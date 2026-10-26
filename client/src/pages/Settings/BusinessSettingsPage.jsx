import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateBusinessMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';

export default function BusinessSettingsPage() {
  const dispatch = useDispatch();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading }] = useUpdateBusinessMutation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', tax_id: '', address: '', currency: 'INR' });

  useEffect(() => {
    if (activeBusiness) {
      setForm({ name: activeBusiness.name || '', email: activeBusiness.email || '', phone: activeBusiness.phone || '', tax_id: activeBusiness.tax_id || '', address: activeBusiness.address || '', currency: activeBusiness.currency || 'INR' });
    }
  }, [activeBusiness]);

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const result = await updateBusiness({ id: activeBusiness.id, ...form }).unwrap();
      dispatch(updateBusinessInList(result.data.business));
      dispatch(setActiveBusiness(result.data.business));
      dispatch(addToast({ type: 'success', message: 'Business settings saved.' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to save settings.' }));
    }
  };

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
    </div>
  );
}
