document.addEventListener("DOMContentLoaded", () => {

  const logBox = document.getElementById("log");
  const launchBtn = document.getElementById("launchBtn");

  function log(message) {
    logBox.textContent += `\n${message}`;
  }

  log("index.js chargé correctement.");

  async function connectAndSign() {
    try {
      log("Bouton cliqué.");
      log("Vérification de Phantom...");

      if (!window.solana || !window.solana.isPhantom) {
        log("Phantom non détecté.");
        alert("Phantom non détecté");
        return;
      }

      const provider = window.solana;

      log("Connexion...");
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();

      log(`Wallet connecté : ${walletAddress}`);

      // 🔥 ICI on force une signature (déclenche Approve)
      log("Demande de signature...");

      const message = new TextEncoder().encode(
        "Validation ChromoHelios CHLS9"
      );

      await provider.signMessage(message, "utf8");

      log("Signature acceptée ✔");
      alert("Transaction validée (signature)");

    } catch (error) {
      console.error(error);
      log(`ERREUR : ${error?.message || error}`);
      alert("Erreur console");
    }
  }

  launchBtn.addEventListener("click", connectAndSign);

});
