import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/products — paginated product list ─────────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count(),
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
    console.error('❌ GET /api/products error:', error);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// ─── POST /api/products — create a product ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, price, cost, categoryId, description, stock, lowStockThreshold, barcode, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return Response.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (price === undefined || typeof price !== 'number' || price <= 0) {
      return Response.json({ error: 'Price must be a positive number' }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existing) {
      return Response.json({ error: 'SKU already exists' }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        price,
        cost: cost ?? null,
        categoryId: categoryId ?? null,
        description: description ?? null,
        stock: stock ?? 0,
        lowStockThreshold: lowStockThreshold ?? 10,
        barcode: barcode ?? null,
        isActive: isActive ?? true,
      },
      include: { category: true },
    });

    return Response.json({
      ...product,
      price: product.price.toString(),
      cost: product.cost?.toString() ?? null,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/products error:', error);
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
