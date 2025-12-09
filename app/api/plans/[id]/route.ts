import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePlanSchema } from '@/lib/validators/plan';
import { PrismaError, isPrismaError } from '@/lib/prisma-errors';

// GET /api/plans/[id] - get a single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        subscriptions: {
          include: {
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

// PATCH /api/plans/[id] - update a plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updatePlanSchema.parse(body);

    // Update plan
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: validatedData,
    });

    return NextResponse.json(plan);
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
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Prisma unique constraint violation (duplicate plan name)
    if (isPrismaError(error) && error.code === PrismaError.UniqueConstraintViolation) {
      return NextResponse.json(
        { error: 'A plan with this name already exists' },
        { status: 409 }
      );
    }

    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - delete a plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Check if plan has active subscriptions
    const subscriptionCount = await prisma.subscription.count({
      where: {
        planId: planId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (subscriptionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active subscriptions. Set plan to inactive instead.' },
        { status: 409 }
      );
    }

    await prisma.plan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    // Prisma record not found
    if (isPrismaError(error) && error.code === PrismaError.RecordNotFound) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}