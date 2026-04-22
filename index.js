import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl
} from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.2/+esm";

document.addEventListener("DOMContentLoaded", () => {
  const logBox = document.getElementById("log");
  const connectBtn = document.getElementById("connectBtn");
  const signBtn = document.getElementById("signBtn");
  const sendBtn = document.getElementById("sendBtn");
  const payBtn = document.getElementById("payBtn");
  const pdfBtn = document.getElementById("pdfBtn");

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const RECEIVER_ADDRESS = "FuUbZHFVWpf75QKHTKycqXpxiQzxQdmhZB6nTsp4DFct";

  function clearLog() {
    logBox.textContent = "";
  }

  function log(message) {
    logBox.textContent += `\n${message}`;
  }

  function getProvider() {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom non détecté");
    }
    return window.solana;
  }

  async function connectWallet() {
    const provider = getProvider();

    log("Vérification de Phantom...");
    log("Phantom détecté.");
    log("Demande de connexion au wallet...");

    const response = await provider.connect();
    const walletAddress = response.publicKey.toString();

    log(`Wallet connecté : ${walletAddress}`);

    const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
    const balanceSol = balanceLamports / 1_000_000_000;

    log(`Balance Devnet : ${balanceSol} SOL`);

    return {
      provider,
      walletAddress,
      balanceLamports
    };
  }

  async function connectOnly() {
    try {
      clearLog();
      log("Début connexion...");
      await connectWallet();
      alert("Connexion wallet OK");
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function signMessageOnly() {
    try {
      clearLog();
      log("Début signature...");

      const { provider, walletAddress } = await connectWallet();

      log("Demande de signature...");
      const message = new TextEncoder().encode("Validation ChromoHelios CHLS9");
      await provider.signMessage(message, "utf8");

      log(`Signature acceptée ✔ ${walletAddress}`);
      alert("Transaction validée (signature)");
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function buildAndSendTransfer(lamports, destinationAddress) {
    const { provider, walletAddress, balanceLamports } = await connectWallet();

    if (balanceLamports < lamports) {
      throw new Error("Solde insuffisant");
    }

    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(destinationAddress);

    log("Préparation de la transaction...");

    const latest = await connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction({
      feePayer: fromPubkey,
      recentBlockhash: latest.blockhash
    }).add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports
      })
    );

    log("Demande de signature de transaction...");
    const signedTransaction = await provider.signTransaction(transaction);

    log("Envoi de la transaction...");
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    log(`Signature transaction : ${signature}`);
    log("Confirmation en cours...");

    await connection.confirmTransaction(
      {
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight
      },
      "confirmed"
    );

    log("Transaction confirmée ✔");
    return signature;
  }

  async function sendSolToSelf() {
    try {
      clearLog();
      log("Début envoi test 0.01 SOL...");

      const provider = getProvider();
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();

      const signature = await buildAndSendTransfer(10_000_000, walletAddress);

      alert(`Transaction envoyée ✔ ${signature}`);
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function payAccess() {
    try {
      clearLog();
      log("Début paiement accès 0.05 SOL...");

      const signature = await buildAndSendTransfer(50_000_000, RECEIVER_ADDRESS);

      log("Paiement accès confirmé ✔");
      alert(`Paiement validé ✔ ${signature}`);
      generatePDF();
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  function generatePDF() {
    const element = document.getElementById("pdfBox");

    html2pdf()
      .set({
        margin: 10,
        filename: "heliosastro-chromohelios-chls9.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .save();
  }

  connectBtn.addEventListener("click", connectOnly);
  signBtn.addEventListener("click", signMessageOnly);
  sendBtn.addEventListener("click", sendSolToSelf);
  payBtn.addEventListener("click", payAccess);
  pdfBtn.addEventListener("click", generatePDF);

  log("index.js chargé correctement.");
  log("Système CHLS9 prêt ✔");
});
