import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FileText, Receipt, ArrowRight } from 'lucide-react';
import { useUpdateBusinessMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import { TEMPLATE_META } from '../../constants/templates';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';

export default function BusinessSettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading }] = useUpdateBusinessMutation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    address: '',
    currency: 'INR',
  });

  useEffect(() => {
    if (activeBusiness) {
      setForm({
        name: activeBusiness.name || '',
        email: activeBusiness.email || '',
        phone: activeBusiness.phone || '',
        tax_id: activeBusiness.tax_id || '',
        address: activeBusiness.address || '',
        currency: activeBusiness.currency || 'INR',
      });
    }
  }, [activeBusiness]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const result = await updateBusiness({ id: activeBusiness.id, ...form }).unwrap();
      const updatedBusiness = {
        ...activeBusiness,
        ...result.data.business,
      };
      dispatch(updateBusinessInList(updatedBusiness));
      dispatch(setActiveBusiness(updatedBusiness));
      dispatch(addToast({ type: 'success', message: 'Business settings saved.' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to save settings.' }));
    }
  };

  const invoiceTpl = TEMPLATE_META[activeBusiness?.invoice_template_id || 'classic'] || TEMPLATE_META.classic;
  const billTpl = TEMPLATE_META[activeBusiness?.bill_template_id || 'receipt'] || TEMPLATE_META.receipt;
  const isReceipt = (activeBusiness?.bill_template_id || 'receipt') === 'receipt';
  const paperWidth = activeBusiness?.receipt_paper_width || 80;

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Business Settings</h2>
          <p className="page-header__sub">
            Update your business profile and billing details.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave} className="settings-form" autoComplete="off">
          <FormField label="Business name" required>
            <InputField id="s-name" value={form.name} onChange={setField('name')} placeholder="Business name" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="Email">
              <InputField id="s-email" type="email" value={form.email} onChange={setField('email')} placeholder="contact@business.com" />
            </FormField>
            <FormField label="Phone">
              <InputField id="s-phone" type="tel" value={form.phone} onChange={setField('phone')} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <FormField label="Tax ID / GST Number">
            <InputField id="s-tax" value={form.tax_id} onChange={setField('tax_id')} placeholder="22AAAAA0000A1Z5" />
          </FormField>
          <FormField label="Address">
            <InputField textarea id="s-addr" value={form.address} onChange={setField('address')} placeholder="Full business address…" style={{ minHeight: 80 }} />
          </FormField>
          <FormField label="Default currency">
            <InputField id="s-currency" value={form.currency} onChange={setField('currency')} placeholder="INR" />
          </FormField>
          <div className="settings-form__actions">
            <Button type="submit" variant="primary" size="md" loading={isLoading} id="save-settings-btn">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* PDF & Billing Templates Section */}
      <div style={{ marginTop: '32px' }}>
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="page-header__title" style={{ fontSize: '18px' }}>Billing & Invoice Templates</h3>
            <p className="page-header__sub">
              Select and configure the default print and PDF templates for your business documents.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Invoice Template Card */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-primary-subtle, rgba(244, 91, 42, 0.12))',
                    color: 'var(--color-primary, #f45b2a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Invoice Template</h4>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>A4 format for clients</span>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  background: 'var(--color-bg-muted, #f1f5f9)',
                  color: 'var(--color-text-main, #111827)',
                  textTransform: 'uppercase',
                }}>
                  {invoiceTpl.name}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1, lineHeight: 1.5 }}>
                {invoiceTpl.description}
              </p>
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/settings/templates/invoice')}
                >
                  Configure Invoice Template <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Bill Template Card */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-primary-subtle, rgba(244, 91, 42, 0.12))',
                    color: 'var(--color-primary, #f45b2a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Bill Template</h4>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {isReceipt ? `Thermal POS · ${paperWidth} mm` : 'A4 Document'}
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  background: 'var(--color-bg-muted, #f1f5f9)',
                  color: 'var(--color-text-main, #111827)',
                  textTransform: 'uppercase',
                }}>
                  {billTpl.name}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1, lineHeight: 1.5 }}>
                {billTpl.description}
              </p>
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/settings/templates/bill')}
                >
                  Configure Bill Template <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
