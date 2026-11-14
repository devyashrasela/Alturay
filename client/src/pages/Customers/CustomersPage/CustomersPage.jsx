import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from '../../../store/api/customerApi';
import { addToast } from '../../../store/slices/uiSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import Icon from '../../../components/ui/Icon/Icon';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import CustomerModal from '../../../components/customer/CustomerModal/CustomerModal';
import { formatDate } from '../../../utils/formatDate';

export default function CustomersPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { can } = usePermissions();

  const canCreate = can('customer.create');
  const canUpdate = can('customer.update');
  const canDelete = can('customer.delete');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const { data, isLoading } = useGetCustomersQuery(
    { businessId: activeBusinessId, page, search },
    { skip: !activeBusinessId }
  );

  const [deleteCustomerMutation, { isLoading: deleting }] = useDeleteCustomerMutation();

  const customers = data?.data?.customers || [];
  const meta = data?.meta || {};

  // Auto-open create modal if navigated with ?add=1 or ?create=1 and permitted
  useEffect(() => {
    if (!canCreate) return;
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1' || params.get('create') === '1') {
      setEditCustomer(null);
      setShowModal(true);
    }
  }, [location.search, canCreate]);

  const openCreate = () => {
    setEditCustomer(null);
    setShowModal(true);
  };

  const openEdit = (cust) => {
    setEditCustomer(cust);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    try {
      await deleteCustomerMutation({
        businessId: activeBusinessId,
        customerId: deleteCustomer.id,
      }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Customer deleted successfully.' }));
      setDeleteCustomer(null);
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to delete customer.',
        })
      );
    }
  };

  const formatAddress = (c) => {
    if (c.formatted_address) return c.formatted_address;
    const parts = [c.address_line1, c.address_line2, c.city, c.state, c.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      width: '24%',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text)' }}>{c.name}</div>
          {c.email ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.email}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      width: '16%',
      render: (c) => c.phone || '—',
    },
    {
      key: 'location',
      header: 'City / State',
      width: '18%',
      render: (c) => {
        const loc = [c.city, c.state].filter(Boolean).join(', ');
        return loc || '—';
      },
    },
    {
      key: 'address',
      header: 'Address',
      width: '22%',
      render: (c) => {
        const addr = formatAddress(c);
        return (
          <div
            title={addr}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            {addr}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Added',
      width: canUpdate || canDelete ? '10%' : '20%',
      render: (c) => <span className="tax">{formatDate(c.createdAt || c.created_at)}</span>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            width: '10%',
            align: 'right',
            render: (c) => (
              <DataTable.RowActions>
                {canUpdate && (
                  <DataTable.ActionButton
                    icon="edit"
                    label={`Edit ${c.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(c);
                    }}
                  />
                )}
                {canDelete && (
                  <DataTable.ActionButton
                    icon="trash"
                    variant="danger"
                    label={`Delete ${c.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCustomer(c);
                    }}
                  />
                )}
              </DataTable.RowActions>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`Manage your customer directory and billing profiles for ${activeBusiness?.name || 'your business'}`}
      />

      <DataTable>
        <DataTable.Toolbar>
          <DataTable.Search
            placeholder="Search customers…"
            ariaLabel="Search customers"
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
          <DataTable.Actions>
            <DataTable.FilterButton ariaLabel="Filter and sort customers" />
            {canCreate && (
              <DataTable.NewButton onClick={openCreate}>
                Add customer
              </DataTable.NewButton>
            )}
          </DataTable.Actions>
        </DataTable.Toolbar>

        <DataTable.Content
          isLoading={isLoading}
          isEmpty={customers.length === 0}
          emptyState={{
            icon: <Icon name="users" size={28} />,
            title: 'No customers yet',
            description: 'Add your first customer to keep track of contact details and billing.',
            actionLabel: canCreate ? 'Add Customer' : undefined,
            onAction: canCreate ? openCreate : undefined,
          }}
          columns={columns}
          data={customers}
        />

        <DataTable.Pagination
          page={page}
          meta={meta}
          onPageChange={setPage}
          limit={20}
        />
      </DataTable>

      {/* Customer Create / Edit Modal */}
      <CustomerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customer={editCustomer}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCustomer)}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteCustomer?.name}"? All associated invoices will remain preserved.`}
      />
    </div>
  );
}
