import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';

@Injectable()
export class QuestionnaireImportService {
  constructor(private prisma: PrismaService) {}

  async importFromCsv(questionnaireId: string, fileBuffer: Buffer) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new BadRequestException('Questionnaire not found');
    }

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const responses: any[] = [];

    for (const record of records) {
      const answers: Record<string, any> = {};
      let respondentNim: string | null = null;
      let respondentName: string | null = null;

      // Map columns to questions based on [CODE] pattern
      Object.entries(record as any).forEach(([columnHeader, value]) => {
        const match = columnHeader.match(/\[([A-Z0-9]+)\]/);
        const code = match ? match[1] : null;

        if (code) {
          // Attempt to convert to number if it's a rating
          const numValue = Number(value);
          answers[code] = isNaN(numValue) ? value : numValue;
        }

        // Special handling for identity if present
        if (columnHeader.toLowerCase().includes('nim'))
          respondentNim = value as string;
        if (columnHeader.toLowerCase().includes('nama'))
          respondentName = value as string;
      });

      if (Object.keys(answers).length > 0) {
        responses.push({
          questionnaireId,
          respondentNim,
          respondentName,
          answers,
        });
      }
    }

    if (responses.length === 0) {
      throw new BadRequestException(
        'CSV tidak memiliki kolom jawaban yang dapat diimpor.',
      );
    }

    // Save to database
    return this.prisma.$transaction(async (tx) => {
      // Clear previous responses to avoid duplication if re-importing
      await tx.questionnaireResponse.deleteMany({
        where: { questionnaireId },
      });

      return tx.questionnaireResponse.createMany({
        data: responses,
      });
    });
  }
}
