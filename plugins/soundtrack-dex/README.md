# soundtrack-dex — 코딩 사운드트랙 도감

Claude Code가 일하는 동안 Spotify에서 들은 곡이 **도감에 포획**되고, 그 곡과 **함께 코딩한 날 수**만큼 곡 카드가 진화한다. 진행 상황은 statusline에 항상 보인다.

```
♫ NewJeans — Ditto [전우 Lv3 · 9일] │ 📖 142 │ 🔥 5일 │ ⬆ 전우 승급
```

| 단계 | 조건 (함께 코딩한 날) |
|---|---|
| Lv1 만남 | 첫 포획 |
| Lv2 동료 | 3일 |
| Lv3 전우 | 7일 |
| Lv4 OST | 20일 |

- **포획**: 프롬프트를 보낸 순간부터 Claude가 응답을 끝낼 때까지(한 턴) 재생된 곡
- **날 수 기준**: 턴 수로 세면 턴을 잘게 쪼갤수록 부풀기 때문
- **로컬 전용**: 데이터는 내 PC에만 저장. Spotify 권한은 읽기 전용(재생 제어 안 함)

> v0.1 — Windows 우선 버전. Spotify API는 목(mock) 서버로 검증했고, 실제 Windows + Spotify 계정 검증은 아직 전.

---

## Windows 설치

### 0. 준비물
- **Spotify Premium** — 2026-03부터 Spotify 개발자 앱(dev mode)은 소유자가 Premium이어야 동작한다
- **Node.js 18+** — PowerShell에서 `node -v`로 확인
- Claude Code (Windows)

### 1. Spotify 개발자 앱 만들기 (한 번만, 3분)
1. https://developer.spotify.com/dashboard 로그인 → **Create app**
2. App name/description은 아무거나 (예: `soundtrack-dex`)
3. **Redirect URI**: `http://127.0.0.1:8888/callback` 입력 후 Add
4. **Which API/SDKs**: `Web API` 체크 → Save
5. 앱 **Settings**에서 **Client ID** 복사 (Client Secret은 필요 없음 — PKCE 사용)

### 2. 플러그인 설치
PowerShell:
```powershell
git clone https://github.com/ytg1616/free.git C:\dev\free
```
Claude Code 안에서:
```
/plugin marketplace add C:/dev/free
/plugin install soundtrack-dex@ytg1616-free
```
설치 후 **Claude Code를 한 번 재시작**한다. 시작할 때 hook이 `%APPDATA%\soundtrack-dex\dex.js` 런처를 만든다.

### 3. Spotify 연결
Claude Code에서:
```
/dex-setup <복사한 Client ID>
```
브라우저가 열리면 Spotify에서 승인. 끝나면 statusLine 설치를 물어본다.

직접 하려면 PowerShell에서:
```powershell
node "$env:APPDATA\soundtrack-dex\dex.js" setup <Client ID>
node "$env:APPDATA\soundtrack-dex\dex.js" install-statusline
```
`install-statusline`은 `~\.claude\settings.json`의 `statusLine`만 바꾸고 원본은 `settings.json.dex-backup`에 백업한다. 이미 다른 statusLine을 쓰고 있으면 `--force` 없이는 건드리지 않는다.

### 4. 사용
- 음악 틀고 Claude Code에 작업을 시킨다 → 턴이 끝나면 포획
- `/dex` — 도감 현황, 승급 임박 곡, 최근 새로 들어온 곡

---

## 구조

```
plugins/soundtrack-dex/
├─ .claude-plugin/plugin.json
├─ hooks/hooks.json        SessionStart(런처) · UserPromptSubmit(턴 시작) · Stop(포획)
├─ commands/dex.md         /dex
├─ commands/dex-setup.md   /dex-setup
└─ scripts/
   ├─ dex.js               CLI: hook · worker · statusline · report · setup · install-statusline
   └─ lib/                 paths · store(JSON+락) · game(레벨·스트릭) · spotify(PKCE·API)
```

- hook은 Spotify를 기다리지 않는다. 턴 정보만 적고 분리된(detached) 워커를 띄운 뒤 바로 끝난다 (~100ms)
- 포획 = `recently-played?after=턴시작` + 턴 시작/끝 시점의 `currently-playing`
- statusline은 로컬 캐시만 읽고, 캐시가 15초 넘게 묵으면 백그라운드 갱신만 건다 → Spotify rate limit 보호
- 외부 의존성 없음 (Node 내장 모듈만)

### 데이터 (`%APPDATA%\soundtrack-dex\`)
| 파일 | 내용 |
|---|---|
| `config.json` | Client ID, 토큰 |
| `db.json` | 도감 (곡 카드, 활동일, 이벤트) |
| `state.json` | 진행 중인 턴 |
| `nowplaying.json` | statusline용 현재 곡 캐시 |
| `dex.log` | 오류 로그 |
| `dex.js` | 런처 (플러그인 실제 경로로 연결) |

## 문제 해결
- **statusline 이모지가 깨짐** → `~\.claude\settings.json`에 `"env": { "DEX_PLAIN": "1" }` 추가
- **아무것도 포획 안 됨** → `%APPDATA%\soundtrack-dex\dex.log` 확인
- **403 오류** → 대시보드 앱 소유 계정과 다른 Spotify 계정으로 로그인했다면 앱 **User Management**에 그 계정 추가 (dev mode는 최대 5명)
- **포트 8888 사용 중** → `setup <Client ID> --port 8899` + 대시보드 Redirect URI도 같은 포트로 변경

## 개발
```
cd plugins/soundtrack-dex
npm test
```

## 참고: Spotify 개발자 정책
Spotify 개발자 정책에 "Do not create a game, including trivia quizzes" 조항이 있다. 이 도구는 경쟁·보상·퀴즈 없이 **개인 청취 기록**만 로컬에 남기는 방향으로 설계했다. 공개 배포 전에는 정책 원문을 다시 확인할 것.
