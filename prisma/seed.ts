import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  const adminPass = await bcrypt.hash('admin123', saltRounds);
  const docPass = await bcrypt.hash('doctor123', saltRounds);
  const recPass = await bcrypt.hash('reception123', saltRounds);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@pc.local' },
    update: {},
    create: {
      email: 'admin@pc.local',
      passwordHash: adminPass,
      role: Role.admin,
      firstname: 'System',
      lastname: 'Admin',
    },
  });

  // Doctor
  await prisma.user.upsert({
    where: { email: 'doctor@pc.local' },
    update: {},
    create: {
      email: 'doctor@pc.local',
      passwordHash: docPass,
      role: Role.doctor,
      firstname: 'Alice',
      lastname: 'Doctor',
    },
  });

  // Reception
  await prisma.user.upsert({
    where: { email: 'reception@pc.local' },
    update: {},
    create: {
      email: 'reception@pc.local',
      passwordHash: recPass,
      role: Role.reception,
      firstname: 'Bob',
      lastname: 'Reception',
    },
  });

  console.log('Seed done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
