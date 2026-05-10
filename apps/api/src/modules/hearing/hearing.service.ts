import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HearingService {
  constructor(private prisma: PrismaService) {}

  async create(aspirationId: string, data: any) {
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

  async findAll(aspirationId: string) {
    return this.prisma.hearing.findMany({
      where: { aspirationId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.hearing.update({
      where: { id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
  }
}
