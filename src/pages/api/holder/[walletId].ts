/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });
  const {walletId}: any = req.query;

  let totalNfts: string[] = [];

  try {
    let meData: any = await fetch(
      "https://api-mainnet.magiceden.dev/v2/wallets/" + walletId + "/tokens?listStatus=unlisted&limit=500" ,
      {
        method: "GET",
        redirect: "follow",
      });
    let meJson = await meData.json(); // look at collection?
  
    for(let x = 0; x < meJson.length; x++) {
      try{
        if(meJson[x]['collection'] === "the_stone_heads") {
          totalNfts.push(meJson[x])
        }
      }
      catch(e){
        continue;
      }
    }
    return res.send({
      message: true,
      data: totalNfts.length,
    });
    
  } catch (e) {
    return res.send({
      message: true,
      data: totalNfts.length,
    });
  }
  
};
