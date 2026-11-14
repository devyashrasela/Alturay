import './TemplateCard.css';

export default function TemplateCard({
  template,
  isSelected,
  isActive,
  isDefault,
  onSelect,
}) {
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(template.id);
    }
  };

  const isReceipt = template.id === 'receipt';

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      className={`template-card ${isSelected ? 'template-card--selected' : ''}`}
      onClick={() => onSelect(template.id)}
      onKeyDown={handleKeyDown}
      id={`template-card-${template.id}`}
    >
      <div className="template-card__preview-wrap">
        {isReceipt ? (
          <div className="template-card__receipt-mock" aria-hidden="true">
            <div className="receipt-mock__header">STORE RECEIPT</div>
            <div className="receipt-mock__sub">Thermal 58/80 mm</div>
            <div className="receipt-mock__divider" />
            <div className="receipt-mock__row">
              <span>Item 1</span>
              <span>120.00</span>
            </div>
            <div className="receipt-mock__row">
              <span>Item 2</span>
              <span>45.00</span>
            </div>
            <div className="receipt-mock__divider" />
            <div className="receipt-mock__row receipt-mock__row--bold">
              <span>TOTAL</span>
              <span>₹165.00</span>
            </div>
            <div className="receipt-mock__footer">*** PAID ***</div>
          </div>
        ) : (
          <img
            src={template.image}
            alt={`${template.name} preview`}
            className="template-card__image"
            loading="lazy"
          />
        )}
      </div>

      <div className="template-card__body">
        <div className="template-card__header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="template-card__title">{template.name}</h3>
            <div className="template-card__badges">
              {isActive ? (
                <span className="template-card__badge template-card__badge--active">Current</span>
              ) : null}
              {isDefault && !isActive ? (
                <span className="template-card__badge template-card__badge--default">Default</span>
              ) : null}
            </div>
          </div>
          <span className="template-card__radio" aria-hidden="true">
            <span className="template-card__radio-inner" />
          </span>
        </div>
        <p className="template-card__desc">{template.description}</p>
      </div>
    </div>
  );
}
