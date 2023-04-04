/* eslint-disable import/no-anonymous-default-export */
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { Metaplex } from "@metaplex-foundation/js";

const connection = new Connection(
  "https://long-blue-firefly.solana-mainnet.discover.quiknode.pro/80ebe646aca8edfc308ec4861602e7963ec276a6/",
  "confirmed"
);

const URL: any = "https://ecqcmoftwqbfqjkhyebd.supabase.co";
// const PUBLIC: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjcyNTQ3MzUsImV4cCI6MTk4MjgzMDczNX0.jbRz0NXvWSiiRwbc9A1U7bOBn_mL-e5KnbPkIBFmiSg";
const SECRET: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2NzI1NDczNSwiZXhwIjoxOTgyODMwNzM1fQ.fa3JA9NXVI7PcUeM7a-EOEuaDwM5gQrgjFpda6S9h3w";
const supabase = createClient(URL, SECRET)

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });

  const { data: auctions }: any = await supabase.from('merch').select('*')
  const metaplex = new Metaplex(connection)
  let newAuctions: any = await Promise.all(auctions.map(async (auction: any) => {
      const {quantity, SOL, created_at, end_at, id, mint_id, seller, hide, type, featured, starting_price, reserve_price, usd_cost} = auction;
      try {
        const nft = await metaplex.nfts().findByMint({mintAddress: new PublicKey(mint_id)});
        if(!nft.json) return;
        return {quantity, SOL, created_at, end_at, id, mint_id, starting_price, seller, name: nft.json.name, image: nft.json.image, description: nft.json.description, hide, type, reserve_price, featured, usd_cost}
      } catch (e) {
        return
      }
  }))

  return res.send({
    message: true,
    data: newAuctions,
  });
};