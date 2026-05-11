import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly fonnteToken: string | undefined;
  private readonly brevoApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.fonnteToken = this.configService.get<string>('FONNTE_TOKEN');
    if (this.fonnteToken) {
      this.logger.log(`Fonnte Token loaded: ${this.fonnteToken.substring(0, 4)}***`);
    } else {
      this.logger.warn('Fonnte Token NOT found in configuration');
    }
    
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY');

    if (this.brevoApiKey) {
      this.logger.log('Brevo REST API initialized for email delivery (bypassing strict SMTP limitations).');
    } else {
      this.logger.warn('BREVO_API_KEY not found. Email notifications will be skipped or mocked.');
    }
  }

  async sendWhatsApp(target: string, message: string) {
    if (!this.fonnteToken) {
      this.logger.warn(
        'WhatsApp notification skipped: FONNTE_TOKEN not configured.',
      );
      return;
    }

    if (!target) {
      this.logger.warn(
        'WhatsApp notification skipped: Target phone number is empty.',
      );
      return;
    }

    // Bersihkan nomor
    let formattedPhone = target.replace(/[^0-9]/g, '');

    // Konversi format 08... ke 628...
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('8')) {
      formattedPhone = '62' + formattedPhone;
    }

    this.logger.log(`Attempting to send WhatsApp to ${formattedPhone}...`);
    this.logger.debug(`WhatsApp Payload: ${JSON.stringify({ target: formattedPhone, message: message.substring(0, 20) + '...' })}`);

    try {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        {
          target: formattedPhone,
          message: message,
          countryCode: '62',
        },
        {
          headers: {
            Authorization: this.fonnteToken.trim(),
          },
          timeout: 10000,
        },
      );

      if (response.data.status === true) {
        this.logger.log(
          `WhatsApp sent successfully to ${formattedPhone}. ID: ${response.data.id || 'N/A'}`,
        );
      } else {
        this.logger.error(
          `Fonnte rejected message to ${formattedPhone}: ${response.data.reason || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      const errorDetail =
        error.response?.data?.reason ||
        error.response?.data?.message ||
        error.message;
      this.logger.error(
        `Failed to send WhatsApp to ${formattedPhone}: ${errorDetail}`,
      );
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    if (!this.brevoApiKey) {
      this.logger.log(`[DEV MODE] Email to: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@siammpa.com';
      const fromName = 'SIAM MPA HIMAKOM';

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: body,
        },
        {
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Email sent successfully via Brevo to ${to} (MessageId: ${response.data?.messageId})`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      this.logger.error(`Failed to send email to ${to} via Brevo: ${errorMsg}`);
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

