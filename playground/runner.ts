import { Operations } from './operations';

const run = async (): Promise<void> => {
  const op = new Operations();
  await op.init();

  // await op.closeMangoAccount(0);
  // await op.closeMangoAccount(1);
  // await op.closeMangoAccount(2);
  // await op.closeMangoAccount(3);
  // await op.closeMangoAccount(4);

  // await op.createMangoAccount('andrzej', 0);
  // await op.createMangoAccount('andrzej2', 1);
  // await op.createMangoAccount('andrzej3', 2);
  // await op.createMangoAccount('andrzej4', 3);
  // await op.createMangoAccount('andrzej5', 4);

  // await op.depositToken(0, 1_000);
  // await op.depositToken(1, 1_000);
  // await op.depositToken(2, 1_000);
  // await op.depositToken(3, 1_000);
  // await op.depositToken(4, 1_000);

  // await op.depositTokenRandom(0);
  // await op.depositTokenRandom(1);
  // await op.depositTokenRandom(2);

  // const pp0 = await op.get_perp_positions(0);
  // const pp1 = await op.get_perp_positions(1);
  // const pp2 = await op.get_perp_positions(2);
  // const pp3 = await op.get_perp_positions(3);
  // const pp4 = await op.get_perp_positions(4);
  // console.log('PerpPositions acc0', pp0);
  // console.log('PerpPositions acc1', pp1);
  // console.log('PerpPositions acc2', pp2);
  // console.log('PerpPositions acc3', pp3);
  // console.log('PerpPositions acc4', pp4);

  // await op.cancelAllOrders(1);
  // await op.cancelAllOrders(0);
  // console.log('Cancelled all orders');

  await op.post_asks(1, 50);
  await op.post_bids(0, 50);
  console.log('Posted all orders');
  await op.post_asks(0, 50);
  await op.post_bids(1, 50);
  console.log('Posted all orders');
  // await op.post_asks(2, 50);
  // await op.post_bids(2, 50);
  // console.log('Posted all orders');

  // await op.getOpenOrders(0);
  // await op.getOpenOrders(1);

  await op.post_market_buy(2);
  await op.post_market_sell(3);
  console.log('Posted all market orders');
  await op.post_market_buy(2);
  await op.post_market_sell(3);
  console.log('Posted all market orders');

  // await op.close_all(0);
  // await op.close_all(1);

  const pp0 = await op.get_perp_positions(0);
  const pp1 = await op.get_perp_positions(1);
  const pp2 = await op.get_perp_positions(2);
  const pp3 = await op.get_perp_positions(3);
  const pp4 = await op.get_perp_positions(4);
  console.log('PerpPositions acc0', pp0);
  console.log('PerpPositions acc1', pp1);
  console.log('PerpPositions acc2', pp2);
  console.log('PerpPositions acc3', pp3);
  console.log('PerpPositions acc4', pp4);

  // ==========================================

  // await op.closeMangoAccount(0);
  // await op.closeMangoAccount(1);

  // await op.post_asks(1, 50);
  // await op.post_bids(0, 50);
  // console.log('Posted all orders');
  // await op.close_all(0);
  // await op.close_all(1);
  // await op.post_asks(0, 50);
  // await op.post_bids(1, 50);
  // console.log('Posted all orders');

  // await op.editGroup();

  // await op.settleAll(0);
  // await op.settleAll(1);
  // await op.settleAll(2);

  // await op.post_market_sell_reduce(0);
  // await op.post_market_buy_reduce(0);
  // await op.post_market_sell_reduce(1);
  // await op.post_market_buy_reduce(1);

  // await op.close_all(0);
  // await op.close_all(1);
  // await op.close_all(2);
  // await op.closeMangoAccount(0);
  // await op.closeMangoAccount(1);
  // await op.closeMangoAccount(2);

  // await op.getClient().perpConsumeAllEvents(op.getGroup(), 0 as any);
};

run();
