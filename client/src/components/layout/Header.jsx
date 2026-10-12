import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';
import { toggleTheme } from '../../store/slices/themeSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/invoices': 'Invoices & Bills',
  '/invoices/new': 'Create Invoice',
  '/settings': 'Business Settings',
  '/businesses': 'Your Businesses',
};

export default function Header() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentTheme } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);

  const pageTitle = pageTitles[location.pathname] || 'Alturay';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="app-layout__header">
      <header className="header">
        <div className="header__left">
          {/* Mobile menu toggle */}
          <button
            className="header__icon-btn"
            onClick={() => dispatch(toggleSidebar())}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>
          <h1 className="header__title">{pageTitle}</h1>
        </div>

        <div className="header__right">
          {/* Search */}
          <button className="header__icon-btn" id="header-search-btn">
            <Search size={18} />
          </button>

          {/* Notifications */}
          <button className="header__icon-btn" id="header-notifications-btn">
            <Bell size={18} />
          </button>

          {/* Theme Toggle */}
          <button
            className="header__icon-btn"
            onClick={() => dispatch(toggleTheme())}
            id="header-theme-btn"
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Avatar */}
          <div className="header__avatar" id="header-avatar">
            {initials}
          </div>
        </div>
      </header>
    </div>
  );
}
