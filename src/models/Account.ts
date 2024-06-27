import pool from './db';
import { Transaction, TransactionType } from './Transaction';

export enum AccountType {
  Checking = 'Checking',
  IndividualInvestment = 'IndividualInvestment',
  CorporateInvestment = 'CorporateInvestment'
}

export class Account {
  id: number;
  owner: string;
  balance: number;
  type: AccountType;
  bank_id: number;

  constructor(id: number, owner: string, balance: number, type: AccountType, bank_id: number) {
    this.id = id;
    this.owner = owner;
    this.balance = balance;
    this.type = type;
    this.bank_id = bank_id;
  }

  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        owner VARCHAR(100) NOT NULL,
        balance NUMERIC(12, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        bank_id INTEGER REFERENCES banks(id)
      )`;
    await pool.query(query);
  }

  static async create(owner: string, balance: number, type: AccountType, bank_id: number): Promise<Account> {
    const result = await pool.query(
      'INSERT INTO accounts (owner, balance, type, bank_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [owner, balance, type, bank_id]
    );
    const { id, owner: accountOwner, balance: accountBalance, type: accountType, bank_id: bankId } = result.rows[0];
    return new Account(id, accountOwner, parseFloat(accountBalance), accountType, bankId);
  }

  static async findById(id: number): Promise<Account | null> {
    const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      const { id, owner, balance, type, bank_id } = result.rows[0];
      return new Account(id, owner, parseFloat(balance), type, bank_id);
    }
    return null;
  }

  static async findByOwner(ownerId: string): Promise<Account | null> {
    const result = await pool.query('SELECT * FROM accounts WHERE owner = $1', [ownerId]);
    if (result.rows.length > 0) {
      // need to change this so it returns the array of accounts for owner (email)
      const { id, owner, balance, type, bank_id } = result.rows[0];
      return new Account(id, owner, parseFloat(balance), type, bank_id);
    }
    return null;
  }

  async save(): Promise<void> {
    await pool.query(
      'UPDATE accounts SET owner = $1, balance = $2, type = $3, bank_id = $4 WHERE id = $5',
      [this.owner, this.balance, this.type, this.bank_id, this.id]
    );
  }

  async deposit(amount: number): Promise<void> {
    this.balance += amount;
    await this.save();
    await Transaction.create(TransactionType.Deposit, amount, this.id);
  }

  async withdraw(amount: number): Promise<void> {
    if (this.type === AccountType.IndividualInvestment && amount > 500) {
      throw new Error('Withdrawal limit exceeded for individual investment account');
    }
    if (this.balance < amount) {
      throw new Error('Insufficient funds for withdrawal');
    }
    this.balance -= amount;
    await this.save();
    await Transaction.create(TransactionType.Withdraw, amount, this.id);
  }

  async transfer(amount: number, targetAccount: Account): Promise<void> {
    if (this.balance < amount) {
      throw new Error('Insufficient funds for transfer');
    }
    this.balance -= amount;
    targetAccount.balance += amount;
    await this.save();
    await targetAccount.save();
    await Transaction.create(TransactionType.Transfer, amount, this.id, targetAccount.id);
  }

  static async listByBankId(bank_id: number): Promise<Account[]> {
    const result = await pool.query('SELECT * FROM accounts WHERE bank_id = $1', [bank_id]);
    return result.rows.map((row: any) => new Account(row.id, row.owner, parseFloat(row.balance), row.type, row.bank_id));
  }
}
