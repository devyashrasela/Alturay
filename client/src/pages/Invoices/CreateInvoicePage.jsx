import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Truck } from 'lucide-react';
import {
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetInvoiceQuery,
} from '../../store/api/invoiceApi';
import { useGetProductsQuery } from '../../store/api/productApi';
import { addToast } from '../../store/slices/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import SelectDropdown from '../../components/ui/Select/SelectDropdown';
import SearchableProductDropdown from '../../components/ui/Select/SearchableProductDropdown';
import SearchableStateDropdown from '../../components/ui/Select/SearchableStateDropdown';
import CustomerSelectDropdown from '../../components/customer/CustomerSelectDropdown';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateInvoiceTotals } from '../../utils/calculateInvoiceTotals';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import './CreateInvoice.css';

const EMPTY_ITEM = {
  product_id: null,
  item_name: '',
  description: '',
  unit_price: '',
  quantity: 1,
  tax_rate: 0,
  item_discount_amount: 0,
  item_discount_percent: 0,
};

const EMPTY_SHIPPING = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

// Local calendar date (YYYY-MM-DD)
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDueDaysForType = (type, business) => {
  if (type === 'bill') {
    return business?.default_bill_due_days != null ? Number(business.default_bill_due_days) : 0;
  }
  return business?.default_due_days != null ? Number(business.default_due_days) : 15;
};

const calculateDueDate = (issueDateStr, dueDays) => {
  if (!issueDateStr) return '';
  const days = Number(dueDays) || 0;
  const d = new Date(issueDateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CreateInvoicePage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const currentUser = useSelector((s) => s.auth.user);
  const { can } = usePermissions();

  const defaultType = searchParams.get('type') || 'invoice';

  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();

  const { data: invData, isLoading: loadingInvoice } = useGetInvoiceQuery(
    { businessId: activeBusinessId, invoiceId: id },
    { skip: !activeBusinessId || !id }
  );

  const existingInvoice = invData?.data?.invoice;

  const { data: productsData } = useGetProductsQuery(
    { businessId: activeBusinessId, limit: 200 },
    { skip: !activeBusinessId }
  );
  const products = productsData?.data?.products || [];

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerError, setCustomerError] = useState('');
  const [showShippingAddress, setShowShippingAddress] = useState(false);

  const initialIssueDate = localDate();
  const initialDueDays = getDueDaysForType(defaultType, activeBusiness);
  const initialDueDate = calculateDueDate(initialIssueDate, initialDueDays);

  const [form, setForm] = useState({
    type: defaultType,
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    issue_date: initialIssueDate,
    due_date: initialDueDate,
    discount_amount: 0,
    discount_percent: 0,
    notes: '',
    description: '',
    po_number: '',
    payment_terms: defaultType === 'invoice' ? (activeBusiness?.default_payment_terms || '') : '',
    accepted_payment_methods: Array.isArray(activeBusiness?.default_payment_methods)
      ? activeBusiness.default_payment_methods
      : ['cash'],
    terms_and_conditions: defaultType === 'invoice' ? (activeBusiness?.default_terms_and_conditions || '') : '',
    shipping_address: { ...EMPTY_SHIPPING },
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // Sync defaults when activeBusiness loads (if in create mode and fields not yet customized)
  useEffect(() => {
    if (!isEditMode && activeBusiness) {
      setForm((prev) => {
        const dueDays = getDueDaysForType(prev.type, activeBusiness);
        return {
          ...prev,
          payment_terms: prev.type === 'invoice' ? (prev.payment_terms || activeBusiness.default_payment_terms || '') : prev.payment_terms,
          terms_and_conditions: prev.type === 'invoice' ? (prev.terms_and_conditions || activeBusiness.default_terms_and_conditions || '') : prev.terms_and_conditions,
          accepted_payment_methods: (prev.accepted_payment_methods && prev.accepted_payment_methods.length > 0)
            ? prev.accepted_payment_methods
            : (Array.isArray(activeBusiness.default_payment_methods) ? activeBusiness.default_payment_methods : ['cash']),
          due_date: prev.due_date || calculateDueDate(prev.issue_date, dueDays),
        };
      });
    }
  }, [activeBusiness, isEditMode]);

  // Populate data when editing an existing invoice
  useEffect(() => {
    if (existingInvoice && isEditMode) {
      if (existingInvoice.status !== 'draft') {
        dispatch(addToast({ type: 'error', message: 'Only draft invoices can be edited.' }));
        navigate(`/invoices/${existingInvoice.id}`, { replace: true });
        return;
      }

      if (!can('invoice.edit_any') && existingInvoice.created_by !== currentUser?.id) {
        dispatch(addToast({ type: 'error', message: 'You can only edit drafts you created.' }));
        navigate(`/invoices/${existingInvoice.id}`, { replace: true });
        return;
      }

      let parsedShipping = { ...EMPTY_SHIPPING };
      let hasShipping = false;
      if (existingInvoice.shipping_address) {
        if (typeof existingInvoice.shipping_address === 'object') {
          parsedShipping = { ...EMPTY_SHIPPING, ...existingInvoice.shipping_address };
          hasShipping = Object.values(parsedShipping).some((v) => Boolean(v));
        } else if (typeof existingInvoice.shipping_address === 'string') {
          parsedShipping.line1 = existingInvoice.shipping_address;
          hasShipping = Boolean(existingInvoice.shipping_address.trim());
        }
      }

      setShowShippingAddress(hasShipping);

      setForm({
        type: existingInvoice.type || 'invoice',
        customer_id: existingInvoice.customer_id || null,
        customer_name: existingInvoice.customer_name || '',
        customer_phone: existingInvoice.customer_phone || '',
        customer_email: existingInvoice.customer_email || existingInvoice.customer?.email || '',
        issue_date: existingInvoice.issue_date || localDate(),
        due_date: existingInvoice.due_date || '',
        discount_amount: parseFloat(existingInvoice.discount_amount) || 0,
        discount_percent: parseFloat(existingInvoice.discount_percent) || 0,
        notes: existingInvoice.notes || '',
        description: existingInvoice.description || '',
        po_number: existingInvoice.po_number || '',
        payment_terms: existingInvoice.payment_terms || '',
        accepted_payment_methods: Array.isArray(existingInvoice.accepted_payment_methods)
          ? existingInvoice.accepted_payment_methods
          : ['cash'],
        terms_and_conditions: existingInvoice.terms_and_conditions || '',
        shipping_address: parsedShipping,
      });

      if (existingInvoice.customer) {
        setSelectedCustomer(existingInvoice.customer);
      } else if (existingInvoice.customer_name) {
        setSelectedCustomer({
          id: existingInvoice.customer_id,
          name: existingInvoice.customer_name,
          phone: existingInvoice.customer_phone,
          email: existingInvoice.customer_email,
        });
      }

      if (Array.isArray(existingInvoice.items) && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((item) => ({
            id: item.id,
            product_id: item.product_id || null,
            item_name: item.item_name || '',
            description: item.description || '',
            unit_price: item.unit_price,
            quantity: item.quantity,
            tax_rate: item.tax_rate || 0,
            item_discount_amount: item.item_discount_amount || 0,
            item_discount_percent: item.item_discount_percent || 0,
          }))
        );
      }
    }
  }, [existingInvoice, isEditMode, dispatch, navigate, can, currentUser]);

  const totals = calculateInvoiceTotals(items, {
    discount_amount: form.discount_amount,
    discount_percent: form.discount_percent,
  });

  // Handle document type change (automatically recomputes due date according to settings)
  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    setForm((f) => {
      const defaultDueDays = getDueDaysForType(nextType, activeBusiness);
      let nextPaymentTerms = f.payment_terms;
      let nextTerms = f.terms_and_conditions;
      if (nextType === 'bill') {
        if (f.payment_terms === activeBusiness?.default_payment_terms) {
          nextPaymentTerms = '';
        }
        if (f.terms_and_conditions === activeBusiness?.default_terms_and_conditions) {
          nextTerms = '';
        }
      } else if (nextType === 'invoice') {
        if (!nextPaymentTerms && activeBusiness?.default_payment_terms) {
          nextPaymentTerms = activeBusiness.default_payment_terms;
        }
        if (!nextTerms && activeBusiness?.default_terms_and_conditions) {
          nextTerms = activeBusiness.default_terms_and_conditions;
        }
      }
      return {
        ...f,
        type: nextType,
        payment_terms: nextPaymentTerms,
        terms_and_conditions: nextTerms,
        due_date: calculateDueDate(f.issue_date, defaultDueDays),
      };
    });
  };

  // Handle issue date change (automatically updates due date)
  const handleIssueDateChange = (e) => {
    const nextIssue = e.target.value;
    setForm((f) => {
      const defaultDueDays = getDueDaysForType(f.type, activeBusiness);
      return {
        ...f,
        issue_date: nextIssue,
        due_date: calculateDueDate(nextIssue, defaultDueDays),
      };
    });
  };

  const setField = (field) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const setShippingField = (field, value) => {
    setForm((f) => ({
      ...f,
      shipping_address: {
        ...f.shipping_address,
        [field]: value,
      },
    }));
  };

  const togglePaymentMethod = (methodId) => {
    setForm((prev) => {
      const current = prev.accepted_payment_methods || [];
      const next = current.includes(methodId)
        ? current.filter((m) => m !== methodId)
        : [...current, methodId];
      return { ...prev, accepted_payment_methods: next };
    });
  };

  // Pick up customer details directly from the selected customer in database
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerError('');
    if (customer) {
      setForm((f) => ({
        ...f,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        customer_email: customer.email || '',
      }));
    } else {
      setForm((f) => ({
        ...f,
        customer_id: null,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
      }));
    }
  };

  const setItemField = (index, field) => (e) => {
    const val = e.target.value;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSelectItem = (index, selection) => {
    if (!selection) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product_id: null,
          item_name: '',
        };
        return updated;
      });
      return;
    }

    if (selection.id) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product_id: selection.id,
          item_name: selection.name,
          description: selection.description || updated[index].description || '',
          unit_price: selection.unit_price != null ? selection.unit_price : updated[index].unit_price,
          tax_rate: selection.tax_rate != null ? selection.tax_rate : updated[index].tax_rate,
        };
        return updated;
      });
    } else {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product_id: null,
          item_name: selection.name || '',
        };
        return updated;
      });
    }
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'invoice' && !form.customer_name?.trim()) {
      setCustomerError('Please select or add a customer for this invoice.');
      dispatch(addToast({ type: 'error', message: 'Please select a customer for this invoice.' }));
      return;
    }
    if (items.some((item) => !item.item_name || !item.unit_price)) {
      dispatch(addToast({ type: 'error', message: 'Please fill in all item names and prices.' }));
      return;
    }

    try {
      const hasShippingData = showShippingAddress && Object.values(form.shipping_address).some((v) => Boolean(v?.trim()));
      const resolvedShipping = hasShippingData ? form.shipping_address : null;

      const payload = {
        type: form.type,
        customer_id: form.customer_id || null,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        customer_email: form.customer_email || null,
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        discount_amount: parseFloat(form.discount_amount) || 0,
        discount_percent: parseFloat(form.discount_percent) || 0,
        notes: form.notes || null,
        description: form.description || null,
        po_number: form.po_number || null,
        payment_terms: form.payment_terms || null,
        accepted_payment_methods: form.accepted_payment_methods,
        terms_and_conditions: form.terms_and_conditions || null,
        shipping_address: resolvedShipping,
        businessId: activeBusinessId,
        items: items.map((item) => ({
          product_id: item.product_id || null,
          item_name: item.item_name,
          description: item.description?.trim() || null,
          unit_price: parseFloat(item.unit_price) || 0,
          quantity: parseInt(item.quantity, 10) || 1,
          tax_rate: parseFloat(item.tax_rate) || 0,
          item_discount_amount: parseFloat(item.item_discount_amount) || 0,
          item_discount_percent: parseFloat(item.item_discount_percent) || 0,
        })),
      };

      if (isEditMode) {
        await updateInvoice({
          businessId: activeBusinessId,
          invoiceId: id,
          ...payload,
        }).unwrap();
        dispatch(addToast({ type: 'success', message: `${typeLabel} updated!` }));
        navigate(`/invoices/${id}`);
      } else {
        const result = await createInvoice(payload).unwrap();
        dispatch(
          addToast({
            type: 'success',
            message: `${typeLabel} ${result.data.invoice.invoice_number} created!`,
          })
        );
        navigate(`/invoices/${result.data.invoice.id}`);
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} invoice.`,
        })
      );
    }
  };

  const isBill = form.type === 'bill';
  const typeLabel = isBill ? 'Bill' : 'Invoice';

  if (isEditMode && loadingInvoice) {
    return (
      <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="create-inv">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="page-header__title">
              {isEditMode ? `Edit ${typeLabel} (${existingInvoice?.invoice_number || ''})` : `Create ${typeLabel}`}
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 4,
                background: isBill ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-primary-subtle, rgba(59, 130, 246, 0.12))',
                color: isBill ? '#10b981' : 'var(--color-primary)',
              }}
            >
              {isBill ? 'Cash / POS Bill' : 'Credit Invoice'}
            </span>
          </div>
          <p className="page-header__sub">for {activeBusiness?.name}</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" size="md" onClick={() => navigate(isEditMode ? `/invoices/${id}` : '/invoices')}>
            Cancel
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="create-inv__cols">
          {/* Left: Document Meta */}
          <Card>
            <h3 className="form-section__title">{typeLabel} Details</h3>
            <div className="form-stack">
              <FormField label="Type" htmlFor="inv-type">
                <SelectDropdown id="inv-type" value={form.type} onChange={handleTypeChange}>
                  <option value="invoice">Invoice (Credit terms)</option>
                  <option value="bill">Bill (Cash / Immediate)</option>
                </SelectDropdown>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Issue date" htmlFor="inv-issue" required>
                  <InputField
                    id="inv-issue"
                    type="date"
                    value={form.issue_date}
                    onChange={handleIssueDateChange}
                  />
                </FormField>
                <FormField
                  label="Due date"
                  htmlFor="inv-due"
                  helper={isBill ? 'Default: Immediate' : `Default: Net ${getDueDaysForType('invoice', activeBusiness)}d`}
                >
                  <InputField
                    id="inv-due"
                    type="date"
                    value={form.due_date}
                    onChange={setField('due_date')}
                  />
                </FormField>
              </div>

              <FormField label="PO Number" htmlFor="inv-po">
                <InputField
                  id="inv-po"
                  placeholder="e.g. PO-2026-001"
                  value={form.po_number}
                  onChange={setField('po_number')}
                />
              </FormField>

              <FormField label="Subject / Description" htmlFor="inv-desc">
                <InputField
                  textarea
                  id="inv-desc"
                  placeholder="e.g. Website redesign & development sprint 1…"
                  value={form.description}
                  onChange={setField('description')}
                  style={{ minHeight: 60 }}
                />
              </FormField>
            </div>
          </Card>

          {/* Right: Customer & Shipping */}
          <Card>
            <h3 className="form-section__title">
              {!isBill ? 'Customer Details *' : 'Customer / Vendor Details'}
            </h3>
            <div className="form-stack">
              <FormField
                label="Customer"
                required={!isBill}
                error={customerError}
                helper={!isBill ? 'Email and phone are retrieved automatically from saved customer details.' : ''}
              >
                <CustomerSelectDropdown
                  businessId={activeBusinessId}
                  value={selectedCustomer}
                  onChange={handleCustomerSelect}
                  error={customerError}
                  placeholder={
                    !isBill
                      ? 'Select or add customer (required)…'
                      : 'Search existing customer or enter walk-in below…'
                  }
                />
              </FormField>

              {/* Read-only customer details badge automatically populated from database */}
              {selectedCustomer && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 6px)',
                    background: 'var(--color-bg-muted, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCustomer.name}</span>
                    {selectedCustomer.phone && <span style={{ color: 'var(--color-text-muted)' }}>{selectedCustomer.phone}</span>}
                  </div>
                  {selectedCustomer.email && (
                    <span style={{ color: 'var(--color-primary)' }}>{selectedCustomer.email}</span>
                  )}
                  {selectedCustomer.formatted_address && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{selectedCustomer.formatted_address}</span>
                  )}
                </div>
              )}

              {isBill && !selectedCustomer && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      or walk-in customer
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  </div>
                  <FormField label="Customer / Vendor name" htmlFor="cust-name" required>
                    <InputField
                      id="cust-name"
                      placeholder="e.g. Cash Customer / Walk-in"
                      value={form.customer_name}
                      onChange={setField('customer_name')}
                    />
                  </FormField>
                  <FormField label="Phone number" htmlFor="cust-phone">
                    <InputField
                      id="cust-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.customer_phone}
                      onChange={setField('customer_phone')}
                    />
                  </FormField>
                </>
              )}

              {/* Shipping address toggle */}
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showShippingAddress}
                    onChange={(e) => setShowShippingAddress(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <Truck size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>Ship to a different address</span>
                </label>

                {showShippingAddress && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    <FormField label="Address Line 1" htmlFor="ship-line1">
                      <InputField
                        id="ship-line1"
                        placeholder="House / Unit no., Street"
                        value={form.shipping_address.line1}
                        onChange={(e) => setShippingField('line1', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Address Line 2 (Optional)" htmlFor="ship-line2">
                      <InputField
                        id="ship-line2"
                        placeholder="Landmark, Area"
                        value={form.shipping_address.line2}
                        onChange={(e) => setShippingField('line2', e.target.value)}
                      />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <FormField label="City" htmlFor="ship-city">
                        <InputField
                          id="ship-city"
                          placeholder="City"
                          value={form.shipping_address.city}
                          onChange={(e) => setShippingField('city', e.target.value)}
                        />
                      </FormField>
                      <FormField label="PIN Code" htmlFor="ship-pincode">
                        <InputField
                          id="ship-pincode"
                          placeholder="PIN Code"
                          value={form.shipping_address.pincode}
                          onChange={(e) => setShippingField('pincode', e.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField label="State">
                      <SearchableStateDropdown
                        id="ship-state"
                        value={form.shipping_address.state}
                        onChange={(st) => setShippingField('state', st)}
                        placeholder="Select shipping state…"
                      />
                    </FormField>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Line Items: Description BESIDE Product */}
        <Card className="create-inv__card">
          <div className="create-inv__items-head">
            <h3 className="form-section__title" style={{ marginBottom: 0 }}>Line Items</h3>
            <Button type="button" variant="outline-primary" size="sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </Button>
          </div>

          <div className="create-inv__item-list">
            {/* Header row (desktop only) */}
            <div className="inv-item-grid inv-item-grid--head">
              {['Item / Product', 'Description', 'Price', 'Qty', 'Disc %', 'Tax %', 'Total', ''].map((h, i) => (
                <span key={i} className="section-label">{h}</span>
              ))}
            </div>

            {items.map((item, i) => {
              const calc = totals.items[i] || {};
              return (
                <div className="inv-item-grid" key={i}>
                  {/* 1. Item / Product */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Item / Product</span>
                    <SearchableProductDropdown
                      id={`item-prod-${i}`}
                      products={products}
                      currency={activeBusiness?.currency}
                      productId={item.product_id}
                      itemName={item.item_name}
                      onChange={(selection) => handleSelectItem(i, selection)}
                    />
                  </div>

                  {/* 2. Item Description beside product */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Description</span>
                    <InputField
                      placeholder="Description / details…"
                      aria-label="Item description"
                      value={item.description || ''}
                      onChange={setItemField(i, 'description')}
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>

                  {/* 3. Price */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Price</span>
                    <InputField
                      type="number"
                      aria-label="Unit price"
                      placeholder="0"
                      value={item.unit_price}
                      onChange={setItemField(i, 'unit_price')}
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>

                  {/* 4. Qty */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Qty</span>
                    <InputField
                      type="number"
                      aria-label="Quantity"
                      min="1"
                      value={item.quantity}
                      onChange={setItemField(i, 'quantity')}
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>

                  {/* 5. Disc % */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Disc %</span>
                    <InputField
                      type="number"
                      aria-label="Discount percent"
                      min="0"
                      max="100"
                      value={item.item_discount_percent}
                      onChange={setItemField(i, 'item_discount_percent')}
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>

                  {/* 6. Tax % */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Tax %</span>
                    <InputField
                      type="number"
                      aria-label="Tax rate"
                      min="0"
                      max="100"
                      value={item.tax_rate}
                      onChange={setItemField(i, 'tax_rate')}
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>

                  {/* 7. Line Total */}
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Total</span>
                    <div className="inv-item__total num">
                      {formatCurrency(calc.line_total || 0, activeBusiness?.currency)}
                    </div>
                  </div>

                  {/* 8. Delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove item"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    style={{ color: 'var(--color-danger)', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Payment & Terms Section */}
        <div className="create-inv__cols">
          <Card>
            <h3 className="form-section__title">Payment &amp; Terms</h3>
            <div className="form-stack">
              <FormField label="Accepted Payment Methods">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {PAYMENT_METHODS.map((method) => {
                    const checked = form.accepted_payment_methods?.includes(method.id);
                    return (
                      <label
                        key={method.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 8px',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
                          background: checked ? 'var(--color-primary-subtle, rgba(59, 130, 246, 0.05))' : 'transparent',
                          cursor: 'pointer',
                          fontSize: 12,
                          userSelect: 'none',
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
              </FormField>

              <FormField label="Payment Terms" htmlFor="inv-pterms">
                <InputField
                  id="inv-pterms"
                  placeholder={isBill ? 'e.g. Due upon receipt' : 'e.g. Net 15, Net 30, Due on receipt'}
                  value={form.payment_terms}
                  onChange={setField('payment_terms')}
                />
              </FormField>

              <FormField label="Terms &amp; Conditions" htmlFor="inv-tc">
                <InputField
                  textarea
                  id="inv-tc"
                  rows={3}
                  placeholder="Legal / return conditions…"
                  value={form.terms_and_conditions}
                  onChange={setField('terms_and_conditions')}
                  style={{ minHeight: 70 }}
                />
              </FormField>

              <FormField label="Notes" htmlFor="inv-notes">
                <InputField
                  textarea
                  id="inv-notes"
                  placeholder="Additional remarks or bank details…"
                  value={form.notes}
                  onChange={setField('notes')}
                  style={{ minHeight: 60 }}
                />
              </FormField>
            </div>
          </Card>

          {/* Discount & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card>
              <h3 className="form-section__title">{typeLabel} Discount</h3>
              <div className="form-grid-2">
                <FormField label="Flat discount (₹)" htmlFor="disc-amt">
                  <InputField
                    id="disc-amt"
                    type="number"
                    min="0"
                    value={form.discount_amount}
                    onChange={setField('discount_amount')}
                  />
                </FormField>
                <FormField label="Discount (%)" htmlFor="disc-pct">
                  <InputField
                    id="disc-pct"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount_percent}
                    onChange={setField('discount_percent')}
                  />
                </FormField>
              </div>
            </Card>

            <Card>
              <h3 className="form-section__title">Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Subtotal', value: totals.subtotal },
                  { label: 'Tax', value: totals.tax_total },
                  {
                    label: 'Discount',
                    value: -(
                      parseFloat(form.discount_amount || 0) +
                      (totals.subtotal * parseFloat(form.discount_percent || 0)) / 100
                    ),
                  },
                ].map(({ label, value }) => (
                  <div className="summary-row" key={label}>
                    <span>{label}</span>
                    <span className={`summary-row__value ${value < 0 ? 'summary-row__value--neg' : ''}`}>
                      {value < 0 ? '-' : ''}
                      {formatCurrency(Math.abs(value), activeBusiness?.currency)}
                    </span>
                  </div>
                ))}
                <div className="summary-total">
                  <span className="summary-total__label">Total</span>
                  <span className="summary-total__value">
                    {formatCurrency(totals.total_amount, activeBusiness?.currency)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="create-inv__actions">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate(isEditMode ? `/invoices/${id}` : '/invoices')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={creating || updating}
            id="submit-invoice-btn"
          >
            {isEditMode ? 'Save Changes' : `Create ${typeLabel}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
