import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionnaireType } from '@prisma/client';

@Injectable()
export class QuestionnaireAnalysisService {
  constructor(private prisma: PrismaService) {}

  async getResults(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
      include: {
        responses: true,
        analysis: true,
      },
    });

    if (!questionnaire) throw new NotFoundException('Questionnaire not found');

    // Aggregate internal responses
    const totalResponses = questionnaire.responses.length;

    // Logic for basic statistics (assuming standard 1-5 scale questions)
    // This is a simplified aggregator
    const stats: any = {};
    if (totalResponses > 0) {
      questionnaire.responses.forEach((res: any) => {
        const answers = res.answers as Record<string, any>;
        Object.entries(answers).forEach(([qId, val]) => {
          if (typeof val === 'number') {
            if (!stats[qId])
              stats[qId] = { sum: 0, count: 0, distribution: {} };
            stats[qId].sum += val;
            stats[qId].count += 1;
            stats[qId].distribution[val] =
              (stats[qId].distribution[val] || 0) + 1;
          }
        });
      });
    }

    const processedStats = Object.entries(stats).map(
      ([qId, data]: [string, any]) => {
        const average = data.count > 0 ? data.sum / data.count : 0;
        return {
          questionId: qId,
          average,
          total: data.count,
          distribution: data.distribution,
          isBelowThreshold: average < 3.0, // SOP 5.3 Priority Threshold
        };
      },
    );

    return {
      questionnaire,
      totalResponses,
      processedStats,
      needsUrgentAction: processedStats.some((s) => s.isBelowThreshold),
    };
  }

  async saveAnalysis(id: string, data: any) {
    return this.prisma.questionnaireAnalysis.upsert({
      where: { questionnaireId: id },
      update: {
        summary: data.summary,
        keyFindings: data.keyFindings,
        recommendations: data.recommendations,
        reportFileUrl: data.reportFileUrl,
      },
      create: {
        questionnaireId: id,
        summary: data.summary,
        keyFindings: data.keyFindings,
        recommendations: data.recommendations,
        reportFileUrl: data.reportFileUrl,
      },
    });
  }
}
