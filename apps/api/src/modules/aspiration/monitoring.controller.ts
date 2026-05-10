import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('aspirations/:id/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
export class MonitoringController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('nextCheckIn') nextCheckIn?: string,
    @Request() req?,
  ) {
    return this.prisma.monitoringLog.create({
      data: {
        aspirationId: id,
        content,
        loggedBy: req.user.name,
        nextCheckIn: nextCheckIn ? new Date(nextCheckIn) : null,
      },
    });
  }

  @Get()
  async findAll(@Param('id') id: string) {
    return this.prisma.monitoringLog.findMany({
      where: { aspirationId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
