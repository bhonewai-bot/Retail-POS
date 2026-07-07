import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';

// ─── Prisma Client ──────────────────────────────────────────
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Seed Demo Users ────────────────────────────────────────
async function seed() {
  console.log('Seeding auth users...\n');

  const managerHash = await hashPassword('demo1234');
  const cashierHash = await hashPassword('demo1234');

  // Manager user (admin@demo.com)
  const manager = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'manager',
      isActive: true,
    },
    update: {},
    include: { accounts: true },
  });

  const hasManagerCredential = manager.accounts.some(
    (a) => a.providerId === 'credential'
  );
  if (!hasManagerCredential) {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: manager.id.toString(),
        providerId: 'credential',
        userId: manager.id,
        password: managerHash,
      },
    });
  }
  console.log('Created/updated: admin@demo.com (role: manager)');

  // Cashier user (cashier@demo.com)
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@demo.com' },
    create: {
      name: 'Cashier User',
      email: 'cashier@demo.com',
      role: 'cashier',
      isActive: true,
    },
    update: {},
    include: { accounts: true },
  });

  const hasCashierCredential = cashier.accounts.some(
    (a) => a.providerId === 'credential'
  );
  if (!hasCashierCredential) {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: cashier.id.toString(),
        providerId: 'credential',
        userId: cashier.id,
        password: cashierHash,
      },
    });
  }
  console.log('Created/updated: cashier@demo.com (role: cashier)');

  console.log('\nBoth passwords: demo1234');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
