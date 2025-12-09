import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createInvoiceSchema } from '@/lib/validators/invoice';
import { PrismaError, isPrismaError } from '@/lib/prisma-errors';

// GET /api/invoices - list all invoices
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createInvoiceSchema.parse(body);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: validatedData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    // Foreign key constraint violation (invalid subscriptionId or customerId)
    if (isPrismaError(error) && error.code === PrismaError.ForeignKeyViolation) {
      return NextResponse.json(
        { error: 'Invalid subscription ID or customer ID' },
        { status: 404 }
      );
    }

    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
