import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CircleDot,
  Users,
  Timer,
  UserCircle,
  Package,
  Receipt,
  BarChart3,
  Coffee,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import { useSettings } from '../context/SettingsContext';

const ICON_MAP = {
  LayoutDashboard,
  CircleDot,
  Users,
  Timer,
  UserCircle,
  Package,
  Receipt,
  BarChart3,
  Coffee,
  Settings,
};

const ADMIN_NAV = [
  { to: '/admin', icon: 'LayoutDashboard', label: 'Dashboard', end: true },
  { to: '/tables', icon: 'CircleDot', label: 'Tables' },
  { to: '/staff', icon: 'Users', label: 'Staff' },
  { to: '/sessions', icon: 'Timer', label: 'Sessions' },
  { to: '/customers', icon: 'UserCircle', label: 'Customers' },
  { to: '/inventory', icon: 'Package', label: 'Inventory' },
  { to: '/expenses', icon: 'Receipt', label: 'Expenses' },
  { to: '/reports', icon: 'BarChart3', label: 'Reports' },
];

const STAFF_NAV = [
  { to: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard', end: true },
  { to: '/tables', icon: 'CircleDot', label: 'Tables' },
  { to: '/sessions', icon: 'Timer', label: 'Sessions' },
  { to: '/customers', icon: 'Users', label: 'Customers' },
  { to: '/cafe', icon: 'Coffee', label: 'Cafe' },
  { to: '/inventory', icon: 'Package', label: 'Inventory' },
  { to: '/reports', icon: 'BarChart3', label: 'Reports' },
];

const BOTTOM_ITEMS = [
  { to: '/settings', icon: 'Settings', label: 'Settings' },
];

const FULL_WIDTH = 240;
const COLLAPSED_WIDTH = 68;

function SidebarLink({ to, icon, label, end, collapsed, onClick }) {
  const IconComponent = ICON_MAP[icon];

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg transition-colors duration-200 ease-out font-body text-body ${
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'text-on-secondary-container bg-secondary-container font-semibold'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
        }`
      }
    >
      {IconComponent && <IconComponent size={20} strokeWidth={1.8} className="shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const { open, close, collapsed, toggleCollapse } = useSidebar();
  const { settings } = useSettings();
  const [hovered, setHovered] = useState(false);

  const isManager = user?.role === 'manager';
  const navItems = user?.role === 'super_admin'
    ? ADMIN_NAV
    : isManager
      ? [...STAFF_NAV, { to: '/expenses', icon: 'Receipt', label: 'Expenses' }]
      : STAFF_NAV;

  const clubName = settings.clubName || 'CueMaster Elite';

  const isOverlay = collapsed && hovered;
  const sidebarWidth = isOverlay ? FULL_WIDTH : (collapsed ? COLLAPSED_WIDTH : FULL_WIDTH);
  const isCollapsed = collapsed && !isOverlay;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Desktop hover overlay when collapsed */}
      {isOverlay && (
        <div className="fixed inset-0 bg-on-background/20 backdrop-blur-[2px] z-40 hidden md:block" />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 bg-surface-container/95 backdrop-blur-xl border-r border-outline-variant/20 shadow-xl flex flex-col z-50 w-[280px] transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-title text-title shrink-0">
              C
            </div>
            <div className="min-w-0">
              <h1 className="font-item-title text-item-title text-on-surface tracking-tight font-bold leading-tight truncate">
                {clubName}
              </h1>
              <p className="font-caption text-caption text-on-surface-variant leading-tight truncate">Club Management</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={false} onClick={close} />
          ))}
        </nav>

        <div className="border-t border-outline-variant/20 shrink-0 px-3">
          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={false} onClick={close} />
          ))}
        </div>
      </aside>

      {/* ── Desktop Sidebar ── */}
      <aside
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="hidden md:flex fixed h-screen left-0 top-0 bg-surface-container/80 backdrop-blur-xl border-r border-outline-variant/20 shadow-xl flex-col z-50 transition-all duration-300 ease-out"
        style={{ width: isOverlay ? FULL_WIDTH : sidebarWidth }}
      >
        {/* Brand Header */}
        <div className={`flex items-center border-b border-outline-variant/20 shrink-0 ${isCollapsed ? 'flex-col justify-center gap-2 px-0 py-4' : 'px-4 py-4 gap-3'}`}>
          <div className="h-9 w-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-title text-title shrink-0">
            C
          </div>

          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={22} strokeWidth={1.8} />
            </button>
          )}

          {!isCollapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0 overflow-hidden">
                <h1 className="font-item-title text-item-title text-on-surface tracking-tight font-bold leading-tight truncate">
                  {clubName}
                </h1>
                <p className="font-caption text-caption text-on-surface-variant leading-tight truncate">Club Management</p>
              </div>
              <button
                onClick={toggleCollapse}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft size={22} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={isCollapsed} />
          ))}
        </nav>

        <div className={`border-t border-outline-variant/20 shrink-0 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={isCollapsed} />
          ))}
        </div>
      </aside>
    </>
  );
}
