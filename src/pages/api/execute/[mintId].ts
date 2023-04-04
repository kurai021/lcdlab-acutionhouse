/* eslint-disable import/no-anonymous-default-export */
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { NextApiRequest, NextApiResponse } from "next";
import { Connection, Keypair, PublicKey, Transaction, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { decodeMetadata, getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseProgramAsSigner, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa, loadAuctionHouseProgram, SOL_AH, SPL_AH } from "../../../util/auction-house";
import bs58 from "bs58";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metadata } from "../../../util/metadata";

const connection = new Connection(
  "https://long-blue-firefly.solana-mainnet.discover.quiknode.pro/80ebe646aca8edfc308ec4861602e7963ec276a6/",
  "confirmed"
);

const wallet = new anchor.Wallet(
  Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string)))
)

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") return res.json({ success: false });
  const { mintId, token, price, amount, seller, buyer }: any = req.query;
  console.log(req.query, "QUERY")
  async function bidIx() {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

  const tokenAccountKey = (
    await getAtaForMint(new PublicKey(mintId), new PublicKey(seller))
  )[0];


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

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(buyer),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        buyPriceAdjusted,
      )
    )[0];

    const [sellerTradeState, sellerTradeStateBump] = 
      await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        buyPriceAdjusted);


        console.log("ahKey:", ah_key.toString())
        console.log("seller:", seller)
        console.log("TokenAccount:", tokenAccountKey.toString())
        console.log("treasury mint:", auctionHouseObj.treasuryMint.toString())
        console.log("MintId:", mintId)
        console.log("quantity:", amount)
        console.log("price", price)
        console.log("buyPriceAdjusted", buyPriceAdjusted)
        console.log('trade state', sellerTradeState.toString())

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        new anchor.BN(Number(0)),
      );

    const [programAsSigner, programAsSignerBump] =
      await getAuctionHouseProgramAsSigner();

    const metadata = await getMetadata(new PublicKey(mintId));
    

    const metadataObj = await program.provider.connection.getAccountInfo(
      metadata,
    );
    

    if(!metadataObj) return;
    const metadataDecoded: Metadata = decodeMetadata(
      Buffer.from(metadataObj.data),
    );
    

    const tMint: anchor.web3.PublicKey = auctionHouseObj.treasuryMint;

    const remainingAccounts: any = [];

    if(!metadataDecoded || !metadataDecoded.data || !metadataDecoded.data.creators) return;

    for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
      
      remainingAccounts.push({
        pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
        isWritable: true,
        isSigner: false,
      });
      if (!isNative) {
        remainingAccounts.push({
          pubkey: (
            await getAtaForMint(
              //@ts-ignore
              auctionHouseObj.treasuryMint,
              remainingAccounts[remainingAccounts.length - 1].pubkey,
            )
          )[0],
          isWritable: true,
          isSigner: false,
        });
      }
    }

    remainingAccounts.push({
      pubkey: new PublicKey("FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K"),
      isWritable: false,
      isSigner: true,
    });

    
    let sellerAccount = isNative
            ? new PublicKey(seller)
            : (
                await getAtaForMint(tMint, new PublicKey(seller))
              )[0]

    let buyerAccount = (
            await getAtaForMint(new PublicKey(mintId), new PublicKey(buyer))
          )[0]

    const executeSaleTx = await program.instruction.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(Number(amount)),
      {
      accounts: {
            buyer: new PublicKey(buyer),
            seller: new PublicKey(seller),
            metadata: metadata,
            tokenAccount: tokenAccountKey,
            tokenMint: new PublicKey(mintId),
            escrowPaymentAccount,
            treasuryMint: tMint,
            sellerPaymentReceiptAccount: sellerAccount,
            buyerReceiptTokenAccount: buyerAccount,
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: ah_key,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            //@ts-ignore
            auctionHouseTreasury: auctionHouseObj.auctionHouseTreasury,
            sellerTradeState,
            buyerTradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            programAsSigner,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            freeTradeState,
          }
      }
    )
    for (let i = 0; i < remainingAccounts.length; i++) {
      executeSaleTx.keys.push(remainingAccounts[i]);
    }

    if (true) {
      executeSaleTx.keys
        .filter(k => k.pubkey.equals(new PublicKey("FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K")))
        .map(k => (k.isSigner = true));
      executeSaleTx.keys
        .filter(k => k.pubkey.equals(new PublicKey(buyer)))
        .map(k => (k.isSigner = true));
    }    

    return executeSaleTx
  }

  let createBidIx: any = await bidIx();

  const newTransaction = new Transaction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  newTransaction.feePayer = new PublicKey(buyer);
  newTransaction.recentBlockhash = blockhash;
  newTransaction.lastValidBlockHeight = lastValidBlockHeight;


  newTransaction.add(createBidIx);

  newTransaction.partialSign(
    Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string)))
  );

  // console.log(createBidIx.keys.forEach((key: any) => console.log(key.pubkey.toString())), "ix")
  // console.log(createBidIx, "ix2")
  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");
  
  // console.log("TX:", transactionBase64)
  // return transactionBase64;
  return res.send({
    message: true,
    data: transactionBase64,
  });
};
