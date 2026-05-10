import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AspirationStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const total = await this.prisma.aspiration.count();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = await this.prisma.aspiration.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const resolved = await this.prisma.aspiration.count({
      where: {
        status: {
          in: [AspirationStatus.RESOLVED, AspirationStatus.CLOSED],
        },
      },
    });

    return {
      total,
      thisMonth,
      resolved,
      percentageResolved: total > 0 ? (resolved / total) * 100 : 0,
    };
  }

  async getPerformanceMetrics() {
    const closedAspirations = await this.prisma.aspiration.findMany({
      where: {
        status: { in: [AspirationStatus.CLOSED, AspirationStatus.ARCHIVED] },
        closedAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    let avgResolutionTimeDays = 0;
    if (closedAspirations.length > 0) {
      const totalMs = closedAspirations.reduce((acc, curr) => {
        return acc + (curr.closedAt!.getTime() - curr.createdAt.getTime());
      }, 0);
      avgResolutionTimeDays =
        totalMs / (1000 * 60 * 60 * 24 * closedAspirations.length);
    }

    const totalAspirations = await this.prisma.aspiration.count();
    const escalatedAspirations = await this.prisma.aspiration.count({
      where: {
        statusLogs: {
          some: { toStatus: AspirationStatus.ESCALATED },
        },
      },
    });

    return {
      avgResolutionTimeDays: parseFloat(avgResolutionTimeDays.toFixed(2)),
      slaBreachRate:
        totalAspirations > 0
          ? parseFloat(
              ((escalatedAspirations / totalAspirations) * 100).toFixed(2),
            )
          : 0,
    };
  }

  async getMonthlyTrend() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await this.prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('RESOLVED', 'CLOSED', 'ARCHIVED') THEN 1 END) as resolved
      FROM aspirations
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;

    return trends;
  }

  async getStatusDistribution() {
    const counts = await this.prisma.aspiration.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    return counts.map((c) => ({
      status: c.status,
      count: c._count._all,
    }));
  }

  async getCategoryDistribution() {
    const counts = await this.prisma.aspiration.groupBy({
      by: ['categoryId'],
      _count: {
        _all: true,
      },
    });

    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: counts.map((c) => c.categoryId),
        },
      },
    });

    return counts.map((c) => {
      const category = categories.find((cat) => cat.id === c.categoryId);
      return {
        category: category?.name || 'Unknown',
        count: c._count._all,
      };
    });
  }

  async getRecentActivities(limit = 5) {
    return this.prisma.statusLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        aspiration: {
          select: {
            aspirationCode: true,
            title: true,
          },
        },
        changedBy: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async getPersonalSummary(userId: string) {
    const total = await this.prisma.aspiration.count({ where: { userId } });
    const resolved = await this.prisma.aspiration.count({
      where: {
        userId,
        status: { in: [AspirationStatus.RESOLVED, AspirationStatus.CLOSED] },
      },
    });
    const inProgress = total - resolved;

    const recentAspirations = await this.prisma.aspiration.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    return {
      total,
      resolved,
      inProgress,
      recentAspirations,
    };
  }
}
