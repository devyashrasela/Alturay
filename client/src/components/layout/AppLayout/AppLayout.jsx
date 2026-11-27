import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopNav from '../TopNav/TopNav';
import RightDock from '../RightDock/RightDock';
import UserSettingsModal from '../UserSettingsModal/UserSettingsModal';
import Toast from '../../ui/Toast/Toast';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import { useGetMeQuery } from '../../../store/api/authApi';
import { setUser } from '../../../store/slices/authSlice';
import { setBusinesses, setActiveBusiness, clearBusiness } from '../../../store/slices/businessSlice';
import { useUpdateInvoiceStatusMutation } from '../../../store/api/invoiceApi';
import { usePermissions } from '../../../hooks/usePermissions';
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
  const { can } = usePermissions();

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [userSettingsTab, setUserSettingsTab] = useState('profile');
  const [confirmAction, setConfirmAction] = useState(null);
  const [dockActions, setDockActions] = useState(null);

  // Track previous values for auto-close logic
  const prevPathnameRef = useRef(location.pathname);
  const prevMobilePathRef = useRef(location.pathname);
  const prevBusinessIdRef = useRef(activeBusinessId);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

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

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

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

  // Pages register their own contextual dock actions (e.g. product edit/delete).
  // Handlers stay in page state instead of Redux so dock data remains serializable.
  const registerDockActions = useCallback((actions) => {
    setDockActions(actions);
    return () => {
      setDockActions((current) => (current === actions ? null : current));
    };
  }, []);

  // Keyboard escape for dock and mobile navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || userSettingsOpen) return;
      if (dock?.open) handleCloseDock();
      else if (mobileNavOpen) closeMobileNav();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dock?.open, mobileNavOpen, userSettingsOpen, handleCloseDock, closeMobileNav]);

  // Auto-close dock on route change
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname && dock?.open) {
      dispatch(closeDock());
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, dock?.open, dispatch]);

  // Auto-close mobile navigation on route change
  useEffect(() => {
    if (prevMobilePathRef.current !== location.pathname && mobileNavOpen) {
      closeMobileNav();
    }
    prevMobilePathRef.current = location.pathname;
  }, [location.pathname, mobileNavOpen, closeMobileNav]);

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

  const handleDockStatusChange = async () => {
    const invoice = confirmAction?.invoice;
    const status = confirmAction?.type === 'issue'
      ? 'issued'
      : confirmAction?.type === 'paid'
        ? 'paid'
        : 'cancelled';
    if (!activeBusinessId || !invoice?.id || !confirmAction) return;
    try {
      await updateStatus({
        businessId: activeBusinessId,
        invoiceId: invoice.id,
        status,
      }).unwrap();
      dispatch(updateDockData({ status }));
      dispatch(addToast({
        type: 'success',
        message: status === 'issued'
          ? 'Invoice issued successfully.'
          : status === 'paid'
            ? 'Invoice marked as paid.'
            : 'Invoice cancelled.',
      }));
      setConfirmAction(null);
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        message: err?.data?.error?.message || `Failed to ${status === 'issued' ? 'issue' : status === 'paid' ? 'mark the invoice as paid' : 'cancel'} invoice.`,
      }));
    }
  };

  const requestDockStatusChange = (type) => (invoice) => {
    setConfirmAction({ type, invoice });
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
        onCloseMobileNav={closeMobileNav}
      />

      <div className="app-layout__main-col">
        <TopNav
          onOpenUserSettings={handleOpenUserSettings}
          onOpenHelp={() => handleOpenDock('help')}
          onOpenDock={handleOpenDock}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />

        <main className="app-layout__main" id="main">
          <Outlet
            context={{
              openDock: handleOpenDock,
              closeDock: handleCloseDock,
              isDockOpen: Boolean(dock?.open),
              dockData: dock?.data,
              registerDockActions,
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
        onEdit={can('invoice.edit_any') || can('invoice.edit_own') ? handleDockEdit : undefined}
        onIssue={can('invoice.issue') ? requestDockStatusChange('issue') : undefined}
        onMarkPaid={can('invoice.mark_paid') ? requestDockStatusChange('paid') : undefined}
        onCancel={can('invoice.cancel') ? requestDockStatusChange('cancel') : undefined}
        onDownloadPdf={handleDockPdf}
        onEditProduct={dockActions?.onEdit}
        onDeleteProduct={dockActions?.onDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        onClose={() => {
          if (!updatingStatus) setConfirmAction(null);
        }}
        onConfirm={handleDockStatusChange}
        loading={updatingStatus}
        title={
          confirmAction?.type === 'issue'
            ? 'Issue Invoice?'
            : confirmAction?.type === 'paid'
              ? 'Mark Invoice as Paid?'
              : 'Cancel Invoice?'
        }
        confirmLabel={
          confirmAction?.type === 'issue'
            ? 'Issue Invoice'
            : confirmAction?.type === 'paid'
              ? 'Mark as Paid'
              : 'Cancel Invoice'
        }
        confirmVariant={confirmAction?.type === 'paid' ? 'success' : confirmAction?.type === 'issue' ? 'primary' : 'danger'}
        message={
          confirmAction?.type === 'issue'
            ? 'Once issued, this invoice will be locked from editing and finalized for billing. Do you want to issue this invoice?'
            : confirmAction?.type === 'paid'
              ? 'Are you sure you want to mark this invoice as paid? This action will record the payment and finalize the invoice status.'
              : 'Are you sure you want to cancel this invoice? This action cannot be undone.'
        }
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
