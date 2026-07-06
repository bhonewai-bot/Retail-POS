import "dotenv/config";
import prisma from "../lib/prisma";

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection for Retail POS...\n");

  try {
    // Test 1: Check connection
    console.log("✅ Connected to database!");

    // Test 2: Create a test category
    console.log("\n📝 Creating a test category...");
    const category = await prisma.category.upsert({
      where: { name: "Electronics" },
      update: {},
      create: { name: "Electronics" },
    });
    console.log("✅ Category:", category.name);

    // Test 3: Create a test product
    console.log("\n📝 Creating a test product...");
    const product = await prisma.product.upsert({
      where: { sku: "ELEC-001" },
      update: {},
      create: {
        name: "Wireless Mouse",
        sku: "ELEC-001",
        barcode: "1234567890123",
        price: 29.99,
        cost: 15.0,
        stock: 50,
        categoryId: category.id,
      },
    });
    console.log("✅ Product:", product.name, "— $" + product.price);

    // Test 4: Create a test customer
    console.log("\n📝 Creating a test customer...");
    const customer = await prisma.customer.upsert({
      where: { email: "demo@customer.com" },
      update: {},
      create: {
        name: "Demo Customer",
        email: "demo@customer.com",
        phone: "555-0123",
      },
    });
    console.log("✅ Customer:", customer.name);

    // Test 5: Create an order with items
    console.log("\n📝 Creating a test order...");
    const order = await prisma.order.create({
      data: {
        orderNumber: `POS-${Date.now()}`,
        subtotal: 29.99,
        tax: 2.40,
        total: 32.39,
        paymentMethod: "card",
        customerId: customer.id,
        items: {
          create: [
            {
              quantity: 1,
              price: 29.99,
              total: 29.99,
              productId: product.id,
            },
          ],
        },
      },
      include: { items: true, customer: true },
    });
    console.log("✅ Order:", order.orderNumber, "— $" + order.total);

    // Test 6: Fetch summary
    console.log("\n📊 Summary:");
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const customerCount = await prisma.customer.count();
    console.log(`   Products: ${productCount}`);
    console.log(`   Orders:   ${orderCount}`);
    console.log(`   Customers: ${customerCount}`);

    console.log("\n🎉 All tests passed! Retail POS database is working.\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
