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
  const { mintId, token, price, amount, buyer, seller }: any = req.query;
  // console.log(req.query, "QUERY")
   const program = await loadAuctionHouseProgram(wallet);
   const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
   const auctionHouseObj = await program.account.auctionHouse.fetch(
       ah_key, 
   );
   const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);
   const transferAuthority = anchor.web3.Keypair.generate();

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
  async function executeIx() {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  // const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  // const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
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

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(amount)),
        new anchor.BN(0),
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
      pubkey: ah_key,
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

    const executeSalePreIx = await program.instruction.executeSale(
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

    const preIx = await bidIx()
    const executeSaleTx = await program.methods.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(Number(amount))
    )
    .preInstructions(preIx)
    .accountsStrict({
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
    })
    .remainingAccounts(remainingAccounts)

    // for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
    //   executeSaleTx.accounts.keys.push({
    //     pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
    //     isWritable: true,
    //     isSigner: false,
    //   });
    //   console.log(executeSaleTx.keys, "Keys" + i)
    //   if (!isNative) {
    //     executeSaleTx.keys.push({
    //       pubkey: (
    //         await getAtaForMint(
    //           //@ts-ignore
    //           auctionHouseObj.treasuryMint,
    //           remainingAccounts[remainingAccounts.length - 1].pubkey,
    //         )
    //       )[0],
    //       isWritable: true,
    //       isSigner: false,
    //     });
    //   }
    // }

    // executeSaleTx.keys.push({
    //   pubkey: new PublicKey("FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K"),
    //   isWritable: false,
    //   isSigner: true,
    // });

    return executeSaleTx
  }
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  let createExecuteIx: any = await executeIx();

  let bundledTx = createExecuteIx.rpc()

  bundledTx.feePayer = wallet.publicKey;
  bundledTx.recentBlockhash = blockhash

  bundledTx.partialSign(Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.AH_SECRET_KEY as string))))
  if (!isNative) {
bundledTx.partialSign(transferAuthority)
  }
  const serializedTransaction = bundledTx.serialize({
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

//   await nonce.save();

//   console.log("nonce", nonce);

    // const recoveredTransaction = Transaction.from(
    //   Buffer.from(transaction, "base64")
    // );

    // VersionedMessage.deserialize(Buffer.from(transaction, "base64"))
    
    // console.log("Recovered tx:", recoveredTransaction)
    
    // // recoveredTransaction.partialSign(
    // //   Keypair.fromSecretKey(new Uint8Array(JSON.parse("[85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86]" as string)))
    // // );

    // let allOfIt = await connection.sendTransaction(recoveredTransaction, [Keypair.fromSecretKey(new Uint8Array(JSON.parse("[85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86]" as string)))]);
    // console.log(allOfIt, "AFTER")
    
  // return res.send({
  //   message: true,
  //   data: allOfIt,
  // });
};
