import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import { RaffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const collectProceeds = async (
  raffleClient: RaffleProgram,
  creator: PublicKey,
  proceedsMint: PublicKey,
  raffle: Raffle,
  connection: any
) => {
// Get creator proceed account
const creatorProceeds = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    raffle.proceeds.mint.publicKey,
    creator,
    );
    
  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  // Create raffle
  instructions.push(
    raffleClient.instruction.collectProceeds({
      accounts: {
        raffle: raffle.publicKey,
        proceeds: proceedsMint,
        creator: creator,
        creatorProceeds: creatorProceeds,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  console.log(
    `You have successfully collected your proceeds`
  );

  // Sign and send transaction
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const newTransaction = new Transaction();

  newTransaction.feePayer = creator;
  newTransaction.recentBlockhash = blockhash

  newTransaction.add(...instructions);

  const serializedTransaction = newTransaction.serialize({
    // We will need Alice to deserialize and sign the transaction
    requireAllSignatures: false,
  });

  const transactionBase64 = serializedTransaction.toString("base64");

  return transactionBase64;
};
