const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const filePath = 'C:\\Users\\User\\.clawdbot\\media\\inbound\\48e266ca-6613-4d14-ab9a-2b38376bf0d8.xlsx';
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const headers = rows[0];
  console.log('Headers:', headers);
  
  // Find column indices
  const codeIdx = headers.indexOf('No');
  const nameIdx = headers.indexOf('상호');
  const salesRepIdx = headers.indexOf('영업담당');
  const deliveryContactIdx = headers.indexOf('배송담당');
  
  console.log(`\nColumn indices: code=${codeIdx}, name=${nameIdx}, salesRep=${salesRepIdx}, deliveryContact=${deliveryContactIdx}`);
  
  let updated = 0;
  let notFound = 0;
  let noData = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = row[codeIdx] ? String(row[codeIdx]).trim() : null;
    const name = row[nameIdx] ? String(row[nameIdx]).trim() : null;
    const salesRepName = row[salesRepIdx] ? String(row[salesRepIdx]).trim() : null;
    const deliveryContact = row[deliveryContactIdx] ? String(row[deliveryContactIdx]).trim() : null;
    
    if (!code) continue;
    
    // Skip if both are empty or just '-'
    const hasSalesRep = salesRepName && salesRepName !== '-' && salesRepName !== '';
    const hasDeliveryContact = deliveryContact && deliveryContact !== '-' && deliveryContact !== '';
    
    if (!hasSalesRep && !hasDeliveryContact) {
      noData++;
      continue;
    }
    
    // Find store by code
    const store = await prisma.store.findFirst({
      where: { code: code }
    });
    
    if (!store) {
      notFound++;
      continue;
    }
    
    // Update store
    const updateData = {};
    if (hasSalesRep) updateData.salesRepName = salesRepName;
    if (hasDeliveryContact) updateData.deliveryContact = deliveryContact;
    
    await prisma.store.update({
      where: { id: store.id },
      data: updateData
    });
    
    updated++;
    if (updated % 50 === 0) {
      console.log(`Updated ${updated} stores...`);
    }
  }
  
  console.log(`\nDone!`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`No data: ${noData}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
