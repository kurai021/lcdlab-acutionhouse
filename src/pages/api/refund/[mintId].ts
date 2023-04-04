/* eslint-disable import/no-anonymous-default-export */
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { NextApiRequest, NextApiResponse } from "next";
import { Connection, Keypair, PublicKey, Transaction, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa, loadAuctionHouseProgram, SOL_AH, SPL_AH } from "../../../util/auction-house";
import bs58 from "bs58";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  const { mintId, token, price, buyer, method, bidId }: any = req.query;

  async function refundBid() {
    const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
    let tokenDecimals = token === "SOL" ? 9 : 6;

    const program = await loadAuctionHouseProgram(wallet);

    const auctionHouseObj = await program.account.auctionHouse.fetch(
        ah_key, 
    );

    let buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )


      const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

      const ata = (
        await getAtaForMint(
          //@ts-ignore
          auctionHouseObj.treasuryMint,
          new PublicKey(buyer),
        )
      )[0];

      const [escrowPaymentAccount, bump] = await getAuctionHouseBuyerEscrow(
        ah_key,
        new PublicKey(buyer),
      );


    if(method === "all" && token === "SOL") {
      const getEscrowBalance: any = await connection.getParsedAccountInfo(escrowPaymentAccount);

      buyPriceAdjusted = new anchor.BN(getEscrowBalance["value"]["lamports"])
      let deleteAllSol = await supabase.from("auctionBids").delete().match({buyer: buyer, token: "SOL"})
    }

    if(method === "all" && token === "LCD") {
      const getEscrowBalance: any = await connection.getParsedAccountInfo(escrowPaymentAccount);

      buyPriceAdjusted = new anchor.BN(getEscrowBalance["value"]["data"]["parsed"]["info"]["tokenAmount"]["amount"]);
      let deleteAllLcd = await supabase.from("auctionBids").delete().match({buyer: buyer, token: "LCD"})
    }

    if(method === "one" && token === "SOL") {
      const getEscrowBalance: any = await connection.getParsedAccountInfo(escrowPaymentAccount);

      buyPriceAdjusted = new anchor.BN(getEscrowBalance["value"]["lamports"])
      let deleteOneSol = await supabase.from("auctionBids").delete().match({mint_id: mintId, buyer: buyer, token: "SOL"})
    }

    if(method === "one" && token === "LCD") {
      const getEscrowBalance: any = await connection.getParsedAccountInfo(escrowPaymentAccount);

      buyPriceAdjusted = new anchor.BN(getEscrowBalance["value"]["data"]["parsed"]["info"]["tokenAmount"]["amount"]);
      let deleteOneLcd = await supabase.from("auctionBids").delete().match({mint_id: mintId, buyer: buyer, token: "LCD"})
    }


      const bidTx = await program.instruction.withdraw(
        bump,
        buyPriceAdjusted,
        {
            accounts: {
                wallet: new PublicKey(buyer),
                receiptAccount: isNative ? new PublicKey(buyer) : ata,
                escrowPaymentAccount,
                //@ts-ignore
                treasuryMint: auctionHouseObj.treasuryMint,
                //@ts-ignore
                authority: auctionHouseObj.authority,
                auctionHouse: ah_key,
                //@ts-ignore
                auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            }
        })

      bidTx.keys.push({
        pubkey: new anchor.web3.PublicKey(wallet.publicKey),
        isWritable: false,
        isSigner: true,
      });

      bidTx.keys.push({
        pubkey: new PublicKey(buyer),
        isWritable: false,
        isSigner: true,
      });

    return bidTx
  }

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  let createBidIx = await refundBid();

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
  console.log("TX:", transactionBase64)
  // return transactionBase64;
  return res.send({
    message: true,
    data: transactionBase64,
  });
};
