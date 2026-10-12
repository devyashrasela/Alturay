import { useState, useEffect } from 'react';
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
    issue_date: new Date().toISOString().split('T')[0],
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Create {typeLabel}</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>for {activeBusiness?.name}</p>
        </div>
        <Button variant="secondary" size="md" onClick={() => navigate('/invoices')}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Left: Invoice Meta */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{typeLabel} Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <InputField textarea id="inv-notes" placeholder="Payment terms, notes..." value={form.notes} onChange={setField('notes')} style={{ minHeight: 80 }} />
              </FormField>
            </div>
          </Card>

          {/* Right: Customer */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Customer Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Line Items</h3>
            <Button type="button" variant="outline-primary" size="sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px 40px', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
              {['Item / Product', 'Price', 'Qty', 'Disc %', 'Tax %', 'Total', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {items.map((item, i) => {
              const calc = totals.items[i] || {};
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px 40px', gap: 8, alignItems: 'center' }}>
                  {/* Product picker + name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <SelectDropdown value={item.product_id || ''} onChange={(e) => selectProduct(i, e.target.value)} style={{ height: 32, fontSize: 12 }}>
                      <option value="">Custom item...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </SelectDropdown>
                    <InputField placeholder="Item name" value={item.item_name} onChange={setItemField(i, 'item_name')} style={{ height: 32, fontSize: 13 }} />
                  </div>
                  <InputField type="number" placeholder="0" value={item.unit_price} onChange={setItemField(i, 'unit_price')} style={{ height: 36, fontSize: 13 }} />
                  <InputField type="number" min="1" value={item.quantity} onChange={setItemField(i, 'quantity')} style={{ height: 36, fontSize: 13 }} />
                  <InputField type="number" min="0" max="100" value={item.item_discount_percent} onChange={setItemField(i, 'item_discount_percent')} style={{ height: 36, fontSize: 13 }} />
                  <InputField type="number" min="0" max="100" value={item.tax_rate} onChange={setItemField(i, 'tax_rate')} style={{ height: 36, fontSize: 13 }} />
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                    {formatCurrency(calc.line_total || 0, activeBusiness?.currency)}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length === 1} style={{ color: 'var(--color-danger)', padding: 4 }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Totals + Discount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Invoice Discount</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Flat discount (₹)">
                <InputField id="disc-amt" type="number" min="0" value={form.discount_amount} onChange={setField('discount_amount')} />
              </FormField>
              <FormField label="Discount (%)">
                <InputField id="disc-pct" type="number" min="0" max="100" value={form.discount_percent} onChange={setField('discount_percent')} />
              </FormField>
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Subtotal', value: totals.subtotal },
                { label: 'Tax', value: totals.tax_total },
                { label: 'Discount', value: -(parseFloat(form.discount_amount) + (totals.subtotal * parseFloat(form.discount_percent || 0) / 100)) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  <span>{label}</span>
                  <span style={{ color: value < 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                    {value < 0 ? '-' : ''}{formatCurrency(Math.abs(value), activeBusiness?.currency)}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(totals.total_amount, activeBusiness?.currency)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button type="submit" variant="primary" size="lg" loading={isLoading} id="submit-invoice-btn">
            Create {typeLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
