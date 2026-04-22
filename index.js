import { createUmi } from "https://esm.sh/@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, createV1, TokenStandard } from "https://esm.sh/@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "https://esm.sh/@metaplex-foundation/umi";

const MINT = "Hu1p8Yrmu7pUYTfhsiKowieLUUaWX6GyUW4iX8KWhFhJ";
const URI = "https://helios120.github.io/heliosastro-chls9/assets/token-metadata.json";

const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());

async function run() {
  try {
    if (!window.solana) {
      alert("Installe Phantom");
      return;
    }

    await window.solana.connect();
    await umi.useWalletAdapter(window.solana);

    console.log("Wallet :", window.solana.publicKey.toString());

    const tx = await createV1(umi, {
      mint: publicKey(MINT),
      authority: umi.identity,
      payer: umi.identity,
      updateAuthority: umi.identity,
      name: "ChromoHelios CHLS9",
      symbol: "CHLS9",
      uri: URI,
      sellerFeeBasisPoints: 0,
      tokenStandard: TokenStandard.Fungible
    }).sendAndConfirm(umi);

    console.log("SUCCESS :", tx);
    alert("Metadata créée");
  } catch (e) {
    console.error(e);
    alert("Erreur console");
  }
}

document.getElementById("btn").onclick = run;
