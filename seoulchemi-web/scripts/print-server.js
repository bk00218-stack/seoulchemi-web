/**
 * 로컬 프린트 서버
 * 웹앱에서 POST 요청 → 네트워크 프린터로 출력
 * 
 * 사용법: node print-server.js
 * 포트: 9100
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 9100;
const PRINTER_NAME = '\\\\Chemi-03\\BIXOLON SRP-350III';

// 임시 파일 디렉토리
const TEMP_DIR = path.join(os.tmpdir(), 'lens-print');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 상태 체크
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      printer: PRINTER_NAME,
      port: PORT 
    }));
    return;
  }

  // 프린트 요청
  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { type, content, orderNo } = data;

        console.log(`[${new Date().toISOString()}] 출력 요청: ${orderNo || 'unknown'}`);

        if (type === 'html') {
          // HTML을 임시 파일로 저장 후 출력
          const filename = `print_${Date.now()}.html`;
          const filepath = path.join(TEMP_DIR, filename);
          
          fs.writeFileSync(filepath, content, 'utf8');

          // Windows 기본 프린터로 HTML 출력 (브라우저 이용)
          // 또는 특정 프린터로 출력
          const printCmd = `rundll32 mshtml.dll,PrintHTML "${filepath}"`;
          
          exec(printCmd, (error, stdout, stderr) => {
            if (error) {
              console.error('출력 오류:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
              return;
            }

            console.log(`[${new Date().toISOString()}] 출력 완료: ${orderNo || filename}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: '출력 완료' }));

            // 5초 후 임시 파일 삭제
            setTimeout(() => {
              try { fs.unlinkSync(filepath); } catch (e) {}
            }, 5000);
          });

        } else if (type === 'raw') {
          // RAW 데이터 직접 전송 (ESC/POS 명령어)
          const filename = `print_${Date.now()}.prn`;
          const filepath = path.join(TEMP_DIR, filename);
          
          // Buffer로 변환 (base64인 경우)
          const buffer = Buffer.from(content, 'base64');
          fs.writeFileSync(filepath, buffer);

          // 네트워크 프린터로 직접 전송
          const printCmd = `copy /b "${filepath}" "${PRINTER_NAME}"`;
          
          exec(printCmd, { shell: 'cmd.exe' }, (error, stdout, stderr) => {
            if (error) {
              console.error('출력 오류:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
              return;
            }

            console.log(`[${new Date().toISOString()}] RAW 출력 완료: ${orderNo || filename}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: '출력 완료' }));

            // 임시 파일 삭제
            setTimeout(() => {
              try { fs.unlinkSync(filepath); } catch (e) {}
            }, 1000);
          });

        } else if (type === 'text') {
          // 텍스트 출고지시서
          const filename = `print_${Date.now()}.txt`;
          const filepath = path.join(TEMP_DIR, filename);
          
          fs.writeFileSync(filepath, content, 'utf8');

          // 네트워크 프린터로 전송
          const printCmd = `print /d:"${PRINTER_NAME}" "${filepath}"`;
          
          exec(printCmd, { shell: 'cmd.exe' }, (error, stdout, stderr) => {
            if (error) {
              console.error('출력 오류:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
              return;
            }

            console.log(`[${new Date().toISOString()}] 텍스트 출력 완료: ${orderNo || filename}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: '출력 완료' }));

            setTimeout(() => {
              try { fs.unlinkSync(filepath); } catch (e) {}
            }, 1000);
          });

        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid type. Use: html, raw, text' }));
        }

      } catch (e) {
        console.error('파싱 오류:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🖨️  렌즈초이스 프린트 서버');
  console.log('='.repeat(50));
  console.log(`포트: ${PORT}`);
  console.log(`프린터: ${PRINTER_NAME}`);
  console.log(`상태 확인: http://localhost:${PORT}/status`);
  console.log('='.repeat(50));
  console.log('대기 중...\n');
});

// 종료 시그널 처리
process.on('SIGINT', () => {
  console.log('\n프린트 서버 종료');
  process.exit(0);
});
