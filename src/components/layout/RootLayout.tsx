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

        {/* 모바일: 상단바 + 하단탭바 여백, 데스크탑: 상단바 여백만 */}
        <main className="flex-1 pb-20 md:pb-0">
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
