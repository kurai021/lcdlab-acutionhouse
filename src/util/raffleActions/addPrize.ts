import { BN } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import { REACT_APP_RAFFLE_PROGRAM_ID } from '../programIds';
import { RaffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const addPrize = async (
  raffleClient: RaffleProgram,
  raffle: Raffle,
  creator: PublicKey,
  prizeMint: PublicKey,
  prizeIndex: number,
  amount: number,
  connection: any
) => {
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
        raffle.publicKey.toBytes(),
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

  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  instructions.push(
    raffleClient.instruction.addPrize(new BN(prizeIndex), new BN(amount), {
      accounts: {
        raffle: raffle.publicKey,
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

  // Sign and send transaction
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const newTransaction = new Transaction();

  newTransaction.feePayer = raffleClient.provider.wallet.publicKey;
  newTransaction.recentBlockhash = blockhash

  newTransaction.add(...instructions);

  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");

  return transactionBase64;
};
