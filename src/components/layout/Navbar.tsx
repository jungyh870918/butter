import { NavLink, useNavigate } from 'react-router-dom';
import { AvatarImage } from '../ui';
import { Search } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/journal', label: 'Journal' },
  { path: '/cartography', label: 'Map' },
] as const;

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── 데스크탑 ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm px-8 md:px-14 py-4 items-center gap-10"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.045)' }}
      >
        {/* 로고 */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <div className="w-6 h-6 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-sm">
            B
          </div>
          <span className="font-serif text-[1.05rem] font-semibold tracking-tight">Butter</span>
        </div>

        {/* 네비 링크 — 로고 바로 오른쪽 */}
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

        {/* 오른쪽 — 검색 + 아바타 */}
        <div className="ml-auto flex items-center gap-5">
          <div className="relative">
            <Search size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-butter-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search the library…"
              className="pl-6 pr-3 py-1 text-[12px] bg-transparent border-0 focus:outline-none text-butter-text placeholder:text-butter-muted/60 w-36 focus:w-48 transition-all duration-300"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.10)' }}
            />
          </div>
          <div className="w-7 h-7 rounded-full overflow-hidden" style={{ opacity: 0.82 }}>
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* ── 모바일 상단 ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-sm px-5 py-3.5 flex justify-between items-center"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.045)' }}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-6 h-6 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-sm">
            B
          </div>
          <span className="font-serif text-base font-semibold">Butter</span>
        </div>
        <div className="flex items-center gap-4">
          <Search size={16} className="text-butter-muted" />
          <div className="w-7 h-7 rounded-full overflow-hidden" style={{ opacity: 0.82 }}>
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── 모바일 하단 탭 ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-butter-bg/97 backdrop-blur-sm"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.045)' }}
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
