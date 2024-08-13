import * as anchor from '@coral-xyz/anchor';
import {
  mintTo,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { MANGO_V4_ID, USDC_MINT } from '../../src';

dotenv.config();

const { RPC_URL, ADMIN_KEYPAIR } = process.env;
const CLUSTER = 'devnet';

async function devnetAirdropInit(): Promise<void> {
  const options = anchor.AnchorProvider.defaultOptions();
  const connection = new Connection(RPC_URL!, options);

  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(ADMIN_KEYPAIR!, 'utf-8'))),
  );

  console.log(`Program ID: ${MANGO_V4_ID[CLUSTER]}`);

  const mint = USDC_MINT;
  const payer = admin;

  // Check the program ID and seeds
  const programId = new PublicKey(MANGO_V4_ID[CLUSTER]);
  console.log('Program ID:', programId.toBase58());

  const seed = 'authority';
  const [programAuthorityPda, bumpSeed] = PublicKey.findProgramAddressSync(
    [Buffer.from(seed)],
    programId,
  );

  // Additional logging for debugging
  console.log('Program Authority PDA:', programAuthorityPda.toBase58());
  console.log('Bump Seed:', bumpSeed);

  // Create the airdrop vault token account
  const reserveAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    mint,
    programAuthorityPda, // airdropVault,
    true,
  );

  console.log('Reserve Account:', reserveAccount.address.toBase58());

  // Mint tokens to the reserve account
  const mintSig = await mintTo(
    connection,
    payer,
    mint,
    reserveAccount.address,
    payer,
    10_000_000_000 * 1_000_000,
    [],
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID,
  );

  console.log('Mint Signature:', mintSig);
}

devnetAirdropInit().catch((err) => {
  console.error(err);
  process.exit(1);
});
