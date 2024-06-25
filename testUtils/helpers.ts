import pool from '../src/models/db';

export const clearDb = async () => {
    await pool.query('DROP TABLE IF EXISTS transactions');
    await pool.query('DROP TABLE IF EXISTS accounts');
    await pool.query('DROP TABLE IF EXISTS banks');
}

export const endPool = async () => {
    await pool.end();
}