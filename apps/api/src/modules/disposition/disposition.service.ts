import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { CreateDispositionDto } from './dto/create-disposition.dto';
import { AspirationStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class DispositionService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  async create(
    aspirationId: string,
    dto: CreateDispositionDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Create disposition record
      const disposition = await tx.disposition.create({
        data: {
          aspirationId,
          sentBy: userId,
          sentTo: dto.sentTo,
          summary: dto.summary,
          recommendation: dto.recommendation,
          deadline: new Date(dto.deadline),
          status: 'SENT',
        },
      });

      // Transition status
      await this.workflow.transitionStatus(
        aspirationId,
        AspirationStatus.ASSIGNED,
        userId,
        `Disposed to: ${dto.sentTo}`,
        tx,
      );

      return disposition;
    });
  }

  async exportPdf(id: string, res: Response) {
    const disposition = await this.prisma.disposition.findUnique({
      where: { id },
      include: {
        aspiration: true,
      },
    });

    if (!disposition) throw new BadRequestException('Disposition not found');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DISPOSISI-${disposition.aspiration.aspirationCode}.pdf`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(14).text('MAJELIS PERWAKILAN ANGGOTA', { align: 'center' });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('HIMAKOM POLBAN', { align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .text('KOMISI ASPIRASI - SURAT DISPOSISI DIGITAL', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Body
    doc
      .fontSize(12)
      .text(`Kode Aspirasi: ${disposition.aspiration.aspirationCode}`);
    doc.text(
      `Tanggal Disposisi: ${disposition.createdAt.toLocaleDateString()}`,
    );
    doc.text(`Ditujukan Ke: ${disposition.sentTo}`);
    doc.text(`Batas Waktu: ${disposition.deadline.toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Ringkasan Permasalahan:', { underline: true });
    doc.fontSize(12).text(disposition.summary);
    doc.moveDown();

    doc.fontSize(14).text('Rekomendasi Tindakan:', { underline: true });
    doc.fontSize(12).text(disposition.recommendation);
    doc.moveDown(2);

    // Footer/Signature Area
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .text(
        'Dicetak otomatis oleh Sistem Informasi Aspirasi Mahasiswa (SIAM)',
        { align: 'center' },
      );

    doc.end();
  }
}
