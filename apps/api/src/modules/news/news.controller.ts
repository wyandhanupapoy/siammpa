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
      include: { author: { select: { name: true } } },
    });
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
