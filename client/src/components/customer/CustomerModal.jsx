import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../store/api/customerApi';
import { addToast } from '../../store/slices/uiSlice';
import Modal from '../ui/Modal/Modal';
import FormField from '../ui/FormField/FormField';
import InputField from '../ui/Input/InputField';
import Button from '../ui/Button/Button';
import SearchableStateDropdown from '../ui/Select/SearchableStateDropdown';

const EMPTY_CUSTOMER_FORM = {
  name: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
};

export default function CustomerModal({
  isOpen,
  onClose,
  customer = null,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { activeBusinessId } = useSelector((s) => s.business);
  const [form, setForm] = useState(EMPTY_CUSTOMER_FORM);

  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
      });
    } else {
      setForm(EMPTY_CUSTOMER_FORM);
    }
  }, [customer, isOpen]);

  const handleChange = (field) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      dispatch(addToast({ type: 'error', message: 'Customer name is required.' }));
      return;
    }

    try {
      let saved;
      if (customer) {
        saved = await updateCustomer({
          businessId: activeBusinessId,
          customerId: customer.id,
          ...form,
        }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Customer updated successfully.' }));
      } else {
        saved = await createCustomer({
          businessId: activeBusinessId,
          ...form,
        }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Customer created successfully.' }));
      }

      const returnedCustomer = saved?.data?.customer || saved?.customer || form;
      if (onSuccess) {
        onSuccess(returnedCustomer);
      }
      onClose();
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to save customer.',
        })
      );
    }
  };

  const isEditing = Boolean(customer);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={creating || updating}>
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-stack">
          <FormField label="Customer name" required>
            <InputField
              id="cust-name-modal"
              name="name"
              placeholder="e.g. Acme Corporation or John Doe"
              value={form.name}
              onChange={handleChange('name')}
              autoFocus
            />
          </FormField>

          <div className="form-grid-2">
            <FormField label="Phone number">
              <InputField
                id="cust-phone-modal"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange('phone')}
              />
            </FormField>

            <FormField label="Email address">
              <InputField
                id="cust-email-modal"
                name="email"
                type="email"
                placeholder="customer@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
            </FormField>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 8px', paddingTop: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Billing Address
            </span>
          </div>

          <FormField label="Address Line 1">
            <InputField
              id="cust-line1-modal"
              name="address_line1"
              placeholder="Flat / Building / Street address"
              value={form.address_line1}
              onChange={handleChange('address_line1')}
            />
          </FormField>

          <FormField label="Address Line 2 (optional)">
            <InputField
              id="cust-line2-modal"
              name="address_line2"
              placeholder="Suite, unit, floor, landmark"
              value={form.address_line2}
              onChange={handleChange('address_line2')}
            />
          </FormField>

          <div className="form-grid-2">
            <FormField label="City">
              <InputField
                id="cust-city-modal"
                name="city"
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={handleChange('city')}
              />
            </FormField>

            <FormField label="State">
              <SearchableStateDropdown
                id="cust-state-modal"
                value={form.state}
                onChange={(st) => setForm((f) => ({ ...f, state: st }))}
                placeholder="Select State"
              />
            </FormField>
          </div>

          <FormField label="PIN Code">
            <InputField
              id="cust-pincode-modal"
              name="pincode"
              placeholder="e.g. 400001"
              value={form.pincode}
              onChange={handleChange('pincode')}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
