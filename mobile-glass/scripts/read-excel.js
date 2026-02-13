const XLSX = require('xlsx');

const filePath = process.argv[2] || 'C:\\Users\\User\\.clawdbot\\media\\inbound\\48e266ca-6613-4d14-ab9a-2b38376bf0d8.xlsx';

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get headers (first row)
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Sheet:', sheetName);
console.log('Total rows:', data.length);
console.log('\nHeaders:');
console.log(data[0]);
console.log('\nFirst 3 data rows:');
for (let i = 1; i <= 3 && i < data.length; i++) {
  console.log(data[i]);
}
