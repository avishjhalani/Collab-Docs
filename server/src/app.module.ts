// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketModule } from './websocket/websocket.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, WebsocketModule,RedisModule], 
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}