import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateBusinessMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import SearchableStateDropdown from '../../components/ui/Select/SearchableStateDropdown';

export default function BusinessSettingsPage() {
  const dispatch = useDispatch();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading }] = useUpdateBusinessMutation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    currency: 'INR',
  });

  useEffect(() => {
    if (activeBusiness) {
      setForm({
        name: activeBusiness.name || '',
        email: activeBusiness.email || '',
        phone: activeBusiness.phone || '',
        tax_id: activeBusiness.tax_id || '',
        address_line1: activeBusiness.address_line1 || '',
        address_line2: activeBusiness.address_line2 || '',
        city: activeBusiness.city || '',
        state: activeBusiness.state || '',
        pincode: activeBusiness.pincode || '',
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

          {/* ── Business Address ── */}
          <div style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Business Address
            </h4>
            <FormField label="Address line 1" required>
              <InputField
                id="s-line1"
                value={form.address_line1}
                onChange={setField('address_line1')}
                placeholder="Shop/Floor/Building number, Street name"
              />
            </FormField>
            <FormField label="Address line 2">
              <InputField
                id="s-line2"
                value={form.address_line2}
                onChange={setField('address_line2')}
                placeholder="Area, Locality or Landmark"
              />
            </FormField>
            <div className="form-grid-3">
              <FormField label="City" required>
                <InputField
                  id="s-city"
                  value={form.city}
                  onChange={setField('city')}
                  placeholder="City / District"
                />
              </FormField>
              <FormField label="State" required>
                <SearchableStateDropdown
                  id="s-state"
                  value={form.state}
                  onChange={(val) => setForm((f) => ({ ...f, state: val }))}
                  placeholder="Select State"
                />
              </FormField>
              <FormField label="Pin code" required>
                <InputField
                  id="s-pincode"
                  value={form.pincode}
                  onChange={setField('pincode')}
                  placeholder="e.g. 110001"
                />
              </FormField>
            </div>
          </div>

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
