import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { UpdatePatientDTO } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        email: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async list(query: ListPatientsDto) {
    const where: any = {};

    // Kiritilgan q qidiruvi
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // Gender filteri
    if (query.gender) {
      where.gender = query.gender;
    }

    // Tartib
    const orderBy =
      query.sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const }; // yangi yozilganlarni oxirgi bo'lib ko'rsatish uchun

    // Prisma tranzaksiyasi orqali ma'lumotlarni olish
    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy,
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          email: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      total,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      items,
    };
  }

  async getOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        email: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDTO) {
    const exists = await this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Patient not found');
    return this.prisma.patient.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        email: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Patient not found');
    await this.prisma.patient.delete({ where: { id } });
    return { message: 'Patient deleted' };
  }
}
