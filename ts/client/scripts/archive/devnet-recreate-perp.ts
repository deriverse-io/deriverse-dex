import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';
import { MangoClient } from '../../src/client';
import { MANGO_V4_ID } from '../../src/constants';
import * as dotenv from 'dotenv';
import { PerpMarketIndex } from '../../src';
import { perpCreateMarketBTC, perpCreateMarketSOL } from './utils/createPerps';
dotenv.config();

const GROUP_NUM = Number(process.env.GROUP_NUM || 0);

const { ADMIN_KEYPAIR, RPC_URL } = process.env;

async function buildAdminClient(): Promise<[MangoClient, Keypair, Keypair]> {
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(ADMIN_KEYPAIR!, 'utf-8'))),
  );

  const options = AnchorProvider.defaultOptions();
  const connection = new Connection(RPC_URL!, options);

  const adminWallet = new Wallet(admin);
  console.log(`Admin ${adminWallet.publicKey.toBase58()}`);
  const adminProvider = new AnchorProvider(connection, adminWallet, options);

  const client = await MangoClient.connect(
    adminProvider,
    'devnet',
    MANGO_V4_ID['devnet'],
    {
      idsSource: 'get-program-accounts',
    },
  );

  const creator = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(ADMIN_KEYPAIR!, 'utf-8'))),
  );

  return [client, admin, creator];
}

async function closePerpMarkets() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  console.log(`Group ${group.publicKey}`);
  let sig;
  // close all perp markets
  for (const market of group.perpMarketsMapByMarketIndex.values()) {
    console.log(`Closing perp market ${market.name}`);
    sig = await client.perpCloseMarket(group, market.perpMarketIndex);
    console.log(
      `Closed perp market ${market.name}, sig https://explorer.solana.com/tx/${sig.signature}`,
    );
  }
}

async function registerPerpMarkets() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  await perpCreateMarketSOL(client, group);
  await perpCreateMarketBTC(client, group);
}

// async function changeTokenOracle() {
//   const result = await buildAdminClient();
//   const client = result[0];
//   const admin = result[1];
//   const creator = result[2];

//   const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
//   const bank = group.getFirstBankByMint(
//     new PublicKey(DEVNET_MINTS.get('MNGO')!),
//   );
//   await client.tokenEdit(
//     group,
//     bank.mint,
//     Builder(NullTokenEditParams)
//       .oracle(new PublicKey(DEVNET_ORACLES.get('MNGO')!))
//       .build(),
//   );
// }

async function getMarketsDetails() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  const perpMarkets = await client.perpGetMarkets(group);
  await perpMarkets.map(async (perpMarket) => {
    return getMarketDetails(perpMarket.perpMarketIndex);
  });
}

async function getMarketDetails(perpMarketIndex: PerpMarketIndex) {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
  const market = await group.findPerpMarket(perpMarketIndex);

  const details = {
    name: market.name,
    reduceOnly: market?.reduceOnly,
    minOrderSize: market.minOrderSize,
    tickSize: market.tickSize,
    initLeverage: (1 / (market.initBaseLiabWeight.toNumber() - 1)).toFixed(2),
    maxLeverage: (1 / (market.maintBaseLiabWeight.toNumber() - 1)).toFixed(2),
    makerFee: (100 * market.makerFee.toNumber()).toFixed(2),
    takerFee: (100 * market.takerFee.toNumber()).toFixed(2),
    minFunding: (100 * market.minFunding.toNumber()).toFixed(2),
    maxFunding: (100 * market.maxFunding.toNumber()).toFixed(2),
    // oracle: market.oracleConfig.
  };
  console.table(details);
}

async function main() {
  try {
    await closePerpMarkets();
  } catch (error) {
    console.log(error);
  }

  try {
    await registerPerpMarkets();
    await getMarketsDetails();
    // await makePerpMarketReduceOnly();
  } catch (error) {
    console.log(error);
  }

  // try {
  //   // createAndPopulateAlt();
  // } catch (error) {
  //   console.log(error);
  // }
}

try {
  main();
} catch (error) {
  console.log(error);
}
