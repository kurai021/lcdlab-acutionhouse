import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Metaplex } from "@metaplex-foundation/js";

export const useNfts = (refreshHandle?: any) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!publicKey) return;
      const metaplex = new Metaplex(connection)
      const walletNfts: any = await metaplex.nfts().findAllByOwner({owner: publicKey})
      // console.log(walletNfts, "in hooks")
      const nfts = [];
      for (let nft of walletNfts)
        if (
          nft &&
          nft.creators &&
          nft.creators[0] &&
          nft.creators[0].verified 
        )
        try{
          nfts.push({
            mint: nft.mintAddress.toString(),
            data: await metaplex.nfts().load({metadata: nft}),
          });
        }
        catch(ex){
          nfts.push({
            mint: nft.mintAddress.toString(),
            data: await metaplex.nfts().load({metadata: nft}),
          });
        }

      let collator = new Intl.Collator(undefined, { numeric: true });
      nfts.sort((a, b) => collator.compare(a.data.name, b.data.name))
      setNfts(nfts);
    })();
  }, [publicKey, connection, refreshHandle]);

  return nfts;
};
