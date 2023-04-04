import { TESTING } from './misc';
import { REACT_APP_DISPENSER_PROGRAM_ID, DISPENSER_REGISTRY_ADDRESS } from './programIds';
import { AnchorProvider, utils } from '@project-serum/anchor';
import { getTokenAccount } from '@project-serum/common';
import * as math from 'mathjs';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export const getWalletLamports = async (
  provider: AnchorProvider
): Promise<number | undefined> => {
  if (!provider.wallet.publicKey) return;

  const walletAccount = await provider.connection.getAccountInfo(
    provider.wallet.publicKey
  );

  return walletAccount?.lamports; // TODO: Check why number??
};

export const getBuyerATABalance = async (
  provider: AnchorProvider,
  proceedsMint: PublicKey
): Promise<u64 | undefined> => {
  const buyerATA = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    proceedsMint,
    provider.wallet.publicKey
  );

  try {
    const accountInfo = await getTokenAccount(
      // @ts-ignore
      provider,
      buyerATA
    );
    return accountInfo.amount;
  } catch (error: any) {
    console.error(error);
    return;
  }
};

export const getDisplayAmount = (
  amount: u64,
  mint: { decimals: number }
): string => {
  return math
    .bignumber(amount.toString())
    .div(Math.pow(10, mint.decimals))
    .toString();
};

export const getAssociatedTokenAccountAddress = (
  walletAddress: PublicKey,
  mint: PublicKey
) =>
  Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    walletAddress
  );

export const findAssociatedTokenAccountAddressSync = (
  walletAddress: PublicKey,
  mint: PublicKey
) =>
  utils.publicKey.findProgramAddressSync(
    [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

export const createOwnAssociatedTokenAccountInstruction = (
  mint: PublicKey,
  ata: PublicKey,
  owner: PublicKey
) =>
  Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    ata,
    owner,
    owner
  );


export const ADMIN_ACCOUNTS = TESTING
  ? [
    '3NVyo9HKzqkqvP389jjrxWtT9aMJ347wZFGcVd8yWaqZ',
    'FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K',
    'stakesVTTcLyZozxBmixmNZwuG4ahr1MzLoQoykPWYD',
    ]
  : [
    '3NVyo9HKzqkqvP389jjrxWtT9aMJ347wZFGcVd8yWaqZ',
    'FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K',
    'stakesVTTcLyZozxBmixmNZwuG4ahr1MzLoQoykPWYD',
    ];

export const [VAULT_TOKEN_IN] = utils.publicKey.findProgramAddressSync(
  [Buffer.from('vault_token_in'), DISPENSER_REGISTRY_ADDRESS.toBytes()],
  REACT_APP_DISPENSER_PROGRAM_ID
);
// console.log(`VAULT_TOKEN_IN: ${VAULT_TOKEN_IN.toBase58()}`);

export const [VAULT_TOKEN_OUT] = utils.publicKey.findProgramAddressSync(
  [Buffer.from('vault_token_out'), DISPENSER_REGISTRY_ADDRESS.toBytes()],
  REACT_APP_DISPENSER_PROGRAM_ID
);
// console.log(`VAULT_TOKEN_OUT = ${VAULT_TOKEN_OUT.toBase58()}`);
