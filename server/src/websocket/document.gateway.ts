// server/src/websocket/document.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class DocumentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeDocs = new Map<string, Y.Doc>();
  // Tracks how many local users on this specific server are editing a document
  private roomUserCounts = new Map<string, number>(); 

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const { docId, username } = client.data;
    if (!docId) return;

    console.log(`Client disconnected: ${client.id} (${username})`);

    // Decrement local user count for this room
    const count = (this.roomUserCounts.get(docId) || 1) - 1;
    this.roomUserCounts.set(docId, count);

    // Clean up Redis subscription if no local users are left on this server instance
    if (count === 0) {
      console.log(`No local users left for document ${docId}. Unsubscribing from Redis.`);
      await this.redisService.unsubscribe(`doc-updates:${docId}`);
      this.activeDocs.delete(docId);
      this.roomUserCounts.delete(docId);
    }

    client.to(docId).emit('user-left', { username, socketId: client.id });
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { docId: string; username: string },
  ) {
    const { docId, username } = data;
    
    client.join(docId);
    client.data.username = username;
    client.data.docId = docId;

    // Track active local users
    const currentCount = this.roomUserCounts.get(docId) || 0;
    this.roomUserCounts.set(docId, currentCount + 1);

    // Load Y.Doc in memory
    let ydoc = this.activeDocs.get(docId);
    if (!ydoc) {
      ydoc = new Y.Doc();
      const dbDoc = await this.prisma.document.findUnique({ where: { id: docId } });
      if (dbDoc && dbDoc.content) {
        Y.applyUpdate(ydoc, dbDoc.content);
      }
      this.activeDocs.set(docId, ydoc);

      // --- REDIS SUBSCRIPTION SETUP ---
      // If this is the first client on this server instance editing the document,
      // subscribe to the Redis channel for updates from other server instances.
      await this.redisService.subscribe(`doc-updates:${docId}`, (messageStr) => {
        // Decode the message from base64 string back to binary
        const updateBinary = new Uint8Array(Buffer.from(messageStr, 'base64'));
        
        // Apply update to our local server memory
        Y.applyUpdate(ydoc!, updateBinary);

        // Broadcast to all clients connected to this specific server instance
        // (Use server.to() instead of client.to() to reach everyone in this room on this server)
        this.server.to(docId).emit('update-document', Buffer.from(updateBinary));
      });
    }

    const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    client.emit('init-document-state', Buffer.from(stateUpdate));
    client.to(docId).emit('user-joined', { username, socketId: client.id });
  }

  @SubscribeMessage('update-document')
  async handleUpdateDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateBinary: Buffer,
  ) {
    const docId = client.data.docId;
    if (!docId) return;

    const ydoc = this.activeDocs.get(docId);
    if (ydoc) {
      // 1. Apply to local memory
      Y.applyUpdate(ydoc, new Uint8Array(updateBinary));

      // 2. Convert binary update to Base64 string for safe transport over Redis
      const base64Update = Buffer.from(updateBinary).toString('base64');

      // 3. Publish to Redis so all other server instances receive it
      await this.redisService.publish(`doc-updates:${docId}`, base64Update);
    }
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() cursorData: { x: number; y: number; selectionRange: any },
  ) {
    const docId = client.data.docId;
    if (!docId) return;

    client.to(docId).emit('cursor-move', {
      socketId: client.id,
      username: client.data.username,
      ...cursorData,
    });
  }
}