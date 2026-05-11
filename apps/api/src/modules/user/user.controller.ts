import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
  BadRequestException,
  NotFoundException,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.userService.findOne({ id: req.user.id });
    if (!user) throw new NotFoundException('User not found');
    
    // Remove sensitive data
    const { passwordHash, ...rest } = user as any;
    return rest;
  }

  @Put('me')
  async updateProfile(@Request() req, @Body() data: any) {
    const updateData: any = {
      name: data.name,
      phone: data.phone,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userService.update({
      where: { id: req.user.id },
      data: updateData,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('roles')
  async findAllRoles() {
    return this.prisma.role.findMany();
  }

  @Post()
  async create(@Body() data: any) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { nim: data.nim }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'User with this email or NIM already exists',
      );
    }

    const passwordHash = await bcrypt.hash(data.password || 'Mpa123!', 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        nim: data.nim,
        name: data.name,
        passwordHash,
        isActive: true,
        roles: {
          create: data.roleIds.map((roleId: string) => ({
            roleId,
          })),
        },
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.prisma.$transaction(async (tx) => {
      // Update basic info
      await tx.user.update({
        where: { id },
        data: {
          email: data.email,
          nim: data.nim,
          name: data.name,
          isActive: data.isActive,
          ...(data.password
            ? { passwordHash: await bcrypt.hash(data.password, 10) }
            : {}),
        },
      });

      // Update roles if provided
      if (data.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId: string) => ({
            userId: id,
            roleId,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true } } },
      });
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      // Get all aspiration IDs for this user
      const aspirations = await tx.aspiration.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const aspIds = aspirations.map((a) => a.id);

      // 1. Questionnaire PIC assignments
      await tx.questionnaire.updateMany({
        where: { picId: id },
        data: { picId: null },
      });

      // 2. Aspiration sub-records
      if (aspIds.length > 0) {
        await tx.statusLog.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.attachment.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.validationForm.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.classificationForm.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.disposition.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.hearing.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.monitoringLog.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.satisfactionSurvey.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.escalation.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.internalComment.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });
        await tx.internalAnalysis.deleteMany({
          where: { aspirationId: { in: aspIds } },
        });

        // Final delete for aspirations
        await tx.aspiration.deleteMany({ where: { id: { in: aspIds } } });
      }

      // 3. User sub-records not linked to specific aspirations
      await tx.statusLog.deleteMany({ where: { changedById: id } });
      await tx.internalComment.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.auditLog.deleteMany({ where: { userId: id } });
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.newsReaction.deleteMany({ where: { userId: id } });
      await tx.newsComment.deleteMany({ where: { userId: id } });

      const newsIds = await tx.news.findMany({ where: { authorId: id } }).then(n => n.map(x => x.id));
      if (newsIds.length > 0) {
        await tx.newsReaction.deleteMany({ where: { newsId: { in: newsIds } } });
        await tx.newsComment.deleteMany({ where: { newsId: { in: newsIds } } });
        await tx.news.deleteMany({ where: { authorId: id } });
      }

      // 4. Finally delete the user
      return tx.user.delete({ where: { id } });
    });
  }
}
