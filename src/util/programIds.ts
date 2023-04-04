import { Keypair, PublicKey } from '@solana/web3.js';

export const REACT_APP_RAFFLE_PROGRAM_ID = new PublicKey("bRafEWJ3T6Awj4wyDXxiEFDMry9ZyLcKGKvkk1RngCj" as string);
export const REACT_APP_DISPENSER_PROGRAM_ID = new PublicKey(
  'B2jCF3V3hCCPcwsXPtjMhXVjzafXU68EMJWz3eKZ2kVa' as string
);

export const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const DISPENSER_REGISTRY_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse("[113,246,58,68,183,214,165,226,130,213,55,129,156,201,172,105,111,136,155,207,144,229,30,38,74,227,178,43,236,162,23,240,100,81,218,27,7,195,198,164,28,100,47,51,189,51,38,157,184,2,142,202,178,230,107,50,138,56,189,81,109,139,156,145]" as string)
  )
);
export const DISPENSER_REGISTRY_ADDRESS = DISPENSER_REGISTRY_KEYPAIR.publicKey;
