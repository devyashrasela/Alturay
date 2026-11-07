const A4_TEMPLATES = ['classic', 'professional', 'modern'];
const TEMPLATE_POOLS = {
  invoice: A4_TEMPLATES,
  bill: ['receipt', ...A4_TEMPLATES],
};
const DEFAULT_TEMPLATE = {
  invoice: 'classic',
  bill: 'receipt',
};
const PAPER_WIDTHS = [58, 80];

module.exports = {
  A4_TEMPLATES,
  TEMPLATE_POOLS,
  DEFAULT_TEMPLATE,
  PAPER_WIDTHS,
};
