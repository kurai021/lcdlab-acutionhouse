import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ProgramAccount } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

import {
  RaffleProgram,
  EntrantsData,
  RaffleDataRaw,
} from './ProgramApisProvider';
import { useProgramApis } from '../hooks/useProgramApis';
import { Entrant, Raffle, RaffleMetaData } from '../util/types';
import {
  deserializeEntrantsData,
  fetchPrizes,
  fetchProceedsAccount,
  getRaffleProgramAccounts,
  toEntrantsProcessed,
} from '../lib/store';
import { cloneDeep } from 'lodash';
import { areEqualObjects } from '../util/utils';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAllowList, getBlocklist } from '../util/raffleBlocklist';
import { ADMIN_ACCOUNTS } from '../util/accounts';

export interface RafflesStore {
  raffles: Map<string, Raffle>;
  fetchAllRaffles: (includeEmpty?: boolean) => void;
  updateRaffleById: (raffleId: string) => void;
  fetching: boolean;
}

const getAssociatedRaffleData = async (
  raffleRaw: ProgramAccount<RaffleDataRaw>,
  raffleMetaData: RaffleMetaData,
  raffleClient: RaffleProgram,
  connection: Connection,
  entrantsData?: EntrantsData
): Promise<Raffle | undefined> => {
  if(ADMIN_ACCOUNTS.indexOf(raffleRaw.account.creator.toString()) !== -1) {
    const proceedsAccount = await fetchProceedsAccount(
      raffleRaw.publicKey,
      raffleClient,
      connection
    );
    let entrants = new Map<string, Entrant>();
    if (!entrantsData) {
      try {
        const entrantsAccountInfo = await connection.getAccountInfo(
          raffleRaw.account.entrants
        );
        if (!entrantsAccountInfo)
          throw new Error('Cannot find entrants account info');
        entrantsData = deserializeEntrantsData(
          raffleClient,
          entrantsAccountInfo.data
        );
      } catch {
        // TODO: Merge ended raffle data stored off-chain here
        // console.log(`Raffle ${raffleRaw.publicKey} entrants account is closed`);
  
        entrantsData = {
          max: 0,
          total: 0,
          entrants: [],
        };
      }
    }
  
    entrants = toEntrantsProcessed(entrantsData);
  
    const prizes = await fetchPrizes(
      raffleRaw.publicKey,
      raffleClient,
      raffleRaw.account.totalPrizes
    );
    let RAFFLES_ALLOWLIST = await getAllowList();
    const endTimestamp = new Date(
      raffleRaw.account.endTimestamp.toNumber() * 1000
    );
    // console.log(raffleRaw.publicKey.toString(), "RAW RAFFLE pubkey")
    // console.log(raffleMetaData, "RAW RAFFLE metadata")
    // console.log(prizes, "RAW RAFFLE prizes")
    // console.log(proceedsAccount.mintInfo, "Mint info")
    // console.log(RAFFLES_ALLOWLIST.filter((allowedRaffle: any) => allowedRaffle[0] === raffleRaw.publicKey.toString())[0][1], "THIS IS BEFORE")
    return {
      publicKey: raffleRaw.publicKey,
      metadata: raffleMetaData,
      creator: raffleRaw.account.creator,
      endTimestamp,
      entrantsCap: entrantsData.max,
      entrants,
      entrantsRaw: entrantsData.entrants,
      totalTickets: entrantsData.total,
      entrantsAccountAddress: raffleRaw.account.entrants,
      randomness: raffleRaw.account.randomness as number[],
      prizes,
      proceeds: {
        address: proceedsAccount.address,
        ticketPrice: raffleRaw.account.ticketPrice,
        mint: proceedsAccount.mintInfo,
      },
      isEnded: endTimestamp < new Date(),
      hidden: RAFFLES_ALLOWLIST.filter((allowedRaffle: any) => allowedRaffle[0] === raffleRaw.publicKey.toString())[0][1].hidden,
      deleted: RAFFLES_ALLOWLIST.filter((allowedRaffle: any) => allowedRaffle[0] === raffleRaw.publicKey.toString())[0][1].deleted
    };
  }
};

export const RafflesStoreContext = createContext<RafflesStore>({} as any);

const RafflesStoreProvider = ({ children = null as any }: any) => {
  const { connection } = useConnection();
  const { raffleClient } = useProgramApis();

  const [fetching, setFetching] = useState<boolean>(true); // prevents messy first render, but probably not optimal
  const [raffles, setRaffles] = useState<Map<string, Raffle>>(
    new Map<string, Raffle>()
  );

  const fetchAllRaffles = useCallback(
    async (includeEmpty: boolean = false) => {
      setFetching(true);
      let RAFFLES_BLOCKLIST = await getBlocklist();
      try {
        let { raffleDataRawProgramAccounts, entrantsDataProgramAccounts } =
          await getRaffleProgramAccounts(raffleClient);
          // console.log(raffleDataRawProgramAccounts, "HERE")
        raffleDataRawProgramAccounts = raffleDataRawProgramAccounts.filter(
          ({ publicKey }) =>
            includeEmpty || !RAFFLES_BLOCKLIST.has(publicKey.toBase58())
        );
        const newRaffles = (
          await Promise.all(
            raffleDataRawProgramAccounts.map(async (raffleRaw) => {
              const prizes = await fetchPrizes(
                raffleRaw.publicKey,
                raffleClient,
                raffleRaw.account.totalPrizes
              );
              return getAssociatedRaffleData(
                raffleRaw,
                {
                  name:
                    prizes[0] !== undefined
                      ? prizes[0]['mint']['name']
                      : 'No Prize Added',
                  alternatePurchaseMints: [],
                } || {
                  name: 'No Prize Added',
                  alternatePurchaseMints: [],
                },
                raffleClient,
                connection,
                entrantsDataProgramAccounts.find(({ publicKey }) =>
                  publicKey.equals(raffleRaw.account.entrants)
                )?.account
              );
            })
          )
        ).reduce<Map<string, Raffle>>((acc, raffle) => {
         if(raffle !== undefined) {
          acc.set(raffle.publicKey.toString(), raffle);
         } 
          return acc;
        }, new Map<string, Raffle>());
        setRaffles(newRaffles);
      } catch (e) {
        console.log(e);
      }

      setFetching(false);
    },
    [connection, raffleClient]
  );

  const updateRaffleById = useCallback(
    async (raffleId: string) => {
      if (!raffles.has(raffleId.toString())) return;
      setFetching(true);
      const updatedRaffleRaw = await raffleClient.account.raffle.fetch(
        new PublicKey(raffleId)
      );
      const prizes = await fetchPrizes(
        new PublicKey(raffleId),
        raffleClient,
        updatedRaffleRaw.totalPrizes
      );
      const updatedRaffle: any = await getAssociatedRaffleData(
        { publicKey: new PublicKey(raffleId), account: updatedRaffleRaw },
        {
          name:
            prizes[0] !== undefined
              ? prizes[0]['mint']['name']
              : 'No Prize Added',
          alternatePurchaseMints: [],
        } || {
          name: 'No Prize Added',
          alternatePurchaseMints: [],
        },
        raffleClient,
        connection
      );
      if (!areEqualObjects(raffles.get(raffleId.toString()), updatedRaffle)) {
        setRaffles((currentRaffles) => {
          let newRaffles = cloneDeep(currentRaffles);
          newRaffles = newRaffles.set(raffleId, updatedRaffle);
          return newRaffles;
        });
      }
      setFetching(false);
    },
    [connection, raffleClient, raffles, setRaffles]
  );

  useEffect(() => {
    fetchAllRaffles();
  }, [fetchAllRaffles]);

  return (
    <RafflesStoreContext.Provider
      value={{
        raffles,
        fetchAllRaffles,
        updateRaffleById,
        fetching,
      }}
    >
      {children}
    </RafflesStoreContext.Provider>
  );
};

export default RafflesStoreProvider;
