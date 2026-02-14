const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/app');

// 섹션별 사이드바 매핑
const sidebarMap = {
  orders: 'ORDER_SIDEBAR',
  products: 'PRODUCTS_SIDEBAR',
  stores: 'STORES_SIDEBAR',
  purchase: 'PURCHASE_SIDEBAR',
  stats: 'STATS_SIDEBAR',
  settings: 'SETTINGS_SIDEBAR',
};

const activeNavMap = {
  orders: '주문',
  products: '상품',
  stores: '가맹점',
  purchase: '매입',
  stats: '통계',
  settings: '설정',
};

function getRelativeImportPath(filePath) {
  const depth = filePath.split(path.sep).filter(p => p && p !== 'page.tsx').length;
  let prefix = '';
  for (let i = 0; i < depth; i++) {
    prefix += '../';
  }
  return prefix + 'constants/sidebar';
}

function processFile(filePath, section) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sidebarName = sidebarMap[section];
  const activeNav = activeNavMap[section];
  
  if (!sidebarName) return;

  // 이미 상수 import가 있는지 확인
  if (content.includes(`import { ${sidebarName} }`)) {
    console.log(`[SKIP] ${filePath} - already uses ${sidebarName}`);
    return;
  }

  // Layout을 사용하는지 확인
  if (!content.includes('import Layout') && !content.includes('from \'../components/Layout\'') && !content.includes('from \'../../components/Layout\'')) {
    console.log(`[SKIP] ${filePath} - no Layout import`);
    return;
  }

  let newContent = content;

  // 로컬 SIDEBAR 정의 제거 (const SIDEBAR = [...] 형태)
  const localSidebarRegex = /const SIDEBAR\s*(?::\s*\w+\[\])?\s*=\s*\[[\s\S]*?\n\]\s*;?\n\n?/;
  if (localSidebarRegex.test(newContent)) {
    newContent = newContent.replace(localSidebarRegex, '');
    console.log(`[FIX] ${filePath} - removed local SIDEBAR`);
  }

  // import 경로 계산
  const relativePath = filePath.replace(basePath, '').replace(/\\/g, '/');
  const depth = relativePath.split('/').filter(p => p && p !== 'page.tsx').length - 1;
  let importPath = '';
  for (let i = 0; i < depth; i++) {
    importPath += '../';
  }
  importPath += 'constants/sidebar';

  // Layout import 찾기
  const layoutImportRegex = /import Layout from ['"]([^'"]+)['"]/;
  const match = newContent.match(layoutImportRegex);
  
  if (match) {
    // sidebar import 추가 (Layout import 바로 다음에)
    if (!newContent.includes(`{ ${sidebarName} }`)) {
      const sidebarImport = `import { ${sidebarName} } from '${importPath}'`;
      newContent = newContent.replace(
        layoutImportRegex,
        `import Layout from '${match[1]}'\n${sidebarImport}`
      );
    }
  }

  // Layout 사용 부분 수정: sidebarMenus={SIDEBAR} -> sidebarMenus={ORDER_SIDEBAR}
  newContent = newContent.replace(/sidebarMenus=\{SIDEBAR\}/g, `sidebarMenus={${sidebarName}}`);
  
  // activeNav가 없으면 추가
  if (!newContent.includes('activeNav=')) {
    newContent = newContent.replace(
      new RegExp(`sidebarMenus=\\{${sidebarName}\\}`),
      `sidebarMenus={${sidebarName}} activeNav="${activeNav}"`
    );
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`[UPDATED] ${filePath}`);
  }
}

// 각 섹션 처리
const sections = ['orders', 'products', 'stores', 'purchase', 'stats', 'settings'];

sections.forEach(section => {
  const sectionPath = path.join(basePath, section);
  if (!fs.existsSync(sectionPath)) return;

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'page.tsx') {
        processFile(filePath, section);
      }
    });
  }

  walkDir(sectionPath);
});

console.log('Done!');
