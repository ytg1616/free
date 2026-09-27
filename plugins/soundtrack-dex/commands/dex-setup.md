---
description: Spotify 계정 연결 (Spotify 개발자 앱의 Client ID 필요)
argument-hint: <Spotify Client ID>
allowed-tools: Bash(node:*)
---
soundtrack-dex를 Spotify에 연결한다. Client ID: `$ARGUMENTS`

1. Client ID가 비어 있으면 실행하지 말고, README의 "Spotify 개발자 앱 만들기" 절차를 요약해서 안내한 뒤 멈춰.
   (https://developer.spotify.com/dashboard → Create app → Redirect URI `http://127.0.0.1:8888/callback` → Web API 체크 → Client ID 복사)
2. 있으면 Bash 도구로 아래 명령을 timeout 200000으로 실행해:
   `node "${APPDATA:-$HOME/.config}/soundtrack-dex/dex.js" setup $ARGUMENTS`
   브라우저가 열리고 Spotify 승인 화면이 뜬다. 출력에 나온 인증 URL을 사용자에게도 보여줘(브라우저가 안 열렸을 때 대비).
   런처 파일이 없다는 오류면 Claude Code를 재시작하라고 안내해.
3. 연결되면 statusLine 설치를 제안하고, 사용자가 동의하면 실행해:
   `node "${APPDATA:-$HOME/.config}/soundtrack-dex/dex.js" install-statusline`
   이미 다른 statusLine이 있다고 나오면 덮어쓸지(--force) 사용자에게 먼저 물어봐.
