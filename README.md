# 뉴스포츠 사회정서학습 홈페이지

뉴스포츠와 사회정서학습을 연계한 게임 기반 학습 플랫폼입니다.

## 🚀 시작하기

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. 새 프로젝트 생성
3. Authentication 활성화 (Email/Password)
4. Firestore Database 생성 (Test mode)
5. Storage 생성
6. 프로젝트 설정에서 웹 앱 등록
7. 설정 정보 복사

### 2. 환경 변수 설정

`.env` 파일 생성:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. 초기 데이터 설정

Firebase Console에서 다음 데이터 추가:

#### 게임 데이터 (Firestore - `games` 컬렉션)

```javascript
{
  "title": "게임 이름",
  "description": "게임 설명",
  "order": 1,
  "pointReward": 10
}
```

20차시까지 순서대로 추가하세요.

#### 상점 아이템 (Firestore - `shop` 컬렉션)

```javascript
{
  "name": "아이템 이름",
  "cost": 100,
  "category": "furniture",
  "rarity": "common",
  "emoji": "🪑"
}
```

### 4. 프로젝트 실행

```bash
# frontend 디렉토리에서
cd frontend
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 📁 폴더 구조

```
homepage/
├── frontend/                 # React 애플리케이션
│   ├── public/              # 정적 파일
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Games.js
│   │   │   ├── Shop.js
│   │   │   └── MyRoom.js
│   │   ├── context/         # 상태 관리
│   │   │   └── AuthContext.js
│   │   ├── styles/          # CSS 파일
│   │   ├── App.js           # 메인 라우터
│   │   ├── firebase.js      # Firebase 초기화
│   │   └── index.js         # 진입점
│   └── package.json
├── workflows/               # 프로젝트 매뉴얼
│   └── MAIN.md
├── CLAUDE.md               # 프로젝트 지침
├── .env.example            # 환경 변수 템플릿
└── .gitignore              # Git 무시 파일
```

## 🎮 기능

### 1. 회원가입/로그인

- 이메일 기반 회원가입
- Firebase Authentication 사용

### 2. 게임 플레이

- 20개의 게임 카드
- 게임 완료 시 포인트 획득
- 진행도 표시

### 3. 포인트 시스템

- 게임 완료 시 포인트 획득
- 상점에서 아이템 구매

### 4. 상점

- 다양한 아이템 판매
- 포인트로 구매
- 아이템 레어도 (common, rare, epic)

### 5. 마이룸

- 구매한 아이템으로 방 꾸미기
- 아이템 배치/제거
- 보유 아이템 관리

## 🌐 배포

### Vercel에 배포

1. GitHub에 리포지토리 푸시
2. [Vercel](https://vercel.com)에 접속
3. New Project → GitHub 리포지토리 연결
4. Environment Variables 설정
5. Deploy

## 📊 Firestore 데이터 구조

```
users/
├── {userId}/
│   ├── username: string
│   ├── email: string
│   ├── points: number
│   ├── inventory: array
│   ├── roomLayout: array
│   └── completedGames: array

games/
├── {gameId}/
│   ├── title: string
│   ├── description: string
│   ├── order: number (1-20)
│   └── pointReward: number

shop/
├── {itemId}/
│   ├── name: string
│   ├── cost: number
│   ├── category: string
│   ├── rarity: string
│   └── emoji: string
```

## 🔧 개발 팁

### 상태 확인

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, userData, loading } = useAuth();
  // ...
}
```

### Firestore 쿼리

```javascript
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const gamesRef = collection(db, 'games');
const q = query(gamesRef, orderBy('order', 'asc'));
const snapshot = await getDocs(q);
```

## 📋 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 게임 데이터 입력 (20개)
- [ ] 상점 아이템 입력
- [ ] 로컬 테스트 완료
- [ ] Vercel 배포
- [ ] 도메인 설정 (선택)

## ⚠️ 주의사항

- API 키는 `.env` 파일에만 저장
- `.env` 파일은 Git에 커밋하지 않음
- 학생 프라이버시 보호
- 정기적 데이터 백업

## 📞 문의

버그나 기능 요청은 이슈를 통해 등록해주세요.

---

**마지막 수정**: 2026년 4월 11일
