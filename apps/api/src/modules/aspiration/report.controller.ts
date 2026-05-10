import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'KETUA_KOMISI', 'KETUA_MPA')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('semester-excel')
  async exportExcel(@Res() res: Response) {
    return this.reportService.exportSemesterReport(res);
  }
}
