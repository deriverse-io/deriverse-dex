import { PublicKey } from '@solana/web3.js';
import { getClient } from './utils/getClient';
import {
  FillEvent,
  Group,
  IPerpPositionUi,
  MangoAccount,
  MangoClient,
  PerpEventQueue,
  PerpMarketIndex,
  PerpOrderSide,
  PerpOrderType,
} from '../ts/client/src';
import * as dotenv from 'dotenv';
import { Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
dotenv.config();

export const DEVNET_USDC = new PublicKey(process.env.DEVNET_USDC!);
export const MARKET_NAME = 'SOL-PERP';
export const OPEN_ORDERS_COUNT = 5;

export class Operations {
  private adminPk = new PublicKey(process.env.ADMIN_PK!);
  private client: MangoClient;
  private group: Group;
  private mangoAccounts: MangoAccount[];
  private initialized = false;
  private keypair: Keypair;

  async init(): Promise<void> {
    this.client = await getClient();
    this.group = await this.client.getGroupForCreator(
      this.adminPk,
      parseInt(process.env.GROUP_NUM!),
    );
    this.mangoAccounts = await this.client.getMangoAccountsForOwner(
      this.group,
      this.adminPk,
    );
    this.initialized = true;
  }

  async initWithKeypair(keypair: Keypair): Promise<void> {
    this.keypair = keypair;
    this.client = await getClient(keypair);
    this.group = await this.client.getGroupForCreator(
      this.adminPk,
      parseInt(process.env.GROUP_NUM!),
    );
    this.mangoAccounts = await this.client.getMangoAccountsForOwner(
      this.group,
      keypair.publicKey,
    );
    this.initialized = true;
  }

  public async solAirdrop(): Promise<void> {
    const requiredLamports = 99600000;
    const airdropSignature = await this.client.connection.requestAirdrop(
      this.keypair.publicKey,
      requiredLamports,
    );
    const sig = await this.client.connection.confirmTransaction(
      airdropSignature,
    );
    console.log('Airdrop Signature:', sig);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async reloadAll(): Promise<void> {
    await this.group.reloadAll(this.client);
    this.mangoAccounts = await this.client.getMangoAccountsForOwner(
      this.group,
      this.adminPk,
    );
    }

  public getAllMangoAccounts(): MangoAccount[] {
    return this.mangoAccounts;
  }

  public async logBidsAndAsks(debug = false): Promise<any> {
    await this.group.reloadAll(this.client);
    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const res = [
      (await perpMarket?.loadBids(this.client)).items(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      (await perpMarket?.loadAsks(this.client)!).items(),
    ];
    if (debug) {
      console.log(
        `bids ${JSON.stringify(
          Array.from(res[0]).map((i) => ({ price: i.uiPrice, size: i.uiSize })),
          null,
          2,
        )}`,
      );
      console.log(
        `asks ${JSON.stringify(
          Array.from(res[1]).map((i) => ({ price: i.uiPrice, size: i.uiSize })),
          null,
          2,
        )}`,
      );
    }
    return res;
  }

  public getMangoAccount(mangoAccountIndex: number): MangoAccount {
    return this.mangoAccounts[mangoAccountIndex];
  }

  public getClient(): MangoClient {
    return this.client;
  }

  public getGroup(): Group {
    return this.group;
  }

  public async post_asks(
    mangoAccountIndex: number,
    offset = 100,
    oraclePegged = false,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];
    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    for (let i = 0; i < OPEN_ORDERS_COUNT; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = perpMarket.uiPrice;
        const priceOffset = Math.floor(Math.random() * offset);
        console.log(
          `...placing perp limit ask clientId: ${clientId} price: ${priceOffset} at oracle price ${perpMarket.uiPrice}`,
        );

        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;
        let sig;

        if (!oraclePegged) {
          sig = await this.client.perpPlaceOrder(
            this.group, // group: Group,
            mangoAccount, // mangoAccount: MangoAccount,
            perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
            PerpOrderSide.ask, // side: PerpOrderSide,
            price + priceOffset, // price: number,
            quantity, //1.01, // quantity: number, // 0.01
            undefined, // maxQuoteQuantity?: number,
            clientId, // clientOrderId?: number,
            PerpOrderType.limit, // orderType?: PerpOrderType,
            false, // reduceOnly?: boolean,
            0, // expiryTimestamp?: number,
            1, // limit?: number,
          );
        } else {
          sig = await this.client.perpPlaceOrderPegged(
            this.group, // group: Group,
            mangoAccount, // mangoAccount: MangoAccount,
            perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
            PerpOrderSide.ask, // side: PerpOrderSide,
            priceOffset, // priceOffset, // price: number,
            quantity, // quantity: number,
            undefined, // pegLimit?: number
            undefined, // maxQuoteQuantity?: number,
            clientId, // clientOrderId?: number,
            PerpOrderType.limit, // orderType?: PerpOrderType,
            false, // reduceOnly?: boolean,
            0, // expiryTimestamp?: number,
            1, // limit?: number,
          );
        }

        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }
  public async post_bids(
    mangoAccountIndex: number,
    offset = 100,
    oraclePegged = false,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const orders = await mangoAccount.loadPerpOpenOrdersForMarket(
      this.client,
      this.group,
      perpMarket.perpMarketIndex,
    );
    for (const order of orders) {
      console.log(
        `Current order - ${order.uiPrice} ${order.uiSize} ${order.side}`,
      );
    }
    for (let i = 0; i < OPEN_ORDERS_COUNT; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = perpMarket.uiPrice;
        const priceOffset = Math.floor(Math.random() * offset);
        console.log(
          `...placing perp limit bid clientId: ${clientId} price: ${priceOffset} at oracle price ${perpMarket.uiPrice}`,
        );

        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;
        let sig;
        if (!oraclePegged) {
          sig = await this.client.perpPlaceOrder(
            this.group, // group: Group,
            mangoAccount, // mangoAccount: MangoAccount,
            perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
            PerpOrderSide.bid, // side: PerpOrderSide,
            price - priceOffset, // price: number,
            quantity, // 1.01, // quantity: number, // 0.01
            undefined, // maxQuoteQuantity?: number,
            clientId, // clientOrderId?: number,
            PerpOrderType.limit, // orderType?: PerpOrderType,
            false, // reduceOnly?: boolean,
            0, // expiryTimestamp?: number,
            1, // limit?: number,
          );
        } else {
          sig = await this.client.perpPlaceOrderPegged(
            this.group, // group: Group,
            mangoAccount, // mangoAccount: MangoAccount,
            perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
            PerpOrderSide.bid, // side: PerpOrderSide,
            -priceOffset, // priceOffset, // price: number,
            quantity, // quantity: number,
            undefined, // pegLimit?: number
            undefined, // maxQuoteQuantity?: number,
            clientId, // clientOrderId?: number,
            PerpOrderType.limit, // orderType?: PerpOrderType,
            false, // reduceOnly?: boolean,
            0, // expiryTimestamp?: number,
            1, // limit?: number,
          );
        }

        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }

  public async cancelAllOrders(mangoAccountIndex: number): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];
    try {
      console.log(`...cancelling all perp orders`);
      const sig = await this.client.perpCancelAllOrders(
        this.group,
        mangoAccount,
        0 as PerpMarketIndex,
        30,
      );
      console.log(
        `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  public async post_market_buy(
    mangoAccountIndex: number,
    numberOrOrders = 1,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const asks = await perpMarket.loadAsks(this.client, true);

    for (let i = 0; i < numberOrOrders; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = asks.best()?.price ?? 0;
        console.log(
          `...placing perp market bid clientId: ${clientId} price: ${price} at oracle price ${perpMarket.uiPrice}`,
        );
        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;

        const sig = await this.client.perpPlaceOrder(
          this.group, // group: Group,
          mangoAccount, // mangoAccount: MangoAccount,
          perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
          PerpOrderSide.bid, // side: PerpOrderSide,
          price, // price: number,
          quantity, //0.01, // quantity: number,
          undefined, // maxQuoteQuantity?: number,
          undefined, // clientOrderId?: number,
          PerpOrderType.market, // orderType?: PerpOrderType,
          false, // reduceOnly?: boolean,
          0, // expiryTimestamp?: number,
          1, // limit?: number,
        );
        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }

  public async post_market_sell(
    mangoAccountIndex: number,
    numberOrOrders = 1,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const bids = await perpMarket.loadBids(this.client, true);

    for (let i = 0; i < numberOrOrders; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = bids.best()?.price ?? 0;
        console.log(
          `...placing perp market ask clientId: ${clientId} price: ${price} at oracle price ${perpMarket.uiPrice}`,
        );
        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;

        const sig = await this.client.perpPlaceOrder(
          this.group, // group: Group,
          mangoAccount, // mangoAccount: MangoAccount,
          perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
          PerpOrderSide.ask, // side: PerpOrderSide,
          price, // price: number,
          quantity, //0.01, // quantity: number,
          undefined, // maxQuoteQuantity?: number,
          undefined, // clientOrderId?: number,
          PerpOrderType.market, // orderType?: PerpOrderType,
          false, // reduceOnly?: boolean,
          0, // expiryTimestamp?: number,
          1, // limit?: number,
        );
        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }

  public async post_market_buy_reduce(
    mangoAccountIndex: number,
    numberOrOrders = 1,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const asks = await perpMarket.loadAsks(this.client, true);

    for (let i = 0; i < numberOrOrders; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = asks.best()?.price ?? 0;
        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;
        console.log(
          `...placing perp market bid clientId: ${clientId} price: ${price} at oracle price ${perpMarket.uiPrice}`,
        );
        const sig = await this.client.perpPlaceOrder(
          this.group, // group: Group,
          mangoAccount, // mangoAccount: MangoAccount,
          perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
          PerpOrderSide.bid, // side: PerpOrderSide,
          price, // price: number,
          quantity, // quantity: number,
          undefined, // maxQuoteQuantity?: number,
          undefined, // clientOrderId?: number,
          PerpOrderType.market, // orderType?: PerpOrderType,
          true, // reduceOnly?: boolean,
          0, // expiryTimestamp?: number,
          1, // limit?: number,
        );
        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }

  public async post_market_sell_reduce(
    mangoAccountIndex: number,
    numberOrOrders = 1,
  ): Promise<any> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const bids = await perpMarket.loadBids(this.client, true);

    for (let i = 0; i < numberOrOrders; i++) {
      try {
        const clientId = Math.floor(Math.random() * 99999);
        const price = bids.best()?.price ?? 0;
        const quantity = (Math.floor(Math.random() * 100) + 1) / 100 + 1;
        console.log(
          `...placing perp market ask clientId: ${clientId} price: ${price} at oracle price ${perpMarket.uiPrice}`,
        );
        const sig = await this.client.perpPlaceOrder(
          this.group, // group: Group,
          mangoAccount, // mangoAccount: MangoAccount,
          perpMarket.perpMarketIndex, // perpMarketIndex: PerpMarketIndex,
          PerpOrderSide.ask, // side: PerpOrderSide,
          price, // price: number,
          quantity, // quantity: number,
          undefined, // maxQuoteQuantity?: number,
          undefined, // clientOrderId?: number,
          PerpOrderType.market, // orderType?: PerpOrderType,
          true, // reduceOnly?: boolean,
          0, // expiryTimestamp?: number,
          1, // limit?: number,
        );
        console.log(
          `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  }

  public async get_perp_positions(
    mangoAccountIndex: number,
  ): Promise<IPerpPositionUi[]> {
    const mangoAccount = this.mangoAccounts[mangoAccountIndex];

    const perpsSummary = mangoAccount.getPerpPositionsUi(this.group);

    return perpsSummary;
  }

  public async close_all(mangoAccountIndex: number): Promise<any> {
    const slippage = 0.5; // 50%

    try {
      const sig = await this.client.perpCloseAll(
        this.group,
        this.mangoAccounts[mangoAccountIndex],
        slippage,
      );
      console.log(
        `closeAll sig ${mangoAccountIndex} https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('closeAll', error.message);
    }
  }

  public async closeMangoAccount(
    mangoAccountIndex: number,
    forceClose = true,
  ): Promise<any> {
    try {
      const sig = await this.client.closeMangoAccount(
        this.group,
        this.mangoAccounts[mangoAccountIndex],
        forceClose,
      );
      console.log(
        `closeAccount sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('closeMangoAccount error', error.message);
    }
  }

  public async createMangoAccount(name: string, index: number): Promise<any> {
    const tokenCount = 3;
    const serum3Count = 0;
    const perpCount = 10; // 20 started to give different error (not InvalidRealloc)
    const perpOoCount = 60;
    // 10/60 worked (needs to be thoroughly tested with multiple markets)
    try {
      const sig = await this.client.createMangoAccount(
        this.group,
        index,
        name,
        tokenCount,
        serum3Count,
        perpCount,
        perpOoCount,
      );

      console.log(
        `createMangoAccount sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('createMangoAccount error', error.message);
    }
  }

  public async createMangoAccountWithAirdrop(name: string): Promise<any> {
    try {
      const sig = await this.client.createMangoAccountWithAirdrop(
        this.group,
        name,
      );

      console.log(
        `createMangoAccountDevnet sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log(
        `createMangoAccountDevnet error sig https://explorer.solana.com/tx/${error.txid}?cluster=devnet`,
      );
      console.log('createMangoAccountDevnet error', error.message);
    }
  }

  public async depositToken(
    mangoAccountIndex: number,
    amount: number,
    reload = false,
  ): Promise<any> {
    try {
      const sig = await this.client.tokenDeposit(
        this.group,
        this.mangoAccounts[mangoAccountIndex],
        DEVNET_USDC,
        amount,
      );
      if (reload) {
        console.log(`mango account ${mangoAccountIndex} reload`);
        await this.mangoAccounts[mangoAccountIndex].reload(this.client);
      }
      console.log(
        `depositToken sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('deposit token', error.message);
    }
  }

  public async depositTokenRandom(mangoAccountIndex: number): Promise<any> {
    const MAX = 100_000;
    const amount = Math.floor(Math.random() * MAX);
    return this.depositToken(mangoAccountIndex, amount);
  }

  public async getOpenOrders(mangoAccountIndex: number): Promise<any[]> {
    // const mangoAccount = this.mangoAccounts[mangoAccountIndex];
    // const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    // const openOrders = await mangoAccount.getOpenOrdersUi(
    //   this.client,
    //   this.group,
    //   perpMarket.perpMarketIndex,
    // );

    // return openOrders;
    return [];
  }

  public async settleAll(mangoAccountIndex: number): Promise<any> {
    try {
      const sig = await this.client.settleAll(
        this.client,
        this.group,
        this.mangoAccounts[mangoAccountIndex],
      );
      console.log(
        `settleAll sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('settleAll', error.message);
    }
  }

  public async editGroup(): Promise<any> {
    try {
      const sig = await this.client.groupEdit(
        this.group,
        undefined,
        undefined,
        undefined,
        1,
      );
      console.log(
        `...edited group, https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      );
    } catch (error) {
      console.log('editGroup', error.message);
    }
  }

  public async loadFills(): Promise<FillEvent[]> {
    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const fills = await perpMarket.loadFills(this.client);

    return fills;
  }

  public async loadEventQueue(): Promise<PerpEventQueue> {
    const perpMarket = this.group.getPerpMarketByName(MARKET_NAME);
    const eventQueue = await perpMarket.loadEventQueue(this.client);

    return eventQueue;
  }
}
