import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ⚠️ 번들 ID — 스토어 등록 후 변경 불가. iOS·Android 동일하게 유지할 것.
  appId: 'com.butterapp.app',
  appName: 'Butter',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      // 웹 앱이 실제로 그려진 뒤 코드에서 hide() 하므로 자동 숨김은 끔.
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      // Android 12+ 는 OS 스플래시(values-v31/styles.xml)가 우선함
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      // 밝은 배경이므로 상태바 글자는 어둡게
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },

  ios: {
    contentInset: 'always',
  },

  android: {
    // 릴리스 빌드에서는 http 평문 통신 금지 (API 는 https 여야 함)
    allowMixedContent: false,
  },
};

export default config;
