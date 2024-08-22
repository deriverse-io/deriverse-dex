import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { MangoV4 } from '../../target/types/mango_v4';
import { MANGO_V4_ID } from '../../ts/client/src/index';
import * as spl from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Group, MangoAccount, MangoClient } from '../../ts/client/src/index';

export enum MINTS {
  USDC = 'USDC',
  BTC = 'BTC',
}
export const NUM_USERS = 4;
export const PROGRAM_ID = MANGO_V4_ID['devnet'];
export const DEFAULT_GROUP_NUM = 666;
export const NET_BORROWS_LIMIT_NATIVE = 1 * Math.pow(10, 7) * Math.pow(10, 6);
export const USDC_DECIMALS = 6;
export const USDC_DECIMALS_MUL = 1_000_000;

export const programId = new PublicKey(PROGRAM_ID);
// Configure the client to use the local cluster.
export const envProvider = anchor.AnchorProvider.env();
anchor.setProvider(envProvider);
export const envProviderWallet = envProvider.wallet;
export const envProviderPayer = (envProviderWallet as NodeWallet).payer;

export const options = AnchorProvider.defaultOptions();
export const connection = new Connection(
  process.env.ANCHOR_PROVIDER_URL!,
  options.commitment,
);

export const program = anchor.workspace.MangoV4 as Program<MangoV4>;

export interface TestUser {
  keypair: anchor.web3.Keypair;
  tokenAccounts: spl.Account[];
  mangoAccount: MangoAccount;
  client: MangoClient;
}

export async function createMints(
  program: anchor.Program<MangoV4>,
  payer: anchor.web3.Keypair,
  admin,
): Promise<Partial<Record<keyof typeof MINTS, PublicKey>>> {
  const mints: PublicKey[] = [];
  for (let i = 0; i < 2; i++) {
    mints.push(
      await spl.createMint(
        program.provider.connection,
        payer,
        admin.publicKey,
        admin.publicKey,
        USDC_DECIMALS,
        undefined,
        undefined,
        spl.TOKEN_PROGRAM_ID,
      ),
    );
  }
  const mintsMap = {
    USDC: mints[0],
    BTC: mints[1],
  };

  return mintsMap;
}

export async function createUser(
  mintsMap: Partial<Record<keyof typeof MINTS, PublicKey>>,
  payer: anchor.web3.Keypair,
  provider: anchor.Provider,
  group: Group,
  connection: Connection,
  programId: PublicKey,
  mintAmount = 1_000_000_000_000_000,
): Promise<TestUser> {
  const user = anchor.web3.Keypair.generate();

  await provider.connection.requestAirdrop(
    user.publicKey,
    LAMPORTS_PER_SOL * 1000,
  );

  const tokenAccounts: spl.Account[] = [];
  for (const mintKey in mintsMap) {
    const mint: PublicKey = mintsMap[mintKey];
    const tokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      user.publicKey,
      false,
    );
    if (mintAmount > 0) {
      await spl.mintTo(
        provider.connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        mintAmount,
        [],
      );
    }
    tokenAccounts.push(tokenAccount);
  }

  const client = await MangoClient.connect(
    new anchor.AnchorProvider(
      connection,
      new NodeWallet(user),
      AnchorProvider.defaultOptions(),
    ),
    'devnet',
    programId,
    { idsSource: 'get-program-accounts' },
  );

  await client.createMangoAccount(group, 0);
  const mangoAccount = await client.getMangoAccountForOwner(
    group,
    user.publicKey,
    0,
  );

  return {
    keypair: user,
    tokenAccounts: tokenAccounts,
    client,
    mangoAccount: mangoAccount!,
  };
}

export async function createUsers(
  mintsMap: Partial<Record<keyof typeof MINTS, PublicKey>>,
  payer: anchor.web3.Keypair,
  provider: anchor.Provider,
  group: Group,
  connection: Connection,
  programId: PublicKey,
): Promise<TestUser[]> {
  const users: TestUser[] = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const user = await createUser(
      mintsMap,
      payer,
      provider,
      group,
      connection,
      programId,
    );

    users.push(user);
  }

  return users;
}
