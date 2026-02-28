# Travel Taipei Frontend

Next.js 기반 프론트엔드입니다. 메인 페이지에서 아래 백엔드 API 연결 결과를 확인할 수 있습니다.

- 환율: `/api/exchange-rates`
- 날씨: `/api/weather`
- 장소추천: `/api/spots`, `/api/spots/{placeId}`

프론트에서는 Next Route Handler(`/api/travel/*`)로 백엔드 API를 프록시하므로 브라우저 CORS 설정 없이 확인 가능합니다.

## 1) 환경 변수

```bash
cp .env.example .env.local
```

기본값:

```env
BACKEND_API_BASE_URL=http://localhost:8080
```

## 2) 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 3) 백엔드 선행 실행

백엔드 서버가 먼저 떠 있어야 데이터가 표시됩니다.

```bash
cd ../backend
./gradlew bootRun
```
