import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCustomerSchema } from '@/lib/validators/customer'

// GET /api/customers - list all customers
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the input
    const validatedData = createCustomerSchema.parse(body)

    // Now create
    const customer = await prisma.customer.create({
      data: validatedData,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

