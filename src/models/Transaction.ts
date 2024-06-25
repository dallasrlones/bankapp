import pool from './db';

export enum TransactionType {
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
  Transfer = 'Transfer'
}

export class Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  sourceAccountId: number;
  targetAccountId?: number;

  constructor(id: number, type: TransactionType, amount: number, sourceAccountId: number, targetAccountId?: number) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.sourceAccountId = sourceAccountId;
    this.targetAccountId = targetAccountId;
  }

  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        source_account_id INTEGER REFERENCES accounts(id),
        target_account_id INTEGER REFERENCES accounts(id)
      )`;
    await pool.query(query);
    // add indexes
  }

  static async create(type: TransactionType, amount: number, sourceAccountId: number, targetAccountId?: number): Promise<Transaction> {
    const result = await pool.query(
      'INSERT INTO transactions (type, amount, source_account_id, target_account_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, amount, sourceAccountId, targetAccountId]
    );
    const { id, type: txnType, amount: txnAmount, source_account_id, target_account_id } = result.rows[0];
    return new Transaction(id, txnType, txnAmount, source_account_id, target_account_id);
  }

  static async findById(id: number): Promise<Transaction | null> {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      const { id, type: txnType, amount: txnAmount, source_account_id, target_account_id } = result.rows[0];
      return new Transaction(id, txnType, txnAmount, source_account_id, target_account_id);
    }
    return null;
  }
}
