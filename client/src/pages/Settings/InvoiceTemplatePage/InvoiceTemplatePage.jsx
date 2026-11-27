import { useState } from 'react';
import TemplateSelector from '../../../components/templates/TemplateSelector/TemplateSelector';
import TemplateViewToggle from '../../../components/templates/TemplateViewToggle/TemplateViewToggle';

export default function InvoiceTemplatePage() {
  const [view, setView] = useState('grid');

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Invoice Template</h2>
          <p className="page-header__sub">
            Choose the default PDF design used when generating and downloading invoices.
          </p>
        </div>
        <div className="page-header__actions">
          <TemplateViewToggle view={view} onChange={setView} />
        </div>
      </div>

      <TemplateSelector type="invoice" view={view} />
    </>
  );
}
