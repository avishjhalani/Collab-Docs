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

@WebSocketGateway({
  cors: {
    origin: '*', // Allows connections from any origin (we'll lock this down later)
  },
})
export class DocumentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // In-memory store for loaded documents
  // Maps: documentId -> Y.Doc
  private activeDocs = new Map<string, Y.Doc>();

  constructor(private prisma: PrismaService) {}

  // 1. Handle incoming connections
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // 2. Handle disconnections
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Clean up room activities if necessary
  }

  // 3. Room Management: Join a document session
  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { docId: string; username: string },
  ) {
    const { docId, username } = data;
    
    // Join the Socket.io room for this document
    client.join(docId);
    
    // Attach details to socket session for tracking
    client.data.username = username;
    client.data.docId = docId;

    console.log(`${username} joined room: ${docId}`);

    // Load document from database or memory
    let ydoc = this.activeDocs.get(docId);
    if (!ydoc) {
      ydoc = new Y.Doc();
      
      // Attempt to load from PostgreSQL
      const dbDoc = await this.prisma.document.findUnique({
        where: { id: docId },
      });

      if (dbDoc && dbDoc.content) {
        // Apply the saved binary state into our active Y.Doc
        Y.applyUpdate(ydoc, dbDoc.content);
      }
      this.activeDocs.set(docId, ydoc);
    }

    // Send the current state of the document to the newly joined client
    const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    client.emit('init-document-state', Buffer.from(stateUpdate));
    
    // Notify others that a new user joined
    client.to(docId).emit('user-joined', { username, socketId: client.id });
  }

  // 4. Document Synchronisation: Sync edits (CRDT binary updates)
  @SubscribeMessage('update-document')
  handleUpdateDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateBinary: Buffer,
  ) {
    const docId = client.data.docId;
    if (!docId) return;

    const ydoc = this.activeDocs.get(docId);
    if (ydoc) {
      // 1. Apply the incoming change to the server's in-memory Y.Doc
      Y.applyUpdate(ydoc, new Uint8Array(updateBinary));

      // 2. Broadcast the update to all other users in the room
      client.to(docId).emit('update-document', updateBinary);

      // TODO: We will trigger a debounced save to PostgreSQL here in the next milestone!
    }
  }

  // 5. Presence: Share mouse cursors & selections
  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() cursorData: { x: number; y: number; selectionRange: any },
  ) {
    const docId = client.data.docId;
    if (!docId) return;

    // Broadcast cursor positions to everyone else in the document
    client.to(docId).emit('cursor-move', {
      socketId: client.id,
      username: client.data.username,
      ...cursorData,
    });
  }
}