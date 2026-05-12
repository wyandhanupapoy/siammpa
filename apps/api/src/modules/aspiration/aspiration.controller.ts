import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AspirationService } from './aspiration.service';
import { CreateAspirationDto } from './dto/create-aspiration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StorageService } from '../storage/storage.service';
import { WorkflowService } from '../workflow/workflow.service';

@Controller('aspirations')
export class AspirationController {
  constructor(
    private readonly aspirationService: AspirationService,
    private readonly storageService: StorageService,
    private readonly workflowService: WorkflowService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createAspirationDto: CreateAspirationDto,
    @Request() req,
  ) {
    return this.aspirationService.create(createAspirationDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const path = `uploads/${Date.now()}-${file.originalname}`;
    const url = await this.storageService.uploadFile(file, path);
    return { url };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get()
  async findAll() {
    return this.aspirationService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get(':id/reveal-identity')
  async revealIdentity(@Param('id') id: string, @Request() req) {
    const aspiration = await this.aspirationService.findById(id);
    if (!aspiration) throw new NotFoundException('Aspiration not found');

    // Audit the reveal action
    await this.aspirationService.auditIdentityReveal(
      id,
      req.user.id,
      aspiration.aspirationCode,
    );

    return {
      nim: aspiration.user.nim,
      name: aspiration.user.name,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const aspiration = await this.aspirationService.findById(id);
    if (!aspiration) throw new NotFoundException('Aspiration not found');
    return aspiration;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/analysis')
  async saveAnalysis(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.aspirationService.saveInternalAnalysis(id, req.user.id, data);
  }

  @Get('track/:code')
  async findByCode(@Param('code') code: string) {
    const aspiration = await this.aspirationService.findByCode(code);
    if (!aspiration) throw new NotFoundException('Aspiration not found');
    return aspiration;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body('toStatus') toStatus: any,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.workflowService.transitionStatus(
      id,
      toStatus,
      req.user.id,
      note,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get(':id/monitoring')
  async getMonitoring(@Param('id') id: string) {
    return this.aspirationService.getMonitoringLogs(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/monitoring')
  async addMonitoring(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.aspirationService.addMonitoringLog(id, req.user.id, content);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get(':id/hearings')
  async getHearings(@Param('id') id: string) {
    return this.aspirationService.getHearings(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/hearings')
  async addHearing(@Param('id') id: string, @Body() data: any) {
    return this.aspirationService.addHearing(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.aspirationService.getInternalComments(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.aspirationService.addInternalComment(id, req.user.id, content);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
  @Post(':id/escalate')
  async escalate(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.aspirationService.escalate(id, req.user.id, reason);
  }

  @Post(':id/survey')
  async submitSurvey(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('comment') comment?: string,
  ) {
    return this.aspirationService.submitSurvey(id, score, comment);
  }
}
