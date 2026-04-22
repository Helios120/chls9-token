import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl
} from "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.2/+esm";

const logBox = document.getElementById("log");

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 👉 TON WALLET (réception paiement)
const RECEIVER = new PublicKey("FuUbZHFVWpf75QKHTKycqXpxiQzxQdmhZB6nTsp4DFct");

function log(msg) {
  logBox.textContent += "\n" + msg;
}

async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    alert("Phantom non installé");
    return;
  }

  const res = await window.solana.connect();
  const wallet = res.publicKey;

  log("Wallet connecté : " + wallet.toString());

  const balance = await connection.getBalance(wallet);
  log("Balance : " + balance / 1e9 + " SOL");

  return wallet;
}

// 🔐 SIGNATURE
async function sign() {
  const wallet = await connectWallet();

  const message = new TextEncoder().encode("Validation CHLS9");

  await window.solana.signMessage(message, "utf8");

  log("Signature validée ✔");
  alert("Signature OK");
}

// 💸 ENVOI TEST
async function sendSol() {
  const wallet = await connectWallet();

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: wallet,
      lamports: 10000000
    })
  );

  tx.feePayer = wallet;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await window.solana.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(sig);

  log("Transaction envoyée ✔");
}

// 💰 PAIEMENT BUSINESS
async function pay() {
  const wallet = await connectWallet();

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: RECEIVER,
      lamports: 50000000 // 0.05 SOL
    })
  );

  tx.feePayer = wallet;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await window.solana.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(sig);

  log("Paiement validé ✔");

  generatePDF();
}

// 📄 PDF
function generatePDF() {
  const element = document.getElementById("log");

  html2pdf().from(element).save("heliosastro.pdf");
}

// 🎯 EVENTS
document.getElementById("connectBtn").onclick = connectWallet;
document.getElementById("signBtn").onclick = sign;
document.getElementById("sendBtn").onclick = sendSol;
document.getElementById("payBtn").onclick = pay;

log("Système CHLS9 prêt ✔");
