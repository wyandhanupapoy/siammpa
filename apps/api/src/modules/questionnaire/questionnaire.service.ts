import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QuestionnaireType,
  QuestionnaireStatus,
  RequestStatus,
  Prisma,
} from '@prisma/client';

type QuestionnaireRequestInput = {
  requesterName?: string;
  requesterRole?: string;
  contactInfo?: string;
  purpose?: string;
  targetRespondent?: string;
  estimatedCount?: number | string;
  requestedDeadline?: string;
  userId?: string;
};

type QuestionnaireUpdateInput = {
  title?: string;
  description?: string;
  formUrl?: string | null;
  isInternal?: boolean;
  questions?: Prisma.InputJsonValue[] | null;
  picId?: string | null;
  status?: QuestionnaireStatus;
  startDate?: string | null;
  endDate?: string | null;
};

type QuestionnaireAnalysisInput = {
  summary?: string;
  keyFindings?: string;
  recommendations?: string;
  reportFileUrl?: string | null;
};

type QuestionnaireResponseInput = {
  nim?: string;
  name?: string;
  answers?: Record<string, unknown>;
};

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

  private normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private parseDate(value: unknown, fieldName: string): Date {
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} tidak valid.`);
    }
    return parsed;
  }

  private ensureScheduleIsValid(startDate: Date, endDate: Date) {
    if (endDate <= startDate) {
      throw new BadRequestException(
        'Tanggal selesai harus lebih besar dari tanggal mulai.',
      );
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 48) {
      throw new BadRequestException(
        'Waktu pengisian kuesioner minimal 48 jam.',
      );
    }
  }

  private validateUrl(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;

    const normalized = this.normalizeString(value);
    if (!normalized) return null;

    try {
      const parsed = new URL(normalized);
      return parsed.toString();
    } catch {
      throw new BadRequestException('URL formulir tidak valid.');
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase().replace(/_/g, '-');
  }

  async createRequest(data: QuestionnaireRequestInput, userId?: string) {
    const requesterName = this.normalizeString(data.requesterName);
    const requesterRole = this.normalizeString(data.requesterRole);
    const contactInfo = this.normalizeString(data.contactInfo);
    const purpose = this.normalizeString(data.purpose);
    const targetRespondent = this.normalizeString(data.targetRespondent);

    if (
      !requesterName ||
      !requesterRole ||
      !contactInfo ||
      !purpose ||
      !targetRespondent
    ) {
      throw new BadRequestException('Data permintaan kuesioner belum lengkap.');
    }

    const requestedDeadline = this.parseDate(
      data.requestedDeadline,
      'Deadline permintaan',
    );
    if (requestedDeadline <= new Date()) {
      throw new BadRequestException(
        'Deadline permintaan harus lebih besar dari waktu saat ini.',
      );
    }

    let estimatedCount: number | null = null;
    if (data.estimatedCount !== undefined && data.estimatedCount !== '') {
      estimatedCount = Number(data.estimatedCount);
      if (!Number.isInteger(estimatedCount) || estimatedCount <= 0) {
        throw new BadRequestException(
          'Estimasi jumlah responden harus berupa bilangan bulat positif.',
        );
      }
    }

    return this.prisma.questionnaireRequest.create({
      data: {
        requesterName,
        requesterRole,
        contactInfo,
        purpose,
        targetRespondent,
        estimatedCount,
        requestedDeadline,
        status: RequestStatus.PENDING,
        userId: userId || data.userId,
      },
    });
  }

  async findAllRequests() {
    return this.prisma.questionnaireRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        questionnaire: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
          },
        },
      },
    });
  }

  async approveRequest(
    id: string,
    picId: string,
    approverRoles: string[] = [],
  ) {
    // SOP 3.4: Maksimum 2 kuesioner mendadak (KSR-C) per bulan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const canOverrideMonthlyLimit = approverRoles.includes('KETUA_MPA');

    const monthlyCount = await this.prisma.questionnaire.count({
      where: {
        type: QuestionnaireType.KSR_C,
        createdAt: { gte: startOfMonth },
      },
    });

    if (monthlyCount >= 2 && !canOverrideMonthlyLimit) {
      throw new BadRequestException(
        'Batas maksimum kuesioner mendadak (2 per bulan) telah tercapai. Butuh persetujuan Ketua MPA.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingRequest = await tx.questionnaireRequest.findUnique({
        where: { id },
        include: { questionnaire: true },
      });

      if (!existingRequest) {
        throw new NotFoundException('Permintaan kuesioner tidak ditemukan.');
      }

      if (existingRequest.status !== RequestStatus.PENDING) {
        throw new BadRequestException(
          'Hanya permintaan berstatus PENDING yang dapat disetujui.',
        );
      }

      if (existingRequest.questionnaire) {
        throw new BadRequestException(
          'Permintaan ini sudah memiliki kuesioner yang dibuat.',
        );
      }

      const request = await tx.questionnaireRequest.update({
        where: { id },
        data: { status: RequestStatus.APPROVED },
      });

      const year = new Date().getFullYear();
      const code = `KSR-F-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const titleSuffix =
        request.purpose.length > 50
          ? `${request.purpose.substring(0, 50)}...`
          : request.purpose;

      return tx.questionnaire.create({
        data: {
          type: QuestionnaireType.KSR_C, // Generic sudden need
          code,
          title: `Kuesioner Permintaan: ${titleSuffix}`,
          description:
            `Pemohon: ${request.requesterName} (${request.requesterRole})\n` +
            `Kontak: ${request.contactInfo}\n` +
            `Target: ${request.targetRespondent}\n` +
            `Tujuan: ${request.purpose}`,
          status: QuestionnaireStatus.DRAFT,
          picId,
          requestId: id,
          endDate: request.requestedDeadline,
        },
      });
    });
  }

  async rejectRequest(id: string, reason: string) {
    const normalizedReason = this.normalizeString(reason);
    if (!normalizedReason) {
      throw new BadRequestException('Alasan penolakan wajib diisi.');
    }

    const request = await this.prisma.questionnaireRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Permintaan kuesioner tidak ditemukan.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Hanya permintaan berstatus PENDING yang dapat ditolak.',
      );
    }

    return this.prisma.questionnaireRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: normalizedReason,
      },
    });
  }

  async submitForReview(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    if (questionnaire.status !== QuestionnaireStatus.DRAFT) {
      throw new BadRequestException(
        'Hanya kuesioner berstatus DRAFT yang bisa diajukan untuk review.',
      );
    }

    const hasInternalQuestions =
      Array.isArray(questionnaire.questions) &&
      questionnaire.questions.length > 0;
    const hasExternalForm = Boolean(questionnaire.formUrl);

    if (!this.normalizeString(questionnaire.title)) {
      throw new BadRequestException('Judul kuesioner wajib diisi.');
    }

    if (!this.normalizeString(questionnaire.description)) {
      throw new BadRequestException('Deskripsi kuesioner wajib diisi.');
    }

    if (!hasInternalQuestions && !hasExternalForm) {
      throw new BadRequestException(
        'Kuesioner harus memiliki pertanyaan internal atau link formulir eksternal sebelum diajukan untuk review.',
      );
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: { status: QuestionnaireStatus.UNDER_REVIEW },
    });
  }

  async publish(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!questionnaire)
      throw new BadRequestException('Questionnaire not found');
    if (questionnaire.status !== QuestionnaireStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Kuesioner harus ditinjau (UNDER_REVIEW) sebelum dipublikasikan.',
      );
    }

    const hasInternalQuestions =
      Array.isArray(questionnaire.questions) &&
      questionnaire.questions.length > 0;
    const hasExternalForm = Boolean(questionnaire.formUrl);

    if (questionnaire.isInternal && !hasInternalQuestions) {
      throw new BadRequestException(
        'Kuesioner internal harus memiliki daftar pertanyaan sebelum dipublikasikan.',
      );
    }

    if (!questionnaire.isInternal && !hasExternalForm) {
      throw new BadRequestException(
        'Kuesioner eksternal harus memiliki link formulir sebelum dipublikasikan.',
      );
    }

    const startDate = questionnaire.startDate ?? new Date();
    const endDate =
      questionnaire.endDate ??
      new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.ensureScheduleIsValid(startDate, endDate);

    const conflict = await this.prisma.questionnaire.findFirst({
      where: {
        id: { not: id },
        status: QuestionnaireStatus.PUBLISHED,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        `Terdapat konflik jadwal dengan kuesioner aktif: ${conflict.title}`,
      );
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: {
        status: QuestionnaireStatus.PUBLISHED,
        startDate,
        endDate,
      },
    });
  }

  async findAll() {
    return this.prisma.questionnaire.findMany({
      include: {
        pic: true,
        analysis: true,
        request: true,
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicByCode(code: string) {
    const normalizedCode = this.normalizeCode(code);
    const candidateCodes = normalizedCode.startsWith('KSR-')
      ? [normalizedCode]
      : [normalizedCode, `KSR-E-${normalizedCode}`];

    const questionnaire = await this.prisma.questionnaire.findFirst({
      where: {
        code: { in: candidateCodes },
        status: QuestionnaireStatus.PUBLISHED,
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        formUrl: true,
        isInternal: true,
        questions: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!questionnaire) {
      throw new NotFoundException(
        'Kuesioner tidak ditemukan atau belum dipublikasikan.',
      );
    }

    return questionnaire;
  }

  async update(id: string, data: QuestionnaireUpdateInput) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    if (
      data.status === QuestionnaireStatus.UNDER_REVIEW ||
      data.status === QuestionnaireStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Gunakan endpoint khusus untuk mengubah status review atau publikasi.',
      );
    }

    const updateData: Prisma.QuestionnaireUpdateInput = {};

    if ('title' in data) {
      const title = this.normalizeString(data.title);
      if (!title) {
        throw new BadRequestException('Judul kuesioner wajib diisi.');
      }
      updateData.title = title;
    }

    if ('description' in data) {
      updateData.description = this.normalizeString(data.description) || null;
    }

    if ('formUrl' in data) {
      updateData.formUrl = this.validateUrl(data.formUrl);
      if (updateData.formUrl) {
        updateData.isInternal = false;
      }
    }

    if ('isInternal' in data) {
      updateData.isInternal = Boolean(data.isInternal);
    }

    if ('questions' in data) {
      if (data.questions !== null && !Array.isArray(data.questions)) {
        throw new BadRequestException(
          'Format pertanyaan internal harus berupa array.',
        );
      }
      updateData.questions = data.questions;
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        updateData.isInternal = true;
      }
    }

    if ('picId' in data) {
      updateData.picId = this.normalizeString(data.picId) || null;
    }

    if ('status' in data && data.status === QuestionnaireStatus.CLOSED) {
      updateData.status = QuestionnaireStatus.CLOSED;
    }

    const nextStartDate =
      'startDate' in data
        ? data.startDate
          ? this.parseDate(data.startDate, 'Tanggal mulai')
          : null
        : questionnaire.startDate;
    const nextEndDate =
      'endDate' in data
        ? data.endDate
          ? this.parseDate(data.endDate, 'Tanggal selesai')
          : null
        : questionnaire.endDate;

    if (nextStartDate && nextEndDate) {
      this.ensureScheduleIsValid(nextStartDate, nextEndDate);

      if (questionnaire.status === QuestionnaireStatus.PUBLISHED) {
        const conflict = await this.prisma.questionnaire.findFirst({
          where: {
            id: { not: id },
            status: QuestionnaireStatus.PUBLISHED,
            startDate: { lte: nextEndDate },
            endDate: { gte: nextStartDate },
          },
        });

        if (conflict) {
          throw new BadRequestException(
            `Terdapat konflik jadwal dengan kuesioner aktif: ${conflict.title}`,
          );
        }
      }
    }

    if ('startDate' in data) {
      updateData.startDate = nextStartDate;
    }

    if ('endDate' in data) {
      updateData.endDate = nextEndDate;
    }

    return this.prisma.questionnaire.update({
      where: { id },
      data: updateData,
    });
  }

  async createAnalysis(
    questionnaireId: string,
    data: QuestionnaireAnalysisInput,
  ) {
    return this.prisma.questionnaireAnalysis.create({
      data: {
        questionnaireId,
        summary: this.normalizeString(data.summary) || '',
        keyFindings: this.normalizeString(data.keyFindings) || '',
        recommendations: this.normalizeString(data.recommendations) || '',
        reportFileUrl: this.validateUrl(data.reportFileUrl),
      },
    });
  }

  async submitResponse(questionnaireId: string, data: QuestionnaireResponseInput) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    if (questionnaire.status !== QuestionnaireStatus.PUBLISHED) {
      throw new BadRequestException(
        'Kuesioner belum dibuka untuk menerima respons.',
      );
    }

    const now = new Date();
    if (questionnaire.startDate && now < questionnaire.startDate) {
      throw new BadRequestException(
        'Kuesioner belum memasuki waktu pengisian.',
      );
    }

    if (questionnaire.endDate && now > questionnaire.endDate) {
      throw new BadRequestException(
        'Periode pengisian kuesioner sudah berakhir.',
      );
    }

    if (
      !data.answers ||
      typeof data.answers !== 'object' ||
      Array.isArray(data.answers)
    ) {
      throw new BadRequestException('Jawaban kuesioner tidak valid.');
    }

    const answers = Object.fromEntries(
      Object.entries(data.answers).filter(([, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
      }),
    );

    if (Object.keys(answers).length === 0) {
      throw new BadRequestException('Jawaban kuesioner tidak boleh kosong.');
    }

    const respondentNim = this.normalizeString(data.nim) || null;
    const respondentName = this.normalizeString(data.name) || null;

    if (respondentNim) {
      const existingResponse =
        await this.prisma.questionnaireResponse.findFirst({
          where: {
            questionnaireId,
            respondentNim,
          },
        });

      if (existingResponse) {
        throw new BadRequestException(
          'NIM tersebut sudah pernah mengisi kuesioner ini.',
        );
      }
    }

    return this.prisma.questionnaireResponse.create({
      data: {
        questionnaireId,
        respondentNim,
        respondentName,
        answers,
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
