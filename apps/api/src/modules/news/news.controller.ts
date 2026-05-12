import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('news')
export class NewsController {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  @Get()
  async findAll() {
    return this.prisma.news.findMany({
      where: { isPublic: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.news.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        comments: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });
  }

  @Get(':id/reactions')
  async getReactions(@Param('id') id: string) {
    const reactions = await this.prisma.newsReaction.groupBy({
      by: ['type'],
      where: { newsId: id },
      _count: true,
    });

    return reactions.reduce(
      (acc: any, curr) => {
        acc[curr.type] = curr._count;
        return acc;
      },
      { LIKE: 0, DISLIKE: 0 },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/react')
  async react(
    @Param('id') id: string,
    @Body('type') type: 'LIKE' | 'DISLIKE',
    @Request() req,
  ) {
    const userId = req.user.id;

    // Check if reaction exists
    const existing = await this.prisma.newsReaction.findUnique({
      where: { newsId_userId: { newsId: id, userId } },
    });

    if (existing) {
      if (existing.type === type) {
        // Remove reaction if same type (toggle)
        return this.prisma.newsReaction.delete({
          where: { id: existing.id },
        });
      } else {
        // Update reaction if different type
        return this.prisma.newsReaction.update({
          where: { id: existing.id },
          data: { type },
        });
      }
    }

    return this.prisma.newsReaction.create({
      data: {
        newsId: id,
        userId,
        type,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.prisma.newsComment.create({
      data: {
        newsId: id,
        userId: req.user.id,
        content,
      },
      include: {
        user: { select: { name: true } },
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  async removeComment(@Param('commentId') commentId: string, @Request() req) {
    const comment = await this.prisma.newsComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new BadRequestException('Komentar tidak ditemukan');

    // Only author or admin can delete
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { roles: { include: { role: true } } },
    });
    const isAdmin = user?.roles.some((r) => r.role.name === 'ADMIN');

    if (comment.userId !== req.user.id && !isAdmin) {
      throw new BadRequestException(
        'Tidak memiliki akses untuk menghapus komentar ini',
      );
    }

    return this.prisma.newsComment.delete({ where: { id: commentId } });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() data: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;
    if (file) {
      const path = `news/${Date.now()}-${file.originalname}`;
      imageUrl = await this.storage.uploadFile(file, path);
    }

    return this.prisma.news.create({
      data: {
        title: data.title,
        content: data.content,
        imageUrl,
        authorId: req.user.id,
        isPublic: data.isPublic === 'false' ? false : true,
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl = data.imageUrl;
    if (file) {
      const path = `news/${Date.now()}-${file.originalname}`;
      imageUrl = await this.storage.uploadFile(file, path);
    }

    return this.prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        imageUrl,
        isPublic: data.isPublic === 'false' ? false : true,
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.news.delete({ where: { id } });
  }
}
