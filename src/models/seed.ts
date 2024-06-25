import { Account } from './Account';
import { Bank } from './Bank';
import { Transaction } from './Transaction';

export const createTables = async () => {
    await Bank.createTable();
    await Account.createTable();
    await Transaction.createTable();
};