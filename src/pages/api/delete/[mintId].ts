/* eslint-disable import/no-anonymous-default-export */
// import { Connection } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { ADMIN_ACCOUNTS } from "../../../util/accounts";

// const connection = new Connection(
//   "https://api.metaplex.solana.com/",
//   "confirmed"
// );

const URL: any = "https://ecqcmoftwqbfqjkhyebd.supabase.co";
// const PUBLIC: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjcyNTQ3MzUsImV4cCI6MTk4MjgzMDczNX0.jbRz0NXvWSiiRwbc9A1U7bOBn_mL-e5KnbPkIBFmiSg";
const SECRET: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2NzI1NDczNSwiZXhwIjoxOTgyODMwNzM1fQ.fa3JA9NXVI7PcUeM7a-EOEuaDwM5gQrgjFpda6S9h3w";
const supabase = createClient(URL, SECRET)

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });
  const { mintId, type, publicKey, id }: any = req.query;

  
  if(type === "auction") {
      console.log("starting")
      try {
        // console.log("inside", auction)
        let result = await supabase.from('auctions').delete().eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success deleting auction"
        })
      } catch (e: any) {
        return res.send({
          err: "Error deleting auction"
        })
      }
  }

  if(type === "market") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('market').delete().eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success deleting market"
        })
      } catch (e: any) {
        return res.send({
          err: "Error deleting market"
        })
      }
  }

  if(type === "merch") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('merch').delete().eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success deleting merch"
        })
      } catch (e: any) {
        return res.send({
          err: "Error deleting merch"
        })
      }
  }

  if(type === "raffle") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('raffle').update({"deleted": true}).eq("public_key", mintId)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success hiding raffle"
        })
      } catch (e: any) {
        return res.send({
          err: "Error hiding raffle"
        })
      }
  }

  if(type === "bid") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('auctionBids').update({"deleted": true}).eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success cancelling bid"
        })
      } catch (e: any) {
        return res.send({
          err: "Error cancelling bid"
        })
      }
  }

  return res.send({
    message: true,
    data: "nonce",
  });
};
