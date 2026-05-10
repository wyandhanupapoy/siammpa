import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateDispositionPdf(
    aspiration: any,
    disposition: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => {
          this.logger.error(`PDF generation error: ${err.message}`, err.stack);
          reject(err);
        });

        // --- Header ---
        doc
          .font('Helvetica')
          .fontSize(14)
          .text('MAJELIS PERWAKILAN ANGGOTA (MPA)', { align: 'center' });
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .text('HIMAKOM POLBAN', { align: 'center' });
        doc
          .font('Helvetica')
          .fontSize(10)
          .text('Politeknik Negeri Bandung', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // --- Title ---
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text('SURAT DISPOSISI ASPIRASI', {
            align: 'center',
            underline: true,
          });
        doc.moveDown();

        // --- Aspiration Details ---
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(`ID Aspirasi: ${aspiration.aspirationCode || '-'}`);
        const createdAt = aspiration.createdAt
          ? new Date(aspiration.createdAt)
          : new Date();
        doc
          .font('Helvetica')
          .text(`Tanggal Masuk: ${createdAt.toLocaleDateString()}`);
        doc.text(`Kategori: ${aspiration.category?.name || '-'}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('PERIHAL:');
        doc.font('Helvetica').text(aspiration.title || '-');
        doc.moveDown();

        // --- Disposition Details ---
        doc.rect(doc.x, doc.y, 495, 200).stroke();
        const innerX = doc.x + 10;
        const innerY = doc.y + 10;

        doc.font('Helvetica-Bold').text('DITERUSKAN KEPADA:', innerX, innerY);
        doc
          .font('Helvetica')
          .text(disposition.sentTo || '-', innerX + 150, innerY);

        doc.font('Helvetica-Bold').text('BATAS WAKTU:', innerX, innerY + 20);
        const deadline = disposition.deadline
          ? new Date(disposition.deadline)
          : new Date();
        doc
          .font('Helvetica')
          .text(deadline.toLocaleDateString(), innerX + 150, innerY + 20);

        doc.font('Helvetica-Bold').text('RINGKASAN ISU:', innerX, innerY + 50);
        doc
          .font('Helvetica')
          .text(disposition.summary || '-', innerX, innerY + 65, {
            width: 475,
          });

        doc
          .font('Helvetica-Bold')
          .text('REKOMENDASI TINDAKAN:', innerX, innerY + 120);
        doc
          .font('Helvetica')
          .text(disposition.recommendation || '-', innerX, innerY + 135, {
            width: 475,
          });

        // --- Footer / Signatures ---
        doc.moveDown(15);
        const bottomY = 700;
        doc
          .font('Helvetica')
          .text('Bandung, ' + new Date().toLocaleDateString(), 350, bottomY);
        doc.moveDown();
        doc
          .font('Helvetica-Bold')
          .text('Ketua Komisi Aspirasi', 350, bottomY + 20);
        doc.moveDown(4);
        doc
          .font('Helvetica')
          .text('( ____________________ )', 350, bottomY + 80);

        doc.end();
      } catch (err) {
        this.logger.error(
          `Failed to start PDF generation: ${err.message}`,
          err.stack,
        );
        reject(err);
      }
    });
  }
}
