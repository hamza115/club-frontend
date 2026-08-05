import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useSidebar } from '../context/SidebarContext';

const FULL_WIDTH = 240;
const COLLAPSED_WIDTH = 68;

export default function AppLayout({ children }) {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? COLLAPSED_WIDTH : FULL_WIDTH;

  return (
    <div className="bg-background text-on-background font-body min-h-screen">
      <Sidebar />
      <TopNavbar />
      <main
        className="min-h-screen pt-20 md:pt-[calc(4rem+40px)] px-4 md:px-gutter pb-4 md:pb-gutter transition-[margin] duration-300 ease-out ml-0 md:ml-[var(--sidebar-ml)]"
        style={{ '--sidebar-ml': `${marginLeft}px` }}
      >
        {children}
      </main>
    </div>
  );
}
