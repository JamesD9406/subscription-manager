import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSubscriptionSchema, cancelSubscriptionSchema } from '@/lib/validators/subscription';
import { PrismaError, isPrismaError } from '@/lib/prisma-errors';

// GET /api/subscriptions/[id] - get a single subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = parseInt(params.id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// PATCH /api/subscriptions/[id] - update a subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = parseInt(params.id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateSubscriptionSchema.parse(body);

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
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

    return NextResponse.json(subscription);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    // Prisma record not found
    if (isPrismaError(error) && error.code === PrismaError.RecordNotFound) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - cancel/delete a subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = parseInt(params.id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    // Parse optional query parameters or body for cancellation options
    const url = new URL(request.url);
    const cancelAtPeriodEnd = url.searchParams.get('cancelAtPeriodEnd') === 'true';

    if (cancelAtPeriodEnd) {
      // Schedule cancellation at period end
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          status: 'ACTIVE', // Keep active until period ends
        },
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
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Subscription will be cancelled at period end',
        subscription,
      });
    } else {
      // Immediate cancellation
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
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
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Subscription cancelled immediately',
        subscription,
      });
    }
  } catch (error) {
    // Prisma record not found
    if (isPrismaError(error) && error.code === PrismaError.RecordNotFound) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
