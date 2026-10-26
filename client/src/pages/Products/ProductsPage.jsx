import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../../store/api/productApi';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal/Modal';
import ConfirmDialog from '../../components/ui/Modal/ConfirmDialog';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import SearchInput from '../../components/ui/SearchInput/SearchInput';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Pagination from '../../components/ui/Pagination/Pagination';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';

const EMPTY_FORM = { name: '', sku: '', description: '', unit_price: '', tax_rate: '0', unit: 'pcs' };

export default function ProductsPage() {
  const dispatch = useDispatch();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useGetProductsQuery({ businessId: activeBusinessId, page, search }, { skip: !activeBusinessId });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProductMutation, { isLoading: deleting }] = useDeleteProductMutation();

  const products = data?.data?.products || [];
  const meta = data?.meta || {};

  const openCreate = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, sku: p.sku || '', description: p.description || '', unit_price: p.unit_price, tax_rate: p.tax_rate, unit: p.unit || 'pcs' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await updateProduct({ businessId: activeBusinessId, productId: editProduct.id, ...form }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Product updated.' }));
      } else {
        await createProduct({ businessId: activeBusinessId, ...form }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Product created.' }));
      }
      setShowModal(false);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to save product.' }));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProductMutation({ businessId: activeBusinessId, productId: deleteProduct.id }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Product deleted.' }));
      setDeleteProduct(null);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete product.' }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Products</h2>
          <p className="page-header__sub">
            Manage your product catalog for {activeBusiness?.name}
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="primary" size="md" id="add-product-btn" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <div className="card-toolbar">
          <SearchInput
            className="products-search"
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search products…"
          />
        </div>

        {isLoading ? <PageLoader /> : products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products yet"
            description="Add your first product to start creating invoices and bills."
            actionLabel="Add Product"
            onAction={openCreate}
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Tax %</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-name">{p.name}</div>
                        {p.description && <div className="product-description">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td className="table-date">{p.sku || '—'}</td>
                      <td className="table-date">{p.unit}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.unit_price, activeBusiness?.currency)}</td>
                      <td className="num" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{p.tax_rate}%</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <Button variant="ghost" size="sm" aria-label={`Edit ${p.name}`} onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" aria-label={`Delete ${p.name}`} onClick={() => setDeleteProduct(p)} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={creating || updating}>
              {editProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <FormField label="Product name" required>
            <InputField id="p-name" name="name" placeholder="e.g. Website Design" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <div className="form-grid-2">
            <FormField label="SKU (optional)">
              <InputField id="p-sku" name="sku" placeholder="e.g. SVC-001" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} />
            </FormField>
            <FormField label="Unit">
              <InputField id="p-unit" name="unit" placeholder="pcs" value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} />
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Unit price" required>
              <InputField id="p-price" type="number" name="unit_price" placeholder="0.00" value={form.unit_price} onChange={(e) => setForm(f => ({ ...f, unit_price: e.target.value }))} />
            </FormField>
            <FormField label="Tax rate %" helper="e.g. 18 for 18% GST">
              <InputField id="p-tax" type="number" name="tax_rate" placeholder="0" value={form.tax_rate} onChange={(e) => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Description (optional)">
            <InputField textarea id="p-desc" name="description" placeholder="Short description…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
