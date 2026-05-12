import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireAnalysisService } from './analysis.service';
import { QuestionnaireImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('questionnaires')
export class QuestionnaireController {
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly analysisService: QuestionnaireAnalysisService,
    private readonly importService: QuestionnaireImportService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async createRequest(@Body() data: any, @Request() req) {
    const userId = req.user.id;
    return this.questionnaireService.createRequest(data, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get('requests')
  async findAllRequests() {
    return this.questionnaireService.findAllRequests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI')
  @Post('requests/:id/approve')
  async approveRequest(@Param('id') id: string, @Request() req) {
    return this.questionnaireService.approveRequest(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI')
  @Post('requests/:id/reject')
  async rejectRequest(@Param('id') id: string, @Body('reason') reason: string) {
    return this.questionnaireService.rejectRequest(id, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get()
  async findAll() {
    return this.questionnaireService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.questionnaireService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/submit-review')
  async submitForReview(@Param('id') id: string) {
    return this.questionnaireService.submitForReview(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI')
  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.questionnaireService.publish(id);
  }

  @Post(':id/responses')
  async submitResponse(@Param('id') id: string, @Body() data: any) {
    return this.questionnaireService.submitResponse(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Put(':id/link')
  async updateLink(@Param('id') id: string, @Body('formUrl') formUrl: string) {
    return this.questionnaireService.update(id, { formUrl });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    return this.analysisService.getResults(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/analysis')
  async createAnalysis(@Param('id') id: string, @Body() data: any) {
    return this.analysisService.saveAnalysis(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importService.importFromCsv(id, file.buffer);
  }
}
