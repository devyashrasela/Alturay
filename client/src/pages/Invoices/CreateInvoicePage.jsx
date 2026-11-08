import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetInvoiceQuery,
} from '../../store/api/invoiceApi';
import { useGetProductsQuery } from '../../store/api/productApi';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import SelectDropdown from '../../components/ui/Select/SelectDropdown';
import SearchableProductDropdown from '../../components/ui/Select/SearchableProductDropdown';
import CustomerSelectDropdown from '../../components/customer/CustomerSelectDropdown';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateInvoiceTotals } from '../../utils/calculateInvoiceTotals';

const EMPTY_ITEM = { product_id: null, item_name: '', unit_price: '', quantity: 1, tax_rate: 0, item_discount_amount: 0, item_discount_percent: 0 };

// Local calendar date (YYYY-MM-DD) — toISOString would slip to yesterday after midnight in UTC+ zones.
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CreateInvoicePage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);

  const defaultType = searchParams.get('type') || 'invoice';

  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();

  const { data: invData, isLoading: loadingInvoice } = useGetInvoiceQuery(
    { businessId: activeBusinessId, invoiceId: id },
    { skip: !activeBusinessId || !id }
  );

  const existingInvoice = invData?.data?.invoice;

  const { data: productsData } = useGetProductsQuery({ businessId: activeBusinessId, limit: 200 }, { skip: !activeBusinessId });
  const products = productsData?.data?.products || [];

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerError, setCustomerError] = useState('');

  const [form, setForm] = useState({
    type: defaultType,
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    issue_date: localDate(),
    due_date: '',
    discount_amount: 0,
    discount_percent: 0,
    notes: '',
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // Populate data when editing an existing invoice
  useEffect(() => {
    if (existingInvoice && isEditMode) {
      if (existingInvoice.status !== 'draft') {
        dispatch(addToast({ type: 'error', message: 'Only draft invoices can be edited.' }));
        navigate(`/invoices/${existingInvoice.id}`);
        return;
      }
      setForm({
        type: existingInvoice.type || 'invoice',
        customer_id: existingInvoice.customer_id || null,
        customer_name: existingInvoice.customer_name || '',
        customer_phone: existingInvoice.customer_phone || '',
        issue_date: existingInvoice.issue_date || localDate(),
        due_date: existingInvoice.due_date || '',
        discount_amount: parseFloat(existingInvoice.discount_amount) || 0,
        discount_percent: parseFloat(existingInvoice.discount_percent) || 0,
        notes: existingInvoice.notes || '',
      });
      if (existingInvoice.customer) {
        setSelectedCustomer(existingInvoice.customer);
      } else if (existingInvoice.customer_name) {
        setSelectedCustomer({
          id: existingInvoice.customer_id,
          name: existingInvoice.customer_name,
          phone: existingInvoice.customer_phone,
        });
      }
      if (Array.isArray(existingInvoice.items) && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((item) => ({
            id: item.id,
            product_id: item.product_id || null,
            item_name: item.item_name || '',
            unit_price: item.unit_price,
            quantity: item.quantity,
            tax_rate: item.tax_rate || 0,
            item_discount_amount: item.item_discount_amount || 0,
            item_discount_percent: item.item_discount_percent || 0,
          }))
        );
      }
    }
  }, [existingInvoice, isEditMode, dispatch, navigate]);

  const totals = calculateInvoiceTotals(items, { discount_amount: form.discount_amount, discount_percent: form.discount_percent });

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerError('');
    if (customer) {
      setForm((f) => ({
        ...f,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
      }));
    } else {
      setForm((f) => ({
        ...f,
        customer_id: null,
        customer_name: '',
        customer_phone: '',
      }));
    }
  };

  const setItemField = (index, field) => (e) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: e.target.value };
      return updated;
    });
  };

  const handleSelectItem = (index, selection) => {
    if (!selection) {
      setItems(prev => {
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
      setItems(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product_id: selection.id,
          item_name: selection.name,
          unit_price: selection.unit_price != null ? selection.unit_price : updated[index].unit_price,
          tax_rate: selection.tax_rate != null ? selection.tax_rate : updated[index].tax_rate,
        };
        return updated;
      });
    } else {
      setItems(prev => {
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

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'invoice' && !form.customer_name?.trim()) {
      setCustomerError('Please select or add a customer for this invoice.');
      dispatch(addToast({ type: 'error', message: 'Please select a customer for this invoice.' }));
      return;
    }
    if (items.some(item => !item.item_name || !item.unit_price)) {
      dispatch(addToast({ type: 'error', message: 'Please fill in all item names and prices.' }));
      return;
    }
    try {
      const payload = {
        ...form,
        businessId: activeBusinessId,
        items: items.map((item) => ({
          ...item,
          unit_price: parseFloat(item.unit_price) || 0,
          quantity: parseInt(item.quantity) || 1,
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
        dispatch(addToast({ type: 'success', message: `${typeLabel} ${result.data.invoice.invoice_number} created!` }));
        navigate(`/invoices/${result.data.invoice.id}`);
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} invoice.` }));
    }
  };

  const typeLabel = form.type === 'invoice' ? 'Invoice' : 'Bill';

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
          <h2 className="page-header__title">
            {isEditMode ? `Edit ${typeLabel} (${existingInvoice?.invoice_number || ''})` : `Create ${typeLabel}`}
          </h2>
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
          {/* Left: Invoice Meta */}
          <Card>
            <h3 className="form-section__title">{typeLabel} Details</h3>
            <div className="form-stack">
              <FormField label="Type">
                <SelectDropdown id="inv-type" value={form.type} onChange={setField('type')}>
                  <option value="invoice">Invoice</option>
                  <option value="bill">Bill</option>
                </SelectDropdown>
              </FormField>
              <FormField label="Issue date" required>
                <InputField id="inv-issue" type="date" value={form.issue_date} onChange={setField('issue_date')} />
              </FormField>
              <FormField label="Due date">
                <InputField id="inv-due" type="date" value={form.due_date} onChange={setField('due_date')} />
              </FormField>
              <FormField label="Notes">
                <InputField textarea id="inv-notes" placeholder="e.g. Net 30, bank transfer to ACME Ltd…" value={form.notes} onChange={setField('notes')} style={{ minHeight: 80 }} />
              </FormField>
            </div>
          </Card>

          {/* Right: Customer */}
          <Card>
            <h3 className="form-section__title">
              {form.type === 'invoice' ? 'Customer Details *' : 'Customer / Vendor Details'}
            </h3>
            <div className="form-stack">
              <FormField
                label="Customer"
                required={form.type === 'invoice'}
                error={customerError}
              >
                <CustomerSelectDropdown
                  businessId={activeBusinessId}
                  value={selectedCustomer}
                  onChange={handleCustomerSelect}
                  error={customerError}
                  placeholder={
                    form.type === 'invoice'
                      ? 'Select or add customer (required)…'
                      : 'Search existing customer or enter below…'
                  }
                />
              </FormField>

              {form.type === 'bill' && !selectedCustomer && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      or walk-in entry
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <FormField label="Customer / Vendor name" required>
                    <InputField
                      id="cust-name"
                      placeholder="e.g. Cash Customer / Walk-in Vendor"
                      value={form.customer_name}
                      onChange={setField('customer_name')}
                    />
                  </FormField>
                  <FormField label="Phone number">
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
            </div>
          </Card>
        </div>

        {/* Line Items */}
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
              {['Item / Product', 'Price', 'Qty', 'Disc %', 'Tax %', 'Total', ''].map((h, i) => (
                <span key={i} className="section-label">{h}</span>
              ))}
            </div>

            {items.map((item, i) => {
              const calc = totals.items[i] || {};
              return (
                <div className="inv-item-grid" key={i}>
                  {/* Searchable product / item dropdown */}
                  <SearchableProductDropdown
                    id={`item-prod-${i}`}
                    products={products}
                    currency={activeBusiness?.currency}
                    productId={item.product_id}
                    itemName={item.item_name}
                    onChange={(selection) => handleSelectItem(i, selection)}
                  />
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Price</span>
                    <InputField type="number" aria-label="Unit price" placeholder="0" value={item.unit_price} onChange={setItemField(i, 'unit_price')} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Qty</span>
                    <InputField type="number" aria-label="Quantity" min="1" value={item.quantity} onChange={setItemField(i, 'quantity')} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Disc %</span>
                    <InputField type="number" aria-label="Discount percent" min="0" max="100" value={item.item_discount_percent} onChange={setItemField(i, 'item_discount_percent')} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Tax %</span>
                    <InputField type="number" aria-label="Tax rate" min="0" max="100" value={item.tax_rate} onChange={setItemField(i, 'tax_rate')} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div className="inv-item-field">
                    <span className="inv-item-field__label">Total</span>
                    <div className="inv-item__total num">
                      {formatCurrency(calc.line_total || 0, activeBusiness?.currency)}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" aria-label="Remove item" onClick={() => removeItem(i)} disabled={items.length === 1} style={{ color: 'var(--color-danger)', padding: 4 }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Totals + Discount */}
        <div className="create-inv__cols">
          <Card>
            <h3 className="form-section__title">{typeLabel} Discount</h3>
            <div className="form-grid-2">
              <FormField label="Flat discount (₹)">
                <InputField id="disc-amt" type="number" min="0" value={form.discount_amount} onChange={setField('discount_amount')} />
              </FormField>
              <FormField label="Discount (%)">
                <InputField id="disc-pct" type="number" min="0" max="100" value={form.discount_percent} onChange={setField('discount_percent')} />
              </FormField>
            </div>
          </Card>

          <Card>
            <h3 className="form-section__title">Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Subtotal', value: totals.subtotal },
                { label: 'Tax', value: totals.tax_total },
                { label: 'Discount', value: -(parseFloat(form.discount_amount) + (totals.subtotal * parseFloat(form.discount_percent || 0) / 100)) },
              ].map(({ label, value }) => (
                <div className="summary-row" key={label}>
                  <span>{label}</span>
                  <span className={`summary-row__value ${value < 0 ? 'summary-row__value--neg' : ''}`}>
                    {value < 0 ? '-' : ''}{formatCurrency(Math.abs(value), activeBusiness?.currency)}
                  </span>
                </div>
              ))}
              <div className="summary-total">
                <span className="summary-total__label">Total</span>
                <span className="summary-total__value">{formatCurrency(totals.total_amount, activeBusiness?.currency)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="create-inv__actions">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(isEditMode ? `/invoices/${id}` : '/invoices')}>Cancel</Button>
          <Button type="submit" variant="primary" size="lg" loading={creating || updating} id="submit-invoice-btn">
            {isEditMode ? 'Save Changes' : `Create ${typeLabel}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
