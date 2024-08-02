import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { MangoClient } from '../../ts/client/src/index';
import { getWallet } from './getWallet';
import * as dotenv from 'dotenv';
dotenv.config();

const PROGRAM_ID =
  process.env.PROGRAM_ID ?? '8AHhgx8bNF4oejgfUzN6A7ZN1CPrh8NMsgnrcDiNgUiZ';

export const getClient = (): MangoClient => {
  // const groupNum = process.env.GROUP_NUM ? parseInt(process.env.GROUP_NUM) : 0;
  // const insuranceMintPk = new PublicKey(process.env.DEVNET_USDC!);
  // const adminPk = new PublicKey(process.env.ADMIN_PK!);

  const conn = new anchor.web3.Connection(
    process.env.RPC_URL ?? '',
    'confirmed',
  );

  const provider = new AnchorProvider(conn, getWallet(), {
    commitment: 'confirmed',
  });
  const envProvider = provider;
  const programId = new PublicKey(PROGRAM_ID);

  const client = MangoClient.connect(envProvider, 'devnet', programId, {
    idsSource: 'get-program-accounts',
    multipleConnections: [
      new Connection(
        process.env.RPC_URL_OFFICIAL ?? 'https://api.devnet.solana.com',
        'confirmed',
      ),
      new Connection(process.env.RPC_URL!, 'confirmed'),
    ],
    turnOffPriceImpactLoading: true,
  });

  return client;
};
