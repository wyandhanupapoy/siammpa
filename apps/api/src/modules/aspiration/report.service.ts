import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async exportSemesterReport(res: Response) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Aspirasi');

    // Styling
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Judul', key: 'title', width: 30 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Pelapor', key: 'user', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Prioritas', key: 'priority', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    const aspirations = await this.prisma.aspiration.findMany({
      include: {
        category: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    aspirations.forEach((asp, index) => {
      sheet.addRow({
        no: index + 1,
        code: asp.aspirationCode,
        date: asp.createdAt.toLocaleDateString(),
        title: asp.title,
        category: asp.category.name,
        user: asp.isAnonymous ? 'Anonim' : asp.user.name,
        status: asp.status,
        priority: asp.priorityLevel || '-',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `Laporan-SIAM-MPA-${Date.now()}.xlsx`,
    );

    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  }
}
