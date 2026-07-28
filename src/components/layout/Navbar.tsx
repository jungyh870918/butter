import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, X, Settings as SettingsIcon } from 'lucide-react';
import { useTheme, THEMES } from '../../hooks/useTheme';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../hooks/useAuth';

// ── 테마 선택 드롭다운 ────────────────────────────────────────────────────
const ThemePicker = () => {
  const { themeId, setTheme } = useTheme();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Change theme"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
          color: 'var(--color-butter-muted)',
          padding: '2px 7px',
          border: '1px solid var(--color-butter-rule)',
          borderRadius: '2px', lineHeight: 1.6,
          background: 'transparent', cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        <span>{currentTheme.emoji}</span>
        <span style={{ opacity: 0.7 }}>{locale === 'ko' ? currentTheme.labelKo : currentTheme.label}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--color-butter-bg)',
          border: '1px solid var(--color-butter-rule)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: '3px', overflow: 'hidden',
          minWidth: '160px', zIndex: 200,
        }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                width: '100%', padding: '0.65rem 1rem',
                background: t.id === themeId ? 'var(--color-butter-surface)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: t.id === themeId ? 600 : 400,
                letterSpacing: '0.06em',
                color: t.id === themeId ? 'var(--color-butter-text)' : 'var(--color-butter-muted)',
                textAlign: 'left',
                borderBottom: '1px solid var(--color-butter-rule)',
              }}
            >
              {/* 테마 컬러 스와치 */}
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: t.vars['--color-butter-primary'],
                border: '1px solid var(--color-butter-rule)',
              }} />
              <span>{locale === 'ko' ? t.labelKo : t.label}</span>
              {t.id === themeId && (
                <span style={{ marginLeft: 'auto', fontSize: '9px', opacity: 0.5 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const NAV_ITEMS = [
    { path: '/', label: t('nav.home') },
    { path: '/explore', label: t('nav.explore') },
    { path: '/journal', label: t('nav.journal') },
    { path: '/cartography', label: t('nav.map') },
  ] as const;

  // 검색 실행
  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchQuery('');
    setMobileSearchOpen(false);
    navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 IME 조합 중엔 무시
    if (e.key === 'Enter') submitSearch(searchQuery);
    if (e.key === 'Escape') {
      setSearchQuery('');
      (e.target as HTMLInputElement).blur();
    }
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  return (
    <>
      {/* ── 데스크탑 ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm px-8 md:px-14 py-4 items-center gap-10"
        style={{
          boxShadow: '0 1px 0 var(--color-butter-rule)',
          paddingTop: 'calc(1rem + var(--safe-top))',
        }}
      >
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <span className="font-serif text-[1.15rem] font-bold italic tracking-tight text-butter-text">Butter</span>
        </div>

        <div className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `text-[12px] uppercase tracking-[0.11em] font-medium transition-colors duration-200 ${
                  isActive ? 'text-butter-text' : 'text-butter-muted hover:text-butter-text'
                }`
              }
            >
              {({ isActive }) => (
                <span
                  className="pb-px"
                  style={isActive ? { borderBottom: '1px solid var(--color-butter-text)' } : {}}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-5">
          {/* 검색창 */}
          <div className="relative flex items-center">
            <button
              onClick={() => submitSearch(searchQuery)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted/60 hover:text-butter-muted transition-colors"
            >
              <Search size={13} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('nav.search.placeholder')}
              className="pl-8 pr-7 py-1.5 text-[16px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/50 w-40 focus:w-56 transition-all duration-300 rounded-sm"
              style={{ border: '1px solid var(--color-butter-rule)' }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-butter-muted/50 hover:text-butter-muted transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* 언어 토글 */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
            title={locale === 'en' ? '한국어로 전환' : 'Switch to English'}
            className="transition-all duration-200 hover:opacity-80"
            style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
              color: 'var(--color-butter-muted)',
              padding: '2px 6px',
              border: '1px solid var(--color-butter-rule)',
              borderRadius: '2px', lineHeight: 1.6,
            }}
          >
            {locale === 'en' ? '한' : 'EN'}
          </button>

          {/* 테마 선택기 */}
          <ThemePicker />

          {/* 유저 + 로그아웃 / 로그인 */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* 계정 설정 — 계정 삭제 진입점 (스토어 정책상 앱 내 경로 필요) */}
              <NavLink
                to="/settings"
                title={t('nav.settings')}
                className="text-[11px] font-medium transition-opacity hover:opacity-100"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.7, textDecoration: 'none' }}
              >
                {user.username}
              </NavLink>
              <button
                onClick={handleLogout}
                className="transition-opacity hover:opacity-100"
                title={locale === 'ko' ? '로그아웃' : 'Sign out'}
                style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
                  color: 'var(--color-butter-muted)', opacity: 0.45,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                }}
              >
                {locale === 'ko' ? '로그아웃' : 'Sign out'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
                color: 'var(--color-butter-muted)', opacity: 0.55,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              }}
              className="transition-opacity hover:opacity-100"
            >
              {locale === 'ko' ? '로그인' : 'Sign in'}
            </button>
          )}
        </div>
      </nav>

      {/* ── 모바일 상단 ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm"
        style={{
          boxShadow: '0 1px 0 var(--color-butter-rule)',
          // 노치·상태바 아래로 헤더를 밀어냄
          paddingTop: 'var(--safe-top)',
        }}
      >
        {/* 기본 헤더 */}
        <div className="px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-serif text-base font-bold italic tracking-tight text-butter-text">Butter</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
              style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
                color: 'var(--color-butter-muted)',
                padding: '2px 5px',
                border: '1px solid var(--color-butter-rule)',
                borderRadius: '2px', lineHeight: 1.6,
              }}
            >
              {locale === 'en' ? '한' : 'EN'}
            </button>
            <ThemePicker />
            {/* 모바일 검색 아이콘 — 클릭하면 검색창 열림 */}
            <button onClick={openMobileSearch} className="text-butter-muted hover:text-butter-text transition-colors">
              <Search size={16} />
            </button>
            {user ? (
              <>
                {/* 계정 설정 — 계정 삭제 진입점 */}
                <NavLink
                  to="/settings"
                  title={t('nav.settings')}
                  className="text-butter-muted hover:text-butter-text transition-colors"
                >
                  <SettingsIcon size={15} />
                </NavLink>
                <button
                  onClick={handleLogout}
                  style={{
                    fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
                    color: 'var(--color-butter-muted)', opacity: 0.5,
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  }}
                >
                  {locale === 'ko' ? '로그아웃' : 'Sign out'}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
                  color: 'var(--color-butter-muted)', opacity: 0.55,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                }}
              >
                {locale === 'ko' ? '로그인' : 'Sign in'}
              </button>
            )}
          </div>
        </div>

        {/* 모바일 검색 확장 바 */}
        {mobileSearchOpen && (
          <div
            className="px-5 pb-3 flex items-center gap-2"
            style={{ borderTop: '1px solid var(--color-butter-rule)' }}
          >
            <Search size={13} className="text-butter-muted/60 shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('nav.search.placeholder')}
              className="flex-1 text-[13px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/50 py-1.5"
            />
            {searchQuery ? (
              <button
                onClick={() => submitSearch(searchQuery)}
                className="text-[11px] font-medium uppercase tracking-[0.1em] text-butter-primary"
              >
                {locale === 'ko' ? '검색' : 'Go'}
              </button>
            ) : (
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="text-butter-muted/60 hover:text-butter-muted transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 모바일 하단 탭 ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-butter-bg/97 backdrop-blur-sm"
        style={{
          boxShadow: '0 -1px 0 var(--color-butter-rule)',
          // 홈 인디케이터 영역만큼 탭바 아래 여백 (안드로이드는 34px로 클램프됨)
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <div className="flex justify-around items-center py-2 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1.5 px-4 transition-colors ${
                  isActive ? 'text-butter-primary' : 'text-butter-muted'
                }`
              }
            >
              <span className="text-[9px] uppercase tracking-widest font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
