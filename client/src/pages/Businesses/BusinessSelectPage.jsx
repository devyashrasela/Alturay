import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Plus } from 'lucide-react';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import { logout } from '../../store/slices/authSlice';
import { useGetBusinessesQuery, useCreateBusinessMutation } from '../../store/api/businessApi';
import { addBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import { businessAccent } from '../../utils/businessAccent';
import Modal from '../../components/ui/Modal/Modal';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import { PageLoader } from '../../components/ui/Loader/Spinner';

export default function BusinessSelectPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { data, isLoading } = useGetBusinessesQuery();
  const [createBusiness, { isLoading: creating }] = useCreateBusinessMutation();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'INR' });

  const businesses = data?.data?.businesses || [];

  const handleSelect = (biz) => {
    dispatch(setActiveBusiness(biz));
    navigate('/dashboard');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createBusiness(form).unwrap();
      dispatch(addBusiness(result.data.business));
      dispatch(setActiveBusiness(result.data.business));
      dispatch(addToast({ type: 'success', message: `${form.name} created!` }));
      setShowModal(false);
      navigate('/dashboard');
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to create business.' }));
    }
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
              <div className={`biz-card__icon ${businessAccent(biz.name)}`}>
                {biz.name?.charAt(0).toUpperCase()}
              </div>
              <div className="biz-card__body">
                <div className="biz-card__name">{biz.name}</div>
                <div className="biz-card__meta">{biz.role} · {biz.currency}</div>
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
          onClick={() => { dispatch(logout()); navigate('/login'); }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Create Business Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create a new business"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>Create Business</Button>
          </>
        }
      >
        <div className="biz-select__modal-form">
          <FormField label="Business name" required>
            <InputField id="biz-name" name="name" placeholder="e.g. Acme Corp" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Currency">
            <InputField id="biz-currency" name="currency" placeholder="INR" value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
