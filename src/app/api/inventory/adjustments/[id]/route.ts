import prisma from '@/lib/prisma';

// ─── GET /api/inventory/adjustments/[id] — single adjustment detail ─
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Invalid adjustment ID' }, { status: 400 });
    }

    const adjustment = await prisma.inventoryAdjustment.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true, stock: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!adjustment) {
      return Response.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    return Response.json(adjustment);
  } catch (error) {
    console.error('❌ GET /api/inventory/adjustments/[id] error:', error);
    return Response.json({ error: 'Failed to fetch adjustment' }, { status: 500 });
  }
}
