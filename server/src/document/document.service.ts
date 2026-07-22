// server/src/document/document.service.ts
import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a document
  async createDocument(title: string, ownerId: string) {
    return this.prisma.document.create({
      data: {
        title,
        ownerId,
      },
    });
  }

  // 2. Get all documents (Owned OR Collaborated on)
  async getUserDocuments(userId: string) {
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

  // 3. Get single document details (must be owner or collaborator)
  async getDocument(docId: string, userId: string) {
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
      throw new NotFoundException('Document not found or unauthorized');
    }
    return doc;
  }

  // 4. Delete a document (only owner)
  async deleteDocument(docId: string, userId: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        id: docId,
        ownerId: userId,
      },
    });
    if (!doc) {
      throw new NotFoundException('Document not found or unauthorized');
    }
    return this.prisma.document.delete({
      where: {
        id: docId,
      },
    });
  }

  // 5. Update document title (owner or collaborator)
  async updateDocument(docId: string, title: string, userId: string) {
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
      throw new NotFoundException('Document not found or unauthorized');
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

  // 6. Share document with another user by email
  async shareDocument(docId: string, inviteeEmail: string, ownerId: string) {
    // A. Check if the document exists and the requester is the owner
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.ownerId !== ownerId) {
      throw new ForbiddenException('Only the document owner can share it');
    }

    // B. Find the user to invite
    const invitee = await this.prisma.user.findUnique({
      where: { email: inviteeEmail },
    });
    if (!invitee) {
      throw new NotFoundException('No user found with this email');
    }

    // C. Check if the invitee is already the owner
    if (doc.ownerId === invitee.id) {
      throw new ConflictException('User is already the owner of this document');
    }

    // D. Check if they are already a collaborator
    const existingCollab = await this.prisma.collaborator.findUnique({
      where: {
        userId_documentId: {
          userId: invitee.id,
          documentId: docId,
        },
      },
    });
    if (existingCollab) {
      throw new ConflictException('Document is already shared with this user');
    }

    // E. Add them to the collaborators table
    return this.prisma.collaborator.create({
      data: {
        userId: invitee.id,
        documentId: docId,
      },
    });
  }
}