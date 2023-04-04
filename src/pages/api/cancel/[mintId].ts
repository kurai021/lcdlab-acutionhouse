/* eslint-disable import/no-anonymous-default-export */
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { NextApiRequest, NextApiResponse } from "next";
import { Connection, Keypair, PublicKey, Transaction, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa, loadAuctionHouseProgram, SOL_AH, SPL_AH } from "../../../util/auction-house";
import bs58 from "bs58";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createClient } from "@supabase/supabase-js";

const connection = new Connection(
  "https://long-blue-firefly.solana-mainnet.discover.quiknode.pro/80ebe646aca8edfc308ec4861602e7963ec276a6/",
  "confirmed"
);

const wallet = new anchor.Wallet(
  Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string)))
)

const URL: any = "https://ecqcmoftwqbfqjkhyebd.supabase.co";
// const PUBLIC: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjcyNTQ3MzUsImV4cCI6MTk4MjgzMDczNX0.jbRz0NXvWSiiRwbc9A1U7bOBn_mL-e5KnbPkIBFmiSg";
const SECRET: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2NzI1NDczNSwiZXhwIjoxOTgyODMwNzM1fQ.fa3JA9NXVI7PcUeM7a-EOEuaDwM5gQrgjFpda6S9h3w";
const supabase = createClient(URL, SECRET)

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });
  const { mintId, token, price, amount, bidId, buyer, seller, endAt }: any = req.query;
  
  async function cancelBid() {
    const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
    let tokenDecimals = token === "SOL" ? 9 : 6;

    const program = await loadAuctionHouseProgram(wallet);

    const auctionHouseObj = await program.account.auctionHouse.fetch(
        ah_key, 
    );

    const tokenAccountKey = (
      await getAtaForMint(new PublicKey(mintId), new PublicKey(buyer))
    )[0];

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

      const [tradeState] = await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(buyer),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        buyPriceAdjusted,
      );

      // console.log("that", tradeState.toString())

      const remainingAccounts = [];

      // remainingAccounts.push({
      //   pubkey: wallet.publicKey,
      //   isWritable: false,
      //   isSigner: true,
      // });

      const bidIx = program.instruction.cancel(
        buyPriceAdjusted,
        new anchor.BN(amount),
        {
        accounts: {
            wallet: new PublicKey(buyer),
            tokenAccount: tokenAccountKey,
            tokenMint: new PublicKey(mintId),
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: ah_key,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            tradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        })

        
      // for (let i = 0; i < remainingAccounts.length; i++) {
      //   bidIx.keys.push(remainingAccounts[i]);
      // }
      bidIx.keys.push({
        pubkey: wallet.publicKey,
        isWritable: false,
        isSigner: true,
      });

        if (true) {
          // bidIx.keys
          //   .filter(k => k.pubkey.equals(new PublicKey(buyer)))
          //   .map(k => (k.isSigner = true));
        bidIx.keys
          .filter(k => k.pubkey.equals(new PublicKey("FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K")))
          .map(k => (k.isSigner = true));
        }

      // console.log(bidIx)

      return bidIx

  }

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  let createBidIx = await cancelBid();

  const newTransaction = new Transaction();

  newTransaction.feePayer = new PublicKey(buyer);
  newTransaction.recentBlockhash = blockhash

  newTransaction.add(createBidIx);

  newTransaction.partialSign(
    Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string)))
  );

  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");

  return res.send({
    message: true,
    data: transactionBase64,
  });
};
