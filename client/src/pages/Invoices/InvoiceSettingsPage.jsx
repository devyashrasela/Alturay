import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateBusinessMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';

const INVOICE_DUE_PRESETS = [0, 7, 15, 30, 45, 60];
const BILL_DUE_PRESETS = [0, 7, 15, 30];

export default function InvoiceSettingsPage() {
  const dispatch = useDispatch();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading }] = useUpdateBusinessMutation();

  const [form, setForm] = useState({
    default_payment_methods: ['cash'],
    default_payment_terms: '',
    default_terms_and_conditions: '',
    default_due_days: 15,
    default_bill_due_days: 0,
  });

  useEffect(() => {
    if (activeBusiness) {
      setForm({
        default_payment_methods: Array.isArray(activeBusiness.default_payment_methods)
          ? activeBusiness.default_payment_methods
          : ['cash'],
        default_payment_terms: activeBusiness.default_payment_terms || '',
        default_terms_and_conditions: activeBusiness.default_terms_and_conditions || '',
        default_due_days: activeBusiness.default_due_days != null ? activeBusiness.default_due_days : 15,
        default_bill_due_days: activeBusiness.default_bill_due_days != null ? activeBusiness.default_bill_due_days : 0,
      });
    }
  }, [activeBusiness]);

  const togglePaymentMethod = (id) => {
    setForm((prev) => {
      const current = prev.default_payment_methods || [];
      const next = current.includes(id)
        ? current.filter((m) => m !== id)
        : [...current, id];
      return { ...prev, default_payment_methods: next };
    });
  };

  const setField = (field) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;

    try {
      const payload = {
        id: activeBusiness.id,
        default_payment_methods: form.default_payment_methods,
        default_payment_terms: form.default_payment_terms || null,
        default_terms_and_conditions: form.default_terms_and_conditions || null,
        default_due_days: form.default_due_days !== '' ? parseInt(form.default_due_days, 10) : 15,
        default_bill_due_days: form.default_bill_due_days !== '' ? parseInt(form.default_bill_due_days, 10) : 0,
      };

      const result = await updateBusiness(payload).unwrap();
      const updated = {
        ...activeBusiness,
        ...result.data.business,
      };
      dispatch(updateBusinessInList(updated));
      dispatch(setActiveBusiness(updated));
      dispatch(addToast({ type: 'success', message: 'Invoice & Bill defaults saved successfully.' }));
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to save defaults.',
        })
      );
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Invoice &amp; Billing Settings</h2>
          <p className="page-header__sub">Configure default due periods, payment terms, and methods for Invoices vs. Bills</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        {/* Invoice Due Date & Terms */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="form-section__title" style={{ margin: 0 }}>Invoice Due Period &amp; Terms</h3>
            <span style={{ fontSize: 11, background: 'var(--color-primary-subtle, rgba(59, 130, 246, 0.1))', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              INVOICES
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Invoices are generally issued with credit terms. Select how many days after the issue date the invoice becomes due.
          </p>

          <div className="form-stack">
            <FormField label="Default Due Period" htmlFor="invoice-due-days">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {INVOICE_DUE_PRESETS.map((days) => {
                  const isSelected = Number(form.default_due_days) === days;
                  const label = days === 0 ? 'On Receipt (0d)' : `Net ${days} days`;
                  return (
                    <button
                      key={days}
                      type="button"
                      className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => setForm((f) => ({ ...f, default_due_days: days }))}
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 280 }}>
                <InputField
                  id="invoice-due-days"
                  type="number"
                  min="0"
                  max="365"
                  placeholder="Custom days"
                  value={form.default_due_days}
                  onChange={setField('default_due_days')}
                  style={{ height: 34, fontSize: 13 }}
                />
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  days from issue date
                </span>
              </div>
            </FormField>

            <FormField
              label="Default Invoice Payment Terms"
              htmlFor="default-payment-terms"
              helper="Printed on invoices (e.g. 'Net 15', 'Net 30', 'Payment due within 15 days')."
            >
              <InputField
                id="default-payment-terms"
                placeholder="e.g. Net 15, Due within 15 days"
                value={form.default_payment_terms}
                onChange={setField('default_payment_terms')}
              />
            </FormField>
          </div>
        </Card>

        {/* Bill Due Date & Terms */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="form-section__title" style={{ margin: 0 }}>Bill / POS Due Period</h3>
            <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              CASH BILLS &amp; POS
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Cash bills and receipts are typically immediate sales. Choose the default due period for bills.
          </p>

          <div className="form-stack">
            <FormField label="Default Due Period" htmlFor="bill-due-days">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {BILL_DUE_PRESETS.map((days) => {
                  const isSelected = Number(form.default_bill_due_days) === days;
                  const label = days === 0 ? 'Immediate / On Receipt (0d)' : `${days} days`;
                  return (
                    <button
                      key={days}
                      type="button"
                      className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => setForm((f) => ({ ...f, default_bill_due_days: days }))}
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 280 }}>
                <InputField
                  id="bill-due-days"
                  type="number"
                  min="0"
                  max="365"
                  placeholder="Custom days"
                  value={form.default_bill_due_days}
                  onChange={setField('default_bill_due_days')}
                  style={{ height: 34, fontSize: 13 }}
                />
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  days from issue date
                </span>
              </div>
            </FormField>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <h3 className="form-section__title">Default Accepted Payment Methods</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Select the default payment options enabled for invoices and bills:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            {PAYMENT_METHODS.map((method) => {
              const checked = form.default_payment_methods?.includes(method.id);
              return (
                <label
                  key={method.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1px solid',
                    borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
                    background: checked ? 'var(--color-primary-subtle, rgba(59, 130, 246, 0.05))' : 'var(--color-bg-surface)',
                    cursor: 'pointer',
                    fontSize: 13,
                    userSelect: 'none',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePaymentMethod(method.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>{method.label}</span>
                </label>
              );
            })}
          </div>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <h3 className="form-section__title">Default Terms &amp; Conditions</h3>
          <FormField
            label="Terms &amp; Conditions"
            htmlFor="default-tc"
            helper="Legal, delivery, or return terms automatically populated into new invoices and bills."
          >
            <InputField
              textarea
              id="default-tc"
              rows={4}
              placeholder="e.g. 1. Goods once sold are not returnable without original invoice.&#10;2. Payments delayed beyond due date incur interest."
              value={form.default_terms_and_conditions}
              onChange={setField('default_terms_and_conditions')}
              style={{ minHeight: 90 }}
            />
          </FormField>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button type="submit" variant="primary" loading={isLoading} size="lg">
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
