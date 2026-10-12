import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import { logout } from '../../store/slices/authSlice';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/invoices', label: 'Invoices & Bills', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { activeBusiness, businesses } = useSelector((state) => state.business);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);

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
    <div className={`app-layout__sidebar ${!sidebarOpen ? 'app-layout__sidebar--collapsed' : ''}`}>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">A</div>
          {sidebarOpen && <span className="sidebar__logo-text">Alturay</span>}
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar__item"
          onClick={() => dispatch(toggleSidebar())}
          style={{ marginBottom: '8px' }}
        >
          {sidebarOpen ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
          {sidebarOpen && <span>Collapse</span>}
        </button>

        {/* Business Switcher */}
        {sidebarOpen && activeBusiness && (
          <div className="biz-switcher" style={{ marginBottom: '16px' }}>
            <button
              className="biz-switcher__trigger"
              onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            >
              <div className="biz-switcher__icon">
                {activeBusiness.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="biz-switcher__info">
                <div className="biz-switcher__name">{activeBusiness.name}</div>
                <div className="biz-switcher__role">{activeBusiness.role || 'Owner'}</div>
              </div>
              <ChevronDown size={16} className="biz-switcher__chevron" />
            </button>

            {bizDropdownOpen && (
              <div className="biz-switcher__dropdown">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    className={`biz-switcher__option ${biz.id === activeBusiness.id ? 'biz-switcher__option--active' : ''}`}
                    onClick={() => handleSwitchBusiness(biz)}
                  >
                    <div className="biz-switcher__icon">
                      {biz.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="biz-switcher__info">
                      <div className="biz-switcher__name">{biz.name}</div>
                    </div>
                  </button>
                ))}
                <button
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
          <div className="sidebar__section-title">
            {sidebarOpen ? 'Menu' : ''}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
              }
            >
              <item.icon size={20} className="sidebar__item-icon" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <button className="sidebar__item" onClick={handleLogout}>
            <LogOut size={20} className="sidebar__item-icon" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </div>
  );
}
