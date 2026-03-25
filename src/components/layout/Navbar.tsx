import { NavLink, useNavigate } from 'react-router-dom';
import { AvatarImage } from '../ui';
import { Search } from 'lucide-react';
import { useTheme, THEMES } from '../../hooks/useTheme';
import { useLocale } from '../../hooks/useLocale';

export const Navbar = () => {
  const navigate = useNavigate();
  const { themeId, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.id === themeId);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.id);
  };

  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const nextTheme = THEMES[(THEMES.findIndex((t) => t.id === themeId) + 1) % THEMES.length];

  const NAV_ITEMS = [
    { path: '/', label: t('nav.home') },
    { path: '/explore', label: t('nav.explore') },
    { path: '/journal', label: t('nav.journal') },
    { path: '/cartography', label: t('nav.map') },
  ] as const;

  return (
    <>
      {/* ── 데스크탑 ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm px-8 md:px-14 py-4 items-center gap-10"
        style={{ boxShadow: '0 1px 0 var(--color-butter-rule)' }}
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
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted/60 pointer-events-none" />
            <input
              type="text"
              placeholder={t('nav.search.placeholder')}
              className="pl-8 pr-3 py-1.5 text-[12px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/50 w-40 focus:w-52 transition-all duration-300 rounded-sm"
              style={{ border: '1px solid var(--color-butter-rule)' }}
            />
          </div>

          {/* 언어 토글 */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
            title={locale === 'en' ? '한국어로 전환' : 'Switch to English'}
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
            }}
          >
            {locale === 'en' ? '한' : 'EN'}
          </button>

          {/* 테마 토글 */}
          <button
            onClick={cycleTheme}
            title={`Switch to ${nextTheme.label}`}
            className="transition-all duration-200 hover:opacity-70"
            style={{ fontSize: '15px', lineHeight: 1 }}
          >
            {currentTheme.emoji}
          </button>

          <div className="w-7 h-7 rounded-full overflow-hidden" style={{ opacity: 0.82 }}>
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* ── 모바일 상단 ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm px-5 py-3.5 flex justify-between items-center"
        style={{ boxShadow: '0 1px 0 var(--color-butter-rule)' }}
      >
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
          <button onClick={cycleTheme} style={{ fontSize: '16px', lineHeight: 1 }}>
            {currentTheme.emoji}
          </button>
          <Search size={16} className="text-butter-muted" />
          <div className="w-7 h-7 rounded-full overflow-hidden" style={{ opacity: 0.82 }}>
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── 모바일 하단 탭 ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-butter-bg/97 backdrop-blur-sm"
        style={{ boxShadow: '0 -1px 0 var(--color-butter-rule)' }}
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
