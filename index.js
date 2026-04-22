import {
  Connection,
  PublicKey,
  clusterApiUrl
} from "https://esm.sh/@solana/web3.js";

const logBox = document.getElementById("logBox");
const launchBtn = document.getElementById("launchBtn");

function log(message) {
  console.log(message);
  logBox.textContent += `${message}\n`;
}

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function connectPhantom() {
  try {
    log("Début du test...");
    log("Vérification de Phantom...");

    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom non détecté. Vérifie que l’extension Phantom est installée et active.");
      log("Phantom non détecté.");
      return;
    }

    log("Phantom détecté.");
    log("Demande de connexion au wallet...");

    const response = await window.solana.connect();
    const walletAddress = response.publicKey.toString();

    log(`Wallet connecté : ${walletAddress}`);

    const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));
    const balanceSol = balanceLamports / 1_000_000_000;

    log(`Balance Devnet : ${balanceSol} SOL`);

    alert("Connexion Phantom réussie. Regarde la zone de log sur la page.");
  } catch (error) {
    console.error(error);
    log(`ERREUR : ${error?.message || error}`);
    alert("Erreur console");
  }
}

launchBtn.addEventListener("click", connectPhantom);
