"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentService = class DocumentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDocument(title, ownerId) {
        return this.prisma.document.create({
            data: {
                title,
                ownerId,
            },
        });
    }
    async getUserDocuments(userId) {
        return this.prisma.document.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                ],
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getDocument(docId, userId) {
        const doc = await this.prisma.document.findFirst({
            where: {
                id: docId,
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                ],
            },
            include: {
                owner: {
                    select: { username: true, email: true },
                },
                collaborators: {
                    include: {
                        user: { select: { username: true, email: true } },
                    },
                },
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found or unauthorized');
        }
        return doc;
    }
    async deleteDocument(docId, userId) {
        const doc = await this.prisma.document.findFirst({
            where: {
                id: docId,
                ownerId: userId,
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found or unauthorized');
        }
        return this.prisma.document.delete({
            where: {
                id: docId,
            },
        });
    }
    async updateDocument(docId, title, userId) {
        const doc = await this.prisma.document.findFirst({
            where: {
                id: docId,
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                ],
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found or unauthorized');
        }
        return this.prisma.document.update({
            where: {
                id: docId,
            },
            data: {
                title,
            },
        });
    }
    async shareDocument(docId, inviteeEmail, ownerId) {
        const doc = await this.prisma.document.findUnique({
            where: { id: docId },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (doc.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('Only the document owner can share it');
        }
        const invitee = await this.prisma.user.findUnique({
            where: { email: inviteeEmail },
        });
        if (!invitee) {
            throw new common_1.NotFoundException('No user found with this email');
        }
        if (doc.ownerId === invitee.id) {
            throw new common_1.ConflictException('User is already the owner of this document');
        }
        const existingCollab = await this.prisma.collaborator.findUnique({
            where: {
                userId_documentId: {
                    userId: invitee.id,
                    documentId: docId,
                },
            },
        });
        if (existingCollab) {
            throw new common_1.ConflictException('Document is already shared with this user');
        }
        return this.prisma.collaborator.create({
            data: {
                userId: invitee.id,
                documentId: docId,
            },
        });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentService);
//# sourceMappingURL=document.service.js.map