import { PrismaClient, LoanStatus } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

function getRelativeDate(daysOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  // Set to midnight UTC for clean date
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert demo user
  const demoPhone = '+919876543210';
  const user = await prisma.user.upsert({
    where: { phone: demoPhone },
    update: { name: 'Rahul Sharma' },
    create: {
      phone: demoPhone,
      name: 'Rahul Sharma',
    },
  });

  console.log(`👤 Demo User ready: ${user.name} (${user.phone}) [ID: ${user.id}]`);

  // Clean existing loans for demo user to make seed idempotent
  await prisma.receipt.deleteMany({ where: { loan: { userId: user.id } } });
  await prisma.loan.deleteMany({ where: { userId: user.id } });

  const loansData = [
    {
      friendName: 'Amit Verma',
      amountPaise: 500_000, // ₹5,000
      dueDate: getRelativeDate(-10),
      note: 'Dinner & concert tickets',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Pooja Singh',
      amountPaise: 1_250_000, // ₹12,500
      dueDate: getRelativeDate(-5),
      note: 'Flight booking split',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Vikram Malhotra',
      amountPaise: 200_000, // ₹2,000
      dueDate: getRelativeDate(-2),
      note: 'Weekly groceries',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Sneha Patel',
      amountPaise: 750_000, // ₹7,500
      dueDate: getRelativeDate(0), // Due today! Not overdue
      note: 'Weekend getaway Airbnb share',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Rohan Gupta',
      amountPaise: 1_500_000, // ₹15,000
      dueDate: getRelativeDate(7),
      note: 'Laptop repair advance',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Ananya Iyer',
      amountPaise: 300_000, // ₹3,000
      dueDate: getRelativeDate(15),
      note: 'Gym group discount',
      status: LoanStatus.PENDING,
    },
    {
      friendName: 'Karan Mehta',
      amountPaise: 1_000_000, // ₹10,000
      dueDate: getRelativeDate(-20),
      note: 'Festival shopping',
      status: LoanStatus.REPAID,
      repaidAt: getRelativeDate(-5),
    },
    {
      friendName: 'Neha Joshi',
      amountPaise: 450_000, // ₹4,500
      dueDate: getRelativeDate(5),
      note: 'Coworking day pass',
      status: LoanStatus.REPAID,
      repaidAt: new Date(),
    },
  ];

  for (const loan of loansData) {
    await prisma.loan.create({
      data: {
        userId: user.id,
        friendName: loan.friendName,
        amountPaise: loan.amountPaise,
        currency: 'INR',
        dueDate: loan.dueDate,
        note: loan.note,
        status: loan.status,
        repaidAt: loan.repaidAt,
      },
    });
  }

  const count = await prisma.loan.count({ where: { userId: user.id } });
  console.log(`✅ Seeded ${count} loans for demo user.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
