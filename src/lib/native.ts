// ── Capacitor 네이티브 브리지 ────────────────────────────────────────────
// 웹(브라우저)에서는 전부 no-op 이 되도록 방어적으로 작성.
// 웹 빌드에는 아무 영향이 없어야 함.

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/**
 * 공유용 공개 링크의 베이스 주소.
 *
 * ⚠️ 네이티브에서 window.location.origin 은 WebView 내부 주소다
 *    (Android `https://localhost`, iOS `capacitor://localhost`).
 *    그대로 공유하면 받은 사람이 열 수 없으므로 공개 웹 주소를 써야 한다.
 *    웹에서는 현재 origin 이 곧 공개 주소라 그대로 쓴다.
 */
export function publicBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_WEB_URL;
  if (isNative && configured) return configured.replace(/\/$/, '');
  return window.location.origin;
}

/**
 * 외부 URL 열기.
 * ⚠️ WebView 안에서 window.open 은 무시되거나 빈 창이 뜨는 경우가 있어
 *    네이티브에서는 in-app browser 로 연다. (플레이북 10번 항목)
 */
export async function openExternal(url: string) {
  if (isNative) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * 스플래시 숨기기 — 웹 앱이 실제로 그려진 뒤에 호출.
 * capacitor.config.ts 에서 launchAutoHide:false 로 두었기 때문에 필수.
 */
export async function hideSplash() {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    /* 스플래시가 이미 사라진 경우 등 — 무시 */
  }
}

/** 현재 테마의 배경색을 읽어 상태바 색을 맞춘다. */
async function syncStatusBarToTheme() {
  if (!isNative) return;
  try {
    const bg =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-butter-bg')
        .trim() || '#ffffff';

    // Butter 테마는 전부 밝은 배경 → 상태바 글자는 어둡게(Style.Light)
    await StatusBar.setStyle({ style: Style.Light });

    // setBackgroundColor 는 Android 전용 (iOS 는 no-op 이 아니라 에러를 던짐)
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: bg });
    }
  } catch {
    /* 상태바 제어 실패는 치명적이지 않음 */
  }
}

/**
 * 앱 부팅 시 1회 호출되는 네이티브 초기화.
 * 반환값은 정리(cleanup) 함수.
 */
export async function initNative(): Promise<() => void> {
  if (!isNative) return () => {};

  await syncStatusBarToTheme();

  // 테마 전환 시 상태바 색도 따라가도록 <html> 속성 변경을 관찰
  const observer = new MutationObserver(() => void syncStatusBarToTheme());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class', 'data-theme'],
  });

  // ── Android 하드웨어 뒤로가기 ──────────────────────────────────────
  // 기본 동작은 "앱 종료" 라서, 히스토리가 있으면 뒤로가기로 처리한다.
  const backHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack || window.history.length > 1) {
      window.history.back();
    } else {
      void CapApp.exitApp();
    }
  });

  return () => {
    observer.disconnect();
    void backHandle.remove();
  };
}
