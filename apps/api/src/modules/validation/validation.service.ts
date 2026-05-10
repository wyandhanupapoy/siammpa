import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { SubmitValidationDto } from './dto/submit-validation.dto';
import { AspirationStatus } from '@prisma/client';

@Injectable()
export class ValidationService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  async validate(
    aspirationId: string,
    dto: SubmitValidationDto,
    userId: string,
  ) {
    const toStatus =
      dto.decision === 'VERIFIED'
        ? AspirationStatus.VERIFIED
        : AspirationStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      // Create or update validation form
      await tx.validationForm.upsert({
        where: { aspirationId },
        create: {
          aspirationId,
          criteria1: dto.criteria1,
          criteria2: dto.criteria2,
          criteria3: dto.criteria3,
          criteria4: dto.criteria4,
          criteria5: dto.criteria5,
          notes: dto.notes,
          decision: dto.decision,
          validatedBy: userId,
        },
        update: {
          criteria1: dto.criteria1,
          criteria2: dto.criteria2,
          criteria3: dto.criteria3,
          criteria4: dto.criteria4,
          criteria5: dto.criteria5,
          notes: dto.notes,
          decision: dto.decision,
          validatedBy: userId,
        },
      });

      // Transition status
      return this.workflow.transitionStatus(
        aspirationId,
        toStatus,
        userId,
        dto.notes,
        tx,
      );
    });
  }
}
