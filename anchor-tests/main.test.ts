import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import * as spl from '@solana/spl-token';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { MangoV4 } from '../target/types/mango_v4';
import {
  Group,
  MangoAccount,
  MangoClient,
  StubOracle,
} from '../ts/client/src/index';
import {
  connection,
  DEFAULT_GROUP_NUM,
  envProvider,
  envProviderPayer,
  envProviderWallet,
  MINTS,
  NET_BORROWS_LIMIT_NATIVE,
  NUM_USERS,
  program,
  programId,
  USDC_DECIMALS,
  USDC_DECIMALS_MUL,
} from './utils/setup';
import { DefaultTokenRegisterParams } from '../ts/client/src/clientIxParamBuilder';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;
const assert = chai.assert;

interface TestUser {
  keypair: anchor.web3.Keypair;
  tokenAccounts: spl.Account[];
  mangoAccount: MangoAccount;
  client: MangoClient;
}

async function createMints(
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

async function createUser(
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

async function createUsers(
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

describe('deriverse dex', () => {
  let users: TestUser[] = [];

  let mintsMap: Partial<Record<keyof typeof MINTS, PublicKey>>;

  let group: Group;
  let usdcOracle: StubOracle;
  // let btcOracle: StubOracle;
  let envClient: MangoClient;

  it('Initialize group and users', async () => {
    mintsMap = await createMints(program, envProviderPayer, envProviderWallet);

    // const groupNum = 666;
    const insuranceMintPk = mintsMap['USDC']!;
    const adminPk = envProviderWallet.publicKey;

    // Passing devnet as the cluster here - client cannot accept localnet
    // I think this is only for getting the serum market though?
    envClient = MangoClient.connect(envProvider, 'devnet', programId, {
      idsSource: 'get-program-accounts',
    });
    await envClient.groupCreate(DEFAULT_GROUP_NUM, true, 1, insuranceMintPk);
    group = await envClient.getGroupForCreator(adminPk, DEFAULT_GROUP_NUM);

    users = await createUsers(
      mintsMap,
      envProviderPayer,
      envProvider,
      group,
      connection,
      programId,
    );

    assert.strictEqual(group.groupNum, DEFAULT_GROUP_NUM);
    assert.deepEqual(group.admin, adminPk);
  });

  it('creates oracle and registers USDC token', async () => {
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
    const banks = await envClient.getBanksForGroup(group);
    assert.equal(banks.length, 1, 'Two banks present');

    assert.equal(banks[0].name, 'USDC', 'USDC bank present');
    assert.equal(banks[0].tokenIndex, 0, 'USDC bank token index set');
    assert.equal(banks[0].uiDeposits(), 0, 'USDC bank has zero deposits');
    assert.equal(banks[0].uiBorrows(), 0, 'USDC bank has zero borrows');
  });

  describe('deposit', () => {
    it('deposits USDC token over a limit', async () => {
      await users[0].client.tokenDeposit(
        group,
        users[0].mangoAccount,
        mintsMap['USDC']!,
        50 * 1e6,
      );
    });

    it('fails to deposit less than a limit', async () => {
      expect(
        users[0].client.tokenDeposit(
          group,
          users[0].mangoAccount,
          mintsMap['USDC']!,
          1,
        ),
      ).to.eventually.be.rejected;
    });
  });

  describe('airdrop', () => {
    const admin = envProviderPayer;
    const payer = admin;
    let mint: PublicKey;
    let reserveAccount: spl.Account;
    let programAuthorityPda: PublicKey;
    let airdropInfoPda: PublicKey;
    let userTokenAccount: PublicKey;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let bumpSeed: number;
    let user: TestUser;
    const seed = 'authority';

    before(async () => {
      mint = mintsMap['USDC']!;

      // Create fresh user
      user = await createUser(
        mintsMap,
        payer,
        envProvider,
        group,
        connection,
        programId,
        0,
      );

      // Find the airdrop info PDA for the user
      [airdropInfoPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('airdrop'), user.keypair.publicKey.toBuffer()],
        programId,
      );

      // Find the program authority PDA
      [programAuthorityPda, bumpSeed] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        programId,
      );
    });

    it('creates airdrop reserve account vault and mints tokens to the reserve', async () => {
      // Create the airdrop vault token account
      reserveAccount = await spl.getOrCreateAssociatedTokenAccount(
        connection,
        admin,
        mint,
        programAuthorityPda, // airdropVault,
        true,
      );

      const amount = 10_000_000_000 * USDC_DECIMALS_MUL;

      // Mint tokens to the reserve account
      await spl.mintTo(
        connection,
        payer,
        mint,
        reserveAccount.address,
        payer,
        amount,
      );

      await Promise.resolve(setTimeout(() => ({}), 500));

      const reserveAccountInfo = await spl.getAccount(
        connection,
        reserveAccount.address,
      );

      // console.log('reserveAccountInfo', reserveAccountInfo);

      expect(Number(reserveAccountInfo.amount)).to.equal(amount);
    });

    it('verify that user has not received airdrop yet and has not aidrop account info', async () => {
      // Verify that the airdrop info data does not exist
      await expect(
        user.client.program.account.airdropInfo.fetch(airdropInfoPda),
      ).to.eventually.be.rejectedWith(/Account does not exist or has no data/);
    });

    it('user is able to run airdrop and receives token', async () => {
      // Get the associated token address for the user
      userTokenAccount = await spl.getAssociatedTokenAddress(
        mint,
        user.keypair.publicKey,
      );

      // Initialize the airdrop and airdrop tokens to the user
      await user.client.program.methods
        .airdrop()
        .accounts({
          user: user.keypair.publicKey,
          reserveAccount: reserveAccount.address,
          userTokenAccount: userTokenAccount,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          programAuthority: programAuthorityPda,
          airdropInfo: airdropInfoPda,
          mint: mint,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user.keypair])
        .rpc({ commitment: 'confirmed' });

      // Verify the airdrop
      const airdropInfo = await user.client.program.account.airdropInfo.fetch(
        airdropInfoPda,
      );
      assert.equal(airdropInfo.hasReceived, true);

      // Verify the airdrop amount
      const userAccount = await spl.getAccount(
        connection,
        userTokenAccount,
        'confirmed',
        spl.TOKEN_PROGRAM_ID,
      );
      assert.equal(Number(userAccount.amount), 10_000 * USDC_DECIMALS_MUL);
    });

    it('user is able to run airdrop 2nd time without receiving more tokens', async () => {
      // Initialize the airdrop and airdrop tokens to the user
      await user.client.program.methods
        .airdrop()
        .accounts({
          user: user.keypair.publicKey,
          reserveAccount: reserveAccount.address,
          userTokenAccount: userTokenAccount,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          programAuthority: programAuthorityPda,
          airdropInfo: airdropInfoPda,
          mint: mint,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user.keypair])
        .rpc({ commitment: 'confirmed' });

      // Verify the airdrop
      const airdropInfo = await user.client.program.account.airdropInfo.fetch(
        airdropInfoPda,
      );
      assert.equal(airdropInfo.hasReceived, true);

      // Verify the airdrop amount is still the same
      const userAccount = await spl.getAccount(
        connection,
        userTokenAccount,
        'confirmed',
        spl.TOKEN_PROGRAM_ID,
      );
      assert.equal(Number(userAccount.amount), 10_000 * USDC_DECIMALS_MUL);
    });
  });

  describe('create mango account with airdrop though sdk', () => {
    let user: TestUser;
    let mint: PublicKey;

    before(async () => {
      mint = mintsMap['USDC']!;

      // Create fresh user
      user = await createUser(
        mintsMap,
        envProviderPayer,
        envProvider,
        group,
        connection,
        programId,
        0,
      );
    });

    it('creates the account', async () => {
      const sig = await user.client.createMangoAccountWithAirdrop(
        group,
        'some_name',
      );
      console.log('sig', sig);

      // Get the associated token address for the user
      const userTokenAccount = await spl.getAssociatedTokenAddress(
        mint,
        user.keypair.publicKey,
      );

      const userAccount = await spl.getAccount(
        connection,
        userTokenAccount,
        'confirmed',
        spl.TOKEN_PROGRAM_ID,
      );
      assert.equal(Number(userAccount.amount), 10_000 * USDC_DECIMALS_MUL);
    });
  });
});
