const { TEMPLATE_POOLS, DEFAULT_TEMPLATE } = require('../../constants/templates');

const registry = {
  classic: require('./classic'),
  professional: require('./professional'),
  modern: require('./modern'),
  receipt: require('./receipt'),
};

const getTemplate = (id, docType = 'invoice') => {
  const pool = TEMPLATE_POOLS[docType] || TEMPLATE_POOLS.invoice;
  const defaultId = DEFAULT_TEMPLATE[docType] || DEFAULT_TEMPLATE.invoice;
  return pool.includes(id) && registry[id] ? registry[id] : registry[defaultId];
};

const resolveTemplateId = (invoice, biz) =>
  invoice.type === 'bill' ? biz.bill_template_id : biz.invoice_template_id;

module.exports = {
  getTemplate,
  resolveTemplateId,
  registry,
};
