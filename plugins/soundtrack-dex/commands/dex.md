---
description: 코딩 사운드트랙 도감 보기
allowed-tools: Bash(node:*)
---
## 도감 현황

!`node "${APPDATA:-$HOME/.config}/soundtrack-dex/dex.js" report`

위 도감 현황을 그대로 보여주고, 눈에 띄는 점(승급 임박 곡, 오늘 새로 들어온 곡, 스트릭)을 한두 줄로 짚어줘.
명령이 실패했다면: Claude Code를 한 번 재시작해 SessionStart hook이 런처를 만들게 하고, 그래도 안 되면 `/dex-setup <Client ID>`로 연결하라고 안내해.
