import {
  Connection,
  PublicKey,
  clusterApiUrl
} from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.2/+esm";

const logBox = document.getElementById("log");
const launchBtn = document.getElementById("launchBtn");

function log(message) {
  logBox.textContent += `${message}\n`;
}

async function connectAndSign() {
  logBox.textContent = "";

  try {
    log("Début du test...");
    log("Vérification de Phantom...");

    if (!window.solana || !window.solana.isPhantom) {
      log("Phantom non détecté.");
      alert("Phantom non détecté");
      return;
    }

    log("Phantom détecté.");
    log("Demande de connexion au wallet...");

    const provider = window.solana;
    const response = await provider.connect();
    const walletAddress = response.publicKey.toString();

    log(`Wallet connecté : ${walletAddress}`);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
    const balanceSol = balanceLamports / 1_000_000_000;

    log(`Balance Devnet : ${balanceSol} SOL`);

    log("Demande de signature...");
    const message = new TextEncoder().encode("ChromoHelios CHLS9 - test signature Devnet");
    await provider.signMessage(message, "utf8");

    log("Signature Phantom acceptée.");
    alert("Connexion et signature OK");
  } catch (error) {
    console.error(error);
    log(`ERREUR : ${error?.message || error}`);
    alert("Erreur console");
  }
}

launchBtn.addEventListener("click", connectAndSign);
