import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class DocumentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    private redisService;
    server: Server;
    private activeDocs;
    private roomUserCounts;
    constructor(prisma: PrismaService, redisService: RedisService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinDocument(client: Socket, data: {
        docId: string;
        username: string;
    }): Promise<void>;
    handleUpdateDocument(client: Socket, updateBinary: Buffer): Promise<void>;
    handleCursorMove(client: Socket, cursorData: {
        x: number;
        y: number;
        selectionRange: any;
    }): void;
}
