import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findOneByNim(nim: string): Promise<User | null> {
    return this.findOne({ nim });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateRoles(userId: string, roleNames: string[]) {
    return this.prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Find role IDs
      const roles = await tx.role.findMany({
        where: { name: { in: roleNames } },
      });

      // Create new roles
      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
        })),
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      });
    });
  }
}
