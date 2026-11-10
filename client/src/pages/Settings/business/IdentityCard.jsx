import { useRef, useEffect } from 'react';
import { Pencil, Loader2 } from 'lucide-react';

export default function IdentityCard({
  business,
  formData,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  onChangeField,
  onUploadLogo,
  onRemoveLogo,
  isUploadingLogo,
  completeness,
  onEditCard,
  focusFieldId,
}) {
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const editBtnRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      if (focusFieldId === 'f-qr') {
        document.getElementById('f-qr')?.focus();
      } else {
        nameInputRef.current?.focus();
      }
    }
  }, [isEditing, focusFieldId]);

  const initial = formData.name ? formData.name.trim().charAt(0).toUpperCase() : 'B';
  const roleLabel = business?.role
    ? business.role.charAt(0).toUpperCase() + business.role.slice(1)
    : 'Owner';

  const ownerName = business?.contact_details ? `Owned by ${business.contact_details}` : `Owned by ${roleLabel}`;
  const location = [formData.city, formData.state].filter(Boolean).join(', ');
  const subtitleLine = [ownerName, location].filter(Boolean).join(' · ');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(['name', 'qr_prefix', 'logo_url']);
  };

  return (
    <section className="bcard" id="c-ident" aria-label="Business identity">
      {!isEditing ? (
        <div>
          <div className="ident">
            <div className="ident-logo" aria-hidden="true">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="ident__body">
              <div className="ident__name">{formData.name || 'Your business'}</div>
              <div className="ident__line">{subtitleLine}</div>
              <div className="ident__chips">
                {formData.qr_prefix && (
                  <span className="chip chip--accent">#{formData.qr_prefix}</span>
                )}
                <span className="chip">{roleLabel}</span>
                <span className="chip">{formData.currency || 'INR'}</span>
                <span className="chip">
                  <i /> Active
                </span>
              </div>
            </div>

            <button
              ref={editBtnRef}
              className="edit-btn"
              type="button"
              onClick={() => onEdit('c-ident')}
              aria-label="Edit business identity"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>

          {/* Profile Completeness Bar */}
          <div className="done">
            <div
              className="done__bar"
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Profile completeness"
            >
              <b style={{ width: `${completeness.percent}%` }} />
            </div>
            <div className="done__txt">
              <strong>Profile {completeness.percent}% complete.</strong>{' '}
              {completeness.firstMissing
                ? completeness.firstMissing.hint
                : 'All essential details are set.'}
            </div>
            {completeness.firstMissing && (
              <button
                className="linkbtn"
                type="button"
                onClick={() =>
                  onEditCard(completeness.firstMissing.card, completeness.firstMissing.focus)
                }
              >
                {completeness.firstMissing.buttonText}
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} noValidate>
          <div style={{ padding: '24px 24px 0' }}>
            <div className="logo-edit">
              <div className="ident-logo">
                {isUploadingLogo ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
                ) : formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo preview" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>Business logo</div>
                <div className="logo-edit__txt">
                  PNG, JPG or WebP, up to 5 MB. Square images look best.
                </div>
                <div className="logo-edit__btns">
                  <label className="linkbtn" htmlFor="logoFileInput" style={{ cursor: 'pointer' }}>
                    Upload photo
                  </label>
                  {formData.logo_url && (
                    <button
                      type="button"
                      className="linkbtn linkbtn--danger"
                      onClick={onRemoveLogo}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="logoFileInput"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="bfgrid">
              <div className="bfield bspan-2">
                <label htmlFor="f-name">
                  Business name <span className="breq">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  className="binput"
                  id="f-name"
                  value={formData.name}
                  onChange={(e) => onChangeField('name', e.target.value)}
                  placeholder="e.g. Acme Retail Pvt Ltd"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="bfield bspan-2">
                <label htmlFor="f-qr">
                  QR prefix <span className="breq">*</span>
                </label>
                <input
                  className="binput"
                  id="f-qr"
                  value={formData.qr_prefix}
                  onChange={(e) =>
                    onChangeField(
                      'qr_prefix',
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    )
                  }
                  placeholder="e.g. acme-retail"
                  autoComplete="off"
                  required
                />
                <span className="bhelp">
                  Added to the QR codes and barcodes we generate for your products.
                </span>
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
          </div>
        </form>
      )}
    </section>
  );
}
