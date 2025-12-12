import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Plans
  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter Plan',
      description: 'Perfect for individuals',
      price: 999,
      billingInterval: 'MONTHLY',
      trialPeriodDays: 14,
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro Plan',
      description: 'For growing businesses',
      price: 9999,
      billingInterval: 'YEARLY',
      trialPeriodDays: 30,
      isActive: true,
    },
  });

  console.log('✓ Created plans');

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'ACTIVE',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'TRIALING',
    },
  });

  console.log('✓ Created customers');

  // Create Subscriptions
  const subscription1 = await prisma.subscription.create({
    data: {
      customerId: customer1.id,
      planId: starterPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    },
  });

  const subscription2 = await prisma.subscription.create({
    data: {
      customerId: customer2.id,
      planId: proPlan.id,
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      cancelAtPeriodEnd: false,
    },
  });

  console.log('✓ Created subscriptions');

  // Create Invoices
  await prisma.invoice.create({
    data: {
      customerId: customer1.id,
      subscriptionId: subscription1.id,
      amount: 999,
      status: 'PAID',
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      lineItems: [
        {
          description: 'Starter Plan - Monthly',
          quantity: 1,
          unitPrice: 999,
          total: 999,
        },
      ],
    },
  });

  await prisma.invoice.create({
    data: {
      customerId: customer2.id,
      subscriptionId: subscription2.id,
      amount: 9999,
      status: 'OPEN',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      lineItems: [
        {
          description: 'Pro Plan - Yearly',
          quantity: 1,
          unitPrice: 9999,
          total: 9999,
        },
      ],
    },
  });

  console.log('✓ Created invoices');
  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });