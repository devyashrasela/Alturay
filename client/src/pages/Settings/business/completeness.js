/**
 * Calculate business profile completeness percentage and the primary call-to-action item.
 */
export function calculateCompleteness(b) {
  if (!b) {
    return {
      percent: 0,
      firstMissing: {
        key: 'name',
        label: 'business name',
        card: 'c-ident',
        focus: 'f-name',
        hint: 'Add your business name.',
        buttonText: 'Add business name',
      },
    };
  }

  const checks = [
    {
      key: 'name',
      label: 'business name',
      card: 'c-ident',
      focus: 'f-name',
      hint: 'Add your business name.',
      buttonText: 'Add business name',
      filled: Boolean(b.name && b.name.trim()),
    },
    {
      key: 'address_line1',
      label: 'address line 1',
      card: 'c-addr',
      focus: 'a-1',
      hint: 'Add address line 1 so customers know where you operate.',
      buttonText: 'Add address',
      filled: Boolean(b.address_line1 && b.address_line1.trim()),
    },
    {
      key: 'city',
      label: 'city',
      card: 'c-addr',
      focus: 'a-city',
      hint: 'Add your city for complete tax & document records.',
      buttonText: 'Add city',
      filled: Boolean(b.city && b.city.trim()),
    },
    {
      key: 'state',
      label: 'state',
      card: 'c-addr',
      focus: 'a-state',
      hint: 'Select your state to configure state-level tax accurately.',
      buttonText: 'Select state',
      filled: Boolean(b.state && b.state.trim()),
    },
    {
      key: 'pincode',
      label: 'pin code',
      card: 'c-addr',
      focus: 'a-pin',
      hint: 'Add your pin code so it prints on invoices.',
      buttonText: 'Add pin code',
      filled: Boolean(b.pincode && b.pincode.trim()),
    },
    {
      key: 'tax_id',
      label: 'Tax ID / GSTIN',
      card: 'c-tax',
      focus: 't-id',
      hint: 'Add your GSTIN / Tax ID to show compliance on receipts.',
      buttonText: 'Add Tax ID / GSTIN',
      filled: Boolean(b.tax_id && b.tax_id.trim()),
    },
    {
      key: 'contact',
      label: 'email or phone',
      card: 'c-info',
      focus: 'i-email',
      hint: 'Add an email or phone number so customers can reach you.',
      buttonText: 'Add contact details',
      filled: Boolean((b.email && b.email.trim()) || (b.phone && b.phone.trim())),
    },
  ];

  const total = checks.length;
  const filledCount = checks.filter((c) => c.filled).length;
  const percent = Math.round((filledCount / total) * 100);
  const firstMissing = checks.find((c) => !c.filled) || null;

  return {
    percent,
    firstMissing,
  };
}
