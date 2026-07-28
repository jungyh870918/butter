# 스토어 제출 체크리스트

> 2026-07-28 기준. **✅ 표시는 실제로 검증한 것**이고, ☐ 는 브라우저에서 직접 해야 하는 일이다.
> 배경 설명은 [CHANGES-2026-07-28.md](CHANGES-2026-07-28.md), 빌드 방법은 [BUTTER-MOBILE.md](BUTTER-MOBILE.md).

---

## A. 코드·빌드 — 완료

| | 항목 | 검증 내용 |
|---|---|---|
| ✅ | Android `.aab` | `android/app/build/outputs/bundle/release/app-release.aab` (3.4MB) |
| ✅ | 서명 | `jarsigner -verify` → **jar verified** |
| ✅ | 서명 인증서 = 우리 keystore | SHA1 `B7:D5:60:C6:A4:8A:BA:C2:57:6F:68:97:B0:98:72:AE:E3:B4:F0:08` 일치 |
| ✅ | 번들에 최신 코드 | 커뮤니티 문자열 없음 / 운영 API·웹 주소 포함 확인 |
| ✅ | iOS Release 빌드 | `xcodebuild ... -configuration Release` → **BUILD SUCCEEDED** |
| ✅ | 버전 | Android `versionCode 1` / `versionName 1.0`, iOS `CURRENT_PROJECT_VERSION 1` / `MARKETING_VERSION 1.0` |
| ✅ | 번들 ID 통일 | `com.butterapp.app` (양 플랫폼) |
| ✅ | 스플래시 | 흰색으로 통일. 실행 4프레임 전부 `#ffffff` — 전환 깜빡임 없음 |
| ✅ | 런처 아이콘 | 배경 레이어 `inset 0%` (풀블리드). ⚠️ `npm run assets` 실행 시 되돌아가므로 재확인 필요 |

⚠️ **`.aab` 는 `.gitignore` 대상이라 레포에 없다.** 위 경로에서 직접 업로드할 것.
재빌드가 필요하면:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
npm run build:android:aab
```

---

## B. 서버·웹 — 완료 (배포됨)

| | 항목 | 검증 내용 |
|---|---|---|
| ✅ | 개인정보처리방침 | https://butter-black.vercel.app/privacy |
| ✅ | 계정 및 데이터 삭제 | https://butter-black.vercel.app/account-deletion |
| ✅ | 고객 지원 | https://butter-black.vercel.app/support |
| ✅ | 계정 삭제 API | `DELETE /api/auth/me` → 미인증 시 401. 운영에서 실제 삭제 성공 확인 |
| ✅ | 앱 CORS | `capacitor://localhost`, `https://localhost` 허용 / 미허용 origin 차단 |
| ✅ | 심사용 계정 | `reviewer` / `ButterReview2026` — 로그인 확인. 샘플 기록 3건·책장 3권 포함 |

---

## C. 스토어 자료 — 완료

| | 항목 | 규격 |
|---|---|---|
| ✅ | Play 앱 아이콘 | `store-assets/play-icon-512.png` — 512×512 **RGB(알파 없음)** |
| ✅ | Play 그래픽 이미지 | `store-assets/play-feature-graphic-1024x500.png` — 1024×500 |
| ✅ | Play 스크린샷 | `store-assets/screenshots/android/01~05.png` — **1080×1920 (9:16)** |
| ✅ | App Store 아이콘 | `store-assets/appstore-icon-1024.png` — 1024×1024 |
| ✅ | iOS 스크린샷 | `store-assets/screenshots/ios-6.9/01~05.png` — **1320×2868 (6.9")** |
| ✅ | 문구 글자수 | 앱이름 20/30 · 간단한설명 43/80 · 자세한설명 903/4000 · iOS부제 17/30 · 키워드 51/100 |
| ✅ | 문구 ↔ 기능 정합성 | "쓴 기록은 다른 사람에게 보이지 않습니다" — 커뮤니티 제거로 사실과 일치 |

붙여넣을 문구 전문: [store-assets/STORE-LISTING.md](store-assets/STORE-LISTING.md)

---

## D. 브라우저에서 직접 해야 하는 일

### ☐ 1. 개발자 계정 (가장 먼저 — 신원확인에 며칠)
- Google Play Console — **$25 일회성** · play.google.com/console
- Apple Developer — **$99/년** · developer.apple.com

### ☐ 2. Play Console
1. 앱 만들기 — 이름 `Butter`, 한국어, 앱, **무료** ⚠️ 무료 선택은 되돌릴 수 없음
2. 스토어 등록정보 — 문구 3종 + 그래픽 3종
   ⚠️ **앱 아이콘 / 그래픽 이미지(가로) / 휴대전화 스크린샷(세로)** 칸이 각각 다르다.
   스크린샷 업로드 후 "용도" 드롭다운에서 **"9:16 세로 모드"** 를 정확히 고를 것
3. 앱 콘텐츠
   - 개인정보처리방침 URL: `https://butter-black.vercel.app/privacy`
   - **데이터 보안 양식** — 아래 E 참고
   - 콘텐츠 등급 설문 · 타겟층 · 광고 없음 선언
4. 국가/지역 선택
5. **비공개 테스트** 트랙에 `.aab` 업로드 + 출시 노트

### ☐ 3. App Store Connect
1. 앱 등록 — 번들 ID `com.butterapp.app`, SKU 임의
2. 버전 정보 — 이름·부제·키워드·설명·스크린샷(6.9")
3. **지원 URL**: `https://butter-black.vercel.app/support`
   **개인정보처리방침 URL**: `https://butter-black.vercel.app/privacy`
4. **App Privacy** 신고 — 아래 E 참고
5. 로그인 필요 **예** → `reviewer` / `ButterReview2026`
6. 심사 메모 — STORE-LISTING.md 의 **영문** 블록 붙여넣기
7. 연령 등급 · 가격(무료) · **수출 규정 준수**(HTTPS만 사용 → 면제 선택)
8. Xcode → 타겟 **Any iOS Device** → **Product ▸ Archive** → Distribute App ▸ App Store Connect
   ⚠️ 첫 아카이브 전에 **Signing & Capabilities → Automatically manage signing** 체크 + Team 선택

### ☐ 4. 비공개 테스트 (최대 병목)
- 개인 계정은 **테스터 12~20명 + 14일 연속** 필요
  (플레이북엔 12명, 이전 Voyage 진행 기록엔 20명 — Play Console 표시값 확인할 것)
- ⚠️ **명단 등록 ≠ 참여.** 옵트인 링크를 직접 전달해야 하고, 테스터가 클릭·수락·설치해야 카운트된다
- 트랙 → 테스터 탭 → 참여 URL 을 복사해 배포
- 넉넉히 15~20명 섭외 권장

### ☐ 5. 심사 제출 → 출시

---

## E. 폼 답변 (그대로 답하면 방침과 일치)

### Play — 데이터 보안
| 질문 | 답 |
|---|---|
| 데이터 수집 | **예** |
| 수집 항목 | 아이디, 비밀번호(해시), 표시이름·아바타URL, 저널 기록, 감정 로그, 책장, 독서 프로파일 |
| 이메일·전화·실명·위치·연락처·사진·광고ID | **수집 안 함** |
| 데이터 암호화 전송 | **예** (HTTPS) |
| 데이터 삭제 요청 가능 | **예** (앱 내 + 웹) |
| **사용자 생성 콘텐츠 공개** | **아니오** — 커뮤니티 제거됨 |
| 광고 포함 | **아니오** |

### App Store — App Privacy
| 카테고리 | 항목 | Used for | Linked | Tracking |
|---|---|---|---|---|
| Identifiers | User ID | App Functionality | Yes | **No** |
| User Content | Other User Content | App Functionality | Yes | **No** |

체크하지 않는 것: Contact Info · Location · Financial · Health · Contacts ·
Browsing/Search History · Purchases · Advertising Data · Sensitive Info · Diagnostics · Usage Data

⚠️ **Tracking 에 Yes 를 하면 ATT 권한 요청이 강제된다.** Butter 는 추적하지 않으므로 반드시 No.

---

## F. 제출 전 마지막 확인

- ☐ **keystore 백업** — `~/Desktop/butter-keystore-backup/` 을 클라우드 + 외장 2곳에.
  ⚠️ 분실하면 이 앱은 영영 업데이트 불가
- ☐ 지원 이메일 — 현재 개인 Gmail 이 공개 페이지에 노출됨.
  바꾸려면 [src/components/legal/LegalPage.tsx](src/components/legal/LegalPage.tsx) 의 `SUPPORT_EMAIL` 한 줄
- ☐ 실기기에서 핵심 흐름 1회 확인 (로그인 → 6단계 기록 저장 → 보관함 → 계정삭제 진입)
- ☐ 업데이트 시 **versionCode 증가** 필수 (현재 1). 안 올리면 "이미 사용된 버전" 오류

### 검증 명령 모음
```bash
# 서명 확인
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
"$JAVA_HOME/bin/jarsigner" -verify android/app/build/outputs/bundle/release/app-release.aab

# CORS (세 줄 모두 헤더가 나오고 마지막은 차단되어야 정상)
for o in "https://butter-black.vercel.app" "capacitor://localhost" "https://localhost" "https://evil.example.com"; do
  printf "%-36s " "$o"
  curl -s -D - -o /dev/null -H "Origin: $o" \
    https://butter-backend-production.up.railway.app/api/books \
    | grep -i "access-control-allow-origin" || echo "차단됨"
done

# 법적 페이지
for p in privacy account-deletion support; do
  curl -s -o /dev/null -w "$p → %{http_code}\n" "https://butter-black.vercel.app/$p"
done
```
