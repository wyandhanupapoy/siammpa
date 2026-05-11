import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async register(data: any) {
    if (!data.email.endsWith('@polban.ac.id')) {
      throw new BadRequestException(
        'Hanya email @polban.ac.id yang diperbolehkan',
      );
    }

    const existing = await this.userService.findOneByEmail(data.email);
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    try {
      await this.prisma.pendingUser.upsert({
        where: { email: data.email },
        update: {
          name: data.name,
          nim: data.nim,
          phone: data.phone,
          passwordHash,
          verificationCode,
          expiresAt,
        },
        create: {
          email: data.email,
          name: data.name,
          nim: data.nim,
          phone: data.phone,
          passwordHash,
          verificationCode,
          expiresAt,
        },
      });

      // Send email in background (don't await)
      this.notificationService.sendEmail(
        data.email,
        '[SIAM MPA] Kode Verifikasi Registrasi',
        `Halo ${data.name},<br/><br/>Kode verifikasi Anda adalah: <strong>${verificationCode}</strong><br/><br/>Silakan masukkan kode ini untuk mengaktifkan akun Anda. Kode ini berlaku selama 24 jam.`,
      ).catch(err => console.error('Background Email Error:', err));

      return {
        message: 'Registrasi berhasil, silakan cek email untuk kode verifikasi',
      };
    } catch (error) {
      console.error('Registration Error Details:', error);
      throw new BadRequestException(
        `Gagal melakukan registrasi: ${error.message || 'Terjadi kesalahan sistem'}`,
      );
    }
  }

  async verifyEmail(email: string, code: string) {
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email },
    });

    if (!pendingUser || pendingUser.verificationCode !== code) {
      throw new BadRequestException('Kode verifikasi tidak valid');
    }

    if (new Date() > pendingUser.expiresAt) {
      await this.prisma.pendingUser.delete({ where: { email } });
      throw new BadRequestException(
        'Kode verifikasi sudah kadaluwarsa. Silakan registrasi ulang.',
      );
    }

    const studentRole = await this.prisma.role.findUnique({
      where: { name: 'MAHASISWA' },
    });

    if (!studentRole) {
      throw new Error('Role MAHASISWA not found in system');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: pendingUser.email,
          name: pendingUser.name,
          nim: pendingUser.nim,
          phone: pendingUser.phone,
          passwordHash: pendingUser.passwordHash,
          isActive: true,
          isEmailVerified: true,
          roles: {
            create: [{ roleId: studentRole.id }],
          },
        },
      });

      await tx.pendingUser.delete({
        where: { email },
      });

      return { message: 'Email berhasil diverifikasi, akun Anda kini aktif' };
    });
  }

  async resendVerificationCode(email: string) {
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email },
    });

    if (!pendingUser) {
      const user = await this.userService.findOneByEmail(email);
      if (user) {
        throw new BadRequestException('Email sudah terverifikasi');
      }
      throw new BadRequestException('Email tidak terdaftar');
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.pendingUser.update({
      where: { email },
      data: { verificationCode, expiresAt },
    });

    // Send email in background
    this.notificationService.sendEmail(
      email,
      '[SIAM MPA] Kode Verifikasi Baru',
      `Halo ${pendingUser.name},<br/><br/>Kode verifikasi baru Anda adalah: <strong>${verificationCode}</strong><br/><br/>Silakan masukkan kode ini untuk mengaktifkan akun Anda.`,
    ).catch(err => console.error('Background Resend Email Error:', err));

    return { message: 'Kode verifikasi baru telah dikirim' };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    // Check if identifier is email or NIM
    let user;
    if (identifier.includes('@')) {
      user = await this.userService.findOneByEmail(identifier);
    } else {
      user = await this.userService.findOneByNim(identifier);
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles.map((ur) => ur.role.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nim: user.nim,
        roles: payload.roles,
      },
    };
  }
}
