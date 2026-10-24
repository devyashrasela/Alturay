import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Check,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toggleSidebar, setSidebarOpen } from '../../store/slices/uiSlice';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import { logout } from '../../store/slices/authSlice';
import { businessAccent } from '../../utils/businessAccent';

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { activeBusiness, businesses } = useSelector((state) => state.business);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const switcherRef = useRef(null);

  const expanded = isMobile || sidebarOpen;
  const collapsed = !expanded;

  // Close the switcher on outside click / Escape
  useEffect(() => {
    if (!bizDropdownOpen) return undefined;
    const handlePointer = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setBizDropdownOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setBizDropdownOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [bizDropdownOpen]);

  const handleSwitchBusiness = (biz) => {
    dispatch(setActiveBusiness(biz));
    setBizDropdownOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

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

        {/* Business switcher */}
        {activeBusiness && (
          <div className="biz-switcher" ref={switcherRef} style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className="biz-switcher__trigger"
              onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={bizDropdownOpen}
            >
              <div className={`biz-switcher__icon ${businessAccent(activeBusiness.name)}`}>
                {activeBusiness.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="biz-switcher__info">
                <div className="biz-switcher__name">{activeBusiness.name}</div>
                <div className="biz-switcher__role">{activeBusiness.role || 'Owner'}</div>
              </div>
              <ChevronDown size={16} className="biz-switcher__chevron" />
            </button>

            {bizDropdownOpen && (
              <div
                className={`biz-switcher__dropdown ${collapsed ? 'biz-switcher__dropdown--floating' : ''}`}
                role="listbox"
              >
                {businesses.map((biz) => (
                  <button
                    type="button"
                    key={biz.id}
                    className={`biz-switcher__option ${biz.id === activeBusiness.id ? 'biz-switcher__option--active' : ''}`}
                    onClick={() => handleSwitchBusiness(biz)}
                  >
                    <div className={`biz-switcher__icon ${businessAccent(biz.name)}`}>
                      {biz.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="biz-switcher__info">
                      <div className="biz-switcher__name">{biz.name}</div>
                      <div className="biz-switcher__role">{biz.role || 'Owner'}</div>
                    </div>
                    {biz.id === activeBusiness.id && <Check size={16} className="biz-switcher__check" />}
                  </button>
                ))}
                <button
                  type="button"
                  className="biz-switcher__add"
                  onClick={() => { setBizDropdownOpen(false); navigate('/businesses'); }}
                >
                  <Plus size={16} />
                  <span>Add Business</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar__nav">
          <div className="sidebar__section-title">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
              }
            >
              <item.icon size={20} className="sidebar__item-icon" />
              {expanded && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <button type="button" className="sidebar__item" onClick={handleLogout}>
            <LogOut size={20} className="sidebar__item-icon" />
            {expanded && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </div>
  );
}
