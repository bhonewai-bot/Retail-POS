import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

const VALID_TYPES = ['stock-receipt', 'damage', 'count-adjustment', 'return', 'other'] as const;

// ─── POST /api/inventory/adjustments — create an adjustment ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, type, quantity, reason } = body;

    // Validate productId
    if (!productId || typeof productId !== 'number' || !Number.isInteger(productId) || productId <= 0) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate type
    if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return Response.json({ error: 'Invalid adjustment type' }, { status: 400 });
    }

    // Validate quantity
    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity === 0) {
      return Response.json({ error: 'Quantity must be a non-zero integer' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check stock won't go negative
    const newStock = product.stock + quantity;
    if (newStock < 0) {
      return Response.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Get the first manager user as the adjustment author
    const managerUser = await prisma.user.findFirst({ where: { role: 'manager' } });
    if (!managerUser) {
      return Response.json({ error: 'No manager user found' }, { status: 500 });
    }

    // Atomic: create adjustment + update stock
    const [adjustment] = await prisma.$transaction([
      prisma.inventoryAdjustment.create({
        data: {
          type,
          quantity,
          reason: reason ? String(reason).trim() : null,
          productId,
          userId: managerUser.id,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
    ]);

    return Response.json(adjustment, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/inventory/adjustments error:', error);
    return Response.json({ error: 'Failed to create adjustment' }, { status: 500 });
  }
}

// ─── GET /api/inventory/adjustments — list adjustment history ─
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const productIdParam = searchParams.get('productId');
    const typeParam = searchParams.get('type');

    // Build dynamic where clause
    const where: Record<string, unknown> = {};
    if (productIdParam) {
      const pid = parseInt(productIdParam, 10);
      if (Number.isInteger(pid) && pid > 0) {
        where.productId = pid;
      }
    }
    if (typeParam && VALID_TYPES.includes(typeParam as typeof VALID_TYPES[number])) {
      where.type = typeParam;
    }

    const [adjustments, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryAdjustment.count({ where }),
    ]);

    return Response.json({
      adjustments,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        total,
      },
    });
  } catch (error) {
    console.error('❌ GET /api/inventory/adjustments error:', error);
    return Response.json({ error: 'Failed to fetch adjustments' }, { status: 500 });
  }
}
