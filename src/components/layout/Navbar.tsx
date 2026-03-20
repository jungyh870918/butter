import { NavLink, useNavigate } from 'react-router-dom';
import { AvatarImage } from '../ui';
import { Search, Book as BookIcon, PenTool, Map, Home as HomeIcon } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/explore', icon: BookIcon, label: 'Explore' },
  { path: '/journal', icon: PenTool, label: 'Journal' },
  { path: '/cartography', icon: Map, label: 'Map' },
] as const;

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── 데스크탑 상단 바 ── */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-butter-bg/80 backdrop-blur-md border-b border-butter-accent px-6 py-4 justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-xl">
            B
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight">Butter</span>
        </div>

        <div className="flex gap-8 items-center">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'text-butter-primary font-semibold'
                    : 'text-butter-muted hover:text-butter-text'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-sm uppercase tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Search size={20} className="text-butter-muted cursor-pointer hover:text-butter-text" />
          <div className="w-8 h-8 rounded-full bg-butter-accent overflow-hidden border border-butter-accent">
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* ── 모바일 상단 미니 바 ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-butter-bg/90 backdrop-blur-md border-b border-butter-accent px-4 py-3 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-7 h-7 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-lg">
            B
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">Butter</span>
        </div>
        <div className="flex items-center gap-3">
          <Search size={18} className="text-butter-muted" />
          <div className="w-7 h-7 rounded-full bg-butter-accent overflow-hidden border border-butter-accent">
            <AvatarImage src="https://i.pravatar.cc/150?u=user" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── 모바일 하단 탭바 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-butter-bg/95 backdrop-blur-md border-t border-butter-accent">
        <div className="flex justify-around items-center py-2 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-butter-primary' : 'text-butter-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
