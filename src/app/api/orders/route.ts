import { type NextRequest } from 'next/server';
import { Prisma } from '../../../generated/prisma/client';
import prisma from '@/lib/prisma';

// ─── POST /api/orders — create an order ──────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, subtotal, tax, total, paymentMethod } = body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Items are required' }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'number' || !Number.isInteger(item.productId) || item.productId <= 0) {
        return Response.json({ error: 'Invalid item data' }, { status: 400 });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return Response.json({ error: 'Invalid item data' }, { status: 400 });
      }
      if (item.price === undefined || typeof item.price !== 'number' || item.price <= 0) {
        return Response.json({ error: 'Invalid item data' }, { status: 400 });
      }
    }

    // Validate totals
    if (subtotal === undefined || typeof subtotal !== 'number' || subtotal < 0) {
      return Response.json({ error: 'Invalid totals' }, { status: 400 });
    }
    if (tax === undefined || typeof tax !== 'number' || tax < 0) {
      return Response.json({ error: 'Invalid totals' }, { status: 400 });
    }
    if (total === undefined || typeof total !== 'number' || total < 0) {
      return Response.json({ error: 'Invalid totals' }, { status: 400 });
    }

    // Validate paymentMethod
    if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim() === '') {
      return Response.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Get unique product IDs
    const productIds = [...new Set(items.map((item: { productId: number }) => item.productId))];

    // Generate order number: ORD-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomNum}`;

    // Atomic: lock rows, validate stock, create order + items + decrement stock
    const order = await prisma.$transaction(async (tx) => {
      // Lock product rows with SELECT ... FOR UPDATE to prevent concurrent overselling
      const lockedProducts = await tx.$queryRaw<{ id: number; stock: number; name: string }[]>`
        SELECT id, stock, name FROM "Product"
        WHERE id IN (${Prisma.join(productIds)})
        FOR UPDATE
      `;

      const lockedMap = new Map(lockedProducts.map((p) => [p.id, p]));

      // Check stock from locked data (inside transaction)
      for (const item of items) {
        const product = lockedMap.get(item.productId);
        if (!product) {
          throw new Error(`Product not found (ID: ${item.productId})`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          tax,
          total,
          paymentMethod: paymentMethod.trim(),
          status: 'completed',
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map((item: { productId: number; quantity: number; price: number }) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
      });

      // Decrement stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Return order with items and product details
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });
    });

    return Response.json(order, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/orders error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    if (message.includes('Insufficient stock') || message.includes('Product not found')) {
      return Response.json({ error: message }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// ─── GET /api/orders — list orders ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const paymentMethodParam = searchParams.get('paymentMethod');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Build dynamic where clause
    const where: Record<string, unknown> = {};
    if (paymentMethodParam) {
      where.paymentMethod = paymentMethodParam;
    }
    if (startDateParam) {
      where.createdAt = { ...(where.createdAt as object), gte: new Date(startDateParam) };
    }
    if (endDateParam) {
      where.createdAt = { ...(where.createdAt as object), lte: new Date(endDateParam) };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return Response.json({
      orders,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        total,
      },
    });
  } catch (error) {
    console.error('❌ GET /api/orders error:', error);
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
