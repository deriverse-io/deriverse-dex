import * as dotenv from 'dotenv';
dotenv.config();

export const DEVNET_MINTS = new Map([
  ['USDC', process.env.DEVNET_USDC], // 0 // our fake USDC
  ['SOL', 'So11111111111111111111111111111111111111112'], // 4 Wrapped SOL
]);
export const DEVNET_ORACLES = new Map([
  // ['SOL', 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'],
  // ['SOL', '7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE'], // THIS IS ADDRESS FROM MAINNET ORACLE SOL
  ['SOL', 'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR'], // switchboard sol devnet address: https://app.switchboard.xyz/solana/devnet/feed/GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR https://app.switchboard.xyz/solana/devnet https://docs.save.finance/permissionless-pools/switchboard-v2-guide
  // ['BTC', 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J'],
  ['BTC', 'J8VFqNEaqBscVNyd3uX5eSazUQcspD44uazzdCFLNA4g'], // switchboard btc devnet address: https://app.switchboard.xyz/solana/devnet/feed/J8VFqNEaqBscVNyd3uX5eSazUQcspD44uazzdCFLNA4g
  ['ETH', 'EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw'],
]);
// const MAINNET_ORACLES = new Map([
//   // USDC - stub oracle
//   ['USDT', '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL'],
//   ['DAI', 'CtJ8EkqLmeYyGB8s4jevpeNsvmD4dxVR2krfsDLcvV8Y'],
//   ['ETH', 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB'],
//   ['SOL', 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'],
//   ['MSOL', 'E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9'],
//   // ['MNGO', '79wm3jjcPr6RaNQ4DGvP5KxG1mNd3gEBsg6FsNVFezK4'], // pyth
//   ['MNGO', '5xUoyPG9PeowJvfai5jD985LiRvo58isaHrmmcBohi3Y'], // switchboard
//   ['BTC', 'GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU'],
//   ['BONK', '4SZ1qb4MtSUrZcoeaeQ3BDzVCyqxw3VwSFpPiMTmn4GE'],
// ]);
