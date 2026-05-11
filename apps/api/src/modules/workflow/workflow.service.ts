import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AspirationStatus, Prisma } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { AuditService } from '../audit/audit.service';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
    private gateway: NotificationGateway,
    private audit: AuditService,
    private questionnaire: QuestionnaireService,
  ) {}

  private readonly VALID_TRANSITIONS: Record<
    AspirationStatus,
    AspirationStatus[]
  > = {
    [AspirationStatus.SUBMITTED]: [AspirationStatus.LOGGED],
    [AspirationStatus.LOGGED]: [AspirationStatus.VALIDATING],
    [AspirationStatus.VALIDATING]: [
      AspirationStatus.VERIFIED,
      AspirationStatus.REJECTED,
    ],
    [AspirationStatus.VERIFIED]: [AspirationStatus.CLASSIFIED],
    [AspirationStatus.CLASSIFIED]: [
      AspirationStatus.ASSIGNED,
      AspirationStatus.CLASSIFIED,
    ], // Allow self-transition for updates
    [AspirationStatus.ASSIGNED]: [AspirationStatus.IN_FOLLOW_UP],
    [AspirationStatus.IN_FOLLOW_UP]: [
      AspirationStatus.RESOLVED,
      AspirationStatus.ESCALATED,
    ],
    [AspirationStatus.ESCALATED]: [
      AspirationStatus.IN_FOLLOW_UP,
      AspirationStatus.RESOLVED,
    ],
    [AspirationStatus.RESOLVED]: [AspirationStatus.CLOSED],
    [AspirationStatus.CLOSED]: [AspirationStatus.ARCHIVED],
    [AspirationStatus.REJECTED]: [AspirationStatus.ARCHIVED],
    [AspirationStatus.ARCHIVED]: [],
  };

  async transitionStatus(
    aspirationId: string,
    toStatus: AspirationStatus,
    changedById: string | null,
    note?: string,
    transactionClient?: Prisma.TransactionClient,
  ) {
    const client = transactionClient || this.prisma;

    const aspiration = await client.aspiration.findUnique({
      where: { id: aspirationId },
      include: { user: true },
    });

    if (!aspiration) {
      throw new BadRequestException('Aspiration not found');
    }

    const fromStatus = aspiration.status;

    // Skip if status is the same and it's not a self-transition allowed state
    // Actually, always allow same status to be "processed" to update notes/logs
    if (changedById !== 'SYSTEM' && fromStatus !== toStatus) {
      if (!this.VALID_TRANSITIONS[fromStatus].includes(toStatus)) {
        throw new BadRequestException(
          `Invalid status transition from ${fromStatus} to ${toStatus}`,
        );
      }
    }

    const performUpdates = async (tx: Prisma.TransactionClient) => {
      const updated = await tx.aspiration.update({
        where: { id: aspirationId },
        data: {
          status: toStatus,
          updatedAt: new Date(),
          ...(toStatus === AspirationStatus.CLOSED
            ? { closedAt: new Date() }
            : {}),
        },
      });

      // Only create status log if status changed OR a note was provided
      if (fromStatus !== toStatus || note) {
        await tx.statusLog.create({
          data: {
            aspirationId,
            fromStatus,
            toStatus,
            changedById:
              changedById === 'SYSTEM' || !changedById ? null : changedById,
            note,
          },
        });
      }

      return updated;
    };

    let updatedAspiration;
    if (transactionClient) {
      updatedAspiration = await performUpdates(transactionClient);
    } else {
      updatedAspiration = await this.prisma.$transaction(performUpdates);
    }

    // Side effects outside the transaction
    this.audit
      .log({
        userId:
          changedById === 'SYSTEM' || !changedById ? 'SYSTEM' : changedById,
        action: fromStatus === toStatus ? 'STATUS_UPDATE' : 'STATUS_TRANSITION',
        resource: 'aspiration',
        resourceId: aspirationId,
        oldValue: { status: fromStatus },
        newValue: { status: toStatus, note },
      })
      .catch((err) => console.error('Audit log error:', err));

    // Only notify on actual status change
    if (fromStatus !== toStatus) {
      if (aspiration.user?.email) {
        // Find phone number from user data if it exists or use email
        const userPhone = (aspiration.user as any).phone || null;

        this.notification
          .notifyStatusChange(
            aspiration.user.email,
            aspiration.aspirationCode,
            toStatus,
            note,
            userPhone,
          )
          .catch((err) => console.error('Notification error:', err));

        // SOP KSR-E: trigger survey when RESOLVED
        if (toStatus === AspirationStatus.RESOLVED) {
          this.questionnaire
            .triggerSatisfactionSurvey(
              aspirationId,
              aspiration.user.email,
              aspiration.aspirationCode,
            )
            .then(() => {
              return this.notification.notifySatisfactionSurvey(
                aspiration.user.email,
                aspiration.aspirationCode,
                userPhone,
              );
            })
            .catch((err) =>
              console.error('Satisfaction survey trigger error:', err),
            );
        }
      }

      // Real-time notification
      this.gateway.notifyStatusChange(aspirationId, {
        aspirationCode: aspiration.aspirationCode,
        fromStatus,
        toStatus,
        note,
      });
    }

    return updatedAspiration;
  }
}
