import { PublicKey } from '@solana/web3.js';
import { DEVNET_ORACLES } from './const';
import { Group, MangoClient } from '../../../src';

const defaultOracleConfig = {
  confFilter: 0.1,
  maxStalenessSlots: null,
};

export const perpCreateMarketSOL = async (
  client: MangoClient,
  group: Group,
): Promise<void> => {
  try {
    console.log(`Registering SOL-PERP...`);

    // 100, // quoteLotSize: number,
    // 10000, // baseLotSize: number,
    // ┌──────────────┬────────────┐
    // │ (index)      │ Values     │
    // ├──────────────┼────────────┤
    // │ name         │ 'SOL-PERP' │
    // │ reduceOnly   │ false      │
    // │ minOrderSize │ 0.01       │
    // │ tickSize     │ 0.01       │
    // │ initLeverage │ '5.00'     │
    // │ maxLeverage  │ '10.00'    │
    // │ makerFee     │ '-0.03'    │
    // │ takerFee     │ '0.06'     │
    // │ minFunding   │ '-5.00'    │
    // │ maxFunding   │ '5.00'     │
    // └──────────────┴────────────┘
    const sig = await client.perpCreateMarket(
      group, // group: Group,
      new PublicKey(DEVNET_ORACLES.get('SOL')!), // oraclePk: PublicKey,
      0, // perpMarketIndex: number,
      'SOL-PERP', // name: string,
      defaultOracleConfig, // oracleConfig: OracleConfigParams,
      6, // baseDecimals: number,
      100, // quoteLotSize: number,
      10000, // baseLotSize: number,
      0.9, // maintBaseAssetWeight: number,
      0.8, // initBaseAssetWeight: number,
      1.1, // maintBaseLiabWeight: number,
      1.2, // initBaseLiabWeight: number,
      0.95, // maintOverallAssetWeight: number,
      0.9, // initOverallAssetWeight: number,
      0.05, // baseLiquidationFee: number,
      -0.0003, // makerFee: number,
      0.0006, // takerFee: number,
      0, // feePenalty: number,
      -0.05, // minFunding: number,
      0.05, // maxFunding: number,
      100, // impactQuantity: number,
      true, // groupInsuranceFund: boolean,
      1000, // settleFeeFlat: number,
      1000000, // settleFeeAmountThreshold: number,
      0.05, // settleFeeFractionLowHealth: number,
      0, // settleTokenIndex: number,
      1.0, // settlePnlLimitFactor: number,
      2 * 60 * 60, // settlePnlLimitWindowSize: number,
      0.1, // positivePnlLiquidationFee: number,
      0, // platformLiquidationFee: number,
    );

    console.log(
      `perpCreateMarket SOL-PERP https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
    );
  } catch (error) {
    console.log('Error registering SOL-PERP', error.message);
    console.log(error);
  }
};

export const perpCreateMarketBTC = async (
  client: MangoClient,
  group: Group,
): Promise<void> => {
  try {
    console.log(`Registering BTC-PERP...`);
    const sig = await client.perpCreateMarket(
      group, // group: Group,
      new PublicKey(DEVNET_ORACLES.get('BTC')!), // oraclePk: PublicKey,
      1, // perpMarketIndex: number,
      'BTC-PERP', // name: string,
      defaultOracleConfig, // DefaultTokenRegisterParams.oracleConfig, // oracleConfig: OracleConfigParams,
      6, // baseDecimals: number,
      10, // quoteLotSize: number,
      100, // baseLotSize: number,
      0.975, // maintBaseAssetWeight: number,
      0.95, // initBaseAssetWeight: number,
      1.025, // maintBaseLiabWeight: number,
      1.05, // initBaseLiabWeight: number,
      0.95, // maintOverallAssetWeight: number,
      0.9, // initOverallAssetWeight: number,
      0.012, // baseLiquidationFee: number,
      0.0002, // makerFee: number,
      0.0, // takerFee: number,
      0, // feePenalty: number,
      0.05, // minFunding: number,
      0.05, // maxFunding: number,
      100, // impactQuantity: number,
      true, // groupInsuranceFund: boolean,
      1000, // settleFeeFlat: number,
      1000000, // settleFeeAmountThreshold: number,
      0.05, // settleFeeFractionLowHealth: number,
      0, // settleTokenIndex: number,
      1.0, // settlePnlLimitFactor: number,
      2 * 60 * 60, // settlePnlLimitWindowSize: number,
      0.025, // positivePnlLiquidationFee: number,
      0, // platformLiquidationFee: number,
    );
    console.log(
      `perpCreateMarket BTC-PERP https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
    );
  } catch (error) {
    console.log('Error registering BTC-PERP', error.message);
    console.log(error);
  }
};
