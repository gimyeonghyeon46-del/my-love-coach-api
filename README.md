# 💬 Love Coach API

Love Coach의 백엔드 API 서버

## 🔧 기능

- OpenAI GPT-3.5-turbo 기반 메시지 분석
- 20+ 심리학 이론 데이터베이스
- Rate Limiting (IP당 하루 10회)
- CORS 보안

## 🚀 실행

```bash
npm install
node server.js
```

## 📝 환경변수

`.env` 파일 생성:
```
OPENAI_API_KEY=your-api-key-here
```

## 🔒 보안

- API 키는 절대 코드에 하드코딩하지 않음
- `.env` 파일은 Git에 올라가지 않음 (.gitignore)
- CORS로 허용된 도메인만 접근 가능
- Rate Limiting으로 무한 사용 방지

## 📦 배포 (Render.com)

1. GitHub에 푸시
2. Render.com에서 repository 연결
3. 환경변수 `OPENAI_API_KEY` 설정
4. 배포 완료!

자세한 내용은 프론트엔드의 `DEPLOY.md` 참고

## 🛠️ 기술 스택

- Node.js
- Express
- OpenAI API
- dotenv

## 📡 API 엔드포인트

### POST `/analyze`

**Request Body:**
```json
{
  "message": "상대방 메시지",
  "mode": "message",
  "myMBTI": "ENFP",
  "theirMBTI": "INTJ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "confidence": 85,
    "current_situation": "...",
    "next_actions": [...],
    ...
  },
  "remaining": 9
}
```

## 📝 라이선스

MIT
