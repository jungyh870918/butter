import { RouterProvider } from 'react-router-dom';
import { useState } from 'react';
import { router } from './router';
import {
  LocaleContext,
  createT,
  initLocale,
  type Locale,
  STORAGE_KEY,
} from './hooks/useLocale';
import { AuthProvider } from './hooks/useAuth';

export default function App() {
  const [locale, setLocaleState] = useState<Locale>(initLocale);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  };

  return (
    <AuthProvider>
      <LocaleContext.Provider value={{ locale, setLocale, t: createT(locale) }}>
        <RouterProvider router={router} />
      </LocaleContext.Provider>
    </AuthProvider>
  );
}
