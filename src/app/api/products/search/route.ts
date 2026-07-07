import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/products/search?q=term ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q');

    if (!q || q.trim() === '') {
      return Response.json({ error: 'Search query required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q.trim(), mode: 'insensitive' } },
          { sku: { contains: q.trim(), mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      orderBy: { name: 'asc' },
      take: 50,
    });

    const serialized = products.map((p) => ({
      ...p,
      price: p.price.toString(),
      cost: p.cost?.toString() ?? null,
      category: p.category ?? null,
    }));

    return Response.json({ products: serialized });
  } catch (error) {
    console.error('❌ GET /api/products/search error:', error);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
