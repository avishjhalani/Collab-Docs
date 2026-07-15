"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const Y = __importStar(require("yjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentGateway = class DocumentGateway {
    prisma;
    server;
    activeDocs = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinDocument(client, data) {
        const { docId, username } = data;
        client.join(docId);
        client.data.username = username;
        client.data.docId = docId;
        console.log(`${username} joined room: ${docId}`);
        let ydoc = this.activeDocs.get(docId);
        if (!ydoc) {
            ydoc = new Y.Doc();
            const dbDoc = await this.prisma.document.findUnique({
                where: { id: docId },
            });
            if (dbDoc && dbDoc.content) {
                Y.applyUpdate(ydoc, dbDoc.content);
            }
            this.activeDocs.set(docId, ydoc);
        }
        const stateUpdate = Y.encodeStateAsUpdate(ydoc);
        client.emit('init-document-state', Buffer.from(stateUpdate));
        client.to(docId).emit('user-joined', { username, socketId: client.id });
    }
    handleUpdateDocument(client, updateBinary) {
        const docId = client.data.docId;
        if (!docId)
            return;
        const ydoc = this.activeDocs.get(docId);
        if (ydoc) {
            Y.applyUpdate(ydoc, new Uint8Array(updateBinary));
            client.to(docId).emit('update-document', updateBinary);
        }
    }
    handleCursorMove(client, cursorData) {
        const docId = client.data.docId;
        if (!docId)
            return;
        client.to(docId).emit('cursor-move', {
            socketId: client.id,
            username: client.data.username,
            ...cursorData,
        });
    }
};
exports.DocumentGateway = DocumentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DocumentGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-document'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], DocumentGateway.prototype, "handleJoinDocument", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update-document'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        Buffer]),
    __metadata("design:returntype", void 0)
], DocumentGateway.prototype, "handleUpdateDocument", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cursor-move'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], DocumentGateway.prototype, "handleCursorMove", null);
exports.DocumentGateway = DocumentGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentGateway);
//# sourceMappingURL=document.gateway.js.map