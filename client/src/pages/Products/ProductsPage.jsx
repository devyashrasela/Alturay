import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../store/api/productApi';
import { addToast } from '../../store/slices/uiSlice';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal/Modal';
import ConfirmDialog from '../../components/ui/Modal/ConfirmDialog';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import Button from '../../components/ui/Button/Button';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Pagination from '../../components/ui/Pagination/Pagination';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';

const EMPTY_FORM = {
  name: '',
  sku: '',
  description: '',
  unit_price: '',
  tax_rate: '0',
  unit: 'pcs',
};

export default function ProductsPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useGetProductsQuery(
    { businessId: activeBusinessId, page, search },
    { skip: !activeBusinessId }
  );
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProductMutation, { isLoading: deleting }] = useDeleteProductMutation();

  const products = data?.data?.products || [];
  const meta = data?.meta || {};

  // Auto-open create modal if navigated with ?add=1 or ?create=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1' || params.get('create') === '1') {
      setEditProduct(null);
      setForm(EMPTY_FORM);
      setShowModal(true);
    }
  }, [location.search]);

  const openCreate = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      sku: p.sku || '',
      description: p.description || '',
      unit_price: p.unit_price,
      tax_rate: p.tax_rate,
      unit: p.unit || 'pcs',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await updateProduct({
          businessId: activeBusinessId,
          productId: editProduct.id,
          ...form,
        }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Product updated.' }));
      } else {
        await createProduct({ businessId: activeBusinessId, ...form }).unwrap();
        dispatch(addToast({ type: 'success', message: 'Product created.' }));
      }
      setShowModal(false);
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to save product.',
        })
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProductMutation({
        businessId: activeBusinessId,
        productId: deleteProduct.id,
      }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Product deleted.' }));
      setDeleteProduct(null);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete product.' }));
    }
  };

  return (
    <div>
      <h1 className="page-title">Products</h1>
      <p className="page-sub">
        Manage your product catalog for {activeBusiness?.name || 'your business'}
      </p>

      <div className="db-bar">
        <label className="db-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="db-end">
          <button type="button" className="db-icon" aria-label="Filter and sort">
            <Icon name="funnel" size={18} />
          </button>
          <button type="button" className="db-new" onClick={openCreate}>
            Add product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 24 }}>
          <PageLoader />
        </div>
      ) : products.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <EmptyState
            icon={<Icon name="pkg" size={28} />}
            title="No products yet"
            description="Add your first product to start creating invoices and bills."
            actionLabel="Add Product"
            onAction={openCreate}
          />
        </div>
      ) : (
        <>
          <div className="db-wrap">
            <table className="db">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Unit</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col">Tax %</th>
                  <th scope="col" className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {p.description.slice(0, 50)}
                          {p.description.length > 50 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td>{p.sku || '–'}</td>
                    <td>{p.unit || 'pcs'}</td>
                    <td className="num price">
                      {formatCurrency(p.unit_price, activeBusiness?.currency)}
                    </td>
                    <td className="tax">{p.tax_rate}%</td>
                    <td>
                      <div className="act">
                        <button
                          type="button"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => openEdit(p)}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="del"
                          aria-label={`Delete ${p.name}`}
                          onClick={() => setDeleteProduct(p)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div style={{ marginTop: 16 }}>
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={20}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={creating || updating}>
              {editProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <FormField label="Product name" required>
            <InputField
              id="p-name"
              name="name"
              placeholder="e.g. Website Design"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <div className="form-grid-2">
            <FormField label="SKU (optional)">
              <InputField
                id="p-sku"
                name="sku"
                placeholder="e.g. SVC-001"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </FormField>
            <FormField label="Unit">
              <InputField
                id="p-unit"
                name="unit"
                placeholder="pcs"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Unit price" required>
              <InputField
                id="p-price"
                type="number"
                name="unit_price"
                placeholder="0.00"
                value={form.unit_price}
                onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
              />
            </FormField>
            <FormField label="Tax rate %" helper="e.g. 18 for 18% GST">
              <InputField
                id="p-tax"
                type="number"
                name="tax_rate"
                placeholder="0"
                value={form.tax_rate}
                onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Description (optional)">
            <InputField
              textarea
              id="p-desc"
              name="description"
              placeholder="Short description…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteProduct)}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
