import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import store from './store';
import AppLayout from './components/layout/AppLayout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RequirePermission from './routes/RequirePermission';
import { PageLoader } from './components/ui/Loader/Spinner';
import { usePermissions } from './hooks/usePermissions';
import { getHomePath } from './components/layout/navConfig';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/Landing/LandingPage/LandingPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage/RegisterPage'));
const BusinessSelectPage = lazy(() => import('./pages/Businesses/BusinessSelectPage/BusinessSelectPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage/ProductsPage'));
const InvoicesPage = lazy(() => import('./pages/Invoices/InvoicesPage/InvoicesPage'));
const CreateInvoicePage = lazy(() => import('./pages/Invoices/CreateInvoicePage/CreateInvoicePage'));
const InvoiceDetailPage = lazy(() => import('./pages/Invoices/InvoiceDetailPage/InvoiceDetailPage'));
const CustomersPage = lazy(() => import('./pages/Customers/CustomersPage/CustomersPage'));
const BusinessSettingsPage = lazy(() => import('./pages/Settings/business/BusinessSettingsPage/BusinessSettingsPage'));
const UsersAccessPage = lazy(() => import('./pages/Settings/users/UsersAccessPage/UsersAccessPage'));
const InvoiceSettingsPage = lazy(() => import('./pages/Invoices/InvoiceSettingsPage/InvoiceSettingsPage'));
const InvoiceTemplatePage = lazy(() => import('./pages/Settings/InvoiceTemplatePage/InvoiceTemplatePage'));
const BillTemplatePage = lazy(() => import('./pages/Settings/BillTemplatePage/BillTemplatePage'));
const PersonalizationPage = lazy(() => import('./pages/Settings/PersonalizationPage/PersonalizationPage'));
const UserSettingsLayout = lazy(() => import('./components/settings/UserSettingsLayout/UserSettingsLayout'));

function AuthenticatedFallback() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { activeBusinessId } = useSelector((state) => state.business);
  const { can } = usePermissions();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!activeBusinessId) return <Navigate to="/businesses" replace />;
  return <Navigate to={getHomePath(can)} replace />;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-main)',
              }}
            >
              <PageLoader />
            </div>
          }
        >
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Auth-only (no business needed) */}
            <Route element={<ProtectedRoute requireBusiness={false} />}>
              <Route path="/businesses" element={<BusinessSelectPage />} />
            </Route>

            {/* Fully protected (auth + business) */}
            <Route element={<ProtectedRoute requireBusiness={true} />}>
              {/* User-level settings use their own shell, not the workspace sidebar */}
              <Route path="/settings/personalization" element={<UserSettingsLayout />}>
                <Route index element={<PersonalizationPage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route element={<RequirePermission permission="dashboard.view" />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                <Route element={<RequirePermission permission="product.view" />}>
                  <Route path="/products" element={<ProductsPage />} />
                </Route>

                <Route element={<RequirePermission permission="invoice.view" />}>
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                </Route>

                <Route element={<RequirePermission permission="invoice.create" />}>
                  <Route path="/invoices/new" element={<CreateInvoicePage />} />
                </Route>

                <Route element={<RequirePermission anyOf={['invoice.edit_any', 'invoice.edit_own']} />}>
                  <Route path="/invoices/:id/edit" element={<CreateInvoicePage />} />
                </Route>

                <Route element={<RequirePermission permission="billing.configure" />}>
                  <Route path="/billing/templates/invoice" element={<InvoiceTemplatePage />} />
                  <Route path="/billing/templates/bill" element={<BillTemplatePage />} />
                  <Route path="/billing/settings" element={<InvoiceSettingsPage />} />
                </Route>

                {/* Backwards-compatible aliases */}
                <Route path="/settings/templates/invoice" element={<Navigate to="/billing/templates/invoice" replace />} />
                <Route path="/settings/templates/bill" element={<Navigate to="/billing/templates/bill" replace />} />
                <Route path="/invoices/templates/invoice" element={<Navigate to="/billing/templates/invoice" replace />} />
                <Route path="/invoices/templates/bill" element={<Navigate to="/billing/templates/bill" replace />} />

                <Route element={<RequirePermission permission="business.update_profile" />}>
                  <Route path="/settings" element={<BusinessSettingsPage />} />
                </Route>

                <Route element={<RequirePermission permission="member.view" />}>
                  <Route path="/settings/users" element={<UsersAccessPage />} />
                </Route>

                <Route element={<RequirePermission permission="customer.view" />}>
                  <Route path="/customers" element={<CustomersPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<AuthenticatedFallback />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
