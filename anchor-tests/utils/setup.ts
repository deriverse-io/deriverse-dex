import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, PublicKey } from '@solana/web3.js';
import { MangoV4 } from '../../target/types/mango_v4';
import { MANGO_V4_ID } from '../../ts/client/src/index';

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
