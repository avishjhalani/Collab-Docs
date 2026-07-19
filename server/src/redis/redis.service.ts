// server/src/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // We need two separate clients because once a client starts subscribing,
  // it enters a "subscriber" mode and cannot perform publishing/other commands.
  private publisherClient: RedisClientType;
  private subscriberClient: RedisClientType;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

    this.publisherClient = createClient({ url: redisUrl });
    this.subscriberClient = this.publisherClient.duplicate();

    // Handle connection error events to prevent process crashes in production
    this.publisherClient.on('error', (err) => console.error('Redis Publisher Client Error:', err));
    this.subscriberClient.on('error', (err) => console.error('Redis Subscriber Client Error:', err));

    // Connect both clients
    await Promise.all([
      this.publisherClient.connect(),
      this.subscriberClient.connect(),
    ]);

    console.log('Successfully connected to Redis Publisher and Subscriber!');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.publisherClient.disconnect(),
      this.subscriberClient.disconnect(),
    ]);
  }

  // Publish a message to a specific channel
  async publish(channel: string, message: string) {
    await this.publisherClient.publish(channel, message);
  }

  // Subscribe to a specific channel and trigger a callback on new messages
  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subscriberClient.subscribe(channel, (message) => {
      callback(message);
    });
  }

  // Unsubscribe to release resources when room is empty
  async unsubscribe(channel: string) {
    await this.subscriberClient.unsubscribe(channel);
  }
}