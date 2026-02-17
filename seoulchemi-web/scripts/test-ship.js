const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error'] });

async function test() {
  try {
    const testItem = await prisma.orderItem.findFirst({
      where: {
        status: 'pending',
        order: { status: { in: ['pending', 'partial'] }, orderType: 'stock' }
      },
      select: { id: true, orderId: true }
    });
    console.log('Test item:', testItem);
    if (!testItem) { console.log('No pending items'); return; }

    const itemIds = [testItem.id];

    const selectedItems = await prisma.orderItem.findMany({
      where: {
        id: { in: itemIds },
        status: 'pending',
        order: { status: { in: ['pending', 'partial'] }, orderType: 'stock' }
      },
      include: {
        order: { include: { store: true } },
        product: { include: { brand: true } }
      }
    });
    console.log('Selected items count:', selectedItems.length);

    const orderIds = [...new Set(selectedItems.map(item => item.orderId))];

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        store: true,
        items: { select: { id: true, status: true } }
      }
    });
    console.log('Orders count:', orders.length);
    console.log('Order items:', orders[0]?.items?.length);

    try {
      await prisma.$transaction(async (tx) => {
        const order = orders[0];
        const store = order.store;
        const now = new Date();
        const itemsToShip = selectedItems.filter(item => item.orderId === order.id);
        const shippedAmount = itemsToShip.reduce((sum, item) => sum + item.totalPrice, 0);
        console.log('shippedAmount:', shippedAmount);

        await tx.orderItem.updateMany({
          where: { id: { in: itemsToShip.map(i => i.id) } },
          data: { status: 'shipped', shippedAt: now }
        });
        console.log('Step 1 OK: orderItem.updateMany');

        for (const item of itemsToShip) {
          const productOption = await tx.productOption.findFirst({
            where: {
              productId: item.productId,
              sph: item.sph || null,
              cyl: item.cyl || null,
              isActive: true
            }
          });

          let beforeStock = 0, afterStock = 0, productOptionId = null;
          if (productOption) {
            beforeStock = productOption.stock;
            afterStock = Math.max(0, beforeStock - item.quantity);
            productOptionId = productOption.id;
            await tx.productOption.update({ where: { id: productOption.id }, data: { stock: afterStock } });
          }
          console.log('Step 2a OK: stock deduction, option found:', !!productOption);

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              productOptionId: productOptionId,
              type: 'out',
              reason: 'sale',
              quantity: -item.quantity,
              beforeStock, afterStock,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              orderId: order.id,
              orderNo: order.orderNo,
              memo: 'TEST'
            }
          });
          console.log('Step 2b OK: inventoryTransaction.create');
        }

        const shippingNowIds = new Set(itemsToShip.map(i => i.id));
        const allShipped = order.items.every(i => shippingNowIds.has(i.id) || i.status === 'shipped');
        console.log('allShipped:', allShipped);

        await tx.order.update({
          where: { id: order.id },
          data: { status: allShipped ? 'shipped' : 'partial', ...(allShipped ? { shippedAt: now } : {}) }
        });
        console.log('Step 3 OK: order.update');

        await tx.store.update({
          where: { id: order.storeId },
          data: { outstandingAmount: { increment: shippedAmount } }
        });
        console.log('Step 4 OK: store.update');

        await tx.transaction.create({
          data: {
            storeId: order.storeId, type: 'sale', amount: shippedAmount,
            balanceAfter: store.outstandingAmount + shippedAmount,
            orderId: order.id, orderNo: order.orderNo,
            memo: 'TEST', processedBy: 'admin'
          }
        });
        console.log('Step 5 OK: transaction.create');

        await tx.workLog.create({
          data: {
            workType: 'order_ship', targetType: 'order',
            targetId: order.id, targetNo: order.orderNo,
            description: 'TEST', details: '{}',
            userName: 'admin', pcName: 'WEB'
          }
        });
        console.log('Step 6 OK: workLog.create');

        // Rollback
        throw new Error('ROLLBACK_TEST');
      });
    } catch (e) {
      if (e.message === 'ROLLBACK_TEST') {
        console.log('\nAll steps passed! Transaction rolled back.');
      } else {
        console.error('\nTransaction FAILED:', e.message);
        console.error('Code:', e.code);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
