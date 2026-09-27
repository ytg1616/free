# 평행세계 레벨 계산기

내 스탯(소득·자산·학력·직업 레어도)이 어느 레벨쯤인지, 다른 나라에선 어떤지 확인하는 **재미용** 웹앱입니다.
사람을 평가하는 도구가 아니며, 결과는 레벨·티어·"1000명 중에 8명 안에 들어요" 같은 비율로만 표현합니다
(1000명 기준은 1~9명일 때만, 나머지는 100명 기준이며 "100명 중 40명"처럼 나누어떨어지면 "10명 중 4명"으로 줄입니다).

- 모든 계산은 브라우저 안에서만 합니다. 서버 전송·저장·localStorage를 쓰지 않습니다.
- 국가 데이터는 전부 **임시 대략치**입니다(`verified: false`). 실제 통계가 아닙니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm test           # Vitest (엔진 완료 기준 + 문구·프라이버시 검사)
npm run typecheck
npm run lint
npm run build      # dist/ 생성
```

결과 공유: 결과 화면의 **결과 공유하기**로 링크를 만들 수 있습니다. 링크에는 레벨 위치·국가·비교 집단·레어도·가장 빛나는 스탯만
URL의 `#` 뒤에 담기고(서버로 전송되지 않음), 입력한 금액과 학력은 담기지 않습니다. 링크를 연 사람은 결과 카드와 "나도 내 레벨 확인하기" 버튼을 봅니다.

디버그 모드: 주소 뒤에 `?debug=1`을 붙이면 버프 전 원값, z값, 중간 계산이 표시되고 버프를 끌 수 있습니다.

## 구조

```
src/
  config.ts            가중치, 상관계수, 버프, 티어, 레어도 가산값, 환율, 나이 배수, 선택지 라벨
  data/countries.json  국가별 임시 데이터
  engine/              순수 함수만 (UI 의존 없음)
    normal.ts          Phi, invPhi
    percentile.ts      소득·자산(로그정규), 학력(범주형)
    composite.ts       종합 z, 버프, 레벨, 티어
    calculate.ts       입력 → 결과 파이프라인 (원화→USD, 구매력 계수, 나이대 보정)
  form.ts              화면 입력 상태 ↔ 엔진 입력 변환
  format.ts            "N명 중 M명 안" 비율, 만원 표기, 국기
  share.ts             공유 링크 인코딩·디코딩 (결과만, # fragment)
  hooks/useTween.ts    곡선 마커 부드러운 이동
  components/          InputPanel, RarityInput, CountryPicker, BellCurve, ResultCards,
                       StatBars, RarityBadge, ResultSection, ShareCard, ShareSheet,
                       SharedView, DebugPanel(lazy)
  tests/
```

직업 레어도 입력 방식은 미정이라 `components/RarityInput.tsx`만 교체하면 되도록 분리해 두었습니다.

## 배포 (GitHub Pages)

`main`에 push하면 `.github/workflows/deploy.yml`이 테스트 → 빌드 → Pages 배포를 합니다.
처음 한 번은 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔야 합니다.
