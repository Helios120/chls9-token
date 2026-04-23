const log = document.getElementById("log");

function write(msg){
  log.innerHTML += msg + "<br>";
}

// Connexion wallet
async function connectWallet(){
  const provider = window.solana;

  if(!provider || !provider.isPhantom){
    alert("Phantom non installé");
    return;
  }

  const res = await provider.connect();
  write("Wallet connecté : " + res.publicKey.toString());
}

// Envoi SOL
async function sendSol(){
  const provider = window.solana;
  await provider.connect();

  const connection = new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl("devnet"),
    "confirmed"
  );

  const tx = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: provider.publicKey,
      lamports: 10000000
    })
  );

  tx.feePayer = provider.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await provider.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(sig);

  write("Transaction OK : " + sig);
}

// Paiement + PDF
async function payAccess(){
  const provider = window.solana;
  await provider.connect();

  const connection = new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl("devnet"),
    "confirmed"
  );

  const receiver = new solanaWeb3.PublicKey(provider.publicKey);

  const tx = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: receiver,
      lamports: 50000000
    })
  );

  tx.feePayer = provider.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await provider.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(sig);

  write("Paiement validé ✔");

  generatePDF();
}

// PDF
function generatePDF(){
  const element = document.getElementById("result");

  html2pdf()
    .from(element)
    .save("heliosastro.pdf");
}
