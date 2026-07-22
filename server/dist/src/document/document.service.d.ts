import { PrismaService } from '../prisma/prisma.service';
export declare class DocumentService {
    private prisma;
    constructor(prisma: PrismaService);
    createDocument(title: string, ownerId: string): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserDocuments(userId: string): Promise<{
        id: string;
        title: string;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        owner: {
            username: string;
            email: string;
        } | null;
    }[]>;
    getDocument(docId: string, userId: string): Promise<{
        owner: {
            username: string;
            email: string;
        } | null;
        collaborators: ({
            user: {
                username: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            documentId: string;
        })[];
    } & {
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteDocument(docId: string, userId: string): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateDocument(docId: string, title: string, userId: string): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    shareDocument(docId: string, inviteeEmail: string, ownerId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        documentId: string;
    }>;
}
