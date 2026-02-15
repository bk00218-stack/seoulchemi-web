const fs = require('fs');
const path = require('path');

// Files to fix with their sidebar constants
const filesToFix = [
  // Purchase pages
  { file: 'src/app/purchase/new/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 2 },
  { file: 'src/app/purchase/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 1 },
  { file: 'src/app/purchase/settlement/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 2 },
  { file: 'src/app/purchase/settlement/history/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 3 },
  { file: 'src/app/purchase/vendors/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 2 },
  { file: 'src/app/purchase/vendors/unpaid/page.tsx', sidebar: 'PURCHASE_SIDEBAR', depth: 3 },
  
  // Settings pages
  { file: 'src/app/settings/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 1 },
  { file: 'src/app/settings/accounts/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  { file: 'src/app/settings/categories/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  { file: 'src/app/settings/main/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  { file: 'src/app/settings/menu-permissions/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  { file: 'src/app/settings/product-detail/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  { file: 'src/app/settings/shipping/page.tsx', sidebar: 'SETTINGS_SIDEBAR', depth: 2 },
  
  // Notifications
  { file: 'src/app/notifications/page.tsx', sidebar: 'ADMIN_SIDEBAR', depth: 1 },
];

function getRelativePath(depth) {
  return '../'.repeat(depth);
}

filesToFix.forEach(({ file, sidebar, depth }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if already has the import
  if (content.includes(`import { ${sidebar} }`)) {
    console.log(`Already has import: ${file}`);
    return;
  }
  
  // Check if uses this sidebar
  if (!content.includes(sidebar)) {
    console.log(`Does not use ${sidebar}: ${file}`);
    return;
  }
  
  const relativePath = getRelativePath(depth);
  const importStatement = `import { ${sidebar} } from '${relativePath}constants/sidebar'\n`;
  
  // Find the last import from components/Layout
  const layoutImportRegex = /import.*from\s+['"].*components\/Layout['"]/;
  const match = content.match(layoutImportRegex);
  
  if (match) {
    // Insert after the Layout import
    const insertIndex = content.indexOf(match[0]) + match[0].length;
    content = content.slice(0, insertIndex) + '\n' + importStatement.trim() + content.slice(insertIndex);
  } else {
    // Insert after 'use client'
    content = content.replace(/'use client'\n/, `'use client'\n\n${importStatement}`);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed: ${file}`);
});

console.log('Done!');
