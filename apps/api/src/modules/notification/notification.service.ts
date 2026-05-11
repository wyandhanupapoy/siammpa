import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fonnteToken: string | undefined;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.fonnteToken = this.configService.get<string>('FONNTE_TOKEN');
    
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);

    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
        // Force IPv4 at the socket level — prevents ENETUNREACH on IPv6-disabled containers
        family: 4,
        tls: {
          rejectUnauthorized: false,
          servername: smtpHost,
        },
        // Also force IPv4 in DNS resolution
        dnsOptions: { family: 4, all: false },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        logger: false,
        debug: false,
      } as any);
      this.logger.log(`SMTP transporter configured: ${smtpHost}:${smtpPort} (IPv4 forced)`);
    }
  }

  /**
   * Mengirim pesan WhatsApp via Fonnte
   * Menggunakan mekanisme try-catch agar tidak merusak alur sistem jika gagal
   */
  async sendWhatsApp(target: string, message: string) {
    if (!this.fonnteToken) {
      this.logger.warn('WhatsApp notification skipped: FONNTE_TOKEN not configured.');
      return;
    }

    // Bersihkan nomor (harus diawali 62)
    let formattedPhone = target.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    try {
      await axios.post('https://api.fonnte.com/send', {
        target: formattedPhone,
        message: message,
        countryCode: '62',
      }, {
        headers: {
          Authorization: this.fonnteToken,
        },
      });
      this.logger.log(`WhatsApp sent successfully to ${formattedPhone}`);
    } catch (error: any) {
      // Log error tapi JANGAN throw exception agar sistem utama tidak berhenti
      this.logger.error(`Failed to send WhatsApp to ${formattedPhone}: ${error.response?.data?.reason || error.message}`);
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    // ... (existing implementation)
    if (!this.transporter) {
      this.logger.log(`[DEV MODE] Email to: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"SIAM MPA HIMAKOM" <${this.configService.get<string>('SMTP_FROM')}>`,
        to,
        subject,
        html: body,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }

  async notifyStatusChange(
    email: string,
    code: string,
    status: string,
    note?: string,
    phone?: string, // Tambahkan parameter phone (opsional)
  ) {
    // 1. Kirim Email
    const subject = `[SIAM MPA] Update Aspirasi: ${code}`;
    const body = `...`; // (isi template email sebelumnya)
    await this.sendEmail(email, subject, body);

    // 2. Kirim WhatsApp (Fail-Safe)
    if (phone) {
      const waMessage = 
`🔔 *UPDATE ASPIRASI SIAM MPA*

Halo, aspirasi Anda dengan kode *${code}* telah diperbarui.

*Status Baru:* ${status}
${note ? `\n*Catatan Admin:* \n"${note}"` : ''}

Pantau terus perkembangannya melalui link berikut:
${this.configService.get('FRONTEND_URL')}/aspirasi/tracking/${code}

_Pesan ini dikirim otomatis oleh Sistem Informasi Aspirasi Mahasiswa MPA HIMAKOM POLBAN._`;

      // Dipanggil tanpa await agar tidak memperlambat respon API utama
      this.sendWhatsApp(phone, waMessage);
    }
  }

  async notifyEscalation(code: string, reason: string) {
    const adminEmail = this.configService.get<string>(
      'ADMIN_NOTIFICATION_EMAIL',
      'admin@polban.ac.id',
    );
    await this.sendEmail(adminEmail, `🚨 [ESKALASI] ${code}`, reason);
  }

  async notifySatisfactionSurvey(email: string, code: string, phone?: string) {
    const surveyUrl = `${this.configService.get('FRONTEND_URL')}/kuesioner/survei/${code}`;
    
    // 1. Kirim Email
    // ... (existing email logic)

    // 2. Kirim WhatsApp
    if (phone) {
      const waMessage = 
`✅ *ASPIRASI SELESAI*

Aspirasi Anda (*${code}*) telah dinyatakan *SELESAI*.

Mohon luangkan waktu 1 menit untuk mengisi kuesioner kepuasan (KSR-E) guna membantu kami meningkatkan kualitas layanan:

🔗 ${surveyUrl}

Terima kasih atas partisipasi Anda!
— Komisi Aspirasi MPA`;

      this.sendWhatsApp(phone, waMessage);
    }
  }

  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

