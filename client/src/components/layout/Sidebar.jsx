import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toggleSidebar, setSidebarOpen } from '../../store/slices/uiSlice';
import SidebarNavItem from './SidebarNavItem';
import UserMenu from './UserMenu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/invoices', label: 'Invoices & Bills', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

// Track the mobile breakpoint so the drawer always renders fully expanded
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { sidebarOpen } = useSelector((state) => state.ui);

  const expanded = isMobile || sidebarOpen;
  const collapsed = !expanded;

  return (
    <div
      className={`app-layout__sidebar ${collapsed ? 'app-layout__sidebar--collapsed' : ''} ${isMobile && sidebarOpen ? 'app-layout__sidebar--open' : ''}`}
    >
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Brand + collapse/close control */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <img
              className="sidebar__logo-icon"
              src="/alturay_light.png"
              alt=""
              width="32"
              height="32"
              draggable="false"
            />
            {expanded && <span className="sidebar__brand-text">Alturay</span>}
          </div>
          {expanded ? (
            <button
              type="button"
              className="sidebar__collapse"
              onClick={() => dispatch(isMobile ? setSidebarOpen(false) : toggleSidebar())}
              title={isMobile ? 'Close menu' : 'Collapse sidebar'}
              aria-label={isMobile ? 'Close menu' : 'Collapse sidebar'}
            >
              {isMobile ? <X size={18} /> : <PanelLeftClose size={18} />}
            </button>
          ) : (
            <button
              type="button"
              className="sidebar__expand"
              onClick={() => dispatch(toggleSidebar())}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          <div className="sidebar__section-title">Menu</div>
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Account */}
        <div className="sidebar__footer">
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </div>
  );
}
