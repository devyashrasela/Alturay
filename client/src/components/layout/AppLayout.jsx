import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import SecondarySidebar from './SecondarySidebar';
import Toast from '../ui/Toast/Toast';
import { getActiveSection } from './navConfig';
import { useGetMeQuery } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';
import { setBusinesses, setActiveBusiness } from '../../store/slices/businessSlice';
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

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const section = getActiveSection(location.pathname);
  const hasSidebar = Boolean(section?.sidebar);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  // Identity + business restore: unchanged from the previous layout.
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
      }
    }
  }, [meData, dispatch, activeBusinessId]);

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setDrawerOpen(false);
  }

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable: preference just won't persist */
      }
      return next;
    });
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="shell">
      <TopNav drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerOpen(true)} />

      <div className="shell__body">
        <SecondarySidebar
          section={section}
          collapsed={hasSidebar && collapsed}
          onToggleCollapse={toggleCollapsed}
          drawerOpen={drawerOpen}
          onCloseDrawer={closeDrawer}
        />
        <main className="shell__content">
          <div className="shell__content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <Toast />
    </div>
  );
}