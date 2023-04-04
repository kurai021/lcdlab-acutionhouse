import { BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import { REACT_APP_RAFFLE_PROGRAM_ID } from '../programIds';
import { RaffleProgram } from '../../providers/ProgramApisProvider';

export const createRaffle = async (
  raffleClient: RaffleProgram,
  creator: PublicKey,
  proceedsMint: PublicKey,
  endTimestamp: number,
  ticketPrice: number,
  maxEntrants: number,
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
      new BN(endTimestamp),
      new BN(ticketPrice),
      new BN(maxEntrants),
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

  console.log(
    `This is your raffle id: ${raffleId.toBase58()}, please use it to add prizes to your raffle`
  );

  // Sign with entrants keypair
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

  return transactionBase64;
};
