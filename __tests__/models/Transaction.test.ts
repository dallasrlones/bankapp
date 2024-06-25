import { Transaction, TransactionType } from '../../src/models/Transaction';
import { clearDb, endPool } from '../../testUtils/helpers';
import { createTables } from '../../src/models/seed';
import { Account, AccountType } from '../../src/models/Account';
import { Bank } from '../../src/models/Bank';

beforeAll(async () => {
    await createTables();
});

afterAll(async () => {
    await clearDb();
    await endPool();
});

// id
// type
// amount
// source_account_id
// target_account_id
const seedDepositTransaction = async () => {
    const bank = await Bank.create('Test Bank');
    const sourceAccount = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
    const targetAccount = await Account.create('bill.billyson@test.com', 1000, AccountType.Checking, bank.id)
    
    const transaction = await Transaction.create(TransactionType.Deposit, 500.32, sourceAccount.id, targetAccount.id);

    return { bank, sourceAccount, targetAccount, transaction };
};

const seedTransferTransaction = async () => {
    const bank = await Bank.create('Test Bank');
    const sourceAccount = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
    const targetAccount = await Account.create('bill.billyson@test.com', 1000, AccountType.Checking, bank.id)
    
    const transaction = await Transaction.create(TransactionType.Transfer, 500.33, sourceAccount.id, targetAccount.id);

    return { bank, sourceAccount, targetAccount, transaction };
};

const seedWithDrawTransaction = async () => {
    const bank = await Bank.create('Test Bank');
    const sourceAccount = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
    const targetAccount = await Account.create('bill.billyson@test.com', 1000, AccountType.Checking, bank.id)
    
    const transaction = await Transaction.create(TransactionType.Withdraw, 500.34, sourceAccount.id, targetAccount.id);

    return { bank, sourceAccount, targetAccount, transaction };
};

describe('Transaction Model', () => {
    it('should create a transaction', async () => {
        // create two accounts
        const bank = await Bank.create('Test Bank');
        const sourceAccount = await Account.create('john.doe@test.com', 1000, AccountType.Checking, bank.id);
        const targetAccount = await Account.create('bill.billyson@test.com', 1000, AccountType.Checking, bank.id)
        
        const transaction = await Transaction.create(TransactionType.Deposit, 500.32, sourceAccount.id, targetAccount.id);
        
        expect(transaction).toBeDefined();
        expect(transaction?.id).toBeDefined();
        expect(transaction?.type).toBe(TransactionType.Deposit);
        expect(transaction?.amount).toBe('500.32');
        expect(transaction?.sourceAccountId).toBe(sourceAccount.id);
        expect(transaction?.targetAccountId).toBe(targetAccount.id);
    });

    it('should find a transaction by ID', async () => {
        const { transaction, sourceAccount, targetAccount } = await seedDepositTransaction();
        const foundTransaction = await Transaction.findById(transaction.id);

        expect(foundTransaction).toBeDefined();
        expect(foundTransaction?.id).toBeDefined();
        expect(foundTransaction?.type).toBe(TransactionType.Deposit);
        expect(foundTransaction?.amount).toBe('500.32');
        expect(foundTransaction?.sourceAccountId).toBe(sourceAccount.id);
        expect(foundTransaction?.targetAccountId).toBe(targetAccount.id);
    });
});