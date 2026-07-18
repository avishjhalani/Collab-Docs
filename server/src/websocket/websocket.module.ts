// server/src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { DocumentGateway } from './document.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  providers: [DocumentGateway],

})
export class WebsocketModule {}