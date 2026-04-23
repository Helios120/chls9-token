document.addEventListener("DOMContentLoaded", () => {
  const MINT_CHLS9 = "EffrWV33cwDhHNbDJ7T7TH5AsfxuXjB7wACHgM6JAGYd6";
  const RPC_NETWORK = "mainnet-beta";

  const logBox = document.getElementById("log");
  const walletAddressEl = document.getElementById("walletAddress");
  const walletBalanceEl = document.getElementById("walletBalance");
  const chlsBalanceEl = document.getElementById("chlsBalance");
  const mintAddressEl = document.getElementById("mintAddress");
  const mintShortEl = document.getElementById("mintShort");
  const priceUsdEl = document.getElementById("priceUsd");
  const tokenNameEl = document.getElementById("tokenName");
  const tokenSymbolEl = document.getElementById("tokenSymbol");
  const tokenVerifiedEl = document.getElementById("tokenVerified");
  const tokensListEl = document.getElementById("tokensList");
  const networkLabelEl = document.getElementById("networkLabel");
  const mintExplorerLinkEl = document.getElementById("mintExplorerLink");
  const mintExplorerBtnEl = document.getElementById("mintExplorerBtn");
  const walletExplorerLinkEl = document.getElementById("walletExplorerLink");

  const reportWalletEl = document.getElementById("reportWallet");
  const reportSolEl = document.getElementById("reportSol");
  const reportChlsEl = document.getElementById("reportChls");
  const reportPriceEl = document.getElementById("reportPrice");

  const miniAddressEl = document.getElementById("miniAddress");
  const miniSolEl = document.getElementById("miniSol");

  const btnConnect = document.getElementById("btnConnect");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnSign = document.getElementById("btnSign");
  const btnSend = document.getElementById("btnSend");
  const btnPdf = document.getElementById("btnPdf");
  const copyMintBtn = document.getElementById("copyMintBtn");

  let currentWallet = null;
  let currentBalance = null;

  function log(message) {
    if (!logBox) return;
    logBox.textContent += `\n${message}`;
  }

  function shortenAddress(address) {
    if (!address || address.length < 12) return address || "-";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  function syncDuplicates() {
    const priceUsdDuplicate = document.getElementById("priceUsdDuplicate");
    const tokenNameDuplicate = document.getElementById("tokenNameDuplicate");
    const tokenSymbolDuplicate = document.getElementById("tokenSymbolDuplicate");
    const tokenVerifiedDuplicate = document.getElementById("tokenVerifiedDuplicate");

    if (priceUsdDuplicate && priceUsdEl) priceUsdDuplicate.textContent = priceUsdEl.textContent;
    if (tokenNameDuplicate && tokenNameEl) tokenNameDuplicate.textContent = tokenNameEl.textContent;
    if (tokenSymbolDuplicate && tokenSymbolEl) tokenSymbolDuplicate.textContent = tokenSymbolEl.textContent;
    if (tokenVerifiedDuplicate && tokenVerifiedEl) tokenVerifiedDuplicate.textContent = tokenVerifiedEl.textContent;
  }

  function setMint() {
    if (mintAddressEl) mintAddressEl.textContent = MINT_CHLS9;
    if (mintShortEl) mintShortEl.textContent = shortenAddress(MINT_CHLS9);
    if (networkLabelEl) networkLabelEl.textContent = RPC_NETWORK;

    const explorerUrl = `https://explorer.solana.com/address/${MINT_CHLS9}`;
    if (mintExplorerLinkEl) mintExplorerLinkEl.href = explorerUrl;
    if (mintExplorerBtnEl) mintExplorerBtnEl.href = explorerUrl;
  }

  function setWallet(address, sol) {
    if (walletAddressEl) walletAddressEl.textContent = address || "Non connecté";
    if (walletBalanceEl) walletBalanceEl.textContent = sol == null ? "-" : `${sol} SOL`;
    if (miniAddressEl) miniAddressEl.textContent = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Non connecté";
    if (miniSolEl) miniSolEl.textContent = sol == null ? "- SOL" : `${sol} SOL`;

    if (reportWalletEl) reportWalletEl.textContent = address || "-";
    if (reportSolEl) reportSolEl.textContent = sol == null ? "-" : `${sol} SOL`;

    if (walletExplorerLinkEl) {
      walletExplorerLinkEl.href = address ? `https://explorer.solana.com/address/${address}` : "#";
    }
  }

  function setStaticMarketData() {
    if (tokenNameEl) tokenNameEl.textContent = "ChromoHelios";
    if (tokenSymbolEl) tokenSymbolEl.textContent = "CHLS9";
    if (tokenVerifiedEl) tokenVerifiedEl.textContent = "Mainnet actif";
    syncDuplicates();
  }

  async function getConnection() {
    return new solanaWeb3.Connection(
      solanaWeb3.clusterApiUrl(RPC_NETWORK),
      "confirmed"
    );
  }

  async function requirePhantom() {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom non détecté");
    }
    return window.solana;
  }

  async function connectWallet() {
    const provider = await requirePhantom();
    const response = await provider.connect();

    currentWallet = response.publicKey.toString();

    const connection = await getConnection();
    const lamports = await connection.getBalance(response.publicKey);
    currentBalance = lamports / 1_000_000_000;

    setWallet(currentWallet, currentBalance);

    log(`Wallet connecté : ${currentWallet}`);
    log(`Balance ${RPC_NETWORK} : ${currentBalance} SOL`);

    return provider;
  }

  async function fetchTokenPrice() {
    try {
      if (priceUsdEl) priceUsdEl.textContent = "$ -";
      if (reportPriceEl) reportPriceEl.textContent = "-";
      syncDuplicates();

      const url = `https://lite-api.jup.ag/price/v3?ids=${encodeURIComponent(MINT_CHLS9)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Réponse API prix ${response.status}`);
      }

      const data = await response.json();
      const item = data?.[MINT_CHLS9];
      const price = item?.usdPrice ?? null;

      if (price == null) {
        log("Prix Jupiter non disponible pour CHLS9.");
        return;
      }

      const formatted = `$ ${Number(price).toFixed(8)}`;
      if (priceUsdEl) priceUsdEl.textContent = formatted;
      if (reportPriceEl) reportPriceEl.textContent = formatted;

      syncDuplicates();
      log(`Prix CHLS9 : ${formatted}`);
    } catch (error) {
      console.error(error);
      log(`ERREUR PRIX : ${error?.message || error}`);
    }
  }

  async function refreshWalletAndTokens() {
    const provider = await connectWallet();
    const connection = await getConnection();

    const tokenProgramId = new solanaWeb3.PublicKey(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );

    const tokens = await connection.getParsedTokenAccountsByOwner(
      provider.publicKey,
      { programId: tokenProgramId }
    );

    let html = "";
    let chlsBalance = 0;

    tokens.value.forEach((tokenAccount) => {
      const info = tokenAccount.account.data.parsed.info;
      const mint = info.mint;
      const amount = info.tokenAmount.uiAmount;

      html += `${shortenAddress(mint)} → ${amount}\n`;

      if (mint === MINT_CHLS9) {
        chlsBalance = amount;
      }
    });

    if (tokensListEl) tokensListEl.textContent = html || "Aucun token détecté";
    if (chlsBalanceEl) chlsBalanceEl.textContent = chlsBalance;
    if (reportChlsEl) reportChlsEl.textContent = chlsBalance;

    log("Liste des tokens rafraîchie");
  }

  async function signMessage() {
    try {
      const provider = await connectWallet();
      const message = new TextEncoder().encode("CHLS9 MAINNET SIGNATURE");
      await provider.signMessage(message, "utf8");

      log("Signature Phantom validée ✔");
      alert("Signature Phantom validée");
    } catch (error) {
      console.error(error);
      log(`ERREUR SIGNATURE : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function sendTestSol() {
    try {
      const provider = await connectWallet();
      const connection = await getConnection();

      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: provider.publicKey,
          lamports: 10_000_000
        })
      );

      transaction.feePayer = provider.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      log("Demande de signature transaction...");
      const signed = await provider.signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      log(`Transaction test validée : ${signature}`);
      alert("Transaction test validée");
    } catch (error) {
      console.error(error);
      log(`ERREUR TRANSACTION : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  function exportPdf() {
    const report = document.getElementById("report");
    if (!report) return;

    html2pdf()
      .set({
        margin: 10,
        filename: "chls9-investor-report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(report)
      .save();
  }

  async function refreshAll() {
    try {
      await refreshWalletAndTokens();
      await fetchTokenPrice();
      setStaticMarketData();
      log("Rafraîchissement complet terminé");
    } catch (error) {
      console.error(error);
      log(`ERREUR REFRESH : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  if (copyMintBtn) {
    copyMintBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(MINT_CHLS9);
        copyMintBtn.textContent = "Adresse copiée";
        setTimeout(() => {
          copyMintBtn.textContent = "Copier l’adresse";
        }, 1600);
      } catch (error) {
        copyMintBtn.textContent = "Erreur";
        setTimeout(() => {
          copyMintBtn.textContent = "Copier l’adresse";
        }, 1600);
      }
    });
  }

  if (btnConnect) {
    btnConnect.addEventListener("click", async () => {
      try {
        await connectWallet();
        await fetchTokenPrice();
        setStaticMarketData();
        alert("Connexion Phantom validée");
      } catch (error) {
        console.error(error);
        log(`ERREUR CONNEXION : ${error?.message || error}`);
        alert("Erreur console");
      }
    });
  }

  if (btnRefresh) btnRefresh.addEventListener("click", refreshAll);
  if (btnSign) btnSign.addEventListener("click", signMessage);
  if (btnSend) btnSend.addEventListener("click", sendTestSol);
  if (btnPdf) btnPdf.addEventListener("click", exportPdf);

  setMint();
  setWallet(null, null);
  setStaticMarketData();
  log("Dashboard CHLS9 mainnet initialisé.");
});
