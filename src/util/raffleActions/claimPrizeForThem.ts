import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TransactionInstruction } from '@solana/web3.js';

import { RaffleProgram } from '../../providers/ProgramApisProvider';
import { getAtaForMint } from '../auction-house';
import { Raffle } from '../types';

export const claimPrizeForThem = async (
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

  let winner = raffle.entrantsRaw[ticketIndex];

  if (winner.toString() === "11111111111111111111111111111111") winner = raffleClient.provider.wallet.publicKey;
  // console.log("this is the mint", prize.mint.publicKey.toString())

  const ata = (
          await getAtaForMint(
            //@ts-ignore
            prize.mint.publicKey,
            winner
          )
        )[0];

  return raffleClient.instruction.claimPrize(prizeIndex, ticketIndex, {
    accounts: {
      raffle: raffle.publicKey,
      entrants: raffle.entrantsAccountAddress,
      prize: prize.address,
      winnerTokenAccount: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });
};
