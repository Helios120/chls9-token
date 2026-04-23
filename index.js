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
    logBox.textContent += `\n${message}`;
  }

  function setMint() {
    mintAddressEl.textContent = MINT_CHLS9;
    mintShortEl.textContent = `${MINT_CHLS9.slice(0, 6)}...${MINT_CHLS9.slice(-6)}`;
    networkLabelEl.textContent = RPC_NETWORK;

    const explorerUrl = `https://explorer.solana.com/address/${MINT_CHLS9}`;
    mintExplorerLinkEl.href = explorerUrl;
    mintExplorerBtnEl.href = explorerUrl;
  }

  function setWallet(address, sol) {
    walletAddressEl.textContent = address || "Non connecté";
    walletBalanceEl.textContent = sol == null ? "-" : `${sol} SOL`;
    miniAddressEl.textContent = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Non connecté";
    miniSolEl.textContent = sol == null ? "- SOL" : `${sol} SOL`;

    reportWalletEl.textContent = address || "-";
    reportSolEl.textContent = sol == null ? "-" : `${sol} SOL`;

    if (address) {
      walletExplorerLinkEl.href = `https://explorer.solana.com/address/${address}`;
    }
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
      const url = `https://lite-api.jup.ag/price/v3?ids=${encodeURIComponent(MINT_CHLS9)}`;
      const response = await fetch(url);
      const data = await response.json();

      const item = data?.[MINT_CHLS9];
      const price = item?.usdPrice ?? null;

      priceUsdEl.textContent = price == null ? "$ -" : `$ ${Number(price).toFixed(6)}`;
      reportPriceEl.textContent = price == null ? "-" : `$ ${Number(price).toFixed(6)}`;

      log(price == null ? "Prix CHLS9 indisponible" : `Prix CHLS9 : $ ${Number(price).toFixed(6)}`);
    } catch (error) {
      console.error(error);
      log(`ERREUR PRIX : ${error?.message || error}`);
      priceUsdEl.textContent = "$ -";
      reportPriceEl.textContent = "-";
    }
  }

  async function fetchTokenInfo() {
    try {
      const url = `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(MINT_CHLS9)}`;
      const response = await fetch(url);
      const data = await response.json();

      const first = Array.isArray(data) ? data[0] : data?.tokens?.[0] || null;

      tokenNameEl.textContent = first?.name || "ChromoHelios";
      tokenSymbolEl.textContent = first?.symbol || "CHLS9";

      const verified =
        first?.verified === true ||
        first?.strict === true ||
        first?.audit?.isVerified === true;

      tokenVerifiedEl.textContent = verified ? "Oui" : "Non / inconnu";

      log(`Infos token chargées`);
    } catch (error) {
      console.error(error);
      log(`ERREUR TOKEN INFO : ${error?.message || error}`);
      tokenNameEl.textContent = "ChromoHelios";
      tokenSymbolEl.textContent = "CHLS9";
      tokenVerifiedEl.textContent = "Inconnu";
    }
  }

  async function refreshWalletAndTokens() {
    const provider = await connectWallet();
    const connection = await getConnection();

    const tokenProgramId = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

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

      html += `${mint} → ${amount}\n`;

      if (mint === MINT_CHLS9) {
        chlsBalance = amount;
      }
    });

    tokensListEl.textContent = html || "Aucun token détecté";
    chlsBalanceEl.textContent = chlsBalance;
    reportChlsEl.textContent = chlsBalance;

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
    html2pdf()
      .set({
        margin: 10,
        filename: "chls9-investor-report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(document.getElementById("report"))
      .save();
  }

  async function refreshAll() {
    try {
      await refreshWalletAndTokens();
      await fetchTokenPrice();
      await fetchTokenInfo();
      log("Rafraîchissement complet terminé");
    } catch (error) {
      console.error(error);
      log(`ERREUR REFRESH : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

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

  btnConnect.addEventListener("click", async () => {
    try {
      await connectWallet();
      await fetchTokenPrice();
      await fetchTokenInfo();
      alert("Connexion Phantom validée");
    } catch (error) {
      console.error(error);
      log(`ERREUR CONNEXION : ${error?.message || error}`);
      alert("Erreur console");
    }
  });

  btnRefresh.addEventListener("click", refreshAll);
  btnSign.addEventListener("click", signMessage);
  btnSend.addEventListener("click", sendTestSol);
  btnPdf.addEventListener("click", exportPdf);

  setMint();
  setWallet(null, null);
  log("Dashboard CHLS9 mainnet initialisé.");
});
