# Capacitor 앱 배포 플레이북 (실전 시행착오 기반)

> Voyage(org.voyageapp.app) iOS·Android 출시에서 **실제로 겪은 함정**을 정리한 것.
> 같은 스택(Capacitor + React/Vite + FastAPI)으로 신규 앱을 낼 때 이 순서대로 하면
> 시행착오를 크게 줄일 수 있음. ⚠️ 표시가 실제로 시간을 잡아먹었던 지점.

---

## 0. 시작 전 결정할 것 (나중에 못 바꿈)

| 항목 | 주의 |
|---|---|
| **번들 ID / 패키지명** | 예: `org.myapp.app`. **한번 정하면 변경 불가.** iOS·Android 통일할 것 |
| **앱 이름** | 스토어 검색·브랜딩. 나중에 변경은 가능하나 번거로움 |
| **개발자 계정 유형** | 개인 vs 조직. ⚠️ **개인이면 Android에서 "테스터 12명+14일" 의무** (아래 7번) |
| **도메인** | privacy·계정삭제 페이지용. 미리 준비 |

⚠️ **함정**: Voyage는 초기에 `com.voyage.app`으로 시작했다가 `org.voyageapp.app`으로 바꾸느라
IDE 캐시(`.idea/workspace.xml`)에 옛 패키지명이 남아 "Activity does not exist" 에러 발생.
→ **처음부터 최종 번들 ID로 시작할 것.** 바꿨다면 IDE 캐시 삭제.

---

## 1. 계정 등록 (돈 + 시간)

| | Android (Play) | iOS (App Store) |
|---|---|---|
| 비용 | **$25 일회성** | **$99/년 구독** |
| 신원확인 | 이름·주소·전화 (+신분증) | 개인/조직(D-U-N-S) |
| 소요 | 수시간~수일 | 수일 |

⚠️ **신원확인에 며칠 걸릴 수 있음.** 개발 시작할 때 **미리 등록해두면** 나중에 안 기다림.

---

## 2. 서명 준비 (잃어버리면 치명적)

### Android — keystore
```bash
keytool -genkey -v -keystore myapp-release.keystore \
  -alias myapp -keyalg RSA -keysize 2048 -validity 10000
```
- alias·비밀번호 **반드시 안전한 곳에 기록** (비밀번호 관리자 등)
- **keystore 파일을 여러 곳에 백업** (레포 밖, 클라우드). 잃으면 같은 앱 업데이트 불가
- ⚠️ **`.gitignore`에 keystore와 비밀번호 넣을 것.** 레포에 올리면 유출
- Play App Signing이 안전망이 되지만, 업로드 키 분실은 여전히 번거로움

### iOS — 인증서/프로파일
- Xcode **"Automatically manage signing"** 체크 + Team 선택하면 대부분 자동
- 수동이면: 개인키 → CSR → 인증서 발급 → App ID 등록 → 프로비저닝 프로파일 생성

---

## 3. Capacitor 설정

```
capacitor.config.ts
├── appId: "org.myapp.app"     ← 번들 ID (변경 불가)
├── appName: "MyApp"
├── webDir: "dist"
└── (스플래시·상태바 플러그인 설정)
```

**빌드 흐름**
```bash
# 웹 빌드 + 네이티브 동기화
npm run build           # vite build → dist/
npx cap sync            # dist/ → 네이티브 프로젝트 복사 + 플러그인 반영
# 또는 package.json에 스크립트로 묶기
"sync:android": "vite build --mode mobile && cap sync android"
```

⚠️ **함정**: `cap sync`가 네이티브 리소스를 덮어쓸 수 있음.
→ **sync 후에 커스텀 리소스(스플래시 등)가 살아있는지 반드시 확인.**

⚠️ **웹/모바일 API 주소 분리**: `.env.mobile`로 빌드 모드 분기.
모바일 빌드가 localhost를 바라보면 앱에서 API가 안 됨.

---

## 4. 스플래시 & 아이콘 (⚠️ 가장 많이 헤맴)

### Android 12+ 스플래시 — OS가 강제하는 규격
⚠️ **Android 12(API 31)부터 OS가 스플래시를 가져감.** 풀블리드 이미지 불가.
**"단색 배경 + 중앙 원형 아이콘"만 허용.**

필요한 파일 3개:
```
android/app/src/main/res/
├── values/colors.xml           → <color name="splash_background">#0D2B52</color>
├── values-v31/styles.xml       → Theme.SplashScreen 상속
│    ├── windowSplashScreenBackground = @color/splash_background
│    ├── windowSplashScreenAnimatedIcon = @drawable/splash_icon
│    └── postSplashScreenTheme = @style/AppTheme.NoActionBar
└── drawable/splash_icon.png    → 1152×1152, 투명 배경, 중앙에 로고
```

⚠️ **원형 마스크 잘림 주의**: 캔버스 1152 중 **가운데 원(지름 ~768~920)만 보임.**
- 가로로 긴 워드마크(글자)는 **양끝이 잘림** → 로고(심볼)만 쓰는 게 안전
- iOS 스플래시와 100% 동일하게 만들 수 없음 (OS 제약). 톤만 맞출 것

### 아이콘
- Android: `assets/icon-only.png`(1024) 등으로 `@capacitor/assets` 자동 생성 가능
- ⚠️ **Play 스토어 아이콘(512×512)은 알파 채널 금지 + 정사각 풀블리드.**
  둥근 모서리로 만들면 Play가 또 둥글게 마스킹해서 어색해짐

---

## 5. 빌드 & 버전 (⚠️ versionCode 규칙)

```gradle
// android/app/build.gradle
versionCode 1        // ⚠️ Play 전체에서 유일 + 항상 증가만. 트랙 무관
versionName "1.0"    // 사용자에게 보이는 버전
```

⚠️ **versionCode 함정 (실제로 여러 번 걸림)**:
- 한 번 Play에 올린 versionCode는 **재사용 불가** → "이미 사용된 코드" 에러
- 내부테스트/비공개테스트/프로덕션 **트랙과 무관하게 유일**해야 함
- 테스트 트랙 버전이 프로덕션보다 높아도 **정상** (테스트가 먼저니까)
- **한 릴리스에 옛 versionCode가 같이 묶이면** "더 높은 코드로 대체됨" 오류 → 옛것 제거

```bash
# 빌드
cd frontend && npm run sync:android
cd android && ./gradlew clean && ./gradlew bundleRelease
# 결과: app/build/outputs/bundle/release/app-release.aab
```

---

## 6. 스토어 그래픽 자료 (⚠️ 규격 실수 잦음)

### Android (Play)
| 항목 | 규격 | 함정 |
|---|---|---|
| 앱 아이콘 | **512×512** PNG | ⚠️ 알파 채널 금지, 풀블리드 |
| 그래픽 이미지 | **1024×500** 가로 배너 | 필수 |
| 휴대전화 스크린샷 | **9:16 (1080×1920)** 권장, 2~8장 | ⚠️ 아래 참고 |

⚠️ **스크린샷 비율 함정 (크게 헤맴)**:
- 에뮬레이터(Pixel 8 등)는 **1080×2400 (20:9)** 로 캡처됨
- Play가 "**자르기 필요**"라며 거부 → **9:16(1080×1920)** 로 만들어야 통과
- 마케팅 프레임(배경+카피) 씌울 때 **처음부터 1080×1920 캔버스**로 작업할 것

⚠️ **Play Console 칸 혼동 (실제로 한참 헤맴)**:
- **앱 아이콘** 칸 / **그래픽 이미지** 칸(가로 배너) / **휴대전화 스크린샷** 칸(세로)이 **각각 다름**
- 스크린샷을 그래픽 이미지 칸에 넣으면 계속 "자르기" 요구
- 업로드 후 뜨는 **"용도 선택" 드롭다운에서 "9:16 세로 모드"** 를 정확히 고를 것
  (PC용 Google Play Games 로고 등 엉뚱한 용도로 분류되기 쉬움)

### iOS
- 기기 크기별 스크린샷 여러 사이즈 요구 (6.7", 6.5" 등)

### 스크린샷 캡처 팁
```bash
# 에뮬레이터/실기기에서 깔끔하게 캡처
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > shot1.png
```

---

## 7. Play Console 폼 (출시를 막는 필수 항목들)

전부 채워야 "검토를 위해 앱 전송" 버튼이 활성화됨:

- ☐ **스토어 등록정보**: 앱 이름, 간단한 설명(80자), 자세한 설명(4000자), 그래픽 3종
- ☐ **개인정보처리방침 URL** (필수) — 도메인에 페이지 배포 필요
- ☐ **데이터 보안 양식**: 수집·공유 데이터 선언
  - ⚠️ 실제 수집하는 것만 정확히. (예: 이메일·음성·앱활동)
  - ⚠️ **계정 생성 앱이면 "계정 삭제 URL" 필수** → 웹페이지 미리 만들어 배포할 것
- ☐ **콘텐츠 등급** 설문
- ☐ **타겟층·콘텐츠** (연령대)
- ☐ **광고 포함 여부** 선언
- ☐ 앱 콘텐츠 선언들(정부앱·금융·건강 등)
- ☐ **국가/지역** 선택
- ☐ **버전(.aab) 업로드** + 출시노트(언어별)

⚠️ **계정 삭제 페이지**: 구글이 요구하는 3요건 — 앱/개발자명, 삭제 요청 방법(이메일 등),
삭제/보관되는 데이터와 기간. 이걸 도메인에 **미리 배포**해둘 것.

---

## 8. 테스트 트랙 (⚠️ 개인 계정의 시간 병목)

| 트랙 | 인원 | 14일 요건 충족 |
|---|---|---|
| 내부 테스트 | 최대 100명 | ❌ **안 됨** |
| **비공개 테스트** | 제한 없음 | ✅ **이것만 됨** |
| 공개 테스트 | 제한 없음 | ✅ |

⚠️ **개인 계정 필수 요건**: 프로덕션 출시 전 **테스터 12명 이상 + 14일 연속** 비공개 테스트.
(2024년 말 정책. 이전엔 20명이었다가 12명으로 완화)

⚠️ **가장 큰 오해 (반드시 인지)**:
- **테스터 이메일을 명단에 넣는 것 ≠ 참여(옵트인)**
- 명단 등록은 "권한 부여"일 뿐. **Play가 자동으로 알림·링크를 보내주지 않음**
- 개발자가 **옵트인 링크를 직접 전달** → 테스터가 클릭 → 수락 → **앱 설치**해야 카운트
- **실제 옵트인 12명**이 채워져야 14일 시작. 명단 20명이어도 옵트인 5명이면 카운트 0
- 명단에만 있고 링크를 안 받은 사람은 **아무 영향 없음**(폰에 알림 안 감)

**실전 조언**:
- 명단엔 12명보다 **넉넉히(15~20명)** 넣기 (일부는 참여 안 함)
- 옵트인 링크 위치: 비공개 테스트 트랙 → **테스터 탭** → 참여 URL
- 테스터에게 "링크 클릭 → 수락 → 설치 → **2주간 유지, 가끔 앱 열기**" 명확히 부탁
  (2026년 정책상 "설치만 하고 안 쓰면" 반려 사유가 될 수 있음)
- **개발 초기에 테스터부터 모으기 시작** — 이게 가장 큰 시간 병목

---

## 9. 출시 순서 (권장 타임라인)

```
[개발 초기] 계정 등록($25/$99) + 신원확인 + 도메인 준비 + 테스터 섭외 시작
     ↓
[개발 중]  keystore 생성·백업 / privacy·계정삭제 페이지 배포
     ↓
[빌드]     번들 ID 확정 → 스플래시·아이콘 → .aab 빌드(versionCode 1)
     ↓
[자료]     아이콘512 + 배너1024×500 + 스크린샷 9:16 6장 + 설명 문구
     ↓
[등록]     Play Console 폼 전부 채우기 → 비공개 테스트에 .aab 업로드
     ↓
[검토]     "검토를 위해 앱 전송" → 통과
     ↓
[14일] ★  옵트인 링크 배포 → 12명 참여 → 14일 카운트  ← 시간 병목
     ↓
[출시]     프로덕션 액세스 신청 → 심사 → 출시
```

★ **14일이 최대 병목**이므로, 앱이 대충 돌아가는 시점에 **일단 비공개 테스트를 시작**하고
그동안 나머지를 다듬는 게 전체 일정상 유리.

---

## 10. Capacitor 특유의 함정 (플랫폼 차이)

### iOS WebView가 `<audio>.volume`을 무시
⚠️ 오디오 볼륨을 코드로 제어 불가 → **볼륨을 음원 파일 자체에 구워넣어야** 함.
"제어권이 없으면 데이터 쪽으로 옮긴다."

### 안드로이드 녹음 포맷이 다름
⚠️ 녹음 라이브러리가 안드로이드에서 **raw AAC(ADTS)를 m4a 라벨로** 보냄
→ 서버(Whisper 등)가 인식 실패. **파일 라벨을 믿지 말고 매직바이트로 실제 포맷 감지**하고
필요시 ffmpeg로 변환할 것.

### safe-area inset
⚠️ `env(safe-area-inset-bottom)`이 안드로이드에서 과도하게 잡혀 탭바 여백이 뜸.
→ `min(env(safe-area-inset-bottom, 0px), 34px)` 로 클램프.

### window.open / 외부 링크
⚠️ WebView에서 `window.open`이 안 열릴 수 있음 → `@capacitor/browser` 고려.
앱 내 "계정 삭제", "설정 열기" 같은 버튼은 **실기기에서 반드시 테스트**.

### 권한 요청
- 마이크·카메라 등은 네이티브 권한 필요. 거부 시 **설정 화면으로 보내는 버튼** 제공
  (`capacitor-native-settings`) → 네이티브다운 UX

### 정적 파일 경로
⚠️ 빌드 파이프라인이 파일을 어디로 옮기는지 모르면 "분명 넣었는데 없다"에 빠짐.
정적 자산은 `frontend/public/` → 빌드 시 `dist/`로 복사됨. 백엔드가 보는 경로 확인.

---

## 11. 빌드 전 최종 체크리스트

```bash
# 1) 리소스가 sync 후에도 살아있는지
npx cap sync android
ls android/app/src/main/res/drawable/splash_icon.png
cat android/app/src/main/res/values-v31/styles.xml

# 2) versionCode 확인 (Play에 안 올린 새 번호인가?)
grep -nE "versionCode|versionName" android/app/build.gradle

# 3) 빌드
cd android && ./gradlew clean && ./gradlew bundleRelease
ls -lh app/build/outputs/bundle/release/app-release.aab

# 4) 서명 확인
jarsigner -verify -verbose app/build/outputs/bundle/release/app-release.aab | tail -3
```

**실기기 확인 항목**
- ☐ 스플래시가 의도대로 (Android 12+ 원형 아이콘)
- ☐ 탭바·하단 여백 정상
- ☐ 마이크 권한 요청·거부 시 설정 이동
- ☐ 외부 링크(window.open) 열림
- ☐ 오디오 볼륨·재생 정상
- ☐ API 통신 정상 (모바일 빌드가 올바른 서버를 바라보는가)

---

## 12. 한 줄 요약 — 시간을 아끼는 5가지

1. **계정 등록·신원확인·테스터 섭외를 개발 초기에 시작** (기다림이 병목)
2. **번들 ID는 처음부터 최종본으로** (변경 불가)
3. **keystore는 만들자마자 여러 곳에 백업** (분실 = 앱 업데이트 불가)
4. **스크린샷은 처음부터 9:16(1080×1920)**, 아이콘 512는 알파 없이 풀블리드
5. **비공개 테스트는 "명단 등록"이 아니라 "옵트인 링크 전달 + 실제 설치"** 가 핵심.
   12명 실제 참여해야 14일이 시작됨

---

## 부록 — 자주 쓰는 명령

```bash
# 스크린샷 캡처
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > shot.png

# 연결된 기기 확인
~/Library/Android/sdk/platform-tools/adb devices

# DNS 확인 (도메인 연결)
dig NS yourdomain.com
dig api.yourdomain.com

# keystore 지문 확인 (백업본과 동일한지)
keytool -list -v -keystore myapp-release.keystore -alias myapp
```
