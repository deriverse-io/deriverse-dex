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
)
const client = MangoClient.connect(provider, 'devnet', DERIVERSE_ID['devnet'], {
    idsSource: 'get-program-accounts'
});
```

# Getting the group

```typescript
import { DERIVERSE_MAIN_GROUP } from '@deriverse/sdk';
const group = await client.getMangoGroup(DERIVERSE_MAIN_GROUP);
```

# Get Account

```typescript
const accountIndex = 0; // This should always be 0
const account = await client.getMangoAccountForOwner(group, owner, accountIndex);
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