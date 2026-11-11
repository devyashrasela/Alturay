import { useState, useRef, useEffect } from 'react';
import { Pencil, Loader2, Check, X, Camera, Lock } from 'lucide-react';
import { useLazyCheckQrPrefixQuery } from '../../../store/api/businessApi';
import { usePermissions } from '../../../hooks/usePermissions';

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
  const { roleLabel: permRoleLabel, can } = usePermissions();
  const canUpdateIdentity = can('business.update_identity');

  const [triggerCheckQrPrefix] = useLazyCheckQrPrefixQuery();
  const [qrStatus, setQrStatus] = useState(null); // { available: boolean, message: string }
  const [isCheckingQr, setIsCheckingQr] = useState(false);

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

  // Debounced QR Prefix availability check
  useEffect(() => {
    if (!isEditing) {
      setQrStatus(null);
      setIsCheckingQr(false);
      return;
    }

    const prefix = (formData.qr_prefix || '').trim().toLowerCase();
    const currentPrefix = (business?.qr_prefix || '').trim().toLowerCase();

    // If unchanged from current business prefix
    if (prefix && prefix === currentPrefix) {
      setQrStatus({ available: true, message: 'Current prefix' });
      setIsCheckingQr(false);
      return;
    }

    if (!prefix) {
      setQrStatus({ available: false, message: 'Prefix is required' });
      setIsCheckingQr(false);
      return;
    }

    if (prefix.length < 3) {
      setQrStatus({ available: false, message: 'Min 3 characters' });
      setIsCheckingQr(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(prefix)) {
      setQrStatus({ available: false, message: 'Alphanumeric, - or _ only' });
      setIsCheckingQr(false);
      return;
    }

    setIsCheckingQr(true);
    const timer = setTimeout(async () => {
      try {
        const res = await triggerCheckQrPrefix({ prefix, excludeId: business?.id }).unwrap();
        if (res?.data) {
          setQrStatus({
            available: res.data.available,
            message: res.data.available ? 'Available' : 'Unavailable',
          });
        }
      } catch {
        setQrStatus(null);
      } finally {
        setIsCheckingQr(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.qr_prefix, isEditing, business?.qr_prefix, business?.id, triggerCheckQrPrefix]);

  const initial = formData.name ? formData.name.trim().charAt(0).toUpperCase() : 'B';
  const roleLabel = permRoleLabel || (business?.role
    ? business.role.charAt(0).toUpperCase() + business.role.slice(1)
    : 'Member');

  const ownerName = business?.contact_details ? `Owned by ${business.contact_details}` : `Owned by ${roleLabel}`;
  const location = [formData.city, formData.state].filter(Boolean).join(', ');
  const subtitleLine = [ownerName, location].filter(Boolean).join(' · ');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (canUpdateIdentity && (isCheckingQr || (qrStatus && !qrStatus.available))) {
      return;
    }
    const fields = canUpdateIdentity
      ? ['name', 'qr_prefix', 'logo_url']
      : ['name', 'logo_url'];
    onSave(fields);
  };

  return (
    <section className="bcard" id="c-ident" aria-label="Business identity">
      {/* Hidden file input accessible in both view and edit modes */}
      <input
        ref={fileInputRef}
        id="logoFileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {!isEditing ? (
        <div>
          <div className="ident">
            <div
              className="ident-logo ident-logo--clickable"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload or change business logo"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              {isUploadingLogo ? (
                <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
              ) : formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" />
              ) : (
                <span>{initial}</span>
              )}
              <div className="ident-logo__overlay" aria-hidden="true">
                <Camera size={18} />
              </div>
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
              <div
                className="ident-logo ident-logo--clickable"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload photo"
                role="button"
                tabIndex={0}
              >
                {isUploadingLogo ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
                ) : formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo preview" />
                ) : (
                  <span>{initial}</span>
                )}
                <div className="ident-logo__overlay" aria-hidden="true">
                  <Camera size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>Business logo</div>
                <div className="logo-edit__txt">
                  PNG, JPG or WebP, up to 5 MB. Square images look best.
                </div>
                <div className="logo-edit__btns">
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? 'Uploading photo...' : 'Upload photo'}
                  </button>
                  {formData.logo_url && (
                    <button
                      type="button"
                      className="linkbtn linkbtn--danger"
                      onClick={onRemoveLogo}
                      disabled={isUploadingLogo}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
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
                <div className="binput-wrap">
                  <span className="binput-wrap__prefix" aria-hidden="true">#</span>
                  <input
                    className={`binput binput--has-prefix ${qrStatus && !qrStatus.available ? 'err' : ''}`}
                    id="f-qr"
                    value={formData.qr_prefix}
                    onChange={(e) =>
                      canUpdateIdentity &&
                      onChangeField(
                        'qr_prefix',
                        e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                      )
                    }
                    readOnly={!canUpdateIdentity}
                    style={
                      !canUpdateIdentity
                        ? { opacity: 0.75, cursor: 'not-allowed', background: 'var(--hover)' }
                        : undefined
                    }
                    placeholder="e.g. acme-retail"
                    autoComplete="off"
                    maxLength={30}
                    required
                  />
                  <div className="binput-wrap__status" aria-live="polite">
                    {!canUpdateIdentity ? (
                      <span
                        title="Only the business owner can change the QR prefix."
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--muted)',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        <Lock size={12} /> Owner only
                      </span>
                    ) : isCheckingQr ? (
                      <span className="binput-wrap__status--checking">
                        <Loader2 size={13} className="animate-spin" /> Checking...
                      </span>
                    ) : qrStatus ? (
                      qrStatus.available ? (
                        <span className="binput-wrap__status--available">
                          <Check size={14} /> {qrStatus.message}
                        </span>
                      ) : (
                        <span className="binput-wrap__status--taken">
                          <X size={14} /> {qrStatus.message}
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
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
                disabled={isSaving || isCheckingQr || (qrStatus && !qrStatus.available)}
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
