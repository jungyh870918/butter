import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useMemo } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import {
  LocaleContext,
  createT,
  initLocale,
  type Locale,
  STORAGE_KEY,
} from '../../hooks/useLocale';

export const RootLayout = () => {
  const location = useLocation();
  const [locale, setLocaleState] = useState<Locale>(initLocale);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  };

  const localeValue = useMemo(
    () => ({ locale, setLocale, t: createT(locale) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  return (
    <LocaleContext.Provider value={localeValue}>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        {/*
          모바일: 상단바 + 하단탭바 여백, 데스크탑: 상단바 여백만.
          고정 헤더/탭바가 안전영역만큼 두꺼워지므로 본문 여백도 같이 늘린다.
          (각 페이지의 pt-20 은 헤더 기본 높이만 가정하므로, 노치 높이는 여기서 더해줌)
        */}
        <main className="flex-1 pt-[var(--safe-top)] pb-[calc(5rem+var(--safe-bottom))] md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </LocaleContext.Provider>
  );
};
