import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopNav from '../TopNav/TopNav';
import RightDock from '../RightDock/RightDock';
import UserSettingsModal from '../UserSettingsModal/UserSettingsModal';
import Toast from '../../ui/Toast/Toast';
import { useGetMeQuery } from '../../../store/api/authApi';
import { setUser } from '../../../store/slices/authSlice';
import { setBusinesses, setActiveBusiness, clearBusiness } from '../../../store/slices/businessSlice';
import { useUpdateInvoiceStatusMutation } from '../../../store/api/invoiceApi';
import { openPdf } from '../../../utils/openPdf';
import {
  addToast,
  openDock,
  closeDock,
  toggleDockWide,
  updateDockData,
} from '../../../store/slices/uiSlice';
import './AppLayout.css';

const COLLAPSE_KEY = 'alturay-sidebar';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { activeBusinessId } = useSelector((state) => state.business);
  const { dock } = useSelector((state) => state.ui);

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [userSettingsTab, setUserSettingsTab] = useState('profile');

  // Track previous values for auto-close logic
  const prevPathnameRef = useRef(location.pathname);
  const prevBusinessIdRef = useRef(activeBusinessId);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const [updateStatus] = useUpdateInvoiceStatusMutation();

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

  const handleOpenDock = useCallback((type, data = null) => {
    dispatch(openDock({ type, data }));
  }, [dispatch]);

  const handleCloseDock = useCallback(() => {
    dispatch(closeDock());
  }, [dispatch]);

  const handleToggleWide = useCallback(() => {
    dispatch(toggleDockWide());
  }, [dispatch]);

  // Keyboard escape for dock
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && dock?.open && !userSettingsOpen) {
        handleCloseDock();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dock?.open, userSettingsOpen, handleCloseDock]);

  // Auto-close dock on route change
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname && dock?.open) {
      dispatch(closeDock());
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, dock?.open, dispatch]);

  // Auto-close dock on workspace switch
  useEffect(() => {
    if (prevBusinessIdRef.current != null && prevBusinessIdRef.current !== activeBusinessId && dock?.open) {
      dispatch(closeDock());
    }
    prevBusinessIdRef.current = activeBusinessId;
  }, [activeBusinessId, dock?.open, dispatch]);

  // Dock actions
  const handleDockEdit = (invoice) => {
    handleCloseDock();
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleDockIssue = async (invoice) => {
    if (!activeBusinessId || !invoice?.id) return;
    try {
      await updateStatus({
        businessId: activeBusinessId,
        invoiceId: invoice.id,
        status: 'issued',
      }).unwrap();
      dispatch(updateDockData({ status: 'issued' }));
      dispatch(addToast({ type: 'success', message: 'Invoice issued successfully.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to issue invoice.' }));
    }
  };

  const handleDockCancel = async (invoice) => {
    if (!activeBusinessId || !invoice?.id) return;
    try {
      await updateStatus({
        businessId: activeBusinessId,
        invoiceId: invoice.id,
        status: 'cancelled',
      }).unwrap();
      dispatch(updateDockData({ status: 'cancelled' }));
      dispatch(addToast({ type: 'success', message: 'Invoice cancelled.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to cancel invoice.' }));
    }
  };

  const handleDockPdf = async (invoice) => {
    if (!activeBusinessId || !invoice?.id) return;
    try {
      await openPdf(`/businesses/${activeBusinessId}/invoices/${invoice.id}/pdf`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.message || 'Failed to download PDF.' }));
    }
  };

  return (
    <div
      className={`app ${collapsed ? 'collapsed' : ''} ${dock?.open ? 'panel' : ''} ${dock?.wide ? 'wide' : ''} ${mobileNavOpen ? 'mobile-nav-open' : ''}`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="main-col right">
        <TopNav
          onOpenUserSettings={handleOpenUserSettings}
          onOpenHelp={() => handleOpenDock('help')}
          onOpenDock={handleOpenDock}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />

        <main className="main" id="main">
          <Outlet
            context={{
              openDock: handleOpenDock,
              closeDock: handleCloseDock,
              isDockOpen: Boolean(dock?.open),
              dockData: dock?.data,
            }}
          />
        </main>

        <footer className="app-footer">
          <span>&copy; 2026 Alturay. All rights reserved.</span>
        </footer>
      </div>

      <RightDock
        open={Boolean(dock?.open)}
        wide={Boolean(dock?.wide)}
        type={dock?.type}
        data={dock?.data}
        onToggleWide={handleToggleWide}
        onClose={handleCloseDock}
        onEdit={handleDockEdit}
        onIssue={handleDockIssue}
        onCancel={handleDockCancel}
        onDownloadPdf={handleDockPdf}
      />

      {userSettingsOpen && (
        <UserSettingsModal
          isOpen={userSettingsOpen}
          initialTab={userSettingsTab}
          onClose={handleCloseUserSettings}
        />
      )}

      <Toast />
    </div>
  );
}
