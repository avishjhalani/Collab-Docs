import { DocumentService } from './document.service';
export declare class DocumentController {
    private documentService;
    constructor(documentService: DocumentService);
    create(body: {
        title: string;
    }, req: any): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAll(req: any): Promise<{
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
    getOne(id: string, req: any): Promise<{
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
    delete(id: string, req: any): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: {
        title: string;
    }, req: any): Promise<{
        id: string;
        title: string;
        content: import("@prisma/client/runtime/client").Bytes | null;
        ownerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    share(id: string, body: {
        email: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        documentId: string;
    }>;
}
