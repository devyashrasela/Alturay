import { useState, useRef, useEffect } from 'react';
import { Building2, Pencil, Copy, Check } from 'lucide-react';

export default function BusinessInfoCard({
  business,
  formData,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  onChangeField,
  focusFieldId,
}) {
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      if (focusFieldId) {
        document.getElementById(focusFieldId)?.focus();
      } else {
        firstInputRef.current?.focus();
      }
    }
  }, [isEditing, focusFieldId]);

  const handleCopyId = () => {
    if (business?.id && navigator.clipboard) {
      navigator.clipboard.writeText(business.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(['name', 'contact_details', 'email', 'phone', 'currency']);
  };

  const currencyDisplay = formData.currency === 'INR'
    ? 'Indian rupee (INR)'
    : formData.currency === 'USD'
      ? 'US Dollar (USD)'
      : formData.currency === 'EUR'
        ? 'Euro (EUR)'
        : formData.currency || 'INR';

  return (
    <section className="bcard" id="c-info" aria-labelledby="t-info">
      <div className="bcard__head">
        <span className="bcard__ico">
          <Building2 size={18} />
        </span>
        <div className="bcard__txt">
          <h2 className="bcard__title" id="t-info">Business information</h2>
          <p className="bcard__sub">Who you are and how customers can reach you.</p>
        </div>
        {!isEditing && (
          <button
            className="edit-btn"
            type="button"
            onClick={() => onEdit('c-info')}
            aria-label="Edit business information"
          >
            <Pencil size={15} />
            Edit
          </button>
        )}
      </div>

      <div className="bcard__body">
        {!isEditing ? (
          <div className="view">
            <ul className="brows">
              <li className="brow">
                <span className="bk">Business name</span>
                <span className="bv">{formData.name || '—'}</span>
              </li>

              <li className="brow">
                <span className="bk">Business ID</span>
                <span className="bv bv--row">
                  <span className="mono">{business?.id || '—'}</span>
                  {business?.id && (
                    <button
                      type="button"
                      className={`bcopy ${copied ? 'ok' : ''}`}
                      onClick={handleCopyId}
                      aria-label="Copy business ID"
                      title={copied ? 'Copied!' : 'Copy business ID'}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Contact person</span>
                <span className="bv">
                  {formData.contact_details ? (
                    formData.contact_details
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-info', 'i-contact')}
                    >
                      Add contact person
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Email</span>
                <span className="bv">
                  {formData.email ? (
                    formData.email
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-info', 'i-email')}
                    >
                      Add email
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Phone</span>
                <span className="bv mono">
                  {formData.phone ? (
                    formData.phone
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-info', 'i-phone')}
                    >
                      Add phone
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Default currency</span>
                <span className="bv">{currencyDisplay}</span>
              </li>
            </ul>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="bfgrid">
              <div className="bfield bspan-2">
                <label htmlFor="i-name">
                  Business name <span className="breq">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  className="binput"
                  id="i-name"
                  value={formData.name}
                  onChange={(e) => onChangeField('name', e.target.value)}
                  required
                />
              </div>

              <div className="bfield">
                <label htmlFor="i-id">Business ID</label>
                <input
                  className="binput mono"
                  id="i-id"
                  value={business?.id || ''}
                  readOnly
                />
                <span className="bhelp">Assigned automatically. It can’t be changed.</span>
              </div>

              <div className="bfield">
                <label htmlFor="i-contact">Contact person</label>
                <input
                  className="binput"
                  id="i-contact"
                  value={formData.contact_details}
                  onChange={(e) => onChangeField('contact_details', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="bfield">
                <label htmlFor="i-email">Email</label>
                <input
                  className="binput"
                  id="i-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => onChangeField('email', e.target.value)}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="bfield">
                <label htmlFor="i-phone">Phone</label>
                <input
                  className="binput"
                  id="i-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onChangeField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="bfield">
                <label htmlFor="i-cur">Default currency</label>
                <input
                  className="binput"
                  id="i-cur"
                  value={formData.currency}
                  onChange={(e) => onChangeField('currency', e.target.value)}
                  placeholder="INR"
                />
                <span className="bhelp">Used for every new invoice and bill.</span>
              </div>
            </div>

            <div className="bactions">
              <button
                type="button"
                className="bbtn bbtn--secondary"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bbtn bbtn--primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
