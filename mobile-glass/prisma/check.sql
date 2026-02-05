SELECT 'Brand' as tbl, COUNT(*) as cnt FROM Brand
UNION ALL SELECT 'Product', COUNT(*) FROM Product
UNION ALL SELECT 'Store', COUNT(*) FROM Store
UNION ALL SELECT 'Order', COUNT(*) FROM "Order";
