import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QuestionnaireType,
  QuestionnaireStatus,
  RequestStatus,
} from '@prisma/client';

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

  async createRequest(data: any) {
    return this.prisma.questionnaireRequest.create({
      data: {
        requesterName: data.requesterName,
        requesterRole: data.requesterRole,
        contactInfo: data.contactInfo,
        purpose: data.purpose,
        targetRespondent: data.targetRespondent,
        estimatedCount: data.estimatedCount,
        requestedDeadline: new Date(data.requestedDeadline),
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAllRequests() {
    return this.prisma.questionnaireRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { questionnaire: true },
    });
  }

  async approveRequest(id: string, picId: string) {
    // SOP 3.4: Maksimum 2 kuesioner mendadak (KSR-C) per bulan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyCount = await this.prisma.questionnaire.count({
      where: {
        type: QuestionnaireType.KSR_C,
        createdAt: { gte: startOfMonth },
      },
    });

    if (monthlyCount >= 2) {
      throw new BadRequestException(
        'Batas maksimum kuesioner mendadak (2 per bulan) telah tercapai. Butuh persetujuan Ketua MPA.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.questionnaireRequest.update({
        where: { id },
        data: { status: RequestStatus.APPROVED },
      });

      const year = new Date().getFullYear();
      const code = `KSR-F-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      return tx.questionnaire.create({
        data: {
          type: QuestionnaireType.KSR_C, // Generic sudden need
          code,
          title: `Kuesioner Permintaan: ${request.purpose.substring(0, 30)}...`,
          status: QuestionnaireStatus.DRAFT,
          picId,
          requestId: id,
        },
      });
    });
  }

  async rejectRequest(id: string, reason: string) {
    return this.prisma.questionnaireRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: reason,
      },
    });
  }

  async submitForReview(id: string) {
    return this.prisma.questionnaire.update({
      where: { id },
      data: { status: QuestionnaireStatus.UNDER_REVIEW },
    });
  }

  async publish(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!questionnaire) throw new BadRequestException('Questionnaire not found');
    if (questionnaire.status !== QuestionnaireStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Kuesioner harus ditinjau (UNDER_REVIEW) sebelum dipublikasikan.',
      );
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: {
        status: QuestionnaireStatus.PUBLISHED,
        startDate: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.questionnaire.findMany({
      include: {
        pic: { select: { name: true } },
        analysis: true,
        request: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      // SOP 3.4: Minimal 48 jam waktu pengisian
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 48) {
        throw new BadRequestException(
          'Waktu pengisian kuesioner minimal 48 jam.',
        );
      }

      // SOP 3.4: Tidak boleh bersamaan dengan kuesioner aktif lain untuk target yang sama
      // (Simplified: check for any overlapping published questionnaire)
      if (data.status === QuestionnaireStatus.PUBLISHED) {
        const conflict = await this.prisma.questionnaire.findFirst({
          where: {
            id: { not: id },
            status: QuestionnaireStatus.PUBLISHED,
            OR: [
              {
                startDate: { lte: end },
                endDate: { gte: start },
              },
            ],
          },
        });

        if (conflict) {
          throw new BadRequestException(
            `Terdapat konflik jadwal dengan kuesioner aktif: ${conflict.title}`,
          );
        }
      }
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async createAnalysis(questionnaireId: string, data: any) {
    return this.prisma.questionnaireAnalysis.create({
      data: {
        questionnaireId,
        summary: data.summary,
        keyFindings: data.keyFindings,
        recommendations: data.recommendations,
        reportFileUrl: data.reportFileUrl,
      },
    });
  }

  async submitResponse(questionnaireId: string, data: any) {
    return this.prisma.questionnaireResponse.create({
      data: {
        questionnaireId,
        respondentNim: data.nim,
        respondentName: data.name,
        answers: data.answers,
      },
    });
  }

  async triggerSatisfactionSurvey(
    aspirationId: string,
    email: string,
    code: string,
  ) {
    const ksrCode = `KSR-E-${code}`;

    // Check if already exists
    const existing = await this.prisma.questionnaire.findUnique({
      where: { code: ksrCode },
    });

    if (!existing) {
      await this.prisma.questionnaire.create({
        data: {
          type: QuestionnaireType.KSR_E,
          code: ksrCode,
          title: `Kepuasan Penanganan Aspirasi: ${code}`,
          status: QuestionnaireStatus.PUBLISHED,
          description: `Kuesioner untuk aspirasi ${code}`,
        },
      });
    }

    // SOP KSR-E: Kirim email notifikasi berisi link kuesioner
    // This is handled by WorkflowService to avoid circular dependency
    
    return ksrCode;
  }
}
