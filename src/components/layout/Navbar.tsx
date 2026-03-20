import { NavLink, useNavigate } from 'react-router-dom';
import { AvatarImage } from '../ui';
import { Search, Book as BookIcon, PenTool, Map, Home as HomeIcon } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/explore', icon: BookIcon, label: 'Explore' },
  { path: '/journal', icon: PenTool, label: 'Journal' },
  { path: '/cartography', icon: Map, label: 'Cartography' },
] as const;

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-butter-bg/80 backdrop-blur-md border-b border-butter-accent px-6 py-4 flex justify-between items-center">
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
            <span className="hidden md:inline text-sm uppercase tracking-widest">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Search size={20} className="text-butter-muted cursor-pointer hover:text-butter-text" />
        <div className="w-8 h-8 rounded-full bg-butter-accent overflow-hidden border border-butter-accent">
          <img src="https://i.pravatar.cc/150?u=user" alt="User" referrerPolicy="no-referrer" />
        </div>
      </div>
    </nav>
  );
};
