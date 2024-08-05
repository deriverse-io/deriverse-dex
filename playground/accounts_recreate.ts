import { Operations } from './operations';

const run = async (): Promise<void> => {
  const op = new Operations();
  await op.init();

  await op.close_all(0);
  await op.close_all(1);
  await op.close_all(2);
  await op.close_all(3);
  await op.close_all(4);

  await op.closeMangoAccount(0);
  await op.closeMangoAccount(1);
  await op.closeMangoAccount(2);
  await op.closeMangoAccount(3);
  await op.closeMangoAccount(4);

  await op.createMangoAccount('andrzej', 0);
  await op.createMangoAccount('andrzej2', 1);
  await op.createMangoAccount('andrzej3', 2);
  await op.createMangoAccount('andrzej4', 3);
  await op.createMangoAccount('andrzej5', 4);

  await op.depositToken(0, 2_000);
  await op.depositToken(1, 2_000);
  await op.depositToken(2, 2_000);
  await op.depositToken(3, 2_000);
  await op.depositToken(4, 2_000);

  process.exit();
};

run();
