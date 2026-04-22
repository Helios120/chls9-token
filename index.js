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

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const ACCESS_WALLET = "FuUbZHFVWpf75QKHTKycqXpxiQzxQdmhZB6nTsp4DFct";

  function log(message) {
    logBox.textContent += `\n${message}`;
  }

  function clearLog() {
    logBox.textContent = "";
  }

  function getProvider() {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom non détecté");
    }
    return window.solana;
  }

  async function connectWallet() {
    clearLog();
    log("Début du test...");
    log("Vérification de Phantom...");

    const provider = getProvider();
    log("Phantom détecté.");
    log("Demande de connexion au wallet...");

    const response = await provider.connect();
    const walletAddress = response.publicKey.toString();

    log(`Wallet connecté : ${walletAddress}`);

    const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
    const balanceSol = balanceLamports / 1_000_000_000;

    log(`Balance Devnet : ${balanceSol} SOL`);

    return { provider, walletAddress, balanceLamports };
  }

  async function signMessageOnly() {
    try {
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
      const provider = getProvider();
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();

      log("Début envoi test 0.01 SOL...");
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

      const signature = await buildAndSendTransfer(50_000_000, ACCESS_WALLET);

      log("Paiement accès confirmé ✔");
      alert(`Paiement validé ✔ ${signature}`);
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  async function connectOnly() {
    try {
      await connectWallet();
      alert("Connexion wallet OK");
    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  connectBtn.addEventListener("click", connectOnly);
  signBtn.addEventListener("click", signMessageOnly);
  sendBtn.addEventListener("click", sendSolToSelf);
  payBtn.addEventListener("click", payAccess);

  log("index.js chargé correctement.");
});
