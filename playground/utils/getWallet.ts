import { Wallet } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';
dotenv.config();

export const getKeypair = (): Keypair => {
  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  const userKey = keypair;

  return userKey;
};

export const getWallet = (keypair?: Keypair): Wallet => {
  const userKey = keypair ?? getKeypair();

  return new Wallet(userKey);
};
