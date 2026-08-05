import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Menu, Search, CircleHelp, Power, User } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import NotificationBell from './NotificationBell';
import ProfileModal from './ProfileModal';

const FULL_WIDTH = 240;
const COLLAPSED_WIDTH = 68;

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { toggle, collapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const searchPlaceholder = (() => {
    if (location.pathname === '/inventory') return 'Search inventory...';
    if (location.pathname === '/cafe') return 'Search cafe products...';
    if (location.pathname === '/staff') return 'Search staff...';
    if (location.pathname === '/sessions') return 'Search sessions...';
    return 'Search tables, users...';
  })();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const leftOffset = collapsed ? COLLAPSED_WIDTH : FULL_WIDTH;

  return (
    <>
      <nav
        className="fixed top-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center h-16 px-4 md:px-gutter transition-[left,width] duration-300 ease-out left-0 w-full md:left-[var(--sidebar-left)] md:w-[var(--sidebar-width)]"
        style={{ '--sidebar-left': `${leftOffset}px`, '--sidebar-width': `calc(100% - ${leftOffset}px)` }}
      >
        {/* Left: hamburger (mobile) + search */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
          <div className="hidden sm:flex items-center w-64 bg-surface rounded-full px-4 py-2 border border-outline-variant/30 focus-within:border-primary transition-colors">
            <Search size={16} strokeWidth={1.8} className="text-on-surface-variant mr-2 shrink-0" />
            <input
              className="bg-transparent border-none outline-none w-full text-body font-body placeholder:text-on-surface-variant/70 text-on-surface"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <NotificationBell />
          <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all" title="Help">
            <CircleHelp size={20} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="h-9 w-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
            title="Logout"
          >
            <Power size={20} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/30 bg-primary-tint text-primary flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            title="View Profile"
          >
            {initials ? (
              <span className="font-item-title text-[12px] font-bold leading-none">{initials}</span>
            ) : (
              <User size={18} strokeWidth={1.8} className="text-on-surface-variant" />
            )}
          </button>
        </div>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
