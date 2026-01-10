# 🔐 로그인 인증 시스템 내부 동작 가이드

## 목차
1. [전체 플로우 개요](#전체-플로우-개요)
2. [회원가입 플로우](#1️⃣-회원가입-register-플로우)
3. [로그인 플로우](#2️⃣-로그인-login-플로우)
4. [인증된 API 요청 플로우](#3️⃣-인증된-api-요청-플로우)
5. [로그아웃 플로우](#4️⃣-로그아웃-logout-플로우)
6. [데이터 흐름 다이어그램](#📊-데이터-흐름-다이어그램)
7. [핵심 포인트](#🔑-핵심-포인트)

---

## 전체 플로우 개요

이 프로젝트는 **JWT(JSON Web Token) 기반 인증 시스템**을 사용합니다.

### 기술 스택
- **백엔드**: Express.js + TypeScript
- **인증 라이브러리**: jsonwebtoken, bcrypt
- **저장소**: File-based (users.json)
- **프론트엔드**: Next.js 15 + React 19
- **상태 관리**: Zustand + React Query

---

## 1️⃣ 회원가입 (Register) 플로우

```
사용자 입력 → 프론트엔드 → 백엔드 → DB 저장 → JWT 발급 → 토큰 반환
```

### 프론트엔드 (apps/web/src/app/register/page.tsx)

```typescript
// 사용자가 폼 제출
handleSubmit = (e) => {
  e.preventDefault()
  register({ username, email, password }) // useAuth hook 호출
}
```

### React Query Hook (apps/web/src/hooks/useAuth.ts)

```typescript
// API 호출
const registerMutation = useMutation({
  mutationFn: authApi.register, // POST /api/auth/register
  onSuccess: (data) => {
    // 응답: { user: UserWithoutPassword, token: string }
    setAuth(data.user, data.token) // Zustand store에 저장
    localStorage.setItem('auth_token', data.token) // localStorage에 토큰 저장
    router.push('/') // 메인 페이지로 이동
  }
})
```

### 백엔드 컨트롤러 (apps/server/src/controllers/auth.controller.ts)

```typescript
async register(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body = { username, email, password }
    const result = await this.authService.register(req.body)
    // result = { user: UserWithoutPassword, token: string }
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error) // 에러 처리 미들웨어로 전달
  }
}
```

### Auth Service (apps/server/src/domains/auth/services/auth.service.ts)

```typescript
async register(data: RegisterRequest): Promise<AuthResponse> {
  // 1. 이메일 중복 확인
  const existingEmail = await this.authRepository.existsByEmail(data.email)
  if (existingEmail) {
    throw new AppError(400, 'Email already in use')
  }

  // 2. 사용자명 중복 확인
  const existingUsername = await this.authRepository.existsByUsername(data.username)
  if (existingUsername) {
    throw new AppError(400, 'Username already in use')
  }

  // 3. 비밀번호 해싱 (bcrypt)
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS) // 10 라운드
  // 예: "mypassword123" → "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

  // 4. 사용자 객체 생성
  const now = new Date().toISOString() // "2026-01-10T01:30:00.000Z"
  const user: User = {
    id: randomUUID(), // "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
    username: data.username,
    email: data.email,
    password: hashedPassword,
    created_at: now,
    updated_at: now,
  }

  // 5. DB에 저장 (users.json)
  await this.authRepository.create(user)

  // 6. JWT 토큰 생성
  const token = this.generateToken(user.id)
  // 예: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC..."

  // 7. 비밀번호 제거 후 반환
  const userWithoutPassword = this.excludePassword(user)

  return {
    user: userWithoutPassword,
    token,
  }
}
```

### JWT 토큰 생성 (apps/server/src/domains/auth/services/auth.service.ts)

```typescript
private generateToken(userId: string): string {
  return jwt.sign(
    { userId }, // Payload: { userId: "a1b2c3d4-e5f6-..." }
    JWT_SECRET, // Secret: "your-secret-key-change-this-in-production"
    { expiresIn: JWT_EXPIRES_IN } // Options: "7d" (7일)
  )
}
```

**JWT 구조:**
```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (알고리즘, 타입)
.
eyJ1c2VySWQiOiJhMWIyYzNkNC4uLiJ9        ← Payload (userId)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV     ← Signature (secret으로 서명)
```

### DB 저장 (apps/server/src/domains/auth/repositories/implementations/file/FileAuthRepository.ts)

```typescript
async create(user: User): Promise<void> {
  const users = await this.loadUsers() // users.json 읽기
  users.push(user) // 배열에 추가
  await this.saveUsers(users) // users.json에 저장
}
```

**users.json 파일 구조:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "username": "홍길동",
    "email": "hong@example.com",
    "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    "created_at": "2026-01-10T01:30:00.000Z",
    "updated_at": "2026-01-10T01:30:00.000Z"
  }
]
```

---

## 2️⃣ 로그인 (Login) 플로우

```
사용자 입력 → 이메일로 사용자 조회 → 비밀번호 검증 → JWT 발급 → 토큰 반환
```

### Auth Service (apps/server/src/domains/auth/services/auth.service.ts)

```typescript
async login(data: LoginRequest): Promise<AuthResponse> {
  // 1. 이메일로 사용자 찾기
  const user = await this.authRepository.findByEmail(data.email)
  if (!user) {
    throw new AppError(401, 'Invalid credentials')
  }
  // user = { id, username, email, password: "$2b$10$...", ... }

  // 2. 비밀번호 검증 (bcrypt)
  const isPasswordValid = await bcrypt.compare(data.password, user.password)
  // bcrypt.compare("mypassword123", "$2b$10$N9qo8uLO...") → true/false
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials')
  }

  // 3. JWT 토큰 생성
  const token = this.generateToken(user.id)

  // 4. 비밀번호 제거 후 반환
  const userWithoutPassword = this.excludePassword(user)

  return {
    user: userWithoutPassword,
    token,
  }
}
```

### 프론트엔드 토큰 저장 (apps/web/src/stores/authStore.ts)

```typescript
setAuth: (user, token) => {
  // 1. localStorage에 토큰 저장
  localStorage.setItem('auth_token', token)

  // 2. Zustand store 업데이트
  set({
    user,           // { id, username, email, created_at, updated_at }
    token,          // "eyJhbGciOiJIUzI1NiIs..."
    isAuthenticated: true,
    isLoading: false
  })
}
```

---

## 3️⃣ 인증된 API 요청 플로우

```
요청 → Axios Interceptor → Authorization 헤더 추가 → 백엔드 → Auth 미들웨어 → JWT 검증 → 사용자 조회 → 요청 처리
```

### Axios Interceptor (apps/web/src/lib/api-client.ts)

```typescript
apiClient.interceptors.request.use((config) => {
  // localStorage에서 토큰 가져오기
  const token = localStorage.getItem('auth_token')
  if (token) {
    // Authorization 헤더에 토큰 추가
    config.headers.Authorization = `Bearer ${token}`
    // 예: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  return config
})
```

### Auth 미들웨어 (apps/server/src/middleware/auth.ts)

```typescript
export function authenticate(authService: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Authorization 헤더에서 토큰 추출
      const authHeader = req.headers.authorization
      // authHeader = "Bearer eyJhbGciOiJIUzI1NiIs..."

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided')
      }

      const token = authHeader.substring(7) // "Bearer " 제거
      // token = "eyJhbGciOiJIUzI1NiIs..."

      // 2. JWT 검증
      const { userId } = authService.verifyToken(token)
      // verifyToken 내부:
      // jwt.verify(token, JWT_SECRET) → { userId: "a1b2c3d4-..." }

      // 3. DB에서 사용자 조회
      const user = await authService.getUserById(userId)
      if (!user) {
        throw new AppError(401, 'User not found')
      }

      // 4. req.user에 사용자 정보 저장 (비밀번호 제외)
      req.user = user
      // req.user = { id, username, email, created_at, updated_at }

      next() // 다음 미들웨어/컨트롤러로 이동
    } catch (error) {
      next(error)
    }
  }
}
```

### JWT 검증 (apps/server/src/domains/auth/services/auth.service.ts)

```typescript
verifyToken(token: string): { userId: string } {
  try {
    // JWT 검증 및 디코딩
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    // decoded = { userId: "a1b2c3d4-...", iat: 1736470200, exp: 1737075000 }
    return decoded
  } catch (error) {
    // 토큰이 만료되었거나 변조된 경우
    throw new AppError(401, 'Invalid or expired token')
  }
}
```

### 보호된 라우트 예시 (apps/server/src/routes/auth.ts)

```typescript
// /api/auth/me - 현재 사용자 정보 조회 (인증 필요)
router.get('/me',
  authenticate(authService), // 미들웨어: JWT 검증 후 req.user 설정
  authController.getCurrentUser.bind(authController)
)

// Controller
async getCurrentUser(req: Request, res: Response, next: NextFunction) {
  // req.user는 이미 미들웨어에서 설정됨
  res.json({ success: true, data: req.user })
}
```

---

## 4️⃣ 로그아웃 (Logout) 플로우

```
사용자 클릭 → 프론트엔드 → localStorage 삭제 → Zustand store 초기화 → 로그인 페이지로 이동
```

**⚠️ JWT는 stateless이므로 서버에서 토큰을 삭제할 수 없습니다. 클라이언트에서만 삭제합니다.**

### 프론트엔드 (apps/web/src/hooks/useAuth.ts)

```typescript
const logoutMutation = useMutation({
  mutationFn: authApi.logout, // POST /api/auth/logout (optional)
  onSuccess: () => {
    clearAuth() // localStorage 및 store 초기화
    queryClient.clear() // React Query 캐시 초기화
    router.push('/login')
  },
  onError: () => {
    // API 실패해도 클라이언트에서는 로그아웃 처리
    clearAuth()
    queryClient.clear()
    router.push('/login')
  }
})
```

### Zustand Store (apps/web/src/stores/authStore.ts)

```typescript
clearAuth: () => {
  // 1. localStorage에서 토큰 삭제
  localStorage.removeItem('auth_token')

  // 2. Zustand store 초기화
  set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  })
}
```

---

## 📊 데이터 흐름 다이어그램

### 회원가입/로그인
```
┌─────────────┐
│  프론트엔드   │
│  (React)    │
└──────┬──────┘
       │ POST /api/auth/register
       │ { username, email, password }
       ▼
┌─────────────┐
│  Auth       │
│  Controller │
└──────┬──────┘
       │ authService.register()
       ▼
┌─────────────┐
│  Auth       │
│  Service    │ ─────► bcrypt.hash(password) → "$2b$10$..."
└──────┬──────┘
       │ authRepository.create(user)
       ▼
┌─────────────┐
│  Auth       │
│  Repository │ ─────► users.json에 저장
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  JWT        │
│  생성        │ ─────► jwt.sign({ userId }, secret, { expiresIn: "7d" })
└──────┬──────┘
       │ { user, token }
       ▼
┌─────────────┐
│  프론트엔드   │ ─────► localStorage.setItem('auth_token', token)
│  (Zustand)  │ ─────► setAuth(user, token)
└─────────────┘
```

### 인증된 API 요청
```
┌─────────────┐
│  프론트엔드   │
│  (Axios)    │ ─────► headers: { Authorization: "Bearer eyJ..." }
└──────┬──────┘
       │ GET /api/auth/me
       ▼
┌─────────────┐
│  Auth       │
│  Middleware │ ─────► jwt.verify(token, secret)
└──────┬──────┘        └─► { userId: "a1b2c3d4..." }
       │
       │ authRepository.findById(userId)
       ▼
┌─────────────┐
│  users.json │ ─────► { id, username, email, ... }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  req.user   │ ─────► 컨트롤러에서 사용 가능
│  설정 완료   │
└─────────────┘
```

---

## 🔑 핵심 포인트

### 1. 비밀번호 보안
- **절대 평문으로 저장하지 않음**
- bcrypt 해싱 (10 라운드)
- 예: `"password123"` → `"$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"`
- bcrypt는 **salt**를 자동으로 포함하여 같은 비밀번호도 매번 다른 해시 생성

### 2. JWT 토큰 구조

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "userId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "iat": 1736470200,  // 발급 시간 (issued at)
  "exp": 1737075000   // 만료 시간 (7일 후)
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**JWT 특징:**
- **Stateless**: 서버에 세션 저장 불필요
- **Self-contained**: 토큰 자체에 사용자 정보 포함
- **Tamper-proof**: Secret으로 서명되어 변조 불가

### 3. 토큰 저장 위치

| 위치 | 지속성 | 용도 |
|------|--------|------|
| **localStorage** | 브라우저를 닫아도 유지 | 토큰 영구 저장 |
| **Zustand store** | 메모리 (새로고침 시 사라짐) | 인증 상태 관리 |

**초기 로딩 시:**
1. localStorage에서 토큰 읽기
2. `/api/auth/me` 호출하여 사용자 정보 조회
3. Zustand store에 복원

### 4. 보안 고려사항

#### 🔴 현재 보안 이슈
- ⚠️ **JWT_SECRET이 하드코딩됨** → 환경변수로 관리 필수
- ⚠️ **HTTP 사용 시 토큰 탈취 위험** → HTTPS 사용 권장

#### ✅ 적용된 보안 조치
- ✅ bcrypt 해싱 (10 라운드)
- ✅ 비밀번호 평문 저장 금지
- ✅ JWT 서명 검증
- ✅ React의 기본 XSS 방어
- ✅ 토큰 만료 시간 설정 (7일)

#### 📋 추가 보안 강화 방안
1. **Refresh Token 도입**
   - Access Token: 짧은 만료 시간 (15분)
   - Refresh Token: 긴 만료 시간 (7일)
   - Access Token 만료 시 Refresh Token으로 재발급

2. **Token Blacklist**
   - 로그아웃 시 서버에서 토큰 무효화
   - Redis 등으로 블랙리스트 관리

3. **HTTPS 강제**
   - 프로덕션 환경에서 필수

4. **Rate Limiting**
   - 로그인 시도 횟수 제한 (Brute Force 공격 방지)

5. **CORS 설정**
   - 허용된 도메인만 API 접근 가능

---

## 📂 파일 구조

### 백엔드
```
apps/server/src/
├── domains/auth/
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   └── IAuthRepository.ts       # Repository 인터페이스
│   │   └── implementations/
│   │       └── file/
│   │           └── FileAuthRepository.ts # File 기반 구현
│   └── services/
│       └── auth.service.ts               # 인증 비즈니스 로직
├── controllers/
│   └── auth.controller.ts                # Auth API 컨트롤러
├── middleware/
│   └── auth.ts                           # JWT 인증 미들웨어
├── routes/
│   └── auth.ts                           # Auth 라우터
└── schemas/
    └── auth.schema.ts                    # Zod 유효성 검증
```

### 프론트엔드
```
apps/web/src/
├── app/
│   ├── login/
│   │   └── page.tsx                      # 로그인 페이지
│   └── register/
│       └── page.tsx                      # 회원가입 페이지
├── hooks/
│   └── useAuth.ts                        # React Query Auth hook
├── stores/
│   └── authStore.ts                      # Zustand Auth store
└── lib/
    └── api-client.ts                     # Axios 설정 (Interceptor)
```

### 공유 타입
```
packages/types/src/
└── index.ts                              # User, AuthResponse 등
```

---

## 🚀 다음 단계: OAuth 통합

현재 ID/PW 기반 인증이 완료되었으므로, OAuth를 추가할 준비가 완료되었습니다.

### OAuth 통합 시 변경 사항

1. **Google OAuth 예시:**
   ```typescript
   // 기존: ID/PW로 회원가입
   authService.register({ username, email, password })

   // OAuth: Google에서 사용자 정보 받아서 처리
   authService.oauthRegister({
     provider: 'google',
     providerId: googleUser.id,
     email: googleUser.email,
     username: googleUser.name
   })
   ```

2. **JWT 발급은 동일:**
   - OAuth 로그인 성공 후에도 동일하게 JWT 토큰 발급
   - 프론트엔드에서는 동일한 방식으로 토큰 관리

3. **추가 필요 사항:**
   - OAuth Provider 설정 (Google Cloud Console 등)
   - Redirect URL 처리
   - User 모델에 `provider`, `providerId` 필드 추가

---

## 📝 API 엔드포인트 목록

### 공개 API (인증 불필요)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |

### 보호된 API (인증 필요)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/auth/me` | 현재 사용자 정보 조회 |
| POST | `/api/auth/logout` | 로그아웃 (선택적) |

---

## 🐛 디버깅 가이드

### 로그인이 안 될 때
1. **브라우저 콘솔 확인:**
   ```javascript
   localStorage.getItem('auth_token') // 토큰 확인
   ```

2. **네트워크 탭 확인:**
   - POST `/api/auth/login` 응답 상태 코드
   - 401: 이메일/비밀번호 오류
   - 500: 서버 오류

3. **백엔드 로그 확인:**
   ```bash
   npm run server:dev
   ```

### 토큰이 만료되었을 때
- 현재는 7일 후 자동 만료
- 만료 시 다시 로그인 필요
- 향후 Refresh Token으로 자동 갱신 가능

---

## 📚 참고 자료

- [JWT.io](https://jwt.io/) - JWT 디버거
- [bcrypt 문서](https://github.com/kelektiv/node.bcrypt.js)
- [jsonwebtoken 문서](https://github.com/auth0/node-jsonwebtoken)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)
- [React Query 문서](https://tanstack.com/query/latest)
