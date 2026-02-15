const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 엑셀 파일 읽기
const workbook = XLSX.readFile(path.join(__dirname, '../data/stores.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// JSON으로 변환
const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('총 레코드:', rawData.length);
console.log('컬럼:', Object.keys(rawData[0] || {}));

// 데이터 정리
const stores = rawData.map((row, index) => {
  // 컬럼명 매핑 (한글 → 영문)
  return {
    id: index + 1,
    optNo: row['OPT_NO'] || '',
    name: row['가맹점명'] || '',
    businessNumber: row['사업자번호'] || '',
    owner: row['대표자'] || '',
    ownerTel: row['대표자TEL'] || '',
    contactTel: row['연락처TEL'] || '',
    fax: row['연락처FAX'] || '',
    email: row['이메일'] || '',
    address: row['주소'] || '',
    addressDetail: row['상세주소'] || '',
    zipCode: row['우편번호'] || '',
    memo: row['메모'] || '',
    status: row['상태'] || '',
    createdAt: row['최초생성일자'] || '',
    coordinates: row['좌표'] || '',
    coordinates2: row['좌표2'] || ''
  };
});

// 샘플 출력
console.log('\n샘플 데이터 (처음 3개):');
stores.slice(0, 3).forEach(store => {
  console.log(`- ${store.name} (${store.groupName}) - ${store.businessNumber}`);
});

// JSON 파일로 저장
const outputPath = path.join(__dirname, '../data/stores.json');
fs.writeFileSync(outputPath, JSON.stringify({ 
  extractedAt: new Date().toISOString(),
  totalStores: stores.length,
  stores 
}, null, 2), 'utf-8');

console.log(`\n저장 완료: ${outputPath}`);
console.log(`총 ${stores.length}개 가맹점 데이터`);
