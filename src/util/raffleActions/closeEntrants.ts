import {
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import { RaffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const closeEntrants = async (
  raffleClient: RaffleProgram,
  creator: PublicKey,
  raffle: Raffle,
  connection: any
) => {
    
  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  // Create raffle
  instructions.push(
    raffleClient.instruction.closeEntrants({
      accounts: {
        raffle: raffle.publicKey,
        entrants: raffle.entrantsAccountAddress,
        creator: creator,
      },
    })
  );

  console.log(
    `You have successfully closed the raffle account`
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
