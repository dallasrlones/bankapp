import pool from './db';
import { Account } from './Account';

export class Bank {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )`;
      // add any indexes
    await pool.query(query)
  }

  static async create(name: string): Promise<Bank> {
    const result = await pool.query('INSERT INTO banks (name) VALUES ($1) RETURNING *', [name]);
    const { id, name: bankName } = result.rows[0];
    return new Bank(id, bankName);
  }

  static async findById(id: number): Promise<Bank | null> {
    const result = await pool.query('SELECT * FROM banks WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      const { id, name } = result.rows[0];
      return new Bank(id, name);
    }
    return null;
  }

  static async findAllAccountsForBank(bankId: number): Promise<Account[] | null> {
    const result = await pool.query('SELECT * FROM banks WHERE bank_id = $1', [bankId]);
    if (result.rows.length > 0) {
      const { id, owner, balance, type, bank_id } = result.rows[0];
      return result.rows.map(row => new Account(id, owner, balance, type, bank_id));
    }
    return null;
  }
}
