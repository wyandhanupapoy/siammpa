import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Get,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DispositionService } from './disposition.service';
import { CreateDispositionDto } from './dto/create-disposition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService } from '../pdf/pdf.service';
import { AspirationService } from '../aspiration/aspiration.service';

@Controller('aspirations/:id/disposition')
export class DispositionController {
  constructor(
    private readonly dispositionService: DispositionService,
    private readonly pdfService: PdfService,
    private readonly aspirationService: AspirationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('id') id: string,
    @Body() dto: CreateDispositionDto,
    @Request() req,
  ) {
    return this.dispositionService.create(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const aspiration = await this.aspirationService.findById(id);
    if (!aspiration || !aspiration.dispositions.length) {
      throw new NotFoundException('Aspiration or Disposition not found');
    }

    const latestDisposition =
      aspiration.dispositions[aspiration.dispositions.length - 1];
    const pdfBuffer = await this.pdfService.generateDispositionPdf(
      aspiration,
      latestDisposition,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=disposisi-${aspiration.aspirationCode}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
