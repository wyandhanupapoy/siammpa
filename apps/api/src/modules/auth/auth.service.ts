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

    const studentRole = await this.prisma.role.findUnique({
      where: { name: 'MAHASISWA' },
    });

    if (!studentRole) {
      throw new Error('Role MAHASISWA not found in system');
    }

    const user = await this.userService.create({
      email: data.email,
      name: data.name,
      nim: data.nim,
      phone: data.phone,
      passwordHash,
      verificationCode,
      isActive: false, // Inactive until verified
      roles: {
        create: [{ roleId: studentRole.id }],
      },
    });

    // Send email
    await this.notificationService.sendEmail(
      user.email,
      '[SIAM MPA] Kode Verifikasi Registrasi',
      `Halo ${user.name},<br/><br/>Kode verifikasi Anda adalah: <strong>${verificationCode}</strong><br/><br/>Silakan masukkan kode ini untuk mengaktifkan akun Anda.`,
    );

    return {
      message: 'Registrasi berhasil, silakan cek email untuk kode verifikasi',
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user || user.verificationCode !== code) {
      throw new BadRequestException('Kode verifikasi tidak valid');
    }

    await this.userService.update({
      where: { id: user.id },
      data: {
        isActive: true,
        isEmailVerified: true,
        verificationCode: null,
      },
    });

    return { message: 'Email berhasil diverifikasi, akun Anda kini aktif' };
  }

  async resendVerificationCode(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Email tidak terdaftar');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.userService.update({
      where: { id: user.id },
      data: { verificationCode },
    });

    await this.notificationService.sendEmail(
      user.email,
      '[SIAM MPA] Kode Verifikasi Baru',
      `Halo ${user.name},<br/><br/>Kode verifikasi baru Anda adalah: <strong>${verificationCode}</strong><br/><br/>Silakan masukkan kode ini untuk mengaktifkan akun Anda.`,
    );

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
