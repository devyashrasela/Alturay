import { useState } from 'react';
import TemplateSelector from '../../../components/templates/TemplateSelector/TemplateSelector';
import TemplateViewToggle from '../../../components/templates/TemplateViewToggle/TemplateViewToggle';

export default function BillTemplatePage() {
  const [view, setView] = useState('grid');

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Bill Template</h2>
          <p className="page-header__sub">
            Choose the default layout for store bills. Supports narrow thermal receipt rolls and standard A4 sheets.
          </p>
        </div>
        <div className="page-header__actions">
          <TemplateViewToggle view={view} onChange={setView} />
        </div>
      </div>

      <TemplateSelector type="bill" view={view} />
    </>
  );
}
