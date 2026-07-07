import prisma from '@/lib/prisma';

// ─── GET /api/categories — all categories ───────────────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error('❌ GET /api/categories error:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
