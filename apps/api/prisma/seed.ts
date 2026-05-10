import { PrismaClient, AspirationStatus, PriorityLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Roles & Permissions
  const roles = [
    { name: 'MAHASISWA', description: 'Student role' },
    { name: 'KOMISI_ASPIRASI', description: 'Aspiration commission staff' },
    { name: 'KETUA_KOMISI', description: 'Head of aspiration commission' },
    { name: 'KETUA_MPA', description: 'Head of MPA' },
    { name: 'ADMIN', description: 'System administrator' },
    { name: 'EKSEKUTIF_BPH', description: 'HIMAKOM Executive Board' },
    { name: 'KOMISI_PENGAWASAN', description: 'Supervisory commission' },
    { name: 'KOMISI_LEGISLASI', description: 'Legislative commission' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2. Categories
  const categories = [
    { name: 'Fasilitas & Sarana Prasarana', code: 'FASILITAS' },
    { name: 'Akademik & Kurikulum', code: 'AKADEMIK' },
    { name: 'Kesejahteraan Mahasiswa', code: 'KESEJAHTERAAN' },
    { name: 'Organisasi & Kemahasiswaan', code: 'ORGANISASI' },
    { name: 'Etika & Kekerasan', code: 'ETIKA' },
    { name: 'Lainnya', code: 'LAINNYA' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // 3. Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const bphRole = await prisma.role.findUnique({ where: { name: 'EKSEKUTIF_BPH' } });
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@polban.ac.id' },
      update: {},
      create: {
        email: 'admin@polban.ac.id',
        name: 'System Admin',
        passwordHash,
        nim: '000000000',
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });
  }

  if (bphRole) {
    await prisma.user.upsert({
      where: { email: 'bph@polban.ac.id' },
      update: {},
      create: {
        email: 'bph@polban.ac.id',
        name: 'Ketua BPH',
        passwordHash,
        nim: '111111111',
        roles: {
          create: {
            roleId: bphRole.id,
          },
        },
      },
    });
  }

  console.log('Seed data created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
