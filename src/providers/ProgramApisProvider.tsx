import { createContext, useMemo } from 'react';
import { AnchorProvider, BN, IdlAccounts, Program } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { customProviderFactory } from '../lib/anchorUtils';

import { Raffle, IDL as RaffleIdl } from '../lib/idl/raffle';
import { Dispenser, IDL as DispenserIdl } from '../lib/idl/dispenser';
import { REACT_APP_DISPENSER_PROGRAM_ID, REACT_APP_RAFFLE_PROGRAM_ID } from '../util/programIds';
import { PublicKey } from '@solana/web3.js';

export const ProgramApisContext = createContext<{
  raffleClient: RaffleProgram;
  dispenserClient: DispenserProgram;
}>({} as any);

export type RaffleDataRaw = {
    entrants: PublicKey;
    creator: PublicKey;
    endTimestamp: BN;
    ticketPrice: BN;
    bump: number;
    totalPrizes: number;
    claimedPrizes: number;
    randomness?: any;
};

export type EntrantsDataRaw = IdlAccounts<Raffle>['entrants'];
export type EntrantsData = EntrantsDataRaw & {
  entrants: PublicKey[];
};
export type RaffleProgram = Omit<Program<Raffle>, 'provider'> & {
  provider: AnchorProvider;
};

export type DispenserRegistryRaw = IdlAccounts<Dispenser>['registry'];
export type DispenserProgram = Omit<Program<Dispenser>, 'provider'> & {
  provider: AnchorProvider;
};

const ProgramApisProvider = ({ children }: any) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  // TODO: Customize type to allow access of publicKey
  const customProvider = useMemo(
    () => customProviderFactory(connection, anchorWallet),
    [connection, anchorWallet]
  );

  const { raffleClient } = useMemo(() => {
    const raffleClient = new Program<Raffle>(
      RaffleIdl,
      REACT_APP_RAFFLE_PROGRAM_ID,
      customProvider
    ) as unknown as RaffleProgram;
    return { raffleClient };
  }, [customProvider]);

  const { dispenserClient } = useMemo(() => {
    const dispenserClient = new Program<Dispenser>(
      DispenserIdl,
      REACT_APP_DISPENSER_PROGRAM_ID,
      customProvider
    ) as unknown as DispenserProgram;
    return { dispenserClient };
  }, [customProvider]);

  return (
    <ProgramApisContext.Provider value={{ raffleClient, dispenserClient }}>
      {children}
    </ProgramApisContext.Provider>
  );
};

export default ProgramApisProvider;
