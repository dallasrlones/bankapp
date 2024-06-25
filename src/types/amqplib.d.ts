declare module 'amqplib' {
    import { EventEmitter } from 'events';
  
    export interface Options {
      durable?: boolean;
      arguments?: Record<string, any>;
    }
  
    export interface Channel {
      assertQueue(queue: string, options?: Options): Promise<any>;
      sendToQueue(queue: string, content: Buffer, options?: Record<string, any>): boolean;
      consume(queue: string, onMessage: (msg: ConsumeMessage | null) => void, options?: Record<string, any>): Promise<any>;
      ack(message: ConsumeMessage, allUpTo?: boolean): void;
      nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
    }
  
    export interface Connection extends EventEmitter {
      createChannel(): Promise<Channel>;
    }
  
    export interface ConsumeMessage {
      content: Buffer;
    }
  
    export function connect(url: string): Promise<Connection>;
  }
  