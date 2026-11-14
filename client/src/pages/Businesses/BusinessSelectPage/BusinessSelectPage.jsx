import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveBusiness, addBusiness } from '../../../store/slices/businessSlice';
import { logout } from '../../../store/slices/authSlice';
import { useGetBusinessesQuery } from '../../../store/api/businessApi';
import { addToast } from '../../../store/slices/uiSlice';
import { PageLoader } from '../../../components/ui/Loader/Spinner';
import Icon from '../../../components/ui/Icon/Icon';
import CreateBusinessModal from '../../../components/business/CreateBusinessModal/CreateBusinessModal';
import './BusinessSelect.css';

export default function BusinessSelectPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const currentTheme = useSelector((s) => s.theme?.currentTheme) || (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme')) || 'dark';
  const { data, isLoading } = useGetBusinessesQuery();
  const [showModal, setShowModal] = useState(false);

  const businesses = data?.data?.businesses || [];

  const handleSelect = (biz) => {
    dispatch(setActiveBusiness(biz));
    navigate('/dashboard');
  };

  const handleCreatedSuccess = (business) => {
    dispatch(addBusiness(business));
    dispatch(setActiveBusiness(business));
    dispatch(addToast({ type: 'success', message: `${business.name} created successfully!` }));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="biz-select-page">
      {/* ── Top section: Brand logo, name, and help link (no border, no header bar) ── */}
      <div className="top">
        <div className="brand">
          <img
            className="lg"
            src={currentTheme === 'light' ? '/alturay_dark.png' : '/alturay_light.png'}
            alt="Alturay"
            width="32"
            height="32"
            draggable="false"
          />
          <span>Alturay</span>
        </div>
        <div className="tr">
          <a href="mailto:support@alturay.com">
            <Icon name="help" size={18} />
            <span>Help</span>
          </a>
        </div>
      </div>

      {/* ── Architectural Blueprint Frame & Card ── */}
      <main>
        <div className="frame">
          <i className="hl t" aria-hidden="true" />
          <i className="hl b" aria-hidden="true" />
          <i className="vl l" aria-hidden="true" />
          <i className="vl r" aria-hidden="true" />
          <i className="hd tl" aria-hidden="true" />
          <i className="hd tr" aria-hidden="true" />
          <i className="hd bl" aria-hidden="true" />
          <i className="hd br" aria-hidden="true" />

          <section className="card" aria-labelledby="t">
            <h1 id="t">
              {businesses.length ? 'Select a business' : 'Get started'}
            </h1>
            <p className="biz-sub">
              {businesses.length
                ? `Welcome back, ${user?.name?.split(' ')[0] || 'there'}! Choose which business to open.`
                : 'Create your first business to start using Alturay.'}
            </p>

            <div className="list">
              {businesses.map((biz) => {
                const initial = biz.name?.charAt(0)?.toUpperCase() || 'B';
                return (
                  <button
                    key={biz.id}
                    type="button"
                    className="biz"
                    onClick={() => handleSelect(biz)}
                  >
                    <span className="tile">
                      {biz.logo_url ? (
                        <img
                          src={biz.logo_url}
                          alt=""
                          className="lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.textContent = initial;
                            }
                          }}
                        />
                      ) : (
                        initial
                      )}
                    </span>
                    <span className="tx">
                      <b>{biz.name}</b>
                      <small>
                        {biz.qr_prefix ? `#${biz.qr_prefix} · ` : ''}
                        {biz.role || 'Owner'}
                        {biz.currency ? ` · ${biz.currency}` : ''}
                      </small>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                className="biz add"
                onClick={() => setShowModal(true)}
              >
                <span className="tile">
                  <Icon name="plus" size={16} />
                </span>
                <span>Add new business</span>
              </button>
            </div>

            <button type="button" className="out" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              <span>Sign out</span>
            </button>
          </section>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <CreateBusinessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleCreatedSuccess}
        />
      )}
    </div>
  );
}
