import TemplateSelector from '../../../components/templates/TemplateSelector/TemplateSelector';

export default function InvoiceTemplatePage() {
  return (
    <div className="settings-page" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Invoice Template</h2>
          <p className="page-header__sub">
            Choose the default PDF design used when generating and downloading invoices.
          </p>
        </div>
      </div>

      <TemplateSelector type="invoice" />
    </div>
  );
}
