import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationService } from '../notification/notification.service';
import { AspirationStatus } from '@prisma/client';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  // SLA Durations in Hours (simplified for MVP)
  private readonly SLA_DURATIONS: Partial<Record<AspirationStatus, number>> = {
    [AspirationStatus.SUBMITTED]: 24, // 1 HK
    [AspirationStatus.VALIDATING]: 48, // 2 HK
    [AspirationStatus.VERIFIED]: 24, // 1 HK
    [AspirationStatus.CLASSIFIED]: 72, // 3 HK
    [AspirationStatus.ASSIGNED]: 24, // 1 HK
    [AspirationStatus.IN_FOLLOW_UP]: 168, // 7 days check-in
    [AspirationStatus.RESOLVED]: 168, // 7 days auto-close
  };

  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
    private notification: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSlaBreaches() {
    this.logger.log('Running SLA check...');

    const activeAspirations = await this.prisma.aspiration.findMany({
      where: {
        status: {
          notIn: [
            AspirationStatus.CLOSED,
            AspirationStatus.ARCHIVED,
            AspirationStatus.REJECTED,
            AspirationStatus.ESCALATED,
          ],
        },
      },
      include: {
        user: true,
      },
    });

    const now = new Date();

    for (const aspiration of activeAspirations) {
      const slaLimitHours = this.SLA_DURATIONS[aspiration.status];
      if (!slaLimitHours) continue;

      const updatedDate = new Date(aspiration.updatedAt);
      const diffMs = now.getTime() - updatedDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // SOP-09: Auto-close RESOLVED after 7 days (168 hours)
      if (aspiration.status === AspirationStatus.RESOLVED && diffHours > 168) {
        await this.workflow.transitionStatus(
          aspiration.id,
          AspirationStatus.CLOSED,
          'SYSTEM',
          'Sistem otomatis menutup aspirasi setelah 7 hari berstatus RESOLVED.',
        );
        continue;
      }

      if (diffHours > slaLimitHours) {
        this.logger.warn(
          `SLA Breach detected for ${aspiration.aspirationCode} in status ${aspiration.status}`,
        );

        // Auto-escalate
        await this.handleBreach(aspiration);
      } else if (slaLimitHours - diffHours <= 48) {
        // FR-04-02: Deteksi Mendekati SLA (H-2)
        // Kita bisa menyimpan flag ini atau sekedar log, atau kirim warning ke PIC
        this.logger.log(
          `SLA Warning: ${aspiration.aspirationCode} akan melewati SLA dalam kurang dari 48 jam.`,
        );
      }
    }
  }

  private async handleBreach(aspiration: any) {
    try {
      // Transition to ESCALATED
      await this.workflow.transitionStatus(
        aspiration.id,
        AspirationStatus.ESCALATED,
        'SYSTEM', // System-triggered
        `SLA breach in status ${aspiration.status} after ${this.SLA_DURATIONS[aspiration.status]} hours.`,
      );

      // Notify
      await this.notification.notifyEscalation(
        aspiration.aspirationCode,
        `SLA limit reached for status ${aspiration.status}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle SLA breach for ${aspiration.aspirationCode}`,
        error,
      );
    }
  }
}
