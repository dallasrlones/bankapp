import { Router } from 'express';
import { Account, AccountType } from '../models/Account';
import { publishTransaction } from '../services/queueService';
import { TransactionType } from '../models/Transaction';

const router = Router();

router.post('/deposit', async (req, res) => {
  const { owner, amount, bank_id, account_type } = req.body;
  const account = await Account.create(owner, amount, account_type, bank_id);
  await publishTransaction({ type: TransactionType.Deposit, amount, accountId: account.id });
  res.send(`Deposit transaction published and account updated with ID: ${account.id}`);
});

router.post('/withdraw', async (req, res) => {
  const { owner, amount, account_type } = req.body;

  const account = await Account.findByOwner(owner);

  if (!account) {
    return res.status(404).send('Account not found');
  }

  if (account_type === AccountType.IndividualInvestment && amount > 500) {
    return res.status(400).send('Withdrawal limit exceeded');
  }

  if (account.balance < amount) {
    return res.status(400).send('Insufficient funds');
  }

  // account.balance -= amount;
  // await account.save();

  await publishTransaction({ type: TransactionType.Withdraw, amount, accountId: account.id });
  res.send(`Withdraw transaction published and account updated with ID: ${account.id}`);
});

router.post('/transfer', async (req, res) => {
  const { sourceOwner, targetOwner, amount } = req.body;

  const sourceAccount = await Account.findByOwner(sourceOwner);
  const targetAccount = await Account.findByOwner(targetOwner);

  if (!sourceAccount || !targetAccount) {
    return res.status(404).send('Source or target account not found');
  }

  if (sourceAccount.balance < amount) {
    return res.status(400).send('Insufficient funds');
  }

  sourceAccount.balance -= amount;
  targetAccount.balance += amount;

  // await sourceAccount.save();
  // await targetAccount.save();

  await publishTransaction({ type: TransactionType.Transfer, amount, sourceAccountId: sourceAccount.id, targetAccountId: targetAccount.id });
  res.send(`Transfer transaction published from account ${sourceAccount.id} to account ${targetAccount.id}`);
});

export default router;
