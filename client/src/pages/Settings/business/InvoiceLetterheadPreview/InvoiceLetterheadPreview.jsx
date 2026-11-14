export default function InvoiceLetterheadPreview({ data }) {
  const d = data || {};
  const initial = d.name ? d.name.trim().charAt(0).toUpperCase() : 'B';

  const addressLines = [d.address_line1, d.address_line2].filter(Boolean).join(', ');
  const cityState = [d.city, d.state].filter(Boolean).join(', ');

  const hasAddress = Boolean(addressLines || cityState || d.pincode);

  return (
    <div className="acard">
      <h2 className="acard__title">How it appears on invoices</h2>
      <p className="acard__sub">Updates as you edit.</p>
      <div className="paper" aria-hidden="true">
        <div className="paper__top">
          <div className="paper__logo">
            {d.logo_url ? (
              <img src={d.logo_url} alt="Logo" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div>
            <div className="paper__name">{d.name || 'Your business'}</div>
            <div className="paper__muted" style={{ marginTop: 2 }}>
              {hasAddress ? (
                <>
                  {addressLines ? (
                    <div>{addressLines}</div>
                  ) : (
                    <div><span className="paper__miss">Address line 1</span></div>
                  )}
                  <div>
                    {cityState ? cityState : <span className="paper__miss">City, State</span>}
                    {' – '}
                    {d.pincode ? d.pincode : <span className="paper__miss">Pin code</span>}
                  </div>
                </>
              ) : (
                <span className="paper__miss">Business address</span>
              )}
            </div>
          </div>
        </div>

        <div className="paper__gap paper__muted">
          <div>
            {d.tax_id ? (
              <span>GSTIN {d.tax_id}</span>
            ) : (
              <span className="paper__miss">GSTIN / Tax ID</span>
            )}
          </div>
          <div style={{ marginTop: 2 }}>
            {[d.phone, d.email].filter(Boolean).length > 0 ? (
              [d.phone, d.email].filter(Boolean).join(' · ')
            ) : (
              <span className="paper__miss">Phone · Email</span>
            )}
          </div>
        </div>

        <div className="paper__title">INVOICE</div>
        <div className="paper__line" />
        <div className="paper__line" />
        <div className="paper__line s" />
      </div>
    </div>
  );
}
