import * as anchor from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Keypair,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import {REACT_APP_RAFFLE_PROGRAM_ID} from '../programIds';
import { RaffleProgram } from '../../providers/ProgramApisProvider';

export const instantRaffle = async (
  raffleClient: RaffleProgram,
  creator: PublicKey,
  proceedsMint: PublicKey,
  endTimestamp: number,
  ticketPrice: number,
  maxEntrants: number,
  prizeMint: PublicKey,
  prizeIndex: number = 0,
  amount: number = 1,
  connection: any
) => {

  // Create keypair for entrants account
  let entrantsRaw = Keypair.generate();
  let entrants = entrantsRaw.publicKey;

  // Find PDA for Raffle
  const RAFFLE_PREFIX = 'raffle';
  const PROCEEDS_PREFIX = 'proceeds';
  async function getRaffleId(): Promise<PublicKey> {
    let [address] = await PublicKey.findProgramAddress(
      [Buffer.from(RAFFLE_PREFIX), entrants.toBuffer()],
      REACT_APP_RAFFLE_PROGRAM_ID
    );
    return address;
  }

  let raffleId = await getRaffleId();

  // Find PDA for Proceeds
  async function getProceedsId(): Promise<PublicKey> {
    let [address] = await PublicKey.findProgramAddress(
      [raffleId.toBuffer(), Buffer.from(PROCEEDS_PREFIX)],
      REACT_APP_RAFFLE_PROGRAM_ID
    );
    return address;
  }

  let proceedsId = await getProceedsId();

  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  // Find rent for entrants max length
  let dataLength = 8 + 4 + 4 + 32 * maxEntrants;
  const rentExemptionAmount =
    await raffleClient.provider.connection.getMinimumBalanceForRentExemption(
      dataLength
    );

  // Fund entrants Account
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: creator,
      newAccountPubkey: entrants,
      lamports: rentExemptionAmount,
      space: dataLength,
      programId: REACT_APP_RAFFLE_PROGRAM_ID,
    })
  );

  // Create raffle
  instructions.push(
    raffleClient.instruction.createRaffle(
      new anchor.BN(endTimestamp),
      new anchor.BN(ticketPrice),
      new anchor.BN(maxEntrants),
      {
        accounts: {
          raffle: raffleId,
          entrants: entrants,
          creator: creator,
          proceeds: proceedsId,
          proceedsMint: proceedsMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // Helper for PrizeIndex format for PDA
  const formatPrizeIndex = (num: number) => {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint8(0, num);
    return new Uint8Array(arr);
  };

  // Find Prize PDA for backend init
  const PRIZE_PREFIX = 'prize';
  async function getPrizeId(): Promise<PublicKey> {
    let [address] = await PublicKey.findProgramAddress(
      [
        raffleId.toBytes(),
        Buffer.from(PRIZE_PREFIX),
        formatPrizeIndex(prizeIndex),
      ],
      REACT_APP_RAFFLE_PROGRAM_ID
    );
    return address;
  }

  let prizeId = await getPrizeId();

  // ATA of prize mint
  let creatorPrizeAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    prizeMint,
    creator
  );

  instructions.push(
    raffleClient.instruction.addPrize(new anchor.BN(prizeIndex), new anchor.BN(amount), {
      accounts: {
        raffle: raffleId,
        creator: creator,
        from: creatorPrizeAddress,
        prize: prizeId,
        prizeMint: prizeMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );


  console.log(
    `This is your raffle id: ${raffleId.toBase58()}, please use it to add prizes to your raffle`
  );


  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const newTransaction = new Transaction();

  newTransaction.feePayer = creator;
  newTransaction.recentBlockhash = blockhash

  newTransaction.add(...instructions);

  newTransaction.partialSign(
    entrantsRaw
  );

  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");

  return [transactionBase64, raffleId.toBase58()];
};
