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

describe('Bank Model', () => {
  it('should create a bank', async () => {
    const bank = await Bank.create('Test Bank');
    expect(bank).toBeDefined();
    expect(bank.id).toBeDefined();
    expect(bank.name).toBe('Test Bank');
  });

  it('should find a bank by ID', async () => {
    const bank = await Bank.create('Another Bank');
    const foundBank = await Bank.findById(bank.id);
    expect(foundBank).toBeDefined();
    expect(foundBank?.id).toBe(bank.id);
    expect(foundBank?.name).toBe('Another Bank');
  });
});
