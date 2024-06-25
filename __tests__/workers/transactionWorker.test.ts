import { closeQueue, connectQueue, publishTransaction, clearQueue } from '../../src/services/queueService';
import { Account, AccountType } from '../../src/models/Account';
import { TransactionType } from '../../src/models/Transaction';
import { clearDb, endPool } from '../../testUtils/helpers';
import { createTables } from '../../src/models/seed';
import { Bank } from '../../src/models/Bank';
import { startTransactionProcessor } from '../../src/workers/transactionWorker';

beforeAll(async () => {
  await startTransactionProcessor();
});

beforeEach(async () => {
  await createTables();
});

afterEach(async () => {
  await clearDb();
});

afterAll(async () => {
  await endPool();
  await clearQueue();
  await closeQueue();
});

describe('Transaction Processor', () => {
  it('should handle deposit transaction', async () => {
    const bank = await Bank.create('Noice Bank');
    const account = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);

    await publishTransaction({
      type: TransactionType.Deposit,
      amount: 500,
      sourceAccountId: account.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));  // Give time for transaction processing

    const updatedAccount = await Account.findById(account.id);
    expect(updatedAccount?.balance).toBe(1500);
  });

  it('should handle withdrawal transaction', async () => {
    const bank = await Bank.create('Noice Bank');
    const account = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);

    await publishTransaction({
      type: TransactionType.Withdraw,
      amount: 500,
      sourceAccountId: account.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));  // Give time for transaction processing

    const updatedAccount = await Account.findById(account.id);
    expect(updatedAccount?.balance).toBe(500);
  });

  it('should handle transfer transaction', async () => {
    const bank = await Bank.create('Noice Bank');
    const sourceAccount = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
    const targetAccount = await Account.create('jane.doe@test.com', 500, AccountType.Checking, bank.id);

    await publishTransaction({
      type: TransactionType.Transfer,
      amount: 300,
      sourceAccountId: sourceAccount.id,
      targetAccountId: targetAccount.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));  // Give time for transaction processing

    const updatedSourceAccount = await Account.findById(sourceAccount.id);
    const updatedTargetAccount = await Account.findById(targetAccount.id);
    expect(updatedSourceAccount?.balance).toBe(700);
    expect(updatedTargetAccount?.balance).toBe(800);
  });
});
