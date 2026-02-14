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
    } else if (file.endsWith('.tsx')) {
      callback(filePath);
    }
  });
}

walkDir(basePath, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 잘못된 import 경로 수정
  if (content.includes("from 'constants/sidebar'") || content.includes('from "constants/sidebar"')) {
    // 파일 위치에 따라 상대 경로 계산
    const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');
    const depth = relativePath.split('/').length - 1;
    
    let correctPath = '';
    for (let i = 0; i < depth; i++) {
      correctPath += '../';
    }
    correctPath += 'constants/sidebar';
    
    content = content.replace(/from ['"]constants\/sidebar['"]/g, `from '${correctPath}'`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${relativePath} -> ${correctPath}`);
  }
});

console.log('Done!');
