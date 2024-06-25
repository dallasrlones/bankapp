import request from 'supertest';
import app from '../../src/index';
import { Bank } from '../../src/models/Bank';
import { clearDb, endPool } from '../../testUtils/helpers';
import { createTables } from '../../src/models/seed';
import { closeQueue, connectQueue } from '../../src/services/queueService';
import { Account } from '../../src/models/Account';

beforeAll(async () => {
  await connectQueue();
});

beforeEach(async () => {
    await createTables();
});

afterEach(async () => {
  await clearDb();
});

afterAll(async () => {
    await endPool();
    await closeQueue();
})

describe('Transactions API', () => {
  it('should create a new deposit transaction for a checking account', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const body = {
        owner: 'john.doe@test.com',
        amount: 1000,
        bank_id: bank.id,
        account_type: 'Checking'
      };

    const res = await request(app).post('/transactions/deposit').send(body);
    const account = await Account.findByOwner(body.owner);

    expect(res.status).toBe(200);
    expect(res.text).toContain(`Deposit transaction published and account updated with ID: ${account?.id}`);
  }, 10000);

  it('should create a new withdraw transaction for a checking account', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const depositRes = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'john.doe@test.com',
        amount: 1000,
        bank_id: bank.id,
        account_type: 'Checking'
      });

    expect(depositRes.status).toBe(200);

    const body = {
        owner: 'john.doe@test.com',
        amount: 500,
        bank_id: bank.id,
        account_type: 'Checking'
      };

    const res = await request(app)
      .post('/transactions/withdraw')
      .send(body);

    const account = await Account.findByOwner(body.owner);

    expect(res.status).toBe(200);
    expect(res.text).toContain(`Withdraw transaction published and account updated with ID: ${account?.id}`);
  }, 10000);

  it('should create a new transfer transaction for checking accounts', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const body = {
        owner: 'john.doe@test.com',
        amount: 1000,
        bank_id: bank.id,
        account_type: 'Checking'
      };

    const depositResSource = await request(app)
      .post('/transactions/deposit')
      .send(body);

    expect(depositResSource.status).toBe(200);

    const depositResTarget = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'jane.doe@test.com',
        amount: 1000,
        bank_id: bank.id,
        account_type: 'Checking'
      });

    expect(depositResTarget.status).toBe(200);

    const res = await request(app)
      .post('/transactions/transfer')
      .send({
        sourceOwner: 'john.doe@test.com',
        targetOwner: 'jane.doe@test.com',
        amount: 200,
        bank_id: bank.id,
        account_type: 'Checking'
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Transfer transaction published from account');
  }, 10000);

  it('should create a new deposit transaction for an individual investment account', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const res = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'john.doe@test.com',
        amount: 2000,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Deposit transaction published and account updated with ID');
  }, 10000);

  it('should create a new withdraw transaction for an individual investment account and respect withdrawal limit', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const depositRes = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'john.doe@test.com',
        amount: 2000,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(depositRes.status).toBe(200);

    const res = await request(app)
      .post('/transactions/withdraw')
      .send({
        owner: 'john.doe@test.com',
        amount: 500,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Withdraw transaction published and account updated with ID');

    const resExceed = await request(app)
      .post('/transactions/withdraw')
      .send({
        owner: 'john.doe@test.com',
        amount: 600,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(resExceed.status).toBe(400);
    expect(resExceed.text).toContain('Withdrawal limit exceeded');
  }, 10000);

  it('should create a new transfer transaction for individual investment accounts', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const depositResSource = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'john.doe@test.com',
        amount: 2000,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(depositResSource.status).toBe(200);

    const depositResTarget = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'jane.doe@test.com',
        amount: 2000,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(depositResTarget.status).toBe(200);

    const res = await request(app)
      .post('/transactions/transfer')
      .send({
        sourceOwner: 'john.doe@test.com',
        targetOwner: 'jane.doe@test.com',
        amount: 300,
        bank_id: bank.id,
        account_type: 'IndividualInvestment'
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Transfer transaction published from account');
  }, 10000);

  it('should create a new deposit transaction for a corporate investment account', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const res = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'corporate@test.com',
        amount: 10000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    const account = await Account.findByOwner('corporate@test.com');

    expect(res.status).toBe(200);
    expect(res.text).toContain(`Deposit transaction published and account updated with ID: ${account?.id}`);
  }, 10000);

  it('should create a new withdraw transaction for a corporate investment account', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const depositRes = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'corporate@test.com',
        amount: 10000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    expect(depositRes.status).toBe(200);

    const res = await request(app)
      .post('/transactions/withdraw')
      .send({
        owner: 'corporate@test.com',
        amount: 2000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    const account = await Account.findByOwner('corporate@test.com')

    expect(res.status).toBe(200);
    expect(res.text).toContain(`Withdraw transaction published and account updated with ID: ${account?.id}`);
  }, 10000);

  it('should create a new transfer transaction for corporate investment accounts', async () => {
    const bank = await Bank.create('Noice Bank 1');

    const depositResSource = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'corporate@test.com',
        amount: 10000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    expect(depositResSource.status).toBe(200);

    const depositResTarget = await request(app)
      .post('/transactions/deposit')
      .send({
        owner: 'corporate.target@test.com',
        amount: 10000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    expect(depositResTarget.status).toBe(200);

    const res = await request(app)
      .post('/transactions/transfer')
      .send({
        sourceOwner: 'corporate@test.com',
        targetOwner: 'corporate.target@test.com',
        amount: 5000,
        bank_id: bank.id,
        account_type: 'CorporateInvestment'
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Transfer transaction published from account');
  }, 10000);
});
