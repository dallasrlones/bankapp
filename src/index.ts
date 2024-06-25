import express from 'express';
import bodyParser from 'body-parser';
import transactionsRouter from './routes/transactionsController';
import { connectQueue } from './services/queueService';
import { createTables } from './models/seed';
import { startTransactionProcessor } from './workers/transactionWorker';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/transactions', transactionsRouter);

export const startServer = async () => {
  try {
    await createTables();
    // await connectQueue();
    await startTransactionProcessor();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
