import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TransactionInstruction } from '@solana/web3.js';

import { RaffleProgram } from '../../providers/ProgramApisProvider';
import { getAtaForMint } from '../auction-house';
import { Raffle } from '../types';

export const claimPrize = async (
  raffleClient: RaffleProgram,
  raffle: Raffle,
  prizeIndex: number,
  ticketIndex: number, 
  connection: any
) => {
  if (prizeIndex >= raffle.prizes.length)
    throw Error(
      `Prize index does not match prize list (${raffle.prizes.length})`
    );
  const prize = raffle.prizes[prizeIndex];

  const ata = (
          await getAtaForMint(
            //@ts-ignore
            prize.mint.publicKey,
            raffleClient.provider.publicKey,
          )
        )[0];

  return raffleClient.instruction.claimPrize(prizeIndex, ticketIndex, {
    accounts: {
      raffle: raffle.publicKey,
      entrants: raffle.entrantsAccountAddress,
      prize: prize.address,
      winnerTokenAccount: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
    }
  });
};
