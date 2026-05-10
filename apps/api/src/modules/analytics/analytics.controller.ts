import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('public')
  async getPublicStats() {
    const summary = await this.analyticsService.getSummary();
    const categories = await this.analyticsService.getCategoryDistribution();
    return {
      summary,
      categories,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('summary')
  async getSummary() {
    return this.analyticsService.getSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('status-distribution')
  async getStatusDistribution() {
    return this.analyticsService.getStatusDistribution();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('category-distribution')
  async getCategoryDistribution() {
    return this.analyticsService.getCategoryDistribution();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('recent-activities')
  async getRecentActivities() {
    return this.analyticsService.getRecentActivities();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('performance')
  async getPerformanceMetrics() {
    return this.analyticsService.getPerformanceMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
  @Get('trend')
  async getMonthlyTrend() {
    return this.analyticsService.getMonthlyTrend();
  }

  @UseGuards(JwtAuthGuard)
  @Get('personal-summary')
  async getPersonalSummary(@Request() req) {
    return this.analyticsService.getPersonalSummary(req.user.id);
  }
}
