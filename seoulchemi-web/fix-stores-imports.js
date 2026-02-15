const fs = require('fs');
const path = require('path');

const filesToFix = [
  { file: 'src/app/stores/page.tsx', depth: 1 },
  { file: 'src/app/stores/approve/page.tsx', depth: 2 },
  { file: 'src/app/stores/delivery-staff/page.tsx', depth: 2 },
  { file: 'src/app/stores/groups/page.tsx', depth: 2 },
  { file: 'src/app/stores/groups/discounts/page.tsx', depth: 3 },
  { file: 'src/app/stores/groups/types/page.tsx', depth: 3 },
  { file: 'src/app/stores/notices/page.tsx', depth: 2 },
  { file: 'src/app/stores/settle/page.tsx', depth: 2 },
  { file: 'src/app/stores/verify/page.tsx', depth: 2 },
  { file: 'src/app/stores/[id]/page.tsx', depth: 2 },
];

function getRelativePath(depth) {
  return '../'.repeat(depth);
}

filesToFix.forEach(({ file, depth }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes("import { STORES_SIDEBAR }")) {
    console.log(`Already has import: ${file}`);
    return;
  }
  
  if (!content.includes('STORES_SIDEBAR')) {
    console.log(`Does not use STORES_SIDEBAR: ${file}`);
    return;
  }
  
  const relativePath = getRelativePath(depth);
  const importStatement = `import { STORES_SIDEBAR } from '${relativePath}constants/sidebar'`;
  
  // Find Layout import and add after it
  const layoutImportRegex = /import.*from\s+['"].*components\/Layout['"]/;
  const match = content.match(layoutImportRegex);
  
  if (match) {
    const insertIndex = content.indexOf(match[0]) + match[0].length;
    content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
  } else {
    content = content.replace(/'use client'\n/, `'use client'\n\n${importStatement}\n`);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed: ${file}`);
});

console.log('Done!');
