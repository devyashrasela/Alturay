import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ChevronRight, LogOut } from 'lucide-react';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import { logout } from '../../store/slices/authSlice';
import { useGetBusinessesQuery, useCreateBusinessMutation } from '../../store/api/businessApi';
import { addBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 48, height: 48, background: 'var(--color-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24 }}>A</div>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>Alturay</span>
      </div>

      <div style={{ width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>
          {businesses.length ? 'Select a business' : 'Get started'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 32 }}>
          {businesses.length
            ? `Welcome back, ${user?.name?.split(' ')[0]}! Choose which business to open.`
            : 'Create your first business to start using Alturay.'}
        </p>

        {/* Business list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => handleSelect(biz)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', border: '1px solid var(--color-border)', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-ring)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 48, height: 48, background: 'var(--color-primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {biz.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>{biz.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {biz.role} · {biz.currency}
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-muted)" />
            </button>
          ))}
        </div>

        {/* Add Business */}
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: '2px dashed var(--color-border)', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500, transition: 'all 150ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          <Plus size={20} />
          <span>Add a new business</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => { dispatch(logout()); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px auto 0', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 13, cursor: 'pointer' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
