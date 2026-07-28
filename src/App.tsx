import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './hooks/useAuth';
import { initNative, hideSplash, isNative } from './lib/native';

export default function App() {
  useEffect(() => {
    if (!isNative) return;

    // 네이티브 전용 CSS 훅 (index.css 의 .capacitor-native 규칙용)
    document.documentElement.classList.add('capacitor-native');

    let cleanup: (() => void) | undefined;
    void initNative().then((fn) => {
      cleanup = fn;
    });

    // 첫 프레임이 그려진 뒤 스플래시 제거 — 흰 화면 깜빡임 방지
    const raf = requestAnimationFrame(() => void hideSplash());

    return () => {
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
