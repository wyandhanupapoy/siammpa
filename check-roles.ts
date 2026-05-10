import { PrismaClient } from '@prisma/client';
async function main() {
  const prisma = new PrismaClient();
  const roles = await prisma.role.findMany();
  console.log(roles);
  await prisma.$disconnect();
}
main().catch(console.error);
