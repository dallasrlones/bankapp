import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { TransactionType } from '../models/Transaction';

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'myuser';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'mypassword';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq'; // use the service name defined in docker-compose
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:5672`;

const QUEUE_NAME = 'transactions';
const DEAD_LETTER_QUEUE = 'dead_letter_queue';

let channel: Channel | null = null;
let connection: Connection | null = null;

export const connectQueue = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DEAD_LETTER_QUEUE,
      },
    });

    await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });

    // console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
    throw error;
  }
};

export const closeQueue = async () => {
  try {
    if (channel) {
      await (channel as any).close();
      // console.log('RabbitMQ channel closed');
    }
    if (connection) {
      await (connection as any).close();
      // console.log('RabbitMQ connection closed');
    }
  } catch (error) {
    console.error('Failed to close RabbitMQ connection', error);
  }
};

export const clearQueue = async () => {
  if (!channel) {
    throw new Error('Channel is not initialized');
  }
  try {
    await (channel as any).purgeQueue(QUEUE_NAME);
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DEAD_LETTER_QUEUE,
      },
    });
    // console.log('Queue cleared');
  } catch (error) {
    console.error('Failed to clear queue', error);
    throw error;
  }
};

export const publishTransaction = async (transaction: any) => {
  if (!channel) {
    throw new Error('Channel is not initialized');
  }
  try {
    const validTypes = Object.values(TransactionType);
    if (!validTypes.includes(transaction.type)) {
      return Promise.reject(new Error('Unknown transaction type'));
    }

    // console.log('Publishing transaction:', transaction);
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(transaction)), {
      persistent: true,
    });
  } catch (error) {
    console.error('Failed to publish transaction', error);
  }
};

export const consumeTransactions = (handleTransaction: (transaction: any, ack: () => void, nack: (err: Error) => void) => void) => {
  if (!channel) {
    throw new Error('Channel is not initialized');
  }
  channel.consume(
    QUEUE_NAME,
    (msg: ConsumeMessage | null) => {
      if (msg) {
        const transaction = JSON.parse(msg.content.toString());
        handleTransaction(transaction, () => {
          channel?.ack(msg);
        }, (err: Error) => {
          console.error('Transaction failed:', transaction, err);
          channel?.nack(msg, false, false);
        });
      }
    },
    { noAck: false }
  );
};