const logBox = document.getElementById("log");
const launchBtn = document.getElementById("launchBtn");

function log(message) {
  logBox.textContent += `\n${message}`;
}

async function connectAndSign() {
  try {
    log("Bouton cliqué.");
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
    alert(`Wallet connecté : ${walletAddress}`);
  } catch (error) {
    console.error(error);
    log(`ERREUR : ${error?.message || error}`);
    alert("Erreur console");
  }
}

launchBtn.addEventListener("click", connectAndSign);

log("index.js chargé correctement.");
