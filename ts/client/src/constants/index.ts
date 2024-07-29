import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export const RUST_U64_MAX = (): BN => {
  return new BN('18446744073709551615');
};
export const RUST_I64_MAX = (): BN => {
  return new BN('9223372036854775807');
};
export const RUST_I64_MIN = (): BN => {
  return new BN('-9223372036854775807');
};

export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  'ComputeBudget111111111111111111111111111111',
);

export const OPENBOOK_PROGRAM_ID = {
  devnet: new PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj'),
  'mainnet-beta': new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
};

export const MANGO_V4_ID = {
  testnet: new PublicKey('8AHhgx8bNF4oejgfUzN6A7ZN1CPrh8NMsgnrcDiNgUiZ'),
  devnet: new PublicKey('8AHhgx8bNF4oejgfUzN6A7ZN1CPrh8NMsgnrcDiNgUiZ'),
  'mainnet-beta': new PublicKey('8AHhgx8bNF4oejgfUzN6A7ZN1CPrh8NMsgnrcDiNgUiZ'),
};

export const MANGO_V4_MAIN_GROUP = new PublicKey(
  'C3DBQndS83wQGFPWrFob3JsdJAft1CkB6HtpTtWWo8d',
);

export const USDC_MINT = new PublicKey(
  '4dcRteBQhtSVewgUEEvSFRjhRZmWohjAAE5VzvT8if8f',
);
export const MAX_RECENT_PRIORITY_FEE_ACCOUNTS = 128;

export const JUPITER = {
  V3: new PublicKey('JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph'),
  V4: new PublicKey('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'),
  V6: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
};
