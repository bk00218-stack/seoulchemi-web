-- 여벌 부분출고 지원: OrderItem에 status, shippedAt 필드 추가
ALTER TABLE "OrderItem" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "OrderItem" ADD COLUMN "shippedAt" TIMESTAMP(3);
CREATE INDEX "OrderItem_status_idx" ON "OrderItem"("status");

-- 이미 출고/배송 완료된 주문의 아이템은 shipped로 backfill
UPDATE "OrderItem" SET "status" = 'shipped', "shippedAt" = o."shippedAt"
FROM "Order" o
WHERE "OrderItem"."orderId" = o.id AND o."status" IN ('shipped', 'delivered');
