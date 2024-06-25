import { connectQueue, consumeTransactions } from '../services/queueService';
import { Account, AccountType } from '../models/Account';
import { Transaction, TransactionType } from '../models/Transaction';

const handleDeposit = async (transaction: Transaction) => {
  // console.log('Handling deposit transaction:', transaction);
  const { amount, sourceAccountId } = transaction;
  const depositAccount = await Account.findById(sourceAccountId);
  if (!depositAccount) {
    throw new Error(`Account with ID ${sourceAccountId} not found for deposit`);
  }
  await depositAccount.deposit(amount);
};

const handleWithdraw = async (transaction: Transaction) => {
  // console.log('Handling withdrawal transaction:', transaction);
  const { amount, sourceAccountId } = transaction;
  const withdrawAccount = await Account.findById(sourceAccountId);
  if (!withdrawAccount) {
    throw new Error(`Account with ID ${sourceAccountId} not found for withdrawal`);
  }
  await withdrawAccount.withdraw(amount);
};

const handleTransfer = async (transaction: Transaction) => {
  // console.log('Handling transfer transaction:', transaction);
  const { amount, sourceAccountId, targetAccountId } = transaction;
  const sourceAccount = await Account.findById(sourceAccountId);
  const targetAccount = await Account.findById(targetAccountId || 0);
  if (!sourceAccount) {
    throw new Error(`Source account with ID ${sourceAccountId} not found for transfer`);
  }
  if (!targetAccount) {
    throw new Error(`Target account with ID ${targetAccountId} not found for transfer`);
  }
  await sourceAccount.transfer(amount, targetAccount);
};

const processTransaction = async (transaction: any, ack: () => void, nack: (err: Error) => void) => {
  try {
    // console.log('Processing transaction:', transaction);
    switch (transaction.type) {
      case TransactionType.Deposit:
        await handleDeposit(transaction);
        break;
      case TransactionType.Withdraw:
        await handleWithdraw(transaction);
        break;
      case TransactionType.Transfer:
        await handleTransfer(transaction);
        break;
      default:
        throw new Error('Unknown transaction type');
    }
    ack();
  } catch (error) {
    console.error('Error processing transaction:', error);
    nack(error as Error);
  }
};

export const startTransactionProcessor = async () => {
  try {
    await connectQueue();
    consumeTransactions(processTransaction);
    // console.log('Transaction processor started and consuming transactions.');
  } catch (error) {
    console.error('Failed to start transaction processor:', error);
    process.exit(1);
  }
};
