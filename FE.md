# Init client

```typescript
import { MangoClient, DERIVERSE_ID } from '@deriverse/sdk';
const options = {
  ...AnchorProvider.defaultOptions(),
  preflightCommitment: 'confirmed',
} as ConfirmOptions;
const provider = new AnchorProvider(
  connection,
  wallet.adapter as unknown as Wallet,
  options,
);
const client = MangoClient.connect(provider, 'devnet', DERIVERSE_ID['devnet'], {
  idsSource: 'get-program-accounts',
});
```

# Getting the group

```typescript
import { DERIVERSE_MAIN_GROUP } from '@deriverse/sdk';
const group = await client.getGroup(DERIVERSE_MAIN_GROUP);
```

# Get Account

```typescript
const accountIndex = 0; // This should always be 0
const account = await client.getMangoAccountForOwner(
  group,
  owner,
  accountIndex,
);
```

# Account creation

```typescript
const sig = await client.createMangoAccountWithAirdrop(group, name);
console.log(`https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`);
```

# Deposit

```typescript
import { USDC_MINT } from '@deriverse/sdk';
cosnt amount = 10_000; // 10000 USDC
const sig = await client.tokenDeposit(group, account, USDC_MINT, amount);
console.log(`https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`);
```

# Get signature from Error

```typescript
try {
  const sig = await client.tokenDeposit(group, account, USDC_MINT, amount);
  console.log(`https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`);
} catch (e) {
  console.error(
    `error https://explorer.solana.com/tx/${e.txid}?cluster=devnet`,
  );
}
```

# Place order

## Get perp market

```typescript
const perpMarket = group.getPerpMarketByName('SOL-PERP');
const perpMarket = group.getPerpMarketByMarketIndex(0 as PerpMarketIndex);
```

## Market order

```typescript
const perpMarket = group.getPerpMarketByName('SOL-PERP');
const perpMarketIndex = perpMarket.perpMarketIndex;
const price = perpMarket.price;
const quantity = 1.66;
const slippage = 0.1; // 10 %
const side = PerpOrderSide.ask; // OR PerpOrderSide.bid
const sig = await client.perpPlaceMarketOrder(
  group,
  mangoAccount,
  perpMarketIndex,
  side,
  price,
  quantity,
  slippage,
);
console.log(
  `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
);
```

## Limit order

```typescript
const perpMarket = group.getPerpMarketByName('SOL-PERP');
const perpMarketIndex = perpMarket.perpMarketIndex;
const price = perpMarket.price;
const quantity = 1.66;
const side = PerpOrderSide.ask; // OR PerpOrderSide.bid

const sig = await client.perpPlaceLimitOrder(
  group,
  mangoAccount,
  perpMarketIndex,
  side,
  price,
  quantity,
);
console.log(
  `sig https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
);
```

# Recent Trades

```typescript
// Subscribe
const listenerId = await client.subscribeToRecentTrades(group, (logUi: IRecentTradeUi) => {
  console.log(logUi);
});

// Unsubscribe
await client.unsubscribeRecentTrades(listenerId);
```

# Load orderbook

```typescript
const perpMarket = group.getPerpMarketByName('SOL-PERP');
const forceReload = false; // After init should be false to minimize the number of requests, set to true to force reload on consecutive calls
const orderbook: IOrderbookUi = await perpMarket.loadOrderbook(client, forceReload);
```

# Portfolio

## Get positions

```typescript
const positions = await mangoAccount.getPerpPositionsUi(group);
```

## Get open orders

```typescript
// for one market
await mangoAccount.getOpenOrdersForMarketUi(client, group, perpMarketIndex);
```

