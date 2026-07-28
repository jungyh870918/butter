# 모바일 앱 배포 — 일반 절차 가이드 (Capacitor 기준)

> 실제 Voyage(iOS·Android) 출시 경험 기반. **처음부터 끝까지 순서대로** 정리한 정석 절차.
> (함정·시행착오 위주 정리는 `capacitor-deploy-playbook.md` 참고 — 이 둘은 짝)

---

## 전체 흐름 한눈에

```
[0] 사전 준비 — 계정·도메인·번들ID
     ↓
[1] 서명 준비 — keystore(Android) / 인증서(iOS)
     ↓
[2] 앱 빌드 — 웹 빌드 → cap sync → 네이티브 빌드
     ↓
[3] 스토어 자료 — 아이콘·스크린샷·설명·정책 페이지
     ↓
[4] 스토어 등록 — 앱 생성 → 폼 작성 → 바이너리 업로드
     ↓
[5] 테스트 — TestFlight(iOS) / 비공개 테스트(Android)
     ↓
[6] 심사 제출 → 출시
```

---

# [0] 사전 준비

## 0-1. 개발자 계정 (가장 먼저 — 승인에 시간 걸림)

| | Android | iOS |
|---|---|---|
| 사이트 | play.google.com/console | developer.apple.com |
| 비용 | **$25 일회성** | **$99/년** |
| 신원확인 | 이름·주소·서류 제출 → **며칠 소요** | 개인/조직 확인 |

**신원확인이 며칠 걸리므로 개발 초기에 등록해둘 것.** 앱이 다 됐는데 계정 때문에 기다리는 건 낭비.

## 0-2. 번들 ID / 패키지명 결정
- 예: `org.myapp.app` — **iOS·Android 통일**, 한번 정하면 **변경 불가**
- 역방향 도메인 형식 권장(`com.회사.앱` 또는 `org.앱.app`)

## 0-3. 도메인 & 필수 웹페이지
스토어가 요구하므로 미리 준비:
- **개인정보처리방침** 페이지 (`yourdomain.com/privacy`) — **양 스토어 필수**
- **계정 삭제 페이지** (`yourdomain.com/account-deletion`) — 계정 생성 앱이면 Android 필수
- 지원 이메일 (`support@yourdomain.com`)

---

# [1] 서명 준비

## 1-1. Android — keystore 생성

```bash
keytool -genkey -v -keystore myapp-release.keystore \
  -alias myapp -keyalg RSA -keysize 2048 -validity 10000
```

**생성 후 즉시 할 일:**
1. **keystore 파일을 레포 밖 안전한 곳에 백업** (클라우드 + 로컬 2곳 이상)
2. **비밀번호를 비밀번호 관리자에 저장** (대화·메모에 평문으로 남기지 말 것)
3. `.gitignore`에 추가:
```
*.keystore
*.jks
keystore.properties
```

**build.gradle 서명 설정** (비밀번호는 별도 파일로 분리):
```gradle
// keystore.properties (git 제외)
storeFile=../app/myapp-release.keystore
storePassword=...
keyAlias=myapp
keyPassword=...
```
```gradle
// build.gradle
signingConfigs {
    release {
        // keystore.properties 읽어서 설정
    }
}
buildTypes {
    release { signingConfig signingConfigs.release }
}
```

⚠️ **keystore 분실 = 그 앱의 업데이트 영영 불가.** iOS엔 없는 Android 고유 위험.

## 1-2. iOS — 인증서 / 프로비저닝

**간편한 방법 (권장)**: Xcode → 프로젝트 → **Signing & Capabilities**
- **"Automatically manage signing"** 체크
- **Team** 선택
- → 인증서·App ID·프로비저닝 프로파일을 Xcode가 자동 생성·관리

**수동이 필요한 경우**: developer.apple.com에서
1. 개인키 생성 → CSR 제출 → **인증서(Distribution)** 발급
2. **App ID** 등록 (번들 ID + 사용할 기능)
3. **프로비저닝 프로파일** 생성 (인증서 + App ID [+ 기기])

---

# [2] 앱 빌드

## 2-1. Capacitor 기본 흐름

```bash
# 1) 웹 빌드
npm run build              # vite build → dist/

# 2) 네이티브로 동기화
npx cap sync               # dist/ 복사 + 플러그인 반영

# 3) 네이티브 빌드
npx cap open ios           # Xcode 열기
npx cap open android       # Android Studio 열기
```

**package.json에 스크립트로 묶어두면 편함:**
```json
"scripts": {
  "sync:ios":     "vite build --mode mobile && cap sync ios",
  "sync:android": "vite build --mode mobile && cap sync android"
}
```

## 2-2. 버전 설정

**Android** (`android/app/build.gradle`):
```gradle
versionCode 1       // Play 전체에서 유일 + 증가만 (내부 식별용)
versionName "1.0"   // 사용자에게 보이는 버전
```

**iOS** (Xcode → General 또는 `Info.plist`):
```
Version (CFBundleShortVersionString): 1.0    ← 사용자 노출
Build   (CFBundleVersion):            1      ← 증가만, 같은 버전 내 빌드 번호
```

## 2-3. Android 릴리스 빌드 (.aab)

```bash
cd android
./gradlew clean
./gradlew bundleRelease
# 결과: app/build/outputs/bundle/release/app-release.aab

# 서명 확인
jarsigner -verify -verbose app/build/outputs/bundle/release/app-release.aab | tail -3
# → "jar verified" 나오면 OK (self-signed 경고는 정상)
```

## 2-4. iOS 아카이브 & 업로드

**방법 A — Xcode 수동 (가장 단순)**
1. Xcode에서 기기 타겟을 **"Any iOS Device"** 로 선택
2. **Product → Archive**
3. Organizer 창에서 **Distribute App → App Store Connect → Upload**

**방법 B — Xcode Cloud (자동화)**
- App Store Connect → Xcode Cloud → 워크플로 생성
- GitHub 레포 연결, 브랜치 푸시 시 자동 빌드
- ⚠️ Capacitor 프로젝트는 **빌드 전 `npm install` + `vite build` + `cap sync`** 가 필요
  → `ios/App/ci_scripts/ci_post_clone.sh` 스크립트 작성 필요
- ⚠️ **Node 버전 주의**: Capacitor CLI가 최신 Node를 요구할 수 있음. 스크립트에서 Node 버전 명시
- ⚠️ 스크립트에 **실행 권한** 필요:
```bash
chmod +x ios/App/ci_scripts/ci_post_clone.sh
git update-index --chmod=+x ios/App/ci_scripts/ci_post_clone.sh   # git에 실행비트 기록
```
- ⚠️ 워크플로의 **"배포 준비"** 를 TestFlight 또는 App Store Connect로 설정해야 빌드가 전달됨
  (기본값 "없음"이면 아카이브만 하고 아무 데도 안 보냄)

**업로드 후**: App Store Connect에서 빌드가 **"처리 중" → "사용 가능"** 이 될 때까지 15~30분 대기.

---

# [3] 스토어 자료 준비

## 3-1. 그래픽

**Android (Play)**
| 항목 | 규격 |
|---|---|
| 앱 아이콘 | 512×512 PNG, **알파 채널 금지**, 정사각 풀블리드 |
| 그래픽 이미지 | 1024×500 가로 배너 (필수) |
| 스크린샷 | **9:16 (1080×1920)** 권장, 2~8장 |

**iOS (App Store)**
| 항목 | 규격 |
|---|---|
| 앱 아이콘 | 1024×1024 (Xcode 에셋에 포함) |
| 스크린샷 | 기기 크기별 (6.7", 6.5" 등) — 요구 사이즈 확인 |

**스크린샷 캡처**
```bash
# Android 에뮬레이터/실기기
adb exec-out screencap -p > shot1.png

# iOS 시뮬레이터
xcrun simctl io booted screenshot shot1.png
```

## 3-2. 텍스트
- **앱 이름**
- **간단한 설명** (Android 80자)
- **자세한 설명** (Android 4000자) / iOS 설명
- **키워드** (iOS)
- **출시 노트 / 새로운 기능**

## 3-3. 정책 페이지 (배포 완료 상태여야 함)
- 개인정보처리방침 URL
- 계정 삭제 URL (해당 시)

---

# [4] 스토어 등록

## 4-1. Android (Play Console)

1. **앱 만들기** — 이름, 기본 언어, 앱/게임, 무료/유료
   - ⚠️ **무료 선택은 되돌릴 수 없음**
2. **스토어 등록정보** — 설명, 그래픽 3종
3. **앱 콘텐츠** 섹션 (전부 채워야 출시 가능):
   - 개인정보처리방침 URL
   - **데이터 보안** 양식 (수집·공유 데이터 선언)
   - **콘텐츠 등급** 설문
   - **타겟층 및 콘텐츠** (연령대)
   - **광고 포함 여부**
   - 정부앱·금융·건강 등 선언
4. **국가/지역** 선택
5. **테스트 트랙에 .aab 업로드** + 출시 노트

## 4-2. iOS (App Store Connect)

1. **앱 등록** — 이름, 번들 ID, SKU, 기본 언어
2. **버전 정보** — 설명, 키워드, 스크린샷, 지원 URL
3. **앱 개인정보 보호(App Privacy)** — 수집 데이터 라벨
4. **연령 등급** 설문
5. **가격 및 사용 가능 여부**
6. **빌드 첨부** — 업로드된 빌드를 버전에 연결
7. **수출 규정 준수** — HTTPS만 쓰면 보통 면제 선택

---

# [5] 테스트

## 5-1. iOS — TestFlight
- 빌드 업로드 후 TestFlight에서 **내부 테스터**(팀원, 최대 100명)에게 바로 배포 가능
- 외부 테스터는 간단한 심사 필요
- **실기기 확인 필수 항목**: 로그인, API 통신, 권한(마이크/카메라), 결제, 오디오 등
- ⚠️ 특히 **API 주소를 바꾼 뒤 첫 빌드**라면 실기기에서 백엔드 연결 확인 필수

## 5-2. Android — 테스트 트랙

| 트랙 | 인원 | 프로덕션 요건 충족 |
|---|---|---|
| 내부 테스트 | 최대 100명 | ❌ |
| **비공개 테스트** | 제한 없음 | ✅ |
| 공개 테스트 | 제한 없음 | ✅ |

⚠️ **개인 계정은 프로덕션 출시 전 "비공개 테스트 12명 이상 + 14일 연속" 필수**

**옵트인 절차 (중요)**:
1. 테스터 이메일을 목록에 등록 (= 권한 부여일 뿐)
2. **옵트인 링크를 개발자가 직접 전달** (Play가 자동 발송 안 함)
3. 테스터가 링크 클릭 → 수락 → **앱 설치**
4. **실제 옵트인 12명**이 채워지면 14일 카운트 시작

---

# [6] 심사 & 출시

## 6-1. 심사 제출
- **Android**: 모든 필수 항목 완료 → "검토를 위해 앱 전송"
- **iOS**: 버전 페이지에서 "심사를 위해 제출"

## 6-2. 심사 기간 (경험적)
| | 기간 |
|---|---|
| Android | 보통 수 시간 ~ 며칠 (첫 출시는 더 걸림) |
| iOS | 보통 1~3일 (사람이 심사, 더 엄격) |

## 6-3. 출시
- **Android**: 비공개 테스트 14일 충족 → **프로덕션 액세스 신청** → 심사 → 출시
- **iOS**: 심사 통과 → 수동 출시 또는 자동 출시 선택

---

# 업데이트 배포 (2회차부터)

```
코드 수정
  ↓
버전 올리기
  Android: versionCode +1 (versionName은 필요시)
  iOS:     Build +1 (Version은 필요시)
  ↓
빌드 (.aab / Archive)
  ↓
업로드 → 출시 노트 작성 → 심사 제출
```

⚠️ **versionCode / Build 번호를 안 올리면 "이미 사용된 버전" 에러**로 업로드 거부됨.

---

# 자주 겪는 문제

| 증상 | 원인·해결 |
|---|---|
| "버전 코드가 이미 사용됨" | versionCode 증가 필요. 트랙 무관하게 유일해야 함 |
| "이 APK는 더 높은 버전으로 대체됨" | 한 릴리스에 옛 versionCode가 묶임 → 옛것 제거 |
| 앱 아이콘 거부 | 알파 채널 제거, 정사각 풀블리드로 |
| 스크린샷 "자르기 필요" | 비율 안 맞음 → 9:16(1080×1920)로 재작업 |
| Xcode Cloud 빌드 실패 | ci 스크립트 실행권한/Node 버전/cap sync 누락 확인 |
| 빌드 업로드했는데 안 보임 | "처리 중" 대기 (15~30분). 처리 후 버전에 첨부 |
| 심사 거부 | 사유 확인 → 수정 → 재제출. 개인정보·권한 설명 부족이 흔함 |

---

# 배포 전 최종 체크리스트

**공통**
- ☐ 번들 ID가 iOS·Android 통일되고 스토어 등록과 일치
- ☐ 버전 번호 올림 (versionCode / Build)
- ☐ 프로덕션 API 주소를 바라보는지 (localhost 아님)
- ☐ 개인정보처리방침·계정삭제 페이지가 실제로 열리는지
- ☐ 실기기에서 핵심 기능 동작 확인

**Android**
- ☐ keystore로 서명됨 (`jarsigner -verify` → jar verified)
- ☐ keystore·비밀번호 백업 완료
- ☐ 앱 콘텐츠 폼 전부 완료
- ☐ 테스터 12명 옵트인 진행 중

**iOS**
- ☐ Archive → 업로드 성공, 빌드 "사용 가능"
- ☐ 버전에 빌드 첨부됨
- ☐ 스크린샷·설명·App Privacy 완료
- ☐ 수출 규정 준수 답변 완료

---

## 핵심 요약

1. **계정 등록·신원확인은 개발 초기에** (며칠 걸림)
2. **번들 ID와 keystore는 되돌릴 수 없다** — 신중히 정하고 즉시 백업
3. **빌드 = 웹 빌드 → cap sync → 네이티브 빌드** (3단계)
4. **스토어는 폼이 많다** — 데이터 보안·콘텐츠 등급·정책 URL 미리 준비
5. **Android 개인계정은 12명+14일이 최대 병목** — 가장 먼저 시작할 것
6. **업데이트마다 버전 번호 증가** 잊지 말 것
