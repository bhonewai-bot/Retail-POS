import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/orders/[id] — fetch single order ───────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    console.error('❌ GET /api/orders/[id] error:', error);
    return Response.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
