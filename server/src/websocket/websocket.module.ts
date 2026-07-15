// server/src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { DocumentGateway } from './document.gateway';

@Module({
  providers: [DocumentGateway],
})
export class WebsocketModule {}