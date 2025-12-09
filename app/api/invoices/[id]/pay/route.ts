import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payInvoiceSchema } from '@/lib/validators/invoice';
import { PrismaError, isPrismaError } from '@/lib/prisma-errors';

// POST /api/invoices/[id]/pay - mark invoice as paid (simulate payment)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get current invoice to check status
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { status: true },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Prevent paying already paid invoices
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 409 }
      );
    }

    // Parse optional body (paidAt date can be provided, defaults to now)
    const body = await request.json().catch(() => ({}));
    const validatedData = payInvoiceSchema.parse(body);

    // Mark invoice as paid
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: validatedData.paidAt,
      },
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

    return NextResponse.json({
      message: 'Invoice marked as paid successfully',
      invoice,
    });
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
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.error('Error marking invoice as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark invoice as paid' },
      { status: 500 }
    );
  }
}
