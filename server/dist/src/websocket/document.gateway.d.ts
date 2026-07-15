import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class DocumentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    private activeDocs;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinDocument(client: Socket, data: {
        docId: string;
        username: string;
    }): Promise<void>;
    handleUpdateDocument(client: Socket, updateBinary: Buffer): void;
    handleCursorMove(client: Socket, cursorData: {
        x: number;
        y: number;
        selectionRange: any;
    }): void;
}
