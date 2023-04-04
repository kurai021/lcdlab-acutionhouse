
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { deserializeUnchecked } from 'borsh';
import * as anchor from '@project-serum/anchor';
import { createClient } from "@supabase/supabase-js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { Metadata, METADATA_SCHEMA } from "./metadata";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

export const AUCTION_HOUSE = 'auction_house';

export const AH = new PublicKey(
  "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk"
);

export const SOL_AH = new PublicKey(
  "FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c"
);

export const SPL_AH = new PublicKey(
  "JDtW36AVm1XJtLWqEr7gsb5mU7EYXSScsEHf23wzJBYr"
);

const URL: any = "https://ecqcmoftwqbfqjkhyebd.supabase.co";
const PUBLIC: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjcyNTQ3MzUsImV4cCI6MTk4MjgzMDczNX0.jbRz0NXvWSiiRwbc9A1U7bOBn_mL-e5KnbPkIBFmiSg";
const SECRET: any = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcWNtb2Z0d3FiZnFqa2h5ZWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2NzI1NDczNSwiZXhwIjoxOTgyODMwNzM1fQ.fa3JA9NXVI7PcUeM7a-EOEuaDwM5gQrgjFpda6S9h3w";
const supabaseSecret = createClient(URL, SECRET)
const supabasePublic = createClient(URL, PUBLIC)

export const getAtaForMint = async (
  mint: PublicKey,
  buyer: PublicKey,
): Promise<[PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
};

  export function timeSince(seconds: number) {
      var interval = seconds / 31536000;
      if (interval > 1) {
        return Math.floor(interval) + " years";
      }
      interval = seconds / 2592000;
      if (interval > 1) {
        return Math.floor(interval) + " months";
      }
      interval = seconds / 86400;
      if (interval > 1) {
        return Math.floor(interval) + " days";
      }
      interval = seconds / 3600;
      if (interval > 1) {
        return Math.floor(interval) + " hours";
      }
      interval = seconds / 60;
      if (interval > 1) {
        return Math.floor(interval) + " minutes";
      }
      return Math.floor(seconds) + " seconds";
    }


// eslint-disable-next-line no-control-regex
const METADATA_REPLACE = new RegExp('\u0000', 'g');

export const decodeMetadata = (buffer: Buffer): Metadata => {
  const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer,
  ) as Metadata;
  metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
  metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
  metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
  return metadata;
};

  export function formatTime(seconds: number): string {
    var d: any = Math.floor(seconds / (3600 * 24));
    var h: any = Math.floor((seconds % (3600 * 24)) / 3600);
    var m: any = Math.floor((seconds % 3600) / 60);
    var s: any = Math.floor(seconds % 60);

    if(d <= 9) {
      d = "0" + d.toString()
    }
    if(h <= 9) {
      h = "0" + h.toString()
    }
    if(m <= 9) {
      m = "0" + m.toString()
    }
    if(s <= 9) {
      s = "0" + s.toString()
    }

    var dDisplay = d > 0 ? d + (d === 1 ? ':' : ':') : '';
    var hDisplay = h > 0 ? h + (h === 1 ? ': ' : ':') : '00:';
    var mDisplay = m > 0 ? m + (m === 1 ? ':' : ':') : '00:';
    var sDisplay = s > 0 ? s + (s === 1 ? '' : '') : '00';
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }

export function formatCooldown(seconds: number): string {
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);

  var dDisplay = d > 0 ? d + (d === 1 ? ' day,' : ' days, ') : '';
  var hDisplay = h > 0 ? h + (h === 1 ? ' hour,' : ' hours, ') : '';
  var mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : '';
  var sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

export const getAuctionHouseProgramAsSigner = async (): Promise<
  [PublicKey, number]
> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from(AUCTION_HOUSE), Buffer.from('signer')],
    AH,
  );
};

export const getMetadata = async (
  mint: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

export const getAuctionHouseTradeState = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: anchor.BN,
  buyPrice: anchor.BN,
): Promise<[PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from(AUCTION_HOUSE),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      buyPrice.toArrayLike(Buffer, 'le', 8),
      tokenSize.toArrayLike(Buffer, 'le', 8),
    ],
    AH,
  );
};


export const getPriceWithMantissa = async (
  price: number,
  decimals: number
): Promise<number> => {

  const mantissa = 10 ** decimals;
  return Math.ceil(price * mantissa);
};


export const getAuctionHouseBuyerEscrow = async (
  auctionHouse: anchor.web3.PublicKey,
  wallet: anchor.web3.PublicKey,
): Promise<[PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), wallet.toBuffer()],
    AH,
  );
};


export async function loadAuctionHouseProgram(
  wallet: AnchorWallet
) {
  // @ts-ignore
  const solConnection = new anchor.web3.Connection(
    //@ts-ignore
    'https://long-blue-firefly.solana-mainnet.discover.quiknode.pro/80ebe646aca8edfc308ec4861602e7963ec276a6/'
  );

  const provider = new anchor.AnchorProvider(solConnection, wallet, {
    preflightCommitment: 'recent',
  });
  const idl: any = await anchor.Program.fetchIdl(AH, provider);

  return new anchor.Program(idl, AH, provider);
}

//  Getters for AH

export async function getAllAuctions() {
  const { data: auctions }: any = await supabasePublic.from('auctions').select('*')
  return auctions
}

export async function getAllMerch() {
  const { data: auctions }: any = await supabasePublic.from('merch').select('*')
  return auctions
}

export async function getAllMarket() {
  const { data: auctions }: any = await supabasePublic.from('market').select('*')
  return auctions
}

// Create for AH

export async function createAuction(connection: Connection, wallet: AnchorWallet, mintId: PublicKey, endTime: number, price: number, amount: number, token: string) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];
  
  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));
  // console.log("THIS IS THE AH PUB", ahKeypair.publicKey.toString())
  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

  const tokenAccountKey = (
    await getAtaForMint(mintId, wallet.publicKey)
  )[0];

  const [programAsSigner, programAsSignerBump] = await getAuctionHouseProgramAsSigner();

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      new anchor.BN(0),
    );

    const signers: any = [ahKeypair];
    const remainingAccountsSell = [
      {
        pubkey: ahKeypair.publicKey,
        isWritable: false,
        isSigner: true
      }
    ]


    let sellAccounts = {
          wallet: wallet.publicKey,
          metadata: await getMetadata(mintId),
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
    let sellTx = await program.methods.sell(
        tradeBump,
        freeTradeBump,
        programAsSignerBump,
        buyPriceAdjusted,
        new anchor.BN(amount))
        .accountsStrict(sellAccounts)
        .remainingAccounts(remainingAccountsSell)
        .signers(signers)
        .rpc()

    let txResult = await connection.getTransaction(sellTx);

    if(txResult != null && txResult.meta?.logMessages != null){
      // if(txResult.meta?.logMessages[15] === "Program log: Completed assignation!") {
        await supabaseSecret.from('auctions').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: wallet.publicKey.toString(),
          mint_id: mintId.toString(),
          SOL: token === "SOL" ? true : false,
          price: price.toString(),
          end_at: endTime.toFixed(0)
        })
      // }
    }

    return txResult;
}

export async function createMarket(connection: Connection, wallet: AnchorWallet, mintId: PublicKey, endTime: number, price: number, amount: number, token: string) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = "[85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86]"

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));
  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

  const tokenAccountKey = (
    await getAtaForMint(mintId, wallet.publicKey)
  )[0];

  const [programAsSigner, programAsSignerBump] = await getAuctionHouseProgramAsSigner();

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      new anchor.BN(0),
    );

    const signers: any = [ahKeypair];
    const remainingAccountsSell = [
      {
        pubkey: ahKeypair.publicKey,
        isWritable: false,
        isSigner: true
      }
    ]


    let sellAccounts = {
          wallet: wallet.publicKey,
          metadata: await getMetadata(mintId),
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
    let sellTx = await program.methods.sell(
        tradeBump,
        freeTradeBump,
        programAsSignerBump,
        buyPriceAdjusted,
        new anchor.BN(amount))
        .accountsStrict(sellAccounts)
        .remainingAccounts(remainingAccountsSell)
        .signers(signers)
        .rpc()

    let txResult = await connection.getTransaction(sellTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('market').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: wallet.publicKey.toString(),
          mint_id: mintId.toString(),
          SOL: token === "SOL" ? true : false,
          price: price.toString(),
          end_at: endTime.toFixed(0),
          quantity: amount,
        })
    }

    return txResult;
}

export async function createMerch(connection: Connection, wallet: AnchorWallet, mintId: PublicKey, endTime: number, price: number, amount: number, token: string) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));
  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

  const tokenAccountKey = (
    await getAtaForMint(mintId, wallet.publicKey)
  )[0];

  const [programAsSigner, programAsSignerBump] = await getAuctionHouseProgramAsSigner();

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      new anchor.BN(0),
    );

    const signers: any = [ahKeypair];
    const remainingAccountsSell = [
      {
        pubkey: ahKeypair.publicKey,
        isWritable: false,
        isSigner: true
      }
    ]


    let sellAccounts = {
          wallet: wallet.publicKey,
          metadata: await getMetadata(mintId),
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
    let sellTx = await program.methods.sell(
        tradeBump,
        freeTradeBump,
        programAsSignerBump,
        buyPriceAdjusted,
        new anchor.BN(amount))
        .accountsStrict(sellAccounts)
        .remainingAccounts(remainingAccountsSell)
        .signers(signers)
        .rpc()

    let txResult = await connection.getTransaction(sellTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('merch').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          seller: wallet.publicKey.toString(),
          mint_id: mintId.toString(),
          SOL: token === "SOL" ? true : false,
          price: price.toString(),
          end_at: endTime.toFixed(0),
          quantity: amount,
        })
    }

    return txResult;
}

// Execute Sale

export async function executeSaleIx(token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  // const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  // const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        wallet.publicKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        new anchor.BN(0),
      );

    const [programAsSigner, programAsSignerBump] =
      await getAuctionHouseProgramAsSigner();

    const metadata = await getMetadata(mintId);
    

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

    // for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
      
    //   remainingAccounts.push({
    //     pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
    //     isWritable: true,
    //     isSigner: false,
    //   });
    //   if (!isNative) {
    //     remainingAccounts.push({
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

    // remainingAccounts.push({
    //   pubkey: ah_key,
    //   isWritable: false,
    //   isSigner: true,
    // });

    
    let sellerAccount = isNative
            ? seller
            : (
                await getAtaForMint(tMint, seller)
              )[0]

    let buyerAccount = (
            await getAtaForMint(mintId, wallet.publicKey)
          )[0]

    const executeSaleTx = await program.instruction.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(amount),
      {
      accounts: {
            buyer: wallet.publicKey,
            seller: seller,
            metadata: metadata,
            tokenAccount: tokenAccountKey,
            tokenMint: mintId,
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
          },
          signers: [],
      }
    )

    for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
      executeSaleTx.keys.push({
        pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
        isWritable: true,
        isSigner: false,
      });
      if (!isNative) {
        executeSaleTx.keys.push({
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

    executeSaleTx.keys.push({
      pubkey: ah_key,
      isWritable: false,
      isSigner: true,
    });

        return executeSaleTx

}

// Bid Instructions for any AH

export async function bidIx(token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  // const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  // const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

  

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const ata = (
      await getAtaForMint(
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        wallet.publicKey,
      )
    )[0];

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const transferAuthority = anchor.web3.Keypair.generate();

    const instruction = program.instruction.buy(
      tradeBump,
      escrowBump,
      buyPriceAdjusted,
      new anchor.BN(amount),
      {
        accounts: {
          wallet: wallet.publicKey,
          paymentAccount: isNative ? wallet.publicKey : ata,
          transferAuthority: isNative
            ? wallet.publicKey
            : transferAuthority.publicKey,
          metadata: await getMetadata(mintId),
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
        signers: isNative ? [] : [transferAuthority]
      }
    )

    if (true) {
      instruction.keys
        .filter(k => k.pubkey.equals(ah_key))
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
              wallet.publicKey,
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
              wallet.publicKey,
              [],
            ),
          ]),
    ];

    return instructions;

}

// Bid for Auctions

export async function bidAuction(connection: Connection, token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

  const buyPriceAdjusted = new anchor.BN(
    await getPriceWithMantissa(
      price,
      tokenDecimals
    )
  )

  const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
    ah_key,
    wallet.publicKey,
  );

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const ata = (
      await getAtaForMint(
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        wallet.publicKey,
      )
    )[0];

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const transferAuthority = anchor.web3.Keypair.generate();

    const preInstructions = [
      ...(isNative
        ? []
        : [
            Token.createApproveInstruction(
              TOKEN_PROGRAM_ID,
              ata,
              transferAuthority.publicKey,
              wallet.publicKey,
              [],
              buyPriceAdjusted.toNumber(),
            ),
          ])
    ];

    const postInstructions = [
      ...(isNative
        ? []
        : [
            Token.createRevokeInstruction(
              TOKEN_PROGRAM_ID,
              ata,
              wallet.publicKey,
              [],
            ),
          ]),
    ]

    const remainingAccounts = [];

    remainingAccounts.push({
      pubkey: new anchor.web3.PublicKey(ahKeypair.publicKey),
      isWritable: false,
      isSigner: true,
    });

    if (!isNative) {
      remainingAccounts.push({
        pubkey: new anchor.web3.PublicKey(transferAuthority.publicKey),
        isWritable: false,
        isSigner: true,
      });
    }

    const bidTx = await program.methods.buy(
      tradeBump,
      escrowBump,
      buyPriceAdjusted,
      new anchor.BN(amount))
      .preInstructions(preInstructions)
      .accountsStrict({
          wallet: wallet.publicKey,
          paymentAccount: isNative ? wallet.publicKey : ata,
          transferAuthority: isNative
            ? wallet.publicKey
            : transferAuthority.publicKey,
          metadata: await getMetadata(mintId),
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
        })
        .postInstructions(postInstructions)
        .remainingAccounts(remainingAccounts)
        .signers(isNative ? [ahKeypair] : [ahKeypair, transferAuthority])
        .rpc()

    let txResult = await connection.getTransaction(bidTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('auctionBids').insert({
          created_at: ((new Date().getTime())/1000).toFixed(0),
          buyer: wallet.publicKey.toString(),
          mint_id: mintId.toString(),
          bid_amount: price.toString(),
        })
        return true
    }

}

export async function cancelBid(connection: Connection, token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey, endTime: number) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

  const buyPriceAdjusted = new anchor.BN(
    await getPriceWithMantissa(
      price,
      tokenDecimals
    )
  )
  
    const [tradeState] = await getAuctionHouseTradeState(
      ah_key,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintId,
      new anchor.BN(amount),
      buyPriceAdjusted,
    );

    const remainingAccounts = [];

    remainingAccounts.push({
      pubkey: new anchor.web3.PublicKey(ahKeypair.publicKey),
      isWritable: false,
      isSigner: true,
    });
    const bidIx = program.instruction.cancel(
      buyPriceAdjusted,
      new anchor.BN(amount),
      {
      // .preInstructions(preInstructions)
      accounts: {
          wallet: wallet.publicKey,
          tokenAccount: tokenAccountKey,
          tokenMint: mintId,
          //@ts-ignore
          authority: auctionHouseObj.authority,
          auctionHouse: ah_key,
          //@ts-ignore
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          tradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      })

      if (true) {
        bidIx.keys
          .filter(k => k.pubkey.equals(ahKeypair.publicKey))
          .map(k => (k.isSigner = true));
      }

    return bidIx

}

export async function refundBid(connection: Connection, token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey, endTime: number, bidId: any) {
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );

  const buyPriceAdjusted = new anchor.BN(
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
        wallet.publicKey,
      )
    )[0];

    const [escrowPaymentAccount, bump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const remainingAccounts = [];

    remainingAccounts.push({
      pubkey: new anchor.web3.PublicKey(ahKeypair.publicKey),
      isWritable: false,
      isSigner: true,
    });

    remainingAccounts.push({
      pubkey: wallet.publicKey,
      isWritable: false,
      isSigner: true,
    });

    let bidInstructions = await cancelBid(connection, token, wallet, price, mintId, amount, seller, endTime)

    const bidTx = await program.methods.withdraw(
      bump,
      buyPriceAdjusted)
      .preInstructions([bidInstructions])
      .accountsStrict({
          wallet: wallet.publicKey,
          receiptAccount: isNative ? wallet.publicKey : ata,
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
        })
        .remainingAccounts(remainingAccounts)
        .signers([ahKeypair])
        .rpc()

    let txResult = await connection.getTransaction(bidTx);

    // console.log(txResult, "RESULT IN CANCEL")

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('auctionBids')
        .delete()
        .eq("id", bidId);
    }

}

export async function doBothMerch(token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey, connection: Connection) {
  let buyInstructions = await bidIx(token, wallet, price, mintId, amount, seller)
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        wallet.publicKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        new anchor.BN(0),
      );

    const [programAsSigner, programAsSignerBump] =
      await getAuctionHouseProgramAsSigner();

    const metadata = await getMetadata(mintId);
    

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
      pubkey: ahKeypair.publicKey,
      isWritable: false,
      isSigner: true,
    });

    
    let sellerAccount = isNative
            ? seller
            : (
                await getAtaForMint(tMint, seller)
              )[0]

    let buyerAccount = (
            await getAtaForMint(mintId, wallet.publicKey)
          )[0]

    const executeSaleTx = await program.methods.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(amount))
      .preInstructions(buyInstructions)
      .accountsStrict({
          buyer: wallet.publicKey,
          seller: seller,
          metadata: metadata,
          tokenAccount: tokenAccountKey,
          tokenMint: mintId,
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
        .signers([ahKeypair])
        .rpc()

    let txResult = await connection.getTransaction(executeSaleTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('merch').delete().eq("mint_id", mintId.toString())
    }
}

export async function doBothMarket(token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey, connection: Connection) {
  let buyInstructions = await bidAuction(connection, token, wallet, price, mintId, amount, seller)
  if(!buyInstructions) return;
  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        wallet.publicKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        new anchor.BN(0),
      );

    const [programAsSigner, programAsSignerBump] =
      await getAuctionHouseProgramAsSigner();

    const metadata = await getMetadata(mintId);
    

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
      pubkey: ahKeypair.publicKey,
      isWritable: false,
      isSigner: true,
    });

    
    let sellerAccount = isNative
            ? seller
            : (
                await getAtaForMint(tMint, seller)
              )[0]

    let buyerAccount = (
            await getAtaForMint(mintId, wallet.publicKey)
          )[0]

    const executeSaleTx = await program.methods.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(amount))
      // .preInstructions(buyInstructions)
      .accountsStrict({
          buyer: wallet.publicKey,
          seller: seller,
          metadata: metadata,
          tokenAccount: tokenAccountKey,
          tokenMint: mintId,
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
        .signers([ahKeypair])
        .rpc()

    let txResult = await connection.getTransaction(executeSaleTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('market').delete().eq("mint_id", mintId.toString())
    }
}

export async function doBothAuction(token: any, wallet: AnchorWallet, price: any, mintId: PublicKey, amount: number, seller: PublicKey, connection: Connection) {
  let buyInstructions = await bidIx(token, wallet, price, mintId, amount, seller)

  const ah_key = token === "SOL" ? SOL_AH : SPL_AH;
  let tokenDecimals = token === "SOL" ? 9 : 6;
  const ahSecretKey: any = [85,139,62,70,43,214,31,79,104,9,190,2,57,181,168,195,76,142,37,115,226,0,200,41,114,89,97,82,120,126,72,191,218,40,31,191,74,229,127,60,228,88,175,63,247,110,26,67,155,244,22,169,88,96,14,224,97,84,150,193,159,158,121,86];

  const ahKeypair: any = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ahSecretKey as string)));

  const program = await loadAuctionHouseProgram(wallet);

  const auctionHouseObj = await program.account.auctionHouse.fetch(
      ah_key, 
  );
  const tokenAccountResults = await program.provider.connection.getTokenLargestAccounts(mintId);

  const tokenAccountKey = tokenAccountResults.value[0].address;

    const buyPriceAdjusted = new anchor.BN(
      await getPriceWithMantissa(
        price,
        tokenDecimals
      )
    )

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      ah_key,
      wallet.publicKey,
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        wallet.publicKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        ah_key,
        seller,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintId,
        new anchor.BN(amount),
        new anchor.BN(0),
      );

    const [programAsSigner, programAsSignerBump] =
      await getAuctionHouseProgramAsSigner();

    const metadata = await getMetadata(mintId);
    

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
      pubkey: ahKeypair.publicKey,
      isWritable: false,
      isSigner: true,
    });

    
    let sellerAccount = isNative
            ? seller
            : (
                await getAtaForMint(tMint, seller)
              )[0]

    let buyerAccount = (
            await getAtaForMint(mintId, wallet.publicKey)
          )[0]

    const executeSaleTx = await program.methods.executeSale(
      escrowBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyPriceAdjusted,
      new anchor.BN(amount))
      // .preInstructions(buyInstructions)
      .accountsStrict({
          buyer: wallet.publicKey,
          seller: seller,
          metadata: metadata,
          tokenAccount: tokenAccountKey,
          tokenMint: mintId,
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
        .signers([ahKeypair])
        .rpc()

    let txResult = await connection.getTransaction(executeSaleTx);

    if(txResult != null && txResult.meta?.logMessages != null){
        await supabaseSecret.from('auctions').delete().eq("mint_id", mintId.toString())
        await supabaseSecret.from('auctionBids').delete().eq("mint_id", mintId.toString())
    }
}