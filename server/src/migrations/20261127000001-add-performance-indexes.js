'use strict';

const INDEXES = [
  {
    table: 'invoices',
    name: 'idx_invoices_business_status_type',
    fields: ['business_id', 'status', 'type'],
  },
  {
    table: 'invoices',
    name: 'idx_invoices_business_issue_date',
    fields: ['business_id', 'issue_date'],
  },
  {
    table: 'invoices',
    name: 'idx_invoices_due_date',
    fields: ['due_date'],
  },
  {
    table: 'invoice_items',
    name: 'idx_invoice_items_invoice_id',
    fields: ['invoice_id'],
  },
  {
    table: 'products',
    name: 'idx_products_business_id',
    fields: ['business_id'],
  },
  {
    table: 'customers',
    name: 'idx_customers_email',
    fields: ['email'],
  },
];

async function getExistingIndexNames(qi, table) {
  const indexes = await qi.showIndex(table);
  return new Set(indexes.map((idx) => idx.name));
}

module.exports = {
  async up(qi) {
    const indexCache = new Map();

    for (const { table, name, fields } of INDEXES) {
      if (!indexCache.has(table)) {
        indexCache.set(table, await getExistingIndexNames(qi, table));
      }
      if (!indexCache.get(table).has(name)) {
        await qi.addIndex(table, fields, { name });
        indexCache.get(table).add(name);
      }
    }
  },

  async down(qi) {
    const indexCache = new Map();

    for (const { table, name } of INDEXES) {
      if (!indexCache.has(table)) {
        indexCache.set(table, await getExistingIndexNames(qi, table));
      }
      if (indexCache.get(table).has(name)) {
        await qi.removeIndex(table, name);
        indexCache.get(table).delete(name);
      }
    }
  },
};
