/* eslint-disable import/no-anonymous-default-export */
import { Connection } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

const connection = new Connection(
  "https://api.metaplex.solana.com/",
  "confirmed"
);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method != "GET") return res.json({ success: false });
  const { walletPk } = req.query;

//   await dbConnect();

//   const generatedNonce = uuidv4().toString().replaceAll("-", "");

//   console.log("gn", generatedNonce);

//   const nonce = new Nonce({
//     nonce: generatedNonce,
//     target: walletPk,
//     used: false,
//   });

//   await nonce.save();

//   console.log("nonce", nonce);

  return res.send({
    message: true,
    data: "nonce",
  });
};
