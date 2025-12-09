import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSubscriptionSchema } from '@/lib/validators/subscription';
import { PrismaError, isPrismaError } from '@/lib/prisma-errors';

// GET /api/subscriptions - list all subscriptions
export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingInterval: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - create a new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createSubscriptionSchema.parse(body);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: validatedData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingInterval: true,
          },
        },
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    // Foreign key constraint violation (invalid customerId or planId)
    if (isPrismaError(error) && error.code === PrismaError.ForeignKeyViolation) {
      return NextResponse.json(
        { error: 'Invalid customer ID or plan ID' },
        { status: 404 }
      );
    }

    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
