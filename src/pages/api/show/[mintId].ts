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

  // if(ADMIN_ACCOUNTS.indexOf(publicKey) === -1) {
  //   return res.send({
  //     err: "Invalid path"
  //   })
  // }
  
  if(type === "auction") {
      console.log("starting")
      try {
        // console.log("inside", auction)
        let result = await supabase.from('auctions').update({"hide": false}).eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success hiding auction"
        })
      } catch (e: any) {
        return res.send({
          err: "Error hiding auction"
        })
      }
  }

  if(type === "raffle") {
      try {
        // console.log("inside", mintId)
        let result = await supabase.from('raffles').update({"hide": false}).eq("public_key", mintId)
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

  if(type === "market") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('market').update({"hide": false}).eq("id", id)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success hiding market"
        })
      } catch (e: any) {
        return res.send({
          err: "Error hiding market"
        })
      }
  }

  if(type === "merch") {
      try {
        // console.log("inside", auction)
        let result = await supabase.from('merch').update({"hide": false}).eq("mint_id", mintId)
        console.log(result, "Successful")
        return res.send({
          message: true,
          data: "Success hiding merch"
        })
      } catch (e: any) {
        return res.send({
          err: "Error hiding merch"
        })
      }
  }

  return res.send({
    message: true,
    data: "nonce",
  });
};
