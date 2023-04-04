  /* eslint-disable import/no-anonymous-default-export */
import { Connection } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

const connection = new Connection(
  "https://long-blue-firefly.solana-mainnet.discover.quiknode.pro/80ebe646aca8edfc308ec4861602e7963ec276a6/",
  "confirmed"
);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });
  const getSolPrice = async () => {
    let fetchUSD = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    let jsonUSD = await fetchUSD.json();
    return (jsonUSD["solana"]["usd"])
  }
  let solPrice = await getSolPrice();
  return res.send({
    message: true,
    data: solPrice,
  });
};
  