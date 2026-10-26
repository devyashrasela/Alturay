import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { PageLoader } from './components/ui/Loader/Spinner';

// Lazy-loaded pages
const LandingPage         = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage           = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage        = lazy(() => import('./pages/Auth/RegisterPage'));
const BusinessSelectPage  = lazy(() => import('./pages/Businesses/BusinessSelectPage'));
const DashboardPage       = lazy(() => import('./pages/Dashboard/DashboardPage'));
const ProductsPage        = lazy(() => import('./pages/Products/ProductsPage'));
const InvoicesPage        = lazy(() => import('./pages/Invoices/InvoicesPage'));
const CreateInvoicePage   = lazy(() => import('./pages/Invoices/CreateInvoicePage'));
const InvoiceDetailPage   = lazy(() => import('./pages/Invoices/InvoiceDetailPage'));
const BusinessSettingsPage = lazy(() => import('./pages/Settings/BusinessSettingsPage'));
const PersonalizationPage = lazy(() => import('./pages/Settings/PersonalizationPage'));
const UserSettingsLayout  = lazy(() => import('./components/settings/UserSettingsLayout'));

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-main)' }}><PageLoader /></div>}>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
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
                <Route path="/dashboard"       element={<DashboardPage />} />
                <Route path="/products"        element={<ProductsPage />} />
                <Route path="/invoices"        element={<InvoicesPage />} />
                <Route path="/invoices/new"    element={<CreateInvoicePage />} />
                <Route path="/invoices/:id"    element={<InvoiceDetailPage />} />
                <Route path="/settings"        element={<BusinessSettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
