import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateInvoiceMutation } from '../../store/api/invoiceApi';
import { useGetProductsQuery } from '../../store/api/productApi';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import SelectDropdown from '../../components/ui/Select/SelectDropdown';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateInvoiceTotals } from '../../utils/calculateInvoiceTotals';

const EMPTY_ITEM = { product_id: null, item_name: '', unit_price: '', quantity: 1, tax_rate: 0, item_discount_amount: 0, item_discount_percent: 0 };

// Local calendar date (YYYY-MM-DD) — toISOString would slip to yesterday after midnight in UTC+ zones.
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CreateInvoicePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);

  const defaultType = searchParams.get('type') || 'invoice';

  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();
  const { data: productsData } = useGetProductsQuery({ businessId: activeBusinessId, limit: 200 }, { skip: !activeBusinessId });
  const products = productsData?.data?.products || [];

  const [form, setForm] = useState({
    type: defaultType,
    customer_name: '',
    customer_phone: '',
    issue_date: localDate(),
    due_date: '',
    discount_amount: 0,
    discount_percent: 0,
    notes: '',
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const totals = calculateInvoiceTotals(items, { discount_amount: form.discount_amount, discount_percent: form.discount_percent });

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const setItemField = (index, field) => (e) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: e.target.value };
      return updated;
    });
  };

  const selectProduct = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], product_id: productId, item_name: product.name, unit_price: product.unit_price, tax_rate: product.tax_rate };
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(item => !item.item_name || !item.unit_price)) {
      dispatch(addToast({ type: 'error', message: 'Please fill in all item names and prices.' }));
      return;
    }
    try {
      const payload = { ...form, businessId: activeBusinessId, items: items.map(item => ({ ...item, unit_price: parseFloat(item.unit_price) || 0, quantity: parseInt(item.quantity) || 1 })) };
      const result = await createInvoice(payload).unwrap();
      dispatch(addToast({ type: 'success', message: `${form.type === 'invoice' ? 'Invoice' : 'Bill'} ${result.data.invoice.invoice_number} created!` }));
      navigate(`/invoices/${result.data.invoice.id}`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to create invoice.' }));
    }
  };

  const typeLabel = form.type === 'invoice' ? 'Invoice' : 'Bill';

  return (
    <div className="create-inv">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Create {typeLabel}</h2>
          <p className="page-header__sub">for {activeBusiness?.name}</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" size="md" onClick={() => navigate('/invoices')}>Cancel</Button>
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
            <h3 className="form-section__title">Customer Details</h3>
            <div className="form-stack">
              <FormField label="Customer name" required>
                <InputField id="cust-name" placeholder="Full name" value={form.customer_name} onChange={setField('customer_name')} />
              </FormField>
              <FormField label="Phone number">
                <InputField id="cust-phone" type="tel" placeholder="+91 98765 43210" value={form.customer_phone} onChange={setField('customer_phone')} />
              </FormField>
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
                  {/* Product picker + name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <SelectDropdown aria-label="Select a product" value={item.product_id || ''} onChange={(e) => selectProduct(i, e.target.value)} style={{ height: 32, fontSize: 12, fontWeight: 400 }}>
                      <option value="">Custom item…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </SelectDropdown>
                    <InputField aria-label="Item name" placeholder="Item name" value={item.item_name} onChange={setItemField(i, 'item_name')} style={{ height: 32, fontSize: 13 }} />
                  </div>
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
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button type="submit" variant="primary" size="lg" loading={isLoading} id="submit-invoice-btn">
            Create {typeLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
