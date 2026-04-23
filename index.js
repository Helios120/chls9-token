document.addEventListener("DOMContentLoaded", () => {
  const logBox = document.getElementById("log");
  const walletAddressEl = document.getElementById("walletAddress");
  const walletBalanceEl = document.getElementById("walletBalance");

  const btnConnect = document.getElementById("btnConnect");
  const btnSign = document.getElementById("btnSign");
  const btnSend = document.getElementById("btnSend");
  const btnPay = document.getElementById("btnPay");
  const btnPdf = document.getElementById("btnPdf");

  let currentWallet = null;
  let currentBalance = null;

  function log(message) {
    logBox.textContent += `\n${message}`;
  }

  function setWalletInfo(address, balance) {
    walletAddressEl.textContent = address || "Non connecté";
    walletBalanceEl.textContent = balance == null ? "-" : `${balance} SOL`;
  }

  async function getConnection() {
    return new solanaWeb3.Connection(
      solanaWeb3.clusterApiUrl("devnet"),
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

    log("Connexion au wallet...");
    const response = await provider.connect();
    currentWallet = response.publicKey.toString();

    const connection = await getConnection();
    const lamports = await connection.getBalance(response.publicKey);
    currentBalance = lamports / 1_000_000_000;

    setWalletInfo(currentWallet, currentBalance);

    log(`Wallet connecté : ${currentWallet}`);
    log(`Balance Devnet : ${currentBalance} SOL`);

    return provider;
  }

  async function signMessage() {
    try {
      const provider = await connectWallet();

      log("Demande de signature...");
      const message = new TextEncoder().encode("Validation ChromoHelios CHLS9");
      await provider.signMessage(message, "utf8");

      log("Signature acceptée ✔");
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

      log("Préparation transaction test 0.01 SOL...");

      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: provider.publicKey,
          lamports: 10_000_000
        })
      );

      transaction.feePayer = provider.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      log("Demande de signature transaction...");
      const signed = await provider.signTransaction(transaction);

      log("Envoi réseau...");
      const signature = await connection.sendRawTransaction(signed.serialize());

      await connection.confirmTransaction(signature, "confirmed");

      log(`Transaction test validée ✔`);
      log(`Signature réseau : ${signature}`);
      alert("Transaction test validée");
    } catch (error) {
      console.error(error);
      log(`ERREUR TRANSACTION : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function payAccess() {
    try {
      const provider = await connectWallet();
      const connection = await getConnection();

      log("Préparation paiement test 0.05 SOL...");

      const receiver = provider.publicKey;

      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: receiver,
          lamports: 50_000_000
        })
      );

      transaction.feePayer = provider.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      log("Demande de signature paiement...");
      const signed = await provider.signTransaction(transaction);

      log("Envoi paiement...");
      const signature = await connection.sendRawTransaction(signed.serialize());

      await connection.confirmTransaction(signature, "confirmed");

      log("Paiement validé ✔");
      log(`Signature paiement : ${signature}`);

      generatePDF();
      alert("Paiement validé + PDF généré");
    } catch (error) {
      console.error(error);
      log(`ERREUR PAIEMENT : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  function generatePDF() {
    const element = document.getElementById("result");

    html2pdf()
      .set({
        margin: 10,
        filename: "rapport-heliosastro-chromohelios.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .save();
  }

  log("Initialisation terminée.");
  setWalletInfo(null, null);

  btnConnect.addEventListener("click", async () => {
    try {
      await connectWallet();
      alert("Connexion Phantom validée");
    } catch (error) {
      console.error(error);
      log(`ERREUR CONNEXION : ${error?.message || error}`);
      alert("Erreur console");
    }
  });

  btnSign.addEventListener("click", signMessage);
  btnSend.addEventListener("click", sendTestSol);
  btnPay.addEventListener("click", payAccess);
  btnPdf.addEventListener("click", generatePDF);
});
