import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/inventory — paginated inventory list ───────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search') || '';

    // Build dynamic where clause
    const where: Record<string, unknown> = { isActive: true };

    if (lowStock) {
      where.stock = { lte: 10 };
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { sku: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { stock: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    const serialized = products.map((p) => ({
      ...p,
      price: p.price.toString(),
      cost: p.cost?.toString() ?? null,
      category: p.category
        ? { ...p.category }
        : null,
    }));

    return Response.json({
      products: serialized,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        total,
      },
    });
  } catch (error) {
    console.error('❌ GET /api/inventory error:', error);
    return Response.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
