import { useState, useEffect, useRef } from 'react';
import { Camera, Check, X, Loader2, Upload } from 'lucide-react';
import {
  useCreateBusinessMutation,
  useUploadImageMutation,
  useLazyCheckQrPrefixQuery,
} from '../../store/api/businessApi';
import Modal from '../ui/Modal/Modal';
import Button from '../ui/Button/Button';
import FormField from '../ui/FormField/FormField';
import InputField from '../ui/Input/InputField';
import SearchableStateDropdown from '../ui/Select/SearchableStateDropdown';
import './CreateBusinessModal.css';

export default function CreateBusinessModal({ isOpen, onClose, onSuccess }) {
  const [createBusiness, { isLoading: isCreating }] = useCreateBusinessMutation();
  const [uploadImage, { isLoading: isUploadingLogo }] = useUploadImageMutation();
  const [triggerCheckQrPrefix] = useLazyCheckQrPrefixQuery();

  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    qr_prefix: '',
    contact_details: '',
    tax_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    phone: '',
    currency: 'INR',
    logo_url: '',
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [qrStatus, setQrStatus] = useState(null); // { available: boolean, message: string }
  const [isCheckingQr, setIsCheckingQr] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        qr_prefix: '',
        contact_details: '',
        tax_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        email: '',
        phone: '',
        currency: 'INR',
        logo_url: '',
      });
      setLogoPreview('');
      setErrors({});
      setQrStatus(null);
    }
  }, [isOpen]);

  // Debounced QR Prefix availability check
  useEffect(() => {
    const prefix = form.qr_prefix.trim().toLowerCase();
    if (!prefix) {
      setQrStatus(null);
      return;
    }

    if (prefix.length < 3) {
      setQrStatus({ available: false, message: 'Minimum 3 characters' });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(prefix)) {
      setQrStatus({ available: false, message: 'Alphanumeric, - or _ only' });
      return;
    }

    setIsCheckingQr(true);
    const timer = setTimeout(async () => {
      try {
        const res = await triggerCheckQrPrefix(prefix).unwrap();
        if (res?.data) {
          setQrStatus({
            available: res.data.available,
            message: res.data.available ? 'Available' : 'Already in use',
          });
        }
      } catch {
        setQrStatus(null);
      } finally {
        setIsCheckingQr(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.qr_prefix, triggerCheckQrPrefix]);

  const setField = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle Logo Upload via Cloudinary
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadImage(formData).unwrap();
      if (res?.data?.url) {
        setForm((prev) => ({ ...prev, logo_url: res.data.url }));
      }
    } catch (err) {
      // If Cloudinary isn't configured in development, inform user but keep local preview
      const msg = err?.data?.error?.message || 'Failed to upload photo to Cloudinary.';
      setErrors((prev) => ({ ...prev, logo: msg }));
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setForm((prev) => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrors((prev) => ({ ...prev, logo: null }));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Business name is required.';
    if (!form.qr_prefix.trim()) {
      errs.qr_prefix = 'QR prefix is required.';
    } else if (form.qr_prefix.trim().length < 3) {
      errs.qr_prefix = 'QR prefix must be at least 3 characters.';
    } else if (qrStatus && !qrStatus.available) {
      errs.qr_prefix = 'This QR prefix is already in use.';
    }

    if (!form.contact_details.trim()) errs.contact_details = 'Contact details are required.';
    if (!form.tax_id.trim()) errs.tax_id = 'GSTIN / Tax ID is required.';
    if (!form.address_line1.trim()) errs.address_line1 = 'Address line 1 is required.';
    if (!form.address_line2.trim()) errs.address_line2 = 'Address line 2 is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    if (!form.state) errs.state = 'Please select a state.';
    if (!form.pincode.trim()) errs.pincode = 'Pin code is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: form.name.trim(),
        qr_prefix: form.qr_prefix.trim().toLowerCase(),
        contact_details: form.contact_details.trim(),
        tax_id: form.tax_id.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim(),
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        currency: form.currency || 'INR',
        logo_url: form.logo_url || null,
      };

      const result = await createBusiness(payload).unwrap();
      if (onSuccess) {
        onSuccess(result.data.business);
      }
      onClose();
    } catch (err) {
      const serverMsg = err?.data?.error?.message || 'Failed to create business.';
      setErrors((prev) => ({ ...prev, form: serverMsg }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new business"
      maxWidth={680}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isCreating || isUploadingLogo}
            id="create-biz-submit-btn"
          >
            Create Business
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="create-biz-modal" autoComplete="off">
        {errors.form ? (
          <div className="field-error-msg" style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
            {errors.form}
          </div>
        ) : null}

        {/* ── Section 1: Logo & Brand Identity ── */}
        <div className="create-biz-section">
          <h4 className="create-biz-section__title">Brand & Identity</h4>

          {/* Logo Upload Box (Optional) */}
          <div className="logo-upload-wrap">
            <div className="logo-preview-box">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="logo-preview-box__img" />
              ) : (
                <Camera size={24} className="logo-preview-box__placeholder" />
              )}
            </div>
            <div className="logo-upload-content">
              <p className="logo-upload-content__label">Business Logo (Optional)</p>
              <p className="logo-upload-content__sub">
                Upload your brand logo for invoices and bills. Powered by Cloudinary.
              </p>
              <div className="logo-upload-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleLogoFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={isUploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} /> {logoPreview ? 'Change photo' : 'Upload photo'}
                </Button>
                {logoPreview ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    <X size={13} /> Remove
                  </Button>
                ) : null}
              </div>
              {errors.logo ? <span className="field-error-msg">{errors.logo}</span> : null}
            </div>
          </div>

          {/* Business Name */}
          <FormField label="Business name" required error={errors.name}>
            <InputField
              id="cb-name"
              placeholder="e.g. Acme Retail Pvt Ltd"
              value={form.name}
              onChange={setField('name')}
            />
          </FormField>

          {/* QR Prefix + GSTIN Row */}
          <div className="form-grid-2">
            <FormField
              label="QR Prefix (Username for barcodes)"
              required
              error={errors.qr_prefix}
            >
              <div className="qr-prefix-input-wrap">
                <span className="qr-prefix-addon">#</span>
                <InputField
                  id="cb-qr-prefix"
                  className="qr-prefix-input"
                  placeholder="e.g. acme-retail"
                  value={form.qr_prefix}
                  onChange={(e) =>
                    setField('qr_prefix')(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                  }
                />
                <div className="qr-prefix-status">
                  {isCheckingQr ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  ) : qrStatus ? (
                    qrStatus.available ? (
                      <span className="qr-prefix-status--available">
                        <Check size={14} style={{ display: 'inline', marginRight: 2 }} /> {qrStatus.message}
                      </span>
                    ) : (
                      <span className="qr-prefix-status--taken">
                        <X size={14} style={{ display: 'inline', marginRight: 2 }} /> {qrStatus.message}
                      </span>
                    )
                  ) : null}
                </div>
              </div>
              <p className="field-hint-text">
                Unique identifier used as prefix when generating QR codes and barcodes for products.
              </p>
            </FormField>

            <FormField label="GSTIN / Tax ID" required error={errors.tax_id}>
              <InputField
                id="cb-tax"
                placeholder="e.g. 22AAAAA0000A1Z5"
                value={form.tax_id}
                onChange={setField('tax_id')}
              />
            </FormField>
          </div>
        </div>

        {/* ── Section 2: Contact Information ── */}
        <div className="create-biz-section">
          <h4 className="create-biz-section__title">Contact Details</h4>

          <FormField label="Contact details / Person" required error={errors.contact_details}>
            <InputField
              id="cb-contact"
              placeholder="e.g. Rahul Sharma (Director / Manager)"
              value={form.contact_details}
              onChange={setField('contact_details')}
            />
          </FormField>

          <div className="form-grid-2">
            <FormField label="Email address" required error={errors.email}>
              <InputField
                id="cb-email"
                type="email"
                placeholder="contact@business.com"
                value={form.email}
                onChange={setField('email')}
              />
            </FormField>
            <FormField label="Phone number" required error={errors.phone}>
              <InputField
                id="cb-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={setField('phone')}
              />
            </FormField>
          </div>
        </div>

        {/* ── Section 3: Business Address ── */}
        <div className="create-biz-section">
          <h4 className="create-biz-section__title">Business Address</h4>

          <FormField label="Address line 1" required error={errors.address_line1}>
            <InputField
              id="cb-line1"
              placeholder="Shop/Floor/Building number, Street name"
              value={form.address_line1}
              onChange={setField('address_line1')}
            />
          </FormField>

          <FormField label="Address line 2" required error={errors.address_line2}>
            <InputField
              id="cb-line2"
              placeholder="Area, Locality or Landmark"
              value={form.address_line2}
              onChange={setField('address_line2')}
            />
          </FormField>

          <div className="form-grid-3">
            <FormField label="City" required error={errors.city}>
              <InputField
                id="cb-city"
                placeholder="City / District"
                value={form.city}
                onChange={setField('city')}
              />
            </FormField>

            <FormField label="State" required error={errors.state}>
              <SearchableStateDropdown
                id="cb-state"
                value={form.state}
                onChange={setField('state')}
                error={!!errors.state}
              />
            </FormField>

            <FormField label="Pin code" required error={errors.pincode}>
              <InputField
                id="cb-pin"
                placeholder="e.g. 110001"
                value={form.pincode}
                onChange={setField('pincode')}
              />
            </FormField>
          </div>

          <FormField label="Default Currency">
            <InputField
              id="cb-currency"
              value={form.currency}
              onChange={setField('currency')}
              placeholder="INR"
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
