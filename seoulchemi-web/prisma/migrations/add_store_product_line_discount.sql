-- 품목별 할인율 테이블 추가
-- Migration: add_store_product_line_discount
-- Date: 2026-02-15

CREATE TABLE IF NOT EXISTS "StoreProductLineDiscount" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productLineId" INTEGER NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProductLineDiscount_pkey" PRIMARY KEY ("id")
);

-- 유니크 제약조건 (거래처당 품목별 하나의 할인율만)
CREATE UNIQUE INDEX "StoreProductLineDiscount_storeId_productLineId_key" ON "StoreProductLineDiscount"("storeId", "productLineId");

-- 인덱스
CREATE INDEX "StoreProductLineDiscount_storeId_idx" ON "StoreProductLineDiscount"("storeId");
CREATE INDEX "StoreProductLineDiscount_productLineId_idx" ON "StoreProductLineDiscount"("productLineId");

-- 외래키 제약조건
ALTER TABLE "StoreProductLineDiscount" ADD CONSTRAINT "StoreProductLineDiscount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreProductLineDiscount" ADD CONSTRAINT "StoreProductLineDiscount_productLineId_fkey" FOREIGN KEY ("productLineId") REFERENCES "ProductLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
