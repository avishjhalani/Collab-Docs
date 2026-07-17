"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
let RedisService = class RedisService {
    publisherClient;
    subscriberClient;
    async onModuleInit() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
        this.publisherClient = (0, redis_1.createClient)({ url: redisUrl });
        this.subscriberClient = this.publisherClient.duplicate();
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
    async publish(channel, message) {
        await this.publisherClient.publish(channel, message);
    }
    async subscribe(channel, callback) {
        await this.subscriberClient.subscribe(channel, (message) => {
            callback(message);
        });
    }
    async unsubscribe(channel) {
        await this.subscriberClient.unsubscribe(channel);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map