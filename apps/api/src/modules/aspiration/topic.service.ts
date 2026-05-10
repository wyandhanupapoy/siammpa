import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.topic.findMany({
      include: {
        _count: {
          select: { aspirations: true },
        },
        internalAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        aspirations: {
          include: {
            user: { select: { name: true, nim: true } },
            category: true,
          },
        },
        internalAnalysis: true,
      },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  async create(data: CreateTopicDto) {
    return this.prisma.topic.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Unlink aspirations before deleting
    await this.prisma.aspiration.updateMany({
      where: { topicId: id },
      data: { topicId: null },
    });
    return this.prisma.topic.delete({ where: { id } });
  }

  async assignAspirations(topicId: string, aspirationIds: string[]) {
    return this.prisma.aspiration.updateMany({
      where: { id: { in: aspirationIds } },
      data: { topicId },
    });
  }

  async saveAnalysis(topicId: string, userId: string, data: any) {
    return this.prisma.internalAnalysis.upsert({
      where: { topicId },
      update: {
        notulensi: data.notulensi,
        rekomendasi: data.rekomendasi,
        rencanaAksi: data.rencanaAksi,
        analyzedBy: userId,
      },
      create: {
        topicId,
        notulensi: data.notulensi,
        rekomendasi: data.rekomendasi,
        rencanaAksi: data.rencanaAksi,
        analyzedBy: userId,
      },
    });
  }
}
