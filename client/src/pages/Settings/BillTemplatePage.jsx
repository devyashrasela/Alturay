import TemplateSelector from '../../components/templates/TemplateSelector';

export default function BillTemplatePage() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Bill Template</h2>
          <p className="page-header__sub">
            Choose the default layout for store bills. Supports narrow thermal receipt rolls and standard A4 sheets.
          </p>
        </div>
      </div>

      <TemplateSelector type="bill" />
    </div>
  );
}
