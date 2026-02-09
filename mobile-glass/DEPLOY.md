# 🚀 Vercel 배포 가이드

## 1️⃣ Turso 데이터베이스 만들기

1. https://turso.tech 로그인
2. **Create Database** 클릭
3. 이름: `lens-choice`
4. 지역: `nrt` (Tokyo) - 한국에서 제일 빠름
5. 생성 후 DB 클릭 → **"Get Connection URL"** 버튼

필요한 값 2개:
- `TURSO_DATABASE_URL`: `libsql://lens-choice-xxxxx.turso.io` 형태
- `TURSO_AUTH_TOKEN`: 긴 토큰 문자열

---

## 2️⃣ Vercel 환경변수 설정

1. https://vercel.com/dashboard 접속
2. `mobile-glass` 프로젝트 클릭
3. **Settings** → **Environment Variables**
4. 아래 3개 추가:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `TURSO_DATABASE_URL` | (Turso에서 복사) |
| `TURSO_AUTH_TOKEN` | (Turso에서 복사) |

---

## 3️⃣ 재배포

환경변수 설정 후:
```bash
npx vercel --prod
```

또는 Vercel 대시보드에서 **Redeploy** 클릭

---

## 4️⃣ 데이터 마이그레이션

로컬 SQLite 데이터를 Turso로 옮기려면:
```bash
# Turso CLI 설치 (Mac/Linux)
curl -sSfL https://get.tur.so/install.sh | bash

# 데이터 푸시
turso db shell lens-choice < prisma/dev.db
```

Windows에서는 Turso 웹 콘솔에서 SQL 직접 실행

---

## 📝 현재 상태

- [x] Prisma 스키마 업데이트 완료
- [x] Turso 어댑터 설치 완료
- [x] 빌드 스크립트 수정 완료
- [ ] Turso DB 생성 (Zeus)
- [ ] Vercel 환경변수 설정 (Zeus)
- [ ] 배포 테스트
