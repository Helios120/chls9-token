const MINT_CHLS9 = "YOUR_CHLS9_MINT";

const logBox = document.getElementById("log");

function log(msg){
  logBox.textContent += msg + "\n";
}

async function getConnection(){
  return new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl("devnet"), // 👉 change en mainnet-beta plus tard
    "confirmed"
  );
}

async function connect(){
  if(!window.solana) return alert("Phantom absent");

  const res = await window.solana.connect();
  const address = res.publicKey.toString();

  document.getElementById("walletAddress").textContent = address;
  document.getElementById("miniAddress").textContent = address.slice(0,6)+"...";

  log("Wallet connecté: "+address);

  await refresh();
}

async function refresh(){
  const connection = await getConnection();
  const pubkey = window.solana.publicKey;

  const sol = await connection.getBalance(pubkey);
  const solValue = sol / 1e9;

  document.getElementById("walletSol").textContent = solValue + " SOL";
  document.getElementById("miniSol").textContent = solValue + " SOL";

  const tokens = await connection.getParsedTokenAccountsByOwner(
    pubkey,
    { programId: solanaWeb3.TOKEN_PROGRAM_ID }
  );

  let html = "";
  let chlsBalance = 0;

  tokens.value.forEach(t=>{
    const info = t.account.data.parsed.info;
    const mint = info.mint;
    const amount = info.tokenAmount.uiAmount;

    html += `${mint} → ${amount}\n`;

    if(mint === MINT_CHLS9){
      chlsBalance = amount;
    }
  });

  document.getElementById("tokensList").textContent = html || "Aucun token";
  document.getElementById("chlsBalance").textContent = chlsBalance;

  log("Refresh OK");
}

async function sign(){
  const msg = new TextEncoder().encode("CHLS9 signature");
  await window.solana.signMessage(msg,"utf8");
  log("Signature OK");
}

async function send(){
  const connection = await getConnection();
  const provider = window.solana;

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

  log("Transaction OK: "+sig);
}

function pdf(){
  html2pdf().from(document.getElementById("report")).save("chls9-report.pdf");
}

document.getElementById("btnConnect").onclick = connect;
document.getElementById("btnRefresh").onclick = refresh;
document.getElementById("btnSign").onclick = sign;
document.getElementById("btnSend").onclick = send;
document.getElementById("btnPdf").onclick = pdf;
