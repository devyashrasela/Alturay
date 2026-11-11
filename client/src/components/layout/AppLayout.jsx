import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import SecondarySidebar from './SecondarySidebar';
import QuickActions from './QuickActions';
import UserSettingsModal from './UserSettingsModal';
import Toast from '../ui/Toast/Toast';
import { NAV_SECTIONS, filterNavForPermissions } from './navConfig';
import { useGetMeQuery } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';
import { setBusinesses, setActiveBusiness, clearBusiness } from '../../store/slices/businessSlice';
import { usePermissions } from '../../hooks/usePermissions';
import './appShell.css';

const COLLAPSE_KEY = 'alturay_secnav_collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

export default function AppLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { activeBusinessId } = useSelector((state) => state.business);
  const { can } = usePermissions();

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [userSettingsTab, setUserSettingsTab] = useState('profile');

  const filteredSections = filterNavForPermissions(NAV_SECTIONS, can);
  const section = filteredSections.find((s) => s.match(location.pathname)) || null;
  const hasSidebar = Boolean(section?.sidebar && (section.sidebar.pill || section.sidebar.groups?.length > 0));

  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  // Body classes to coordinate layout margin transitions
  useEffect(() => {
    document.body.classList.toggle('has-sb', Boolean(hasSidebar && !collapsed));
    document.body.classList.toggle('has-rail', Boolean(hasSidebar && collapsed));

    return () => {
      document.body.classList.remove('has-sb', 'has-rail');
    };
  }, [hasSidebar, collapsed]);

  // Identity + business restore
  useEffect(() => {
    if (meData?.data?.user) {
      const user = meData.data.user;
      dispatch(setUser(user));
      if (user.businesses?.length) {
        dispatch(setBusinesses(user.businesses));
        if (activeBusinessId) {
          const found = user.businesses.find((b) => b.id === activeBusinessId);
          dispatch(setActiveBusiness(found || user.businesses[0]));
        } else {
          dispatch(setActiveBusiness(user.businesses[0]));
        }
      } else {
        dispatch(clearBusiness());
      }
    }
  }, [meData, dispatch, activeBusinessId]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const handleOpenUserSettings = useCallback((tab = 'profile') => {
    setUserSettingsTab(tab);
    setUserSettingsOpen(true);
  }, []);

  const handleCloseUserSettings = useCallback(() => {
    setUserSettingsOpen(false);
  }, []);

  return (
    <>
      <TopNav onOpenUserSettings={handleOpenUserSettings} />

      <SecondarySidebar
        section={section}
        collapsed={hasSidebar && collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <main className="main" id="main">
        <Outlet />
      </main>

      <QuickActions />

      {userSettingsOpen && (
        <UserSettingsModal
          key={userSettingsTab}
          isOpen={userSettingsOpen}
          initialTab={userSettingsTab}
          onClose={handleCloseUserSettings}
        />
      )}

      <Toast />
    </>
  );
}
