import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAspirationDto } from './dto/create-aspiration.dto';
import { AspirationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { WorkflowService } from '../workflow/workflow.service';
import { EncryptionService } from '../auth/encryption.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notification/notification.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AspirationService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
    private encryption: EncryptionService,
    private audit: AuditService,
    private notificationService: NotificationService,
    private configService: ConfigService,
  ) {}

  async create(createAspirationDto: CreateAspirationDto, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new BadRequestException('User not found');

    // FR-02-10: Maks 3 aspirasi aktif per NIM
    const activeAspirations = await this.prisma.aspiration.count({
      where: {
        userId: targetUserId,
        status: {
          notIn: [
            AspirationStatus.CLOSED,
            AspirationStatus.ARCHIVED,
            AspirationStatus.REJECTED,
          ],
        },
      },
    });

    if (activeAspirations >= 3) {
      throw new BadRequestException(
        'Anda telah mencapai batas maksimum 3 aspirasi aktif. Harap tunggu hingga aspirasi sebelumnya diproses.',
      );
    }

    const reporterNim = user.nim;
    const aspirationCode = await this.generateAspirationCode();

    const result = await this.prisma.aspiration.create({
      data: {
        aspirationCode,
        title: createAspirationDto.title,
        description: createAspirationDto.description,
        isAnonymous: createAspirationDto.isAnonymous || false,
        anonymousNim:
          createAspirationDto.isAnonymous && reporterNim
            ? this.encryption.encrypt(reporterNim)
            : null,
        status: AspirationStatus.SUBMITTED,
        category: {
          connect: { id: createAspirationDto.categoryId },
        },
        user: {
          connect: { id: targetUserId },
        },
        attachments: {
          create: createAspirationDto.attachments?.map((at) => ({
            ...at,
            uploadedById: targetUserId,
          })),
        },
      },
    });

    if (user.phone) {
      const waMessage = 
`✅ *ASPIRASI BERHASIL DIKIRIM*

Halo ${user.name}, aspirasi Anda dengan judul *"${createAspirationDto.title}"* telah masuk ke sistem kami.

*Kode:* ${aspirationCode}
*Status:* SUBMITTED

Pantau perkembangannya melalui:
${this.configService.get('FRONTEND_URL')}/aspirasi/tracking/${aspirationCode}

_Pesan otomatis SIAM MPA HIMAKOM POLBAN._`;
      
      this.notificationService.sendWhatsApp(user.phone, waMessage);
    }

    return result;
  }

  async findAll() {
    return this.prisma.aspiration.findMany({
      include: {
        category: true,
        attachments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.aspiration.findUnique({
      where: { id },
      include: {
        category: true,
        attachments: true,
        user: true,
        topic: true,
        statusLogs: {
          include: {
            changedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        validationForm: true,
        classificationForm: true,
        internalAnalysis: true,
        dispositions: true,
        survey: true,
      },
    });
  }

  async getMonitoringLogs(aspirationId: string) {
    return this.prisma.monitoringLog.findMany({
      where: { aspirationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMonitoringLog(aspirationId: string, userId: string, content: string) {
    return this.prisma.monitoringLog.create({
      data: {
        aspirationId,
        loggedBy: userId,
        content,
      },
    });
  }

  async getHearings(aspirationId: string) {
    return this.prisma.hearing.findMany({
      where: { aspirationId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async addHearing(aspirationId: string, data: any) {
    return this.prisma.hearing.create({
      data: {
        aspirationId,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location,
        participants: data.participants,
        agenda: data.agenda,
      },
    });
  }

  async getInternalComments(aspirationId: string) {
    return this.prisma.internalComment.findMany({
      where: { aspirationId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addInternalComment(
    aspirationId: string,
    userId: string,
    content: string,
  ) {
    return this.prisma.internalComment.create({
      data: {
        aspirationId,
        userId,
        content,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
  }

  async escalate(aspirationId: string, userId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.escalation.create({
        data: {
          aspirationId,
          triggeredBy: userId,
          reason,
          escalationLevel: 1,
          triggerType: 'MANUAL',
          assignedTo: 'KETUA_MPA',
        },
      });

      return this.workflow.transitionStatus(
        aspirationId,
        AspirationStatus.ESCALATED,
        userId,
        `Manual escalation: ${reason}`,
        tx,
      );
    });
  }

  async saveInternalAnalysis(aspirationId: string, userId: string, data: any) {
    return this.prisma.internalAnalysis.upsert({
      where: { aspirationId },
      update: {
        notulensi: data.notulensi,
        rekomendasi: data.rekomendasi,
        rencanaAksi: data.rencanaAksi,
        analyzedBy: userId,
      },
      create: {
        aspirationId,
        notulensi: data.notulensi,
        rekomendasi: data.rekomendasi,
        rencanaAksi: data.rencanaAksi,
        analyzedBy: userId,
      },
    });
  }

  async findByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase().replace(/_/g, '-');
    return this.prisma.aspiration.findUnique({
      where: { aspirationCode: normalizedCode },
      include: {
        category: true,
        statusLogs: {
          include: {
            changedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        survey: true,
      },
    });
  }

  async submitSurvey(id: string, score: number, comment?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.satisfactionSurvey.create({
        data: {
          aspirationId: id,
          score,
          comment,
        },
      });

      return this.workflow.transitionStatus(
        id,
        AspirationStatus.CLOSED,
        null,
        'Survey submitted by user',
        tx,
      );
    });
  }

  async auditIdentityReveal(aspirationId: string, userId: string, code: string) {
    return this.audit.log({
      userId,
      action: 'IDENTITY_REVEAL',
      resource: 'aspiration',
      resourceId: aspirationId,
      newValue: { reason: 'Admin requested identity reveal', code },
    });
  }

  private async generateAspirationCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MPA-${year}`;

    const lastAspiration = await this.prisma.aspiration.findFirst({
      where: {
        aspirationCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        aspirationCode: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastAspiration) {
      const lastNumberMatch = lastAspiration.aspirationCode.match(/-(\d+)$/);
      if (lastNumberMatch) {
        nextNumber = parseInt(lastNumberMatch[1], 10) + 1;
      }
    }

    const nnn = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${nnn}`;
  }
}
