/* eslint-disable import/no-anonymous-default-export */
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { NextApiRequest, NextApiResponse } from "next";
import { Connection, Keypair, PublicKey, Transaction, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseProgramAsSigner, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa, loadAuctionHouseProgram, SOL_AH, SPL_AH } from "../../../util/auction-house";
import bs58 from "bs58";
import { Metaplex, WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
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
  const { type, seller, mintId, token, price, endTime, featured, hide, reserve, quantity, page, raffleId, usdCost }: any = req.query;
  const metaplex = new Metaplex(connection)

  async function createAuction() {
      const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
      let tokenDecimals = token === "SOL" ? 9 : 6;

      const program = await loadAuctionHouseProgram(wallet);

    const auctionHouseObj = await program.account.auctionHouse.fetch(
        ah_key, 
    );

      const buyPriceAdjusted = new anchor.BN(
        await getPriceWithMantissa(
          Number(price),
          tokenDecimals
        )
      )

    const tokenAccountKey = (
      await getAtaForMint(new PublicKey(mintId), new PublicKey(seller))
    )[0];

    const [programAsSigner, programAsSignerBump] = await getAuctionHouseProgramAsSigner();

      const [tradeState, tradeBump] = await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(quantity)),
        buyPriceAdjusted,
      );

        // console.log("ahKey:", ah_key.toString())
        // console.log("seller:", seller)
        // console.log("TokenAccount:", tokenAccountKey.toString())
        // console.log("treasury mint:", auctionHouseObj.treasuryMint.toString())
        // console.log("MintId:", mintId)
        // console.log("quantity:", quantity)
        // console.log("price", price)
        // console.log("buyPriceAdjusted", buyPriceAdjusted)
        // console.log('trade state', tradeState.toString())

      const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
        ah_key,
        new PublicKey(seller),
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        new PublicKey(mintId),
        new anchor.BN(Number(quantity)),
        new anchor.BN(0),
      );


      let sellAccounts = {
            wallet: new PublicKey(seller),
            metadata: await getMetadata(new PublicKey(mintId)),
            tokenAccount: tokenAccountKey,
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: ah_key,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            sellerTradeState: tradeState,
            freeSellerTradeState: freeTradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            programAsSigner,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          }

      let sellIx = await program.instruction.sell(
          tradeBump,
          freeTradeBump,
          programAsSignerBump,
          buyPriceAdjusted,
          new anchor.BN(quantity), {
            accounts: sellAccounts
          })

      sellIx.keys.push(        
        {
          pubkey: wallet.publicKey,
          isWritable: false,
          isSigner: true
        }
      )

      return sellIx;
  }


  if(page === "auctions") {

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      let createBidIx: any = await createAuction();

      const newTransaction = new Transaction();

      newTransaction.feePayer = new PublicKey(seller);
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
  }

  if(page === "auctionsPost") {
      const nft = await metaplex.nfts().findByMint({mintAddress: new PublicKey(mintId)});
      let createAuctionFunction =  await supabase.from('auctions').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: seller,
          mint_id: mintId,
          SOL: token === "SOL" ? true : false,
          starting_price: price,
          reserve_price: reserve,
          quantity: quantity,
          end_at: endTime,
          featured: featured,
          hide: hide,
          type: type,
          metadata: nft
        })
  }

  if(page === "market") {

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      let createBidIx: any = await createAuction();

      const newTransaction = new Transaction();

      newTransaction.feePayer = new PublicKey(seller);
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
  }

  if(page === "marketPost") {
        const nft = await metaplex.nfts().findByMint({mintAddress: new PublicKey(mintId)});
        // console.log(nft, "inMarketPost")
        let insertMessage = await supabase.from('market').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: seller,
          mint_id: mintId,
          SOL: token === "SOL" ? true : false,
          starting_price: price,
          reserve_price: reserve,
          quantity: quantity,
          end_at: endTime,
          featured: featured,
          hide: hide,
          type: type,
          metadata: nft,
          usd_cost: usdCost
        })
  }

  if(page === "merch") {
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      let createBidIx: any = await createAuction();

      const newTransaction = new Transaction();

      newTransaction.feePayer = new PublicKey(seller);
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
  }

  if(page === "merchPost") {
        const nft = await metaplex.nfts().findByMint({mintAddress: new PublicKey(mintId)});
        let insertMessage = supabase.from('merch').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: seller,
          mint_id: mintId,
          SOL: token === "SOL" ? true : false,
          starting_price: price,
          reserve_price: reserve,
          quantity: quantity,
          end_at: endTime,
          featured: featured,
          hide: hide,
          type: type,
          metadata: nft,
          usd_cost: usdCost
        })
  }
// 
  if(page === "raffles") {
    console.log({type, seller, mintId, token, price, endTime, featured, hide, reserve, quantity, page, raffleId, usdCost })
        const nft = await metaplex.nfts().findByMint({mintAddress: new PublicKey(mintId)});
        let createAuctionFunction = await supabase.from('raffles').insert({
          public_key: raffleId,
          name: nft.name,
          image: nft.json?.image,
          creator: seller,
          hide: true,
          type: type,
          currency: token,
          deleted: false,
        });
        console.log("after", {
          public_key: raffleId,
          name: nft.name,
          image: nft.json?.image,
          creator: seller,
          hide: true,
          type: type,
          currency: token,
          deleted: false,
        })
        console.log(createAuctionFunction)

      return res.send({
        message: true,
        data: "success",
      });
  }

  return res.send({
    message: true,
    data: "nonce",
  });
};
