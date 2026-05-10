import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { SubmitClassificationDto } from './dto/submit-classification.dto';
import { AspirationStatus, PriorityLevel } from '@prisma/client';

@Injectable()
export class ClassificationService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  async classify(
    aspirationId: string,
    dto: SubmitClassificationDto,
    userId: string,
  ) {
    const score =
      (dto.param1 * 0.35 +
        dto.param2 * 0.2 +
        dto.param3 * 0.2 +
        dto.param4 * 0.15 +
        dto.param5 * 0.05 +
        dto.param6 * 0.05) *
      20;

    let level: PriorityLevel;
    if (score >= 81) level = PriorityLevel.CRITICAL;
    else if (score >= 61) level = PriorityLevel.HIGH;
    else if (score >= 41) level = PriorityLevel.MEDIUM;
    else level = PriorityLevel.LOW;

    return this.prisma.$transaction(async (tx) => {
      // Create or update classification form
      await tx.classificationForm.upsert({
        where: { aspirationId },
        create: {
          aspirationId,
          param1: dto.param1,
          param2: dto.param2,
          param3: dto.param3,
          param4: dto.param4,
          param5: dto.param5,
          param6: dto.param6,
          totalScore: score,
          level,
          notes: dto.notes,
          classifiedBy: userId,
        },
        update: {
          param1: dto.param1,
          param2: dto.param2,
          param3: dto.param3,
          param4: dto.param4,
          param5: dto.param5,
          param6: dto.param6,
          totalScore: score,
          level,
          notes: dto.notes,
          classifiedBy: userId,
        },
      });

      // Update Aspiration with score and level
      await tx.aspiration.update({
        where: { id: aspirationId },
        data: {
          priorityScore: score,
          priorityLevel: level,
        },
      });

      // Transition status (passing the transaction client)
      return this.workflow.transitionStatus(
        aspirationId,
        AspirationStatus.CLASSIFIED,
        userId,
        `Priority Level: ${level} (Score: ${score.toFixed(2)})`,
        tx,
      );
    });
  }
}
