import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import fs from 'fs';
import { TokenIndex } from '../../src/accounts/bank';
import { Group } from '../../src/accounts/group';
import { Builder } from '../../src/builder';
import { MangoClient } from '../../src/client';
import {
  NullPerpEditParams,
  NullTokenEditParams,
} from '../../src/clientIxParamBuilder';
import { MANGO_V4_ID, OPENBOOK_PROGRAM_ID } from '../../src/constants';
import { buildVersionedTx, toNative } from '../../src/utils';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '../../src/utils/spl';
import * as dotenv from 'dotenv';
import { PerpMarketIndex } from '../../src';
import { tokenRegisterSOL, tokenRegisterUSDC } from './utils/createTokens';
import { DEVNET_MINTS, DEVNET_ORACLES } from './utils/const';
import { perpCreateMarketBTC, perpCreateMarketSOL } from './utils/createPerps';
dotenv.config();

const GROUP_NUM = Number(process.env.GROUP_NUM || 0);

const {
  MB_PAYER_KEYPAIR,
  ADMIN_KEYPAIR,
  RPC_URL,
} = process.env;


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

async function buildUserClient(
  userKeypair: string,
): Promise<[MangoClient, Group, Keypair]> {
  const options = AnchorProvider.defaultOptions();
  const connection = new Connection(RPC_URL!, options);

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(userKeypair, 'utf-8'))),
  );
  const userWallet = new Wallet(user);
  const userProvider = new AnchorProvider(connection, userWallet, options);

  const client = await MangoClient.connect(
    userProvider,
    'devnet',
    MANGO_V4_ID['devnet'],
  );

  const creator = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(MB_PAYER_KEYPAIR!, 'utf-8'))),
  );
  console.log(`Creator ${creator.publicKey.toBase58()}`);
  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
  return [client, group, user];
}

async function createGroup() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];

  try {
    console.log(`Creating Group...`);
    const insuranceMint = new PublicKey(DEVNET_MINTS.get('USDC')!);
    const TESTING = true; // for some reason there was true ?! // THIS PREVENTS ACCOUNT CLOSING e.g.
    await client.groupCreate(GROUP_NUM, TESTING, 2, insuranceMint);
    const group = await client.getGroupForCreator(admin.publicKey, GROUP_NUM);
    console.log(`...registered group ${group.publicKey}`);
  } catch (error) {
    console.log('Error creating group', error.message);
  }
}

async function changeAdmin() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  console.log(`Changing admin...`);
  await client.groupEdit(
    group,
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
  );
}

async function setDepositLimit() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  console.log(`Setting a deposit limit...`);
  await client.groupEdit(
    group,
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
    new PublicKey('DSiGNQaKhFCSZbg4HczqCtPAPb1xV51c9GfbfqcVKTB4'),
    undefined,
    undefined,
    toNative(200, 6),
  );
}

async function registerTokens() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  console.log(`Creating USDC stub oracle...`);
  const usdcMint = new PublicKey(DEVNET_MINTS.get('USDC')!);
  await client.stubOracleCreate(group, usdcMint, 1.0);
  const usdcMainnetOracle = (await client.getStubOracle(group, usdcMint))[0];
  console.log(`...created stub oracle ${usdcMainnetOracle.publicKey}`);

  await tokenRegisterUSDC(client, group);
  await tokenRegisterSOL(client, group);

  // log tokens/banks
  await group.reloadAll(client);
  for (const bank of await Array.from(group.banksMapByMint.values())
    .flat()
    .sort((a, b) => a.tokenIndex - b.tokenIndex)) {
    console.log(`${bank.toString()}`);
  }
}

async function createUser(userKeypair: string) {
  const result = await buildUserClient(userKeypair);
  const client = result[0];
  const group = result[1];
  const user = result[2];

  console.log(`Creating MangoAccount...`);
  const mangoAccount = await client.getMangoAccountForOwner(
    group,
    user.publicKey,
    0,
  );
  if (!mangoAccount) {
    throw new Error(`MangoAccount not found for user ${user.publicKey}`);
  }

  console.log(`...created MangoAccount ${mangoAccount.publicKey.toBase58()}`);
}

async function depositForUser(userKeypair: string) {
  const result = await buildUserClient(userKeypair);
  const client = result[0];
  const group = result[1];
  const user = result[2];

  const mangoAccount = await client.getMangoAccountForOwner(
    group,
    user.publicKey,
    0,
  )!;

  await client.tokenDeposit(
    group,
    mangoAccount!,
    new PublicKey(DEVNET_MINTS.get('USDC')!),
    10,
  );
  await mangoAccount!.reload(client);
  console.log(`...deposited 10 USDC`);
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

async function changeTokenOracle() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
  const bank = group.getFirstBankByMint(
    new PublicKey(DEVNET_MINTS.get('MNGO')!),
  );
  await client.tokenEdit(
    group,
    bank.mint,
    Builder(NullTokenEditParams)
      .oracle(new PublicKey(DEVNET_ORACLES.get('MNGO')!))
      .build(),
  );
}

async function makeTokenReduceonly() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
  const bank = group.getFirstBankByMint(
    new PublicKey(DEVNET_MINTS.get('DAI')!),
  );
  await client.tokenEdit(
    group,
    bank.mint,
    Builder(NullTokenEditParams).reduceOnly(1).build(),
  );
}

async function changeMaxStalenessSlots() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  for (const bank of Array.from(group.banksMapByTokenIndex.values()).flat()) {
    await client.tokenEdit(
      group,
      bank.mint,
      Builder(NullTokenEditParams)
        .oracleConfig({
          confFilter: 0.1,
          maxStalenessSlots: 120,
        })
        .build(),
    );
  }

  for (const perpMarket of Array.from(
    group.perpMarketsMapByMarketIndex.values(),
  )) {
    await client.perpEditMarket(
      group,
      perpMarket.perpMarketIndex,
      Builder(NullPerpEditParams)
        .oracleConfig({
          confFilter: 0.1,
          maxStalenessSlots: 120,
        })
        .build(),
    );
  }
}

async function changeStartQuote() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  // await client.tokenEdit(
  //   group,
  //   group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('USDT')!)).mint,
  //   Builder(NullTokenEditParams)
  //     .depositWeightScaleStartQuote(toNative(1000000, 6).toNumber())
  //     .borrowWeightScaleStartQuote(toNative(1000000, 6).toNumber())
  //     .build(),
  // );
  // await client.tokenEdit(
  //   group,
  //   group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('ETH')!)).mint,
  //   Builder(NullTokenEditParams)
  //     .depositWeightScaleStartQuote(toNative(100000, 6).toNumber())
  //     .borrowWeightScaleStartQuote(toNative(100000, 6).toNumber())
  //     .build(),
  // );
  await client.tokenEdit(
    group,
    group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('SOL')!)).mint,
    Builder(NullTokenEditParams)
      .depositWeightScaleStartQuote(toNative(5000000, 6).toNumber())
      .borrowWeightScaleStartQuote(toNative(5000000, 6).toNumber())
      .build(),
  );
  // await client.tokenEdit(
  //   group,
  //   group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('MSOL')!)).mint,
  //   Builder(NullTokenEditParams)
  //     .depositWeightScaleStartQuote(toNative(1000000, 6).toNumber())
  //     .borrowWeightScaleStartQuote(toNative(1000000, 6).toNumber())
  //     .build(),
  // );
  // await client.tokenEdit(
  //   group,
  //   group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('MNGO')!)).mint,
  //   Builder(NullTokenEditParams)
  //     .depositWeightScaleStartQuote(toNative(5000, 6).toNumber())
  //     .borrowWeightScaleStartQuote(toNative(5000, 6).toNumber())
  //     .build(),
  // );
  // await client.tokenEdit(
  //   group,
  //   group.getFirstBankByMint(new PublicKey(DEVNET_MINTS.get('BONK')!)).mint,
  //   Builder(NullTokenEditParams)
  //     .depositWeightScaleStartQuote(toNative(100000, 6).toNumber())
  //     .borrowWeightScaleStartQuote(toNative(100000, 6).toNumber())
  //     .build(),
  // );
}

async function makePerpMarketReduceOnly() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];
  const creator = result[2];

  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);
  const perpMarket = group.getPerpMarketByName('MNGO-PERP-OLD');
  await client.perpEditMarket(
    group,
    perpMarket.perpMarketIndex,
    Builder(NullPerpEditParams).reduceOnly(true).build(),
  );
}

async function createAndPopulateAlt() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];

  const creator = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(ADMIN_KEYPAIR!, 'utf-8'))),
  );
  console.log(`Creator ${creator.publicKey.toBase58()}`);
  const group = await client.getGroupForCreator(creator.publicKey, GROUP_NUM);

  const connection = client.program.provider.connection;

  // Create ALT, and set to group at index 0
  if (group.addressLookupTables[0].equals(PublicKey.default)) {
    try {
      console.log(`ALT: Creating`);
      const createIx = AddressLookupTableProgram.createLookupTable({
        authority: admin.publicKey,
        payer: admin.publicKey,
        recentSlot: await connection.getSlot('finalized'),
      });
      const createTx = await buildVersionedTx(
        client.program.provider as AnchorProvider,
        [createIx[0]],
      );
      let sig = await connection.sendTransaction(createTx);
      console.log(
        `...created ALT ${createIx[1]} https://explorer.solana.com/tx/${sig}`,
      );

      console.log(`ALT: set at index 0 for group...`);
      sig = (await client.altSet(group, createIx[1], 0)).signature;
      console.log(`...https://explorer.solana.com/tx/${sig}`);
    } catch (error) {
      console.log(error);
    }
  }

  // Extend using mango v4 relevant pub keys
  try {
    const bankAddresses = Array.from(group.banksMapByMint.values())
      .flat()
      .map((bank) => [bank.publicKey, bank.oracle, bank.vault])
      .flat()
      .concat(
        Array.from(group.banksMapByMint.values())
          .flat()
          .map((mintInfo) => mintInfo.publicKey),
      );

    const serum3MarketAddresses = Array.from(
      group.serum3MarketsMapByExternal.values(),
    )
      .flat()
      .map((serum3Market) => serum3Market.publicKey);

    const serum3ExternalMarketAddresses = Array.from(
      group.serum3ExternalMarketsMap.values(),
    )
      .flat()
      .map((serum3ExternalMarket) => [
        serum3ExternalMarket.publicKey,
        serum3ExternalMarket.bidsAddress,
        serum3ExternalMarket.asksAddress,
      ])
      .flat();

    const perpMarketAddresses = Array.from(
      group.perpMarketsMapByMarketIndex.values(),
    )
      .flat()
      .map((perpMarket) => [
        perpMarket.publicKey,
        perpMarket.oracle,
        perpMarket.bids,
        perpMarket.asks,
        perpMarket.eventQueue,
      ])
      .flat();

    // eslint-disable-next-line no-inner-declarations
    async function extendTable(addresses: PublicKey[]): Promise<void> {
      await group.reloadAll(client);
      const alt =
        await client.program.provider.connection.getAddressLookupTable(
          group.addressLookupTables[0],
        );

      addresses = addresses.filter(
        (newAddress) =>
          alt.value?.state.addresses &&
          alt.value?.state.addresses.findIndex((addressInALt) =>
            addressInALt.equals(newAddress),
          ) === -1,
      );
      if (addresses.length === 0) {
        return;
      }
      const extendIx = AddressLookupTableProgram.extendLookupTable({
        lookupTable: group.addressLookupTables[0],
        payer: admin.publicKey,
        authority: admin.publicKey,
        addresses,
      });
      const extendTx = await buildVersionedTx(
        client.program.provider as AnchorProvider,
        [extendIx],
      );
      const sig = await client.program.provider.connection.sendTransaction(
        extendTx,
      );
      console.log(`https://explorer.solana.com/tx/${sig}`);
    }

    console.log(`ALT: extending using mango v4 relevant public keys`);

    await extendTable(bankAddresses);
    await extendTable([OPENBOOK_PROGRAM_ID['mainnet-beta']]);
    await extendTable(serum3MarketAddresses);
    await extendTable(serum3ExternalMarketAddresses);

    // TODO: dont extend for perps atm
    await extendTable(perpMarketAddresses);

    // Well known addresses
    await extendTable([
      SystemProgram.programId,
      SYSVAR_RENT_PUBKEY,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      SYSVAR_INSTRUCTIONS_PUBKEY,
      ComputeBudgetProgram.programId,
    ]);
  } catch (error) {
    console.log(error);
  }
}

async function main() {
  try {
    await createGroup();
    // await changeAdmin();
    // await setDepositLimit();
  } catch (error) {
    console.log(error);
  }
  try {
    await registerTokens();
    // await changeTokenOracle();
    // await makeTokenReduceonly();
    // await changeMaxStalenessSlots();
    // await changeStartQuote();
  } catch (error) {
    console.log(error);
  }
  try {
    // await registerSerum3Markets();
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
  try {
    // await createUser(MB_USER_KEYPAIR!);
    // depositForUser(MB_USER_KEYPAIR!);
  } catch (error) {
    console.log(error);
  }

  try {
    createAndPopulateAlt();
  } catch (error) {
    console.log(error);
  }
}

try {
  main();
} catch (error) {
  console.log(error);
}

////////////////////////////////////////////////////////////
/// UNUSED /////////////////////////////////////////////////
////////////////////////////////////////////////////////////

async function expandMangoAccount(userKeypair: string) {
  const result = await buildUserClient(userKeypair);
  const client = result[0];
  const group = result[1];
  const user = result[2];

  const mangoAccounts = await client.getMangoAccountsForOwner(
    group,
    user.publicKey,
  );
  if (!mangoAccounts) {
    throw new Error(`MangoAccounts not found for user ${user.publicKey}`);
  }

  for (const mangoAccount of mangoAccounts) {
    console.log(
      `...expanding MangoAccount ${mangoAccount.publicKey.toBase58()}`,
    );
    await client.expandMangoAccount(group, mangoAccount, 8, 8, 8, 8);
  }
}

async function deregisterTokens() {
  const result = await buildAdminClient();
  const client = result[0];
  const admin = result[1];

  const group = await client.getGroupForCreator(admin.publicKey, GROUP_NUM);

  // change -1 to tokenIndex of choice
  const bank = group.getFirstBankByTokenIndex(-1 as TokenIndex);
  const sig = await client.tokenDeregister(group, bank.mint);
  console.log(
    `...removed token ${bank.name}, sig https://explorer.solana.com/tx/${sig}`,
  );
}
