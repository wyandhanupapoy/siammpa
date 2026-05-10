import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('aspirations/:id/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
export class InternalCommentController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.prisma.internalComment.create({
      data: {
        aspirationId: id,
        content,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  @Get()
  async findAll(@Param('id') id: string) {
    return this.prisma.internalComment.findMany({
      where: { aspirationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
