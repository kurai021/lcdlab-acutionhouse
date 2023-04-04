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
  const { mintId, token, price, amount, buyer, type, auctionId }: any = req.query;
  const program = await loadAuctionHouseProgram(wallet);
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
  const transferAuthority = anchor.web3.Keypair.generate();

  const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

  async function bidIx() {
    let tokenDecimals = token === "SOL" ? 9 : 6;

    const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(new PublicKey(mintId));

    const tokenAccountKey = tokenAccountResults.value[0].address;


      const buyPriceAdjusted = new anchor.BN(
        await getPriceWithMantissa(
          Number(price),
          tokenDecimals
        )
      )

      const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
        ah_key,
        new PublicKey(buyer),
      );

      const [tradeState, tradeBump] = await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(buyer),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        buyPriceAdjusted,
      );

      const ata = (
        await getAtaForMint(
          //@ts-ignore
          auctionHouseObj.treasuryMint,
          new PublicKey(buyer),
        )
      )[0];

      const instruction = program.instruction.buy(
        tradeBump,
        escrowBump,
        buyPriceAdjusted,
        new anchor.BN(Number(amount)),
        {
          accounts: {
            wallet: new PublicKey(buyer),
            paymentAccount: isNative ? new PublicKey(buyer) : ata,
            transferAuthority: isNative
              ? new PublicKey(buyer)
              : transferAuthority.publicKey,
            metadata: await getMetadata(new PublicKey(mintId)),
            tokenAccount: tokenAccountKey,
            escrowPaymentAccount,
            //@ts-ignore
            treasuryMint: auctionHouseObj.treasuryMint,
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: ah_key,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            buyerTradeState: tradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          signers: []
        }
      )

      if (true) {
        // console.log("should be adding signer as true")
        instruction.keys
          .filter(k => k.pubkey.equals(new PublicKey("FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K")))
          .map(k => (k.isSigner = true));
      }
      
      if (!isNative) {
        instruction.keys
          .filter(k => k.pubkey.equals(transferAuthority.publicKey))
          .map(k => (k.isSigner = true));
      }

      const instructions = [
        ...(isNative
          ? []
          : [
              Token.createApproveInstruction(
                TOKEN_PROGRAM_ID,
                ata,
                transferAuthority.publicKey,
                new PublicKey(buyer),
                [],
                buyPriceAdjusted.toNumber(),
              ),
            ]),
          instruction,
        ...(isNative
          ? []
          : [
              Token.createRevokeInstruction(
                TOKEN_PROGRAM_ID,
                ata,
                new PublicKey(buyer),
                [],
              ),
            ]),
      ];

      return instructions;

  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  let createBidIx = await bidIx();

  const newTransaction = new Transaction();

  newTransaction.feePayer = wallet.publicKey;
  newTransaction.recentBlockhash = blockhash

  newTransaction.add(...createBidIx);

  newTransaction.partialSign(
    Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string)))
  );

  if(!isNative) {
    newTransaction.partialSign(
      transferAuthority
    );
  }
  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");

  if(type === "auctionsPost") {
    let hotdog = await supabase.from('auctionBids').insert({
      created_at: ((new Date().getTime())/1000).toFixed(0),
      buyer: buyer,
      mint_id: mintId,
      bid_amount: price,
      token: token,
      auction_id: auctionId
    })
    // console.log("HOTDOG", hotdog)
  }

  return res.send({
    message: true,
    data: transactionBase64,
  });
};
