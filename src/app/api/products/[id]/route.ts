import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/products/:id — single product ─────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({
      ...product,
      price: product.price.toString(),
      cost: product.cost?.toString() ?? null,
    });
  } catch (error) {
    console.error('❌ GET /api/products/[id] error:', error);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// ─── PUT /api/products/:id — update product ─────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const productId = Number(id);

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check SKU uniqueness if changed
    if (sku.trim() !== existing.sku) {
      const skuTaken = await prisma.product.findFirst({
        where: { sku: sku.trim(), NOT: { id: productId } },
      });
      if (skuTaken) {
        return Response.json({ error: 'SKU already exists' }, { status: 409 });
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        sku: sku.trim(),
        price,
        cost: cost ?? null,
        categoryId: categoryId ?? null,
        description: description ?? null,
        stock: stock ?? existing.stock,
        lowStockThreshold: lowStockThreshold ?? existing.lowStockThreshold,
        barcode: barcode ?? null,
        isActive: isActive ?? existing.isActive,
      },
      include: { category: true },
    });

    return Response.json({
      ...product,
      price: product.price.toString(),
      cost: product.cost?.toString() ?? null,
    });
  } catch (error) {
    console.error('❌ PUT /api/products/[id] error:', error);
    return Response.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// ─── DELETE /api/products/:id — soft delete ─────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return Response.json({
      message: 'Product deactivated',
      product: {
        ...product,
        price: product.price.toString(),
        cost: product.cost?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error('❌ DELETE /api/products/[id] error:', error);
    return Response.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
