import { PublicKey } from '@solana/web3.js';
import { DefaultTokenRegisterParams } from '../../../src/clientIxParamBuilder';
import { Group, MangoClient, toNative } from '../../../src';
import { DEVNET_MINTS, DEVNET_ORACLES } from './const';

const NET_BORROW_LIMIT_PER_WINDOW_QUOTE = toNative(1000000, 6).toNumber();

export const tokenRegisterUSDC = async (
  client: MangoClient,
  group: Group,
): Promise<void> => {
  const usdcMint = new PublicKey(DEVNET_MINTS.get('USDC')!);
  const usdcOracle = (await client.getStubOracle(group, usdcMint))[0];

  try {
    console.log(`Registering USDC...`);
    await client.tokenRegister(
      group,
      usdcMint,
      usdcOracle.publicKey,
      PublicKey.default,
      0,
      'USDC',
      {
        ...DefaultTokenRegisterParams,
        initAssetWeight: 1,
        maintAssetWeight: 1,
        initLiabWeight: 1,
        maintLiabWeight: 1,
        liquidationFee: 0,
        netBorrowLimitPerWindowQuote: NET_BORROW_LIMIT_PER_WINDOW_QUOTE,
      },
    );
  } catch (error) {
    console.log('Error registering USDC', error.message);
  }
};

export const tokenRegisterSOL = async (
  client: MangoClient,
  group: Group,
): Promise<void> => {
  try {
    console.log(`Registering SOL...`);
    const solMint = new PublicKey(DEVNET_MINTS.get('SOL')!);
    const solOracle = new PublicKey(DEVNET_ORACLES.get('SOL')!);
    await client.tokenRegister(
      group,
      solMint,
      solOracle,
      PublicKey.default,
      1,
      'SOL',
      {
        ...DefaultTokenRegisterParams,
        maintAssetWeight: 0.9,
        initAssetWeight: 0.8,
        maintLiabWeight: 1.1,
        initLiabWeight: 1.2,
        liquidationFee: 0.05,
        netBorrowLimitPerWindowQuote: NET_BORROW_LIMIT_PER_WINDOW_QUOTE,
      },
    );
  } catch (error) {
    console.log('Error registering SOL', error.message);
    console.log(error);
  }
};
