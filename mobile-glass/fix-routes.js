const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts' && fullPath.includes('[')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: { params }: { params: { id: string } }
  // Replace with: { params }: { params: Promise<{ id: string }> }
  const patterns = [
    [/\{ params \}: \{ params: \{ id: string \} \}/g, '{ params }: { params: Promise<{ id: string }> }'],
    [/\{ params \}: \{ params: \{ optionId: string \} \}/g, '{ params }: { params: Promise<{ optionId: string }> }'],
    [/\{ params \}: \{ params: \{ id: string; optionId: string \} \}/g, '{ params }: { params: Promise<{ id: string; optionId: string }> }'],
  ];
  
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  // Now fix the params.id usage - need to add await
  // This is trickier - we need to find functions that have Promise<{ id: string }> and fix params.id
  
  // Pattern: parseInt(params.id) -> const { id } = await params; ... parseInt(id)
  // This requires more complex parsing, so let's just flag files that need manual fixing
  
  if (modified) {
    // Check if params.id is still used directly (needs manual fix)
    if (content.includes('params.id') || content.includes('params.optionId')) {
      console.log(`NEEDS MANUAL FIX: ${filePath}`);
      // Let's try to auto-fix by adding destructuring at the start of try blocks
      
      // Replace patterns like:
      // try {
      //   const id = parseInt(params.id)
      // With:
      // try {
      //   const { id } = await params
      //   const id = parseInt(id)  // This would be wrong...
      
      // Actually, let's do a simpler approach - replace params.id with (await params).id
      content = content.replace(/params\.id/g, '(await params).id');
      content = content.replace(/params\.optionId/g, '(await params).optionId');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files with dynamic params`);

for (const file of routeFiles) {
  fixRouteFile(file);
}

console.log('Done!');
