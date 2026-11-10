import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText,
  Receipt,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { useUpdateBusinessMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';
import './InvoiceSettingsPage.css';

const PRESET_DUE_DAYS = [0, 2, 7, 10, 15, 30];

function DuePeriodSelect({
  id,
  value,
  onChange,
  isInvoice = false,
  presets = PRESET_DUE_DAYS,
}) {
  const numVal = value !== '' && value != null ? Number(value) : 0;
  const isPreset = presets.includes(numVal);
  const [isCustomMode, setIsCustomMode] = useState(!isPreset);

  // Sync custom mode if incoming value is not one of presets
  useEffect(() => {
    if (!presets.includes(numVal)) {
      setIsCustomMode(true);
    }
  }, [numVal, presets]);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      onChange(Number(selected));
    }
  };

  const handleCustomInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
    } else {
      const parsed = Math.min(365, Math.max(0, parseInt(raw, 10) || 0));
      onChange(parsed);
    }
  };

  const selectValue = isCustomMode ? 'custom' : String(numVal);

  return (
    <div className="due-period-picker">
      <div className="due-select-wrap">
        <select
          id={id}
          className="due-select"
          value={selectValue}
          onChange={handleSelectChange}
        >
          {presets.map((days) => {
            let label = '';
            if (days === 0) {
              label = isInvoice
                ? 'On Receipt / Immediate (0 days)'
                : 'Immediate / On Receipt (0 days)';
            } else {
              label = isInvoice ? `Net ${days} days` : `${days} days`;
            }
            return (
              <option key={days} value={String(days)}>
                {label}
              </option>
            );
          })}
          <option value="custom">Custom days...</option>
        </select>
        <ChevronDown size={16} className="due-select-wrap__icon" aria-hidden="true" />
      </div>

      {isCustomMode && (
        <div className="due-custom-wrap">
          <input
            id={`${id}-custom`}
            type="number"
            min="0"
            max="365"
            className="due-custom-input"
            placeholder="Enter custom days (0–365)"
            value={value}
            onChange={handleCustomInputChange}
            autoFocus
          />
          <span className="due-custom-suffix">days from issue date</span>
        </div>
      )}
    </div>
  );
}

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
        default_due_days:
          activeBusiness.default_due_days != null ? activeBusiness.default_due_days : 15,
        default_bill_due_days:
          activeBusiness.default_bill_due_days != null
            ? activeBusiness.default_bill_due_days
            : 0,
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
        default_payment_terms: form.default_payment_terms?.trim() || null,
        default_terms_and_conditions: form.default_terms_and_conditions?.trim() || null,
        default_due_days:
          form.default_due_days !== '' ? parseInt(form.default_due_days, 10) : 15,
        default_bill_due_days:
          form.default_bill_due_days !== '' ? parseInt(form.default_bill_due_days, 10) : 0,
      };

      const result = await updateBusiness(payload).unwrap();
      const updated = {
        ...activeBusiness,
        ...result.data.business,
      };
      dispatch(updateBusinessInList(updated));
      dispatch(setActiveBusiness(updated));
      dispatch(
        addToast({
          type: 'success',
          message: 'Invoice & billing defaults saved successfully.',
        })
      );
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
    <div className="inv-settings-page">
      <div className="inv-settings-header">
        <h1 className="inv-settings-title">Invoice &amp; Billing Settings</h1>
        <p className="inv-settings-sub">
          Configure default due periods, payment terms, and accepted methods for Invoices, Cash Bills, and POS receipts.
        </p>
      </div>

      <form onSubmit={handleSave} className="inv-settings-form">
        {/* Top 2-Column Grid: Invoices vs Bills & POS */}
        <div className="inv-settings-grid">
          {/* Card 1: INVOICES */}
          <div className="inv-card">
            <div className="inv-card__head">
              <div className="inv-card__title-wrap">
                <span className="inv-card__icon">
                  <FileText size={18} />
                </span>
                <h2 className="inv-card__title">Invoice Defaults</h2>
              </div>
              <span className="inv-card__badge inv-card__badge--blue">Invoices</span>
            </div>
            <p className="inv-card__desc">
              Invoices are issued with credit terms. Select how many days after the issue date the invoice becomes due.
            </p>

            <div className="inv-card__body">
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="inv-due-select">
                  Default Due Period
                </label>
                <DuePeriodSelect
                  id="inv-due-select"
                  value={form.default_due_days}
                  onChange={(days) => setForm((f) => ({ ...f, default_due_days: days }))}
                  isInvoice
                />
                <span className="inv-field-hint">
                  Automatically populates the due date on newly created credit invoices.
                </span>
              </div>

              <div className="inv-field">
                <label className="inv-field-label" htmlFor="default-payment-terms">
                  Default Payment Terms Label
                </label>
                <input
                  id="default-payment-terms"
                  className="inv-input"
                  placeholder="e.g. Net 15, Due within 15 days"
                  value={form.default_payment_terms}
                  onChange={setField('default_payment_terms')}
                />
                <span className="inv-field-hint">
                  Printed in document headers and summary sections (e.g. &apos;Net 15&apos;, &apos;Due upon receipt&apos;).
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: CASH BILLS & POS */}
          <div className="inv-card">
            <div className="inv-card__head">
              <div className="inv-card__title-wrap">
                <span className="inv-card__icon">
                  <Receipt size={18} />
                </span>
                <h2 className="inv-card__title">Cash Bill &amp; POS Defaults</h2>
              </div>
              <span className="inv-card__badge inv-card__badge--emerald">Bills &amp; POS</span>
            </div>
            <p className="inv-card__desc">
              Cash bills and POS receipts are typically immediate walk-in transactions. Choose their default due period.
            </p>

            <div className="inv-card__body">
              <div className="inv-field">
                <label className="inv-field-label" htmlFor="bill-due-select">
                  Default Due Period
                </label>
                <DuePeriodSelect
                  id="bill-due-select"
                  value={form.default_bill_due_days}
                  onChange={(days) => setForm((f) => ({ ...f, default_bill_due_days: days }))}
                  isInvoice={false}
                />
                <span className="inv-field-hint">
                  Usually set to 0 days (Immediate / On Receipt) for point-of-sale sales.
                </span>
              </div>

              <div className="inv-field">
                <label className="inv-field-label">Document Behavior</label>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 9,
                    background: 'var(--hover)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                  }}
                >
                  Cash bills skip credit aging reports and automatically track immediate customer payments upon creation.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: PAYMENT METHODS (Full Width) */}
        <div className="inv-card">
          <div className="inv-card__head">
            <div className="inv-card__title-wrap">
              <span className="inv-card__icon">
                <CreditCard size={18} />
              </span>
              <h2 className="inv-card__title">Accepted Payment Methods</h2>
            </div>
            <span className="inv-card__badge inv-card__badge--purple">Payment Options</span>
          </div>
          <p className="inv-card__desc">
            Select the default payment methods displayed on invoices, bills, and payment links.
          </p>

          <div className="pm-grid">
            {PAYMENT_METHODS.map((method) => {
              const checked = form.default_payment_methods?.includes(method.id);
              return (
                <div
                  key={method.id}
                  className={`pm-tile ${checked ? 'pm-tile--checked' : ''}`}
                  onClick={() => togglePaymentMethod(method.id)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      togglePaymentMethod(method.id);
                    }
                  }}
                >
                  <div className="pm-tile__check">
                    {checked && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span className="pm-tile__label">{method.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: TERMS & CONDITIONS (Full Width) */}
        <div className="inv-card">
          <div className="inv-card__head">
            <div className="inv-card__title-wrap">
              <span className="inv-card__icon">
                <ShieldCheck size={18} />
              </span>
              <h2 className="inv-card__title">Default Terms &amp; Conditions</h2>
            </div>
          </div>
          <p className="inv-card__desc">
            Standard legal terms, warranty, return policies, or bank transfer instructions automatically added to every new document.
          </p>

          <div className="inv-field">
            <textarea
              id="default-tc"
              className="inv-textarea"
              rows={4}
              placeholder="e.g. 1. Goods once sold are not returnable without the original invoice.&#10;2. Payments delayed beyond the due date incur 1.5% monthly interest.&#10;3. Bank: HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234"
              value={form.default_terms_and_conditions}
              onChange={setField('default_terms_and_conditions')}
            />
            <span className="inv-field-hint">
              You can always customize or override these terms individually on any invoice before issuing.
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="inv-settings-actions">
          <button
            type="submit"
            className="inv-save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving settings...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
