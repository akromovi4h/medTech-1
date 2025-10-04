import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './users-dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ListUsersDto } from './users-dto/list-users.dto';
import { contains } from 'class-validator';
import { UpdateRoleDto } from './users-dto/update-role.dto';
import { UpdateStatusDto } from './users-dto/update-status.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createByAdmin(createUserDto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (exists) throw new BadRequestException('Email already in use');
    const passwordHash = await bcrypt.hash(createUserDto.temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        firstname: createUserDto.firstName,
        lastname: createUserDto.lastName,
        role: createUserDto.role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return user;
  }
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
  async list(query: ListUsersDto) {
    const where: any = {};
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { firstname: { contains: query.q, mode: 'insensitive' } },
        { lastname: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      total,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      items,
    };
  }

  async updateRole(updateRoleDto: UpdateRoleDto, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin' && updateRoleDto.role !== 'admin') {
      const admins = await this.prisma.user.count({
        where: { role: 'admin', isActive: true },
      });
      if (admins <= 1)
        throw new BadRequestException('At least one active admin must remain');
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: updateRoleDto.role },
      select: { id: true, email: true, role: true },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: updateStatusDto.isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
  async remove(id: string, requestId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (id === requestId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('At least one active admin must remain');
    }
    if (user.role === 'doctor') {
      const [appts, recs] = await this.prisma.$transaction([
        this.prisma.appointment.count({ where: { doctorId: id } }),
        this.prisma.medicalRecord.count({ where: { authorId: id } }),
      ]);
      if (appts > 0 || recs > 0) {
        throw new BadRequestException(
          'Doctor has related appointments/records. Reassign or archive before deletion.',
        );
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }
  async getUser(id: string){
    return this.prisma.user.findUnique({
      where: {id},
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
  }
}
