# Butter 모바일 앱 (Capacitor) — 프로젝트 전용 가이드

> 일반 절차는 [mobile-deploy-general-guide.md](mobile-deploy-general-guide.md),
> 함정 모음은 [capacitor-deploy-playbook.md](capacitor-deploy-playbook.md) 참고.
> 이 문서는 **Butter 레포에 실제로 적용된 설정과 남은 할 일**만 다룬다.

---

## 확정된 값 (변경 불가/주의)

| 항목 | 값 |
|---|---|
| **번들 ID (iOS·Android 공통)** | `com.butterapp.app` ⚠️ 스토어 등록 후 변경 불가 |
| 앱 이름 | `Butter` |
| webDir | `dist` |
| versionName / MARKETING_VERSION | `1.0` |
| versionCode / CURRENT_PROJECT_VERSION | `1` |
| 최소 지원 | Android API 24 / iOS 14+ |

---

## ⚠️ 출시 전 반드시 해야 할 일

### 1. 백엔드 CORS 에 앱 origin 추가 — ⚠️ **현재 앱에서 API 가 막혀 있음**

API 주소는 [.env.mobile](.env.mobile) 에 반영 완료
(`https://butter-backend-production.up.railway.app` — Vercel `VITE_API_BASE_URL` 과 동일).

문제는 **CORS**. 앱의 WebView origin 은 웹사이트 주소가 아니다:

| 플랫폼 | origin |
|---|---|
| iOS | `capacitor://localhost` |
| Android | `https://localhost` |

butter-backend 의 `src/app.ts` 는 `ALLOWED_ORIGINS` 를 콤마로 잘라 **정확히 일치**하는지만 보고,
불일치하면 `callback(new Error(...))` → errorHandler → **500** 을 던진다.

**Railway 의 `ALLOWED_ORIGINS` 를 아래로 교체할 것:**
```
https://butter-black.vercel.app,capacitor://localhost,https://localhost
```

검증:
```bash
for o in "https://butter-black.vercel.app" "capacitor://localhost" "https://localhost"; do
  printf "%-38s " "$o"
  curl -s -D - -o /dev/null -H "Origin: $o" \
    https://butter-backend-production.up.railway.app/api/books \
    | grep -i "access-control-allow-origin" || echo "차단됨"
done
```
세 줄 모두 `access-control-allow-origin` 이 나와야 정상.

> 인증은 별도 조치 불필요 — 백엔드가 login 응답 **body 에 `token`** 을 담아주고
> 프론트가 localStorage + `Authorization: Bearer` 로 쓰므로 쿠키 SameSite 와 무관하게 동작한다.

> 앱 origin 을 바꾸는 방법(`server.hostname`)도 있으나, 백엔드 화이트리스트에 추가하는 쪽이 정석.

- API 주소는 반드시 **https**. Android 릴리스는 평문 http 차단(`allowMixedContent: false`), iOS 는 ATS 차단.
- 웹 빌드(`npm run build`)는 `.env` / `.env.local` 을, 모바일 빌드(`npm run build:mobile`)는 `.env.mobile` 을 읽는다.
- `.env.mobile` 수정 후에는 반드시 `npm run sync`.

### 2. keystore 생성 (Android)
```bash
keytool -genkey -v -keystore butter-release.keystore \
  -alias butter -keyalg RSA -keysize 2048 -validity 10000
mv butter-release.keystore android/
cp android/keystore.properties.example android/keystore.properties
# → keystore.properties 에 실제 비밀번호 입력
```
⚠️ **분실하면 앱 업데이트가 영영 불가.** 만들자마자 레포 밖 2곳 이상에 백업.
`*.keystore`, `keystore.properties` 는 [.gitignore](.gitignore) 처리되어 있음.

`android/keystore.properties` 가 없으면 릴리스 빌드는 **서명 없이** 통과한다
(빌드는 되지만 스토어 업로드 불가). 있으면 자동으로 서명된다.

### 3. 필수 웹페이지 배포
- **계정 삭제 URL — ✅ 구현 완료.** Vercel 재배포 후 아래 주소를 스토어 폼에 입력:
  ```
  https://butter-black.vercel.app/account-deletion
  ```
  ⚠️ [AccountDeletion.tsx](src/components/pages/AccountDeletion.tsx) 의 `SUPPORT_EMAIL` 이
  현재 개인 Gmail 이다. 공개 페이지이므로 필요하면 지원용 주소로 교체할 것.
- **개인정보처리방침 URL — ✅ 구현 완료.** Vercel 재배포 후:
  ```
  https://butter-black.vercel.app/privacy
  ```
  ⚠️ 이 문서의 내용은 Play **데이터 보안 양식** / App Store **앱 개인정보 보호** 답변과
  **정확히 일치해야 한다.** 코드가 바뀌면(수집 항목·제3자 전송) 이 페이지도 함께 고칠 것.

  현재 문서가 선언한 사실 — 폼 작성 시 그대로 답하면 됨:
  | 항목 | 답 |
  |---|---|
  | 수집 | 아이디·비밀번호해시·표시이름·아바타URL, 저널 기록, 감정 로그, 책장, 독서 프로파일 |
  | 미수집 | 이메일·전화·실명·위치·연락처·사진·광고ID |
  | 권한 | 카메라·마이크·위치 **없음** |
  | 광고 | **없음** / 분석·추적 SDK **없음** |
  | 제3자 전송 | OpenAI(저널 본문·구절), Google Books·Kakao(검색어), DiceBear(아이디), Neon·Railway·Vercel(인프라) |
  | 다른 이용자에게 공개 | **없음** (커뮤니티 기능 제거됨) |
  | 데이터 삭제 요청 | 가능 (앱 내 + 웹) |

#### 계정 삭제 기능 (구현 완료)
Google Play 정책이 요구하는 **앱 내 경로 + 웹 경로** 를 모두 갖췄다.

| 위치 | 경로 |
|---|---|
| 앱 내 | 로그인 → 상단 ⚙️ → 설정 → Danger Zone → 계정 삭제 (비밀번호 재확인) |
| 웹 (심사자용) | `/account-deletion` — 로그인 불필요 |
| API | `DELETE /api/auth/me` (Bearer + 비밀번호 재확인) |

⚠️ **삭제 순서가 중요하다.** `schema.prisma` 의 참조 액션이 제각각이라
`prisma.user.delete()` 만 호출하면 실패하거나 데이터가 남는다:
- `JournalEntry.user` / `EmotionLog.user` → onDelete 미지정 = **Restrict** (삭제 차단)
- `Reflection.user` → **SetNull** (글이 작성자명과 함께 공개된 채 남음)
- `UserProfile` → **관계 자체가 없음** (userId 컬럼만) — 고아 레코드로 남음

그래서 `butter-backend/src/routes/auth.ts` 에서
Reflection → JournalEntry → EmotionLog → BookShelf → UserProfile → User
순서로 한 트랜잭션에서 지운다. **스키마를 바꾸면 이 순서도 재검토할 것.**

### 4. Apple / Google 개발자 계정
신원확인에 며칠 걸리므로 지금 등록해둘 것 ($99/년 / $25 일회성).
개인 계정이면 **비공개 테스트 12명 옵트인 + 14일** 이 최대 병목 — 가장 먼저 시작.

---

## 일상 빌드 명령

```bash
npm run build:mobile     # vite build --mode mobile → dist/
npm run sync             # 위 + cap sync (ios & android)
npm run sync:ios         # iOS 만
npm run sync:android     # Android 만
npm run open:ios         # Xcode 열기
npm run open:android     # Android Studio 열기
npm run assets           # assets/*.png → 네이티브 아이콘·스플래시 재생성
python3 scripts/make-assets.py   # 아이콘 원본 자체를 다시 그림
```

### 로컬 백엔드에 붙여서 테스트하기
```bash
# .env.mobile 을 잠시 로컬 서버로 돌린 뒤 sync
#   iOS 시뮬레이터  → http://localhost:PORT   (ATS 가 loopback 은 허용함)
#   Android 에뮬레이터 → http://10.0.2.2:PORT  (호스트를 가리키는 특수 IP)
```
- Android debug 빌드는 [src/debug/](android/app/src/debug/) 오버레이 덕분에 위 주소에
  평문 http 로 붙을 수 있다. **release 빌드에는 병합되지 않는다** (확인 완료).
- ⚠️ 단, Android WebView 는 앱을 `https://localhost` 로 서빙하므로 `http://` API 호출은
  **mixed content** 로 차단된다. 로컬 테스트 중에만 `allowMixedContent: true` 로 바꾸고
  **반드시 되돌릴 것.** 운영은 https API 이므로 해당 없음.
- 로컬 백엔드의 `ALLOWED_ORIGINS` 에도 `capacitor://localhost,https://localhost` 를 넣어야 한다.

### Android 릴리스 (.aab)
```bash
npm run build:android:aab
# → android/app/build/outputs/bundle/release/app-release.aab
jarsigner -verify -verbose android/app/build/outputs/bundle/release/app-release.aab | tail -3
```

⚠️ **이 맥에는 시스템 java 가 없다.** Gradle 을 CLI 로 돌리려면:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```
Android Studio GUI 로 빌드하면 불필요.

### iOS 아카이브
```bash
npm run sync:ios && npm run open:ios
```
Xcode → 타겟을 **Any iOS Device** → **Product ▸ Archive** →
Organizer → **Distribute App ▸ App Store Connect ▸ Upload**

첫 아카이브 전에 **Signing & Capabilities → Automatically manage signing** 체크 + Team 선택.

---

## 이 프로젝트에 적용된 모바일 대응

일반 웹 앱을 WebView 에 넣을 때 깨지는 부분들을 미리 손봐둠.

| 파일 | 내용 |
|---|---|
| [src/lib/native.ts](src/lib/native.ts) | 네이티브 브리지. 웹에서는 전부 no-op |
| [src/router.tsx](src/router.tsx) | **네이티브에서만 hash 라우터**. `capacitor://` 로컬 서버는 `/journal` 같은 경로 새로고침 시 index.html 폴백을 보장하지 않아 흰 화면이 됨 |
| [src/App.tsx](src/App.tsx) | 첫 프레임 후 스플래시 숨김, 상태바 색 동기화, Android 하드웨어 뒤로가기 |
| [src/index.css](src/index.css) | `--safe-top/bottom` 변수. ⚠️ `--safe-bottom` 은 안드로이드 과다 인셋 때문에 **34px 로 클램프** |
| [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx) | 상단바에 `--safe-top`, 하단 탭바에 `--safe-bottom` |
| [src/components/layout/RootLayout.tsx](src/components/layout/RootLayout.tsx) | `<main>` 에 `--safe-top` — 각 페이지의 `pt-20` 은 헤더 기본 높이만 가정하므로 노치 높이를 여기서 더함 |
| Home / BookDetail | `window.open` → `openExternal()`. WebView 에서 `window.open` 이 안 열리므로 `@capacitor/browser` 사용 |

### 스플래시 / 아이콘
- 원본은 [scripts/make-assets.py](scripts/make-assets.py) 가 생성 (Georgia Italic "B" + 골드 그라디언트)
- **Android 12+**: [values-v31/styles.xml](android/app/src/main/res/values-v31/styles.xml) —
  단색 배경(`#faf8f4`) + 중앙 원형 아이콘. 캔버스 1152 중 **가운데 원만 보이므로 심볼 "B" 만** 사용
  (워드마크 "Butter" 를 넣으면 양끝이 잘림). iOS 스플래시는 워드마크라 **완전히 동일하지 않음 — OS 제약**
- **Play 아이콘 512** 는 [store-assets/play-icon-512.png](store-assets/play-icon-512.png) — 알파 없음, 풀블리드

⚠️ `npm run assets` 는 `mipmap-anydpi-v26/ic_launcher*.xml` 을 **덮어쓴다.**
배경 레이어의 `inset 16.7%` 를 제거해둔 상태이므로, 재생성 후 아래로 되돌아갔는지 확인:
```bash
grep inset android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml   # background 에 inset 이 없어야 함
```

---

## sync 후 확인 (플레이북 11번)

`cap sync` 가 네이티브 리소스를 덮어쓸 수 있으므로:
```bash
ls  android/app/src/main/res/drawable/splash_icon.png
cat android/app/src/main/res/values-v31/styles.xml
cat android/app/src/main/res/values/colors.xml
grep -n "hasKeystore" android/app/build.gradle
grep -nE "versionCode|versionName" android/app/build.gradle
```

---

## 스토어 자료 현황

| 항목 | 규격 | 상태 |
|---|---|---|
| Play 앱 아이콘 | 512×512, 알파 금지 | ✅ `store-assets/play-icon-512.png` |
| Play 그래픽 이미지 | 1024×500 | ✅ `store-assets/play-feature-graphic-1024x500.png` |
| App Store 아이콘 | 1024×1024 | ✅ `store-assets/appstore-icon-1024.png` (Xcode 에셋에도 포함됨) |
| **Play 스크린샷** | **9:16 (1080×1920)** 2~8장 | ❌ 직접 캡처 필요 |
| **iOS 스크린샷** | 6.7" 등 기기별 | ❌ 직접 캡처 필요 |

⚠️ 에뮬레이터 기본 캡처는 **1080×2400 (20:9)** 라 Play 가 "자르기 필요" 로 거부한다.
**1080×1920 캔버스로 다시 만들 것.** 업로드 후 "용도" 드롭다운에서 **"9:16 세로 모드"** 선택.

```bash
# Android
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > shot1.png
# iOS
xcrun simctl io booted screenshot shot1.png
```

---

## 업데이트 배포 (2회차부터)

```
Android: android/app/build.gradle 의 versionCode +1
iOS:     Xcode ▸ General ▸ Build (CURRENT_PROJECT_VERSION) +1
```
⚠️ 안 올리면 "이미 사용된 버전 코드" 로 업로드 거부됨. versionCode 는 **트랙 무관하게 유일**해야 함.

---

## 실기기 확인 체크리스트

- ☐ **API 통신** ← Railway `ALLOWED_ORIGINS` 수정 전까지는 반드시 실패함 (위 1번)
- ☐ 로그인 / 토큰 저장 (localStorage 가 WebView 에서 유지되는가)
- ☐ 스플래시 (Android 12+ 원형 아이콘)
- ☐ 상단 노치·하단 탭바 여백
- ☐ 하드웨어 뒤로가기 (Android)
- ☐ 외부 링크 (교보문고 / Amazon 버튼 → in-app browser)
- ☐ 공유 카드 (`/share/:bookId`) 진입
- ☐ 계정 삭제 (설정 → Danger Zone) — 실계정으로 하지 말 것, 테스트 계정 사용
