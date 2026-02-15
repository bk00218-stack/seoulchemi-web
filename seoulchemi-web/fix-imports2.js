const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/app');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file === 'page.tsx') {
      callback(filePath);
    }
  });
}

const sidebarImports = ['ORDER_SIDEBAR', 'PRODUCTS_SIDEBAR', 'STORES_SIDEBAR', 'PURCHASE_SIDEBAR', 'STATS_SIDEBAR', 'SETTINGS_SIDEBAR'];

walkDir(basePath, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 사이드바 import가 있는지 확인
  const hasSidebarImport = sidebarImports.some(s => content.includes(s));
  if (!hasSidebarImport) return;
  
  // 현재 import 경로 찾기
  const match = content.match(/from ['"]([^'"]*constants\/sidebar)['"]/);
  if (!match) return;
  
  const currentPath = match[1];
  
  // 올바른 경로 계산
  const relativePath = path.relative(basePath, path.dirname(filePath)).replace(/\\/g, '/');
  const depth = relativePath ? relativePath.split('/').length : 0;
  
  let correctPath = '';
  for (let i = 0; i < depth; i++) {
    correctPath += '../';
  }
  correctPath += 'constants/sidebar';
  
  if (currentPath !== correctPath) {
    content = content.replace(
      /from ['"][^'"]*constants\/sidebar['"]/,
      `from '${correctPath}'`
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${relativePath}/page.tsx: "${currentPath}" -> "${correctPath}"`);
  }
});

console.log('Done!');
