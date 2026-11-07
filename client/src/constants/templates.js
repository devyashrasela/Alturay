import classic from '../assets/templates/classic-preview.png';
import professional from '../assets/templates/professional-preview.png';
import modern from '../assets/templates/modern-preview.png';

export const TEMPLATE_META = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean minimalist black-and-white design. Crisp typography with optimal readability.',
    image: classic,
    isA4: true,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Sophisticated layout with green accent bar, structured totals, and signature lines.',
    image: professional,
    isA4: true,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary purple aesthetic featuring company logo, bordered grid, and notes.',
    image: modern,
    isA4: true,
  },
  receipt: {
    id: 'receipt',
    name: 'Thermal Receipt',
    description: 'POS roll-paper receipt for standard 58 mm and 80 mm thermal printers.',
    image: null,
    isA4: false,
  },
};

export const TEMPLATE_POOLS = {
  invoice: ['classic', 'professional', 'modern'],
  bill: ['receipt', 'classic', 'professional', 'modern'],
};

export const FIELD_BY_TYPE = {
  invoice: 'invoice_template_id',
  bill: 'bill_template_id',
};
