
import {
  PublicKey,
} from '@solana/web3.js';
import {
  Group,
  MangoClient,
  StubOracle,
} from '../ts/client/src/index';
import {
  connection,
  createMints,
  createUser,
  DEFAULT_GROUP_NUM,
  envProvider,
  envProviderPayer,
  envProviderWallet,
  MINTS,
  NET_BORROWS_LIMIT_NATIVE,
  program,
  programId,
  TestUser,
} from './utils/setup';
import { DefaultTokenRegisterParams } from '../ts/client/src/clientIxParamBuilder';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;
const assert = chai.assert;

describe('deposit', () => {
  let user: TestUser;
  let mintsMap: Partial<Record<keyof typeof MINTS, PublicKey>>;
  let group: Group;
  let usdcOracle: StubOracle;
  let envClient: MangoClient;

  before(async () => {
    envClient = MangoClient.connect(envProvider, 'devnet', programId, {
      idsSource: 'get-program-accounts',
    });
    mintsMap = await createMints(program, envProviderPayer, envProviderWallet);
    const insuranceMintPk = mintsMap['USDC']!;
    await envClient.groupCreate(DEFAULT_GROUP_NUM, true, 1, insuranceMintPk);
    const adminPk = envProviderWallet.publicKey;
    group = await envClient.getGroupForCreator(adminPk, DEFAULT_GROUP_NUM);
    user = await createUser(
      mintsMap,
      envProviderPayer,
      envProvider,
      group,
      connection,
      programId,
    );
    await envClient.stubOracleCreate(group, mintsMap['USDC']!, 1.0);
    usdcOracle = (await envClient.getStubOracle(group, mintsMap['USDC']!))[0];
    await envClient.tokenRegister(
      group,
      mintsMap['USDC']!,
      usdcOracle.publicKey,
      PublicKey.default,
      0, // tokenIndex
      'USDC',
      {
        ...DefaultTokenRegisterParams,
        initAssetWeight: 1,
        maintAssetWeight: 1,
        initLiabWeight: 1,
        maintLiabWeight: 1,
        liquidationFee: 0,
        netBorrowLimitPerWindowQuote: NET_BORROWS_LIMIT_NATIVE,
      },
    );
    await group.reloadAll(envClient);
  });

  after(async () => {
    await envClient.tokenDeregister(group, mintsMap['USDC']!);
    await envClient.groupClose(group);
  });

  it('deposits USDC token over a limit', async () => {
    await user.client.tokenDeposit(
      group,
      user.mangoAccount,
      mintsMap['USDC']!,
      50 * 1e6,
    );
  });

  it('fails to deposit less than a limit', async () => {
    expect(
      user.client.tokenDeposit(group, user.mangoAccount, mintsMap['USDC']!, 1),
    ).to.eventually.be.rejected;
  });
});
