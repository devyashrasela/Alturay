import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Plus } from 'lucide-react';
import { setActiveBusiness, addBusiness } from '../../store/slices/businessSlice';
import { logout } from '../../store/slices/authSlice';
import { useGetBusinessesQuery } from '../../store/api/businessApi';
import { addToast } from '../../store/slices/uiSlice';
import { businessAccent } from '../../utils/businessAccent';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import RoleBadge from '../../components/ui/Badge/RoleBadge';
import CreateBusinessModal from '../../components/business/CreateBusinessModal';
import './BusinessSelect.css';

export default function BusinessSelectPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
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

  if (isLoading) return <PageLoader />;

  return (
    <div className="biz-select">
      {/* Logo */}
      <div className="auth-logo">
        <img
          className="auth-logo__icon"
          src="/alturay_light.png"
          alt=""
          width="44"
          height="44"
          draggable="false"
        />
        <span className="auth-logo__name">Alturay</span>
      </div>

      <div className="biz-select__panel">
        <h1 className="biz-select__title">
          {businesses.length ? 'Select a business' : 'Get started'}
        </h1>
        <p className="biz-select__sub">
          {businesses.length
            ? `Welcome back, ${user?.name?.split(' ')[0]}! Choose which business to open.`
            : 'Create your first business to start using Alturay.'}
        </p>

        {/* Business list */}
        <div className="biz-select__list">
          {businesses.map((biz) => (
            <button
              type="button"
              key={biz.id}
              className="biz-card"
              onClick={() => handleSelect(biz)}
            >
              <div className={`biz-card__icon ${!biz.logo_url ? businessAccent(biz.name) : 'biz-card__icon--logo'}`}>
                {biz.logo_url ? (
                  <img
                    src={biz.logo_url}
                    alt=""
                    className="biz-card__img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.textContent = biz.name?.charAt(0).toUpperCase() || 'B';
                        e.currentTarget.parentElement.className = `biz-card__icon ${businessAccent(biz.name)}`;
                      }
                    }}
                  />
                ) : (
                  biz.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="biz-card__body">
                <div className="biz-card__name">{biz.name}</div>
                <div className="biz-card__meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {biz.qr_prefix ? <span>#{biz.qr_prefix} · </span> : null}
                  <RoleBadge role={biz.role} size="sm" />
                  <span>· {biz.currency}</span>
                </div>
              </div>
              <ChevronRight size={18} className="biz-card__chev" />
            </button>
          ))}
        </div>

        {/* Add Business */}
        <button
          type="button"
          className="biz-card biz-card--add"
          onClick={() => setShowModal(true)}
        >
          <div className="biz-card__icon">
            <Plus size={20} />
          </div>
          <span>Add a new business</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          className="biz-select__signout"
          onClick={() => {
            dispatch(logout());
            navigate('/login');
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* New Multi-Section Create Business Modal */}
      <CreateBusinessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleCreatedSuccess}
      />
    </div>
  );
}
