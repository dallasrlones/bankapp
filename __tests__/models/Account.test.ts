import { Account, AccountType } from '../../src/models/Account';
import { Bank } from '../../src/models/Bank';
import { clearDb, endPool } from '../../testUtils/helpers';
import { createTables } from '../../src/models/seed';

beforeAll(async () => {
  await createTables();
});

afterAll(async () => {
  await clearDb();
  await endPool();
});

describe('Account Model', () => {
  it('should create an account', async () => {
    const bank = await Bank.create('Test Bank');
    const account = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
    
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(account.owner).toBe('john.doe@test.com');
    expect(account.balance).toBe(1000.00);
    expect(account.type).toBe(AccountType.Checking);
    expect(account.bank_id).toBe(bank.id);
  });

  it('should find an account by ID', async () => {
    const bank = await Bank.create('Another Bank');
    const account = await Account.create('jane.doe@test.com', 500, AccountType.Checking, bank.id);
    const foundAccount = await Account.findById(account.id);
    
    expect(foundAccount).toBeDefined();
    expect(foundAccount?.id).toBe(account.id);
    expect(foundAccount?.owner).toBe('jane.doe@test.com');
  });

  it('should save an account update', async () => {
    const bank = await Bank.create('Update Bank');
    const account = await Account.create('Update Owner', 200, AccountType.Checking, bank.id);
    account.balance = 300;
    await account.save();
    const updatedAccount = await Account.findById(account.id);
    
    expect(updatedAccount?.balance).toBe(300.00);
  });

  it('should list accounts by bank ID', async () => {
    const bank = await Bank.create('List Bank');
    await Account.create('Owner 1', 100, AccountType.Checking, bank.id);
    await Account.create('Owner 2', 200, AccountType.Checking, bank.id);
    const accounts = await Account.listByBankId(bank.id);
    
    expect(accounts.length).toBe(2);
  });

  it('should handle deposit transaction', async () => {
    const bank = await Bank.create('Deposit Bank');
    const account = await Account.create('deposit@test.com', 1000, AccountType.Checking, bank.id);
    await account.deposit(500);
    const updatedAccount = await Account.findById(account.id);

    expect(updatedAccount?.balance).toBe(1500.00);
  });

  it('should handle withdrawal transaction', async () => {
    const bank = await Bank.create('Withdrawal Bank');
    const account = await Account.create('withdraw@test.com', 1000, AccountType.Checking, bank.id);
    await account.withdraw(500);
    const updatedAccount = await Account.findById(account.id);

    expect(updatedAccount?.balance).toBe(500.00);
  });

  it('should handle transfer transaction', async () => {
    const bank = await Bank.create('Transfer Bank');
    const sourceAccount = await Account.create('source@test.com', 1000, AccountType.Checking, bank.id);
    const targetAccount = await Account.create('target@test.com', 1000, AccountType.Checking, bank.id);
    await sourceAccount.transfer(300, targetAccount);
    const updatedSourceAccount = await Account.findById(sourceAccount.id);
    const updatedTargetAccount = await Account.findById(targetAccount.id);

    expect(updatedSourceAccount?.balance).toBe(700.00);
    expect(updatedTargetAccount?.balance).toBe(1300.00);
  });
});
