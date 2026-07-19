import { Controller, Post, Get, Delete, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(AuthGuard('jwt')) // Protects all routes below with JWT authentication
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  // 1. Create a new document
  @Post()
  create(@Body() body: { title: string }, @Request() req) {
    // req.user is automatically attached by our JwtStrategy
    return this.documentService.createDocument(body.title, req.user.id);
  }

  // 2. Get all documents owned by logged-in user
  @Get()
  getAll(@Request() req) {
    return this.documentService.getUserDocuments(req.user.id);
  }

  // 3. Get single document details
  @Get(':id')
  getOne(@Param('id') id: string, @Request() req) {
    return this.documentService.getDocument(id, req.user.id);
  }

  // 4. Delete a document
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.documentService.deleteDocument(id, req.user.id);
  }

  // 5. Update document title
  @Put(':id')
  update(@Param('id') id: string, @Body() body: { title: string }, @Request() req) {
    return this.documentService.updateDocument(id, body.title, req.user.id);
  }
}