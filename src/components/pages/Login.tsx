import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocale, LocaleContext, createT, initLocale, STORAGE_KEY, type Locale } from '../../hooks/useLocale';
import { useTheme, THEMES } from '../../hooks/useTheme';

// 간이 ThemePicker (Login 페이지용 — 이모지만)
const LoginThemePicker = () => {
  const { themeId, setTheme } = useTheme();
  const idx = THEMES.findIndex((t) => t.id === themeId);
  const current = THEMES[idx] ?? THEMES[0];
  const next = THEMES[(idx + 1) % THEMES.length];
  return (
    <button
      onClick={() => setTheme(next.id)}
      title={`Switch to ${next.label}`}
      className="transition-all duration-200 hover:opacity-70"
      style={{ fontSize: '15px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {current.emoji}
    </button>
  );
};

// Login 페이지는 RootLayout 밖에 있어 LocaleProvider가 없으므로 자체 제공
const LoginInner = () => {
  const { login } = useAuth();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.message === 'Incorrect password') {
        setError(locale === 'ko' ? '비밀번호가 올바르지 않습니다.' : 'Incorrect password.');
      } else {
        setError(err.message ?? (locale === 'ko' ? '오류가 발생했습니다.' : 'Something went wrong.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--color-butter-bg)' }}
    >
      {/* 우측 상단 — 언어 + 테마 토글 */}
      <div className="fixed top-5 right-6 flex items-center gap-3">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
          className="transition-all duration-200 hover:opacity-80"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: 'var(--color-butter-muted)',
            padding: '2px 6px',
            border: '1px solid var(--color-butter-rule)',
            borderRadius: '2px',
            lineHeight: 1.6,
            background: 'transparent',
          }}
        >
          {locale === 'en' ? '한' : 'EN'}
        </button>
        <LoginThemePicker />
      </div>

      {/* 로고 */}
      <div className="mb-12 text-center">
        <span
          className="font-serif font-bold italic tracking-tight"
          style={{ fontSize: '2rem', color: 'var(--color-butter-text)' }}
        >
          Butter
        </span>
        <p
          className="font-serif italic font-light mt-2"
          style={{ fontSize: '0.95rem', color: 'var(--color-butter-muted)', opacity: 0.7 }}
        >
          {locale === 'ko' ? '당신의 독서 기록' : 'Your reading, remembered.'}
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="w-full" style={{ maxWidth: '360px' }}>
        {/* Username */}
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-[10px] uppercase tracking-[0.2em] font-medium mb-2"
            style={{ color: 'var(--color-butter-muted)' }}
          >
            {locale === 'ko' ? '아이디' : 'Username'}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            className="w-full px-4 py-3 text-[16px] font-light bg-transparent focus:outline-none transition-colors"
            style={{ border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-text)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-butter-primary)')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--color-butter-rule)')}
            placeholder={locale === 'ko' ? '아이디를 입력하세요' : 'Enter your username'}
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-[10px] uppercase tracking-[0.2em] font-medium mb-2"
            style={{ color: 'var(--color-butter-muted)' }}
          >
            {locale === 'ko' ? '비밀번호' : 'Password'}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-3 text-[16px] font-light bg-transparent focus:outline-none transition-colors"
            style={{ border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-text)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-butter-primary)')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--color-butter-rule)')}
            placeholder={locale === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password'}
            disabled={loading}
          />
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-[12px] font-light mb-5 -mt-2" style={{ color: '#e05252' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="w-full py-3 text-white font-medium uppercase tracking-[0.14em] text-[11px] transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: 'var(--color-butter-primary)', borderRadius: '2px' }}
        >
          {loading
            ? (locale === 'ko' ? '로그인 중…' : 'Signing in…')
            : (locale === 'ko' ? '로그인' : 'Continue')}
        </button>

        {/* 안내 */}
        <p
          className="text-center font-serif italic font-light mt-6"
          style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.5 }}
        >
          {locale === 'ko'
            ? '처음이라면 입력한 정보로 계정이 만들어집니다.'
            : 'First time? Your account will be created automatically.'}
        </p>
      </form>
    </div>
  );
};

export const Login = () => {
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
      <LoginInner />
    </LocaleContext.Provider>
  );
};
