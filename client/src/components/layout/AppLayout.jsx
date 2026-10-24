import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../ui/Toast/Toast';
import { useGetMeQuery } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';
import { setBusinesses, setActiveBusiness } from '../../store/slices/businessSlice';
import { setSidebarOpen } from '../../store/slices/uiSlice';

export default function AppLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { activeBusinessId } = useSelector((state) => state.business);

  const { data: meData } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (meData?.data?.user) {
      const user = meData.data.user;
      dispatch(setUser(user));
      if (user.businesses?.length) {
        dispatch(setBusinesses(user.businesses));
        // Restore active business or default to first
        if (activeBusinessId) {
          const found = user.businesses.find((b) => b.id === activeBusinessId);
          if (found) dispatch(setActiveBusiness(found));
          else dispatch(setActiveBusiness(user.businesses[0]));
        } else {
          dispatch(setActiveBusiness(user.businesses[0]));
        }
      }
    }
  }, [meData, dispatch, activeBusinessId]);

  // Close the mobile drawer after navigating
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      dispatch(setSidebarOpen(false));
    }
  }, [location.pathname, dispatch]);

  return (
    <div className="app-layout">
      <Sidebar />
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => dispatch(setSidebarOpen(false))}
        className={`app-layout__overlay ${sidebarOpen ? 'app-layout__overlay--visible' : ''}`}
      />
      <div className={`app-layout__main ${!sidebarOpen ? 'app-layout__main--sidebar-collapsed' : ''}`}>
        <Header />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
