import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateBusinessMutation, useUploadImageMutation } from '../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../store/slices/businessSlice';
import { addToast } from '../../store/slices/uiSlice';

import IdentityCard from './business/IdentityCard';
import BusinessInfoCard from './business/BusinessInfoCard';
import AddressCard from './business/AddressCard';
import TaxCard from './business/TaxCard';
import InvoiceLetterheadPreview from './business/InvoiceLetterheadPreview';
import WorkspaceFacts from './business/WorkspaceFacts';
import { calculateCompleteness } from './business/completeness';

import './business/BusinessSettingsPage.css';

export default function BusinessSettingsPage() {
  const dispatch = useDispatch();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading: isSaving }] = useUpdateBusinessMutation();
  const [uploadImage, { isLoading: isUploadingLogo }] = useUploadImageMutation();

  const [activeEditCard, setActiveEditCard] = useState(null);
  const [focusFieldId, setFocusFieldId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    qr_prefix: '',
    logo_url: '',
    contact_details: '',
    email: '',
    phone: '',
    currency: 'INR',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    tax_id: '',
  });

  // Sync form data whenever activeBusiness changes
  useEffect(() => {
    if (activeBusiness) {
      setFormData({
        name: activeBusiness.name || '',
        qr_prefix: activeBusiness.qr_prefix || '',
        logo_url: activeBusiness.logo_url || '',
        contact_details: activeBusiness.contact_details || '',
        email: activeBusiness.email || '',
        phone: activeBusiness.phone || '',
        currency: activeBusiness.currency || 'INR',
        address_line1: activeBusiness.address_line1 || '',
        address_line2: activeBusiness.address_line2 || '',
        city: activeBusiness.city || '',
        state: activeBusiness.state || '',
        pincode: activeBusiness.pincode || '',
        tax_id: activeBusiness.tax_id || '',
      });
    }
  }, [activeBusiness]);

  // Handle Escape key to cancel editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeEditCard) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEditCard, activeBusiness]);

  const handleChangeField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEdit = useCallback((cardId, focusId = null) => {
    setActiveEditCard(cardId);
    setFocusFieldId(focusId);
  }, []);

  const handleCancel = useCallback(() => {
    if (activeBusiness) {
      setFormData({
        name: activeBusiness.name || '',
        qr_prefix: activeBusiness.qr_prefix || '',
        logo_url: activeBusiness.logo_url || '',
        contact_details: activeBusiness.contact_details || '',
        email: activeBusiness.email || '',
        phone: activeBusiness.phone || '',
        currency: activeBusiness.currency || 'INR',
        address_line1: activeBusiness.address_line1 || '',
        address_line2: activeBusiness.address_line2 || '',
        city: activeBusiness.city || '',
        state: activeBusiness.state || '',
        pincode: activeBusiness.pincode || '',
        tax_id: activeBusiness.tax_id || '',
      });
    }
    setActiveEditCard(null);
    setFocusFieldId(null);
  }, [activeBusiness]);

  const handleSave = useCallback(
    async (fieldKeys) => {
      if (!activeBusiness?.id) return;

      const payload = { id: activeBusiness.id };
      if (Array.isArray(fieldKeys) && fieldKeys.length > 0) {
        fieldKeys.forEach((key) => {
          payload[key] = formData[key] ?? '';
        });
      } else {
        Object.assign(payload, formData);
      }

      try {
        const result = await updateBusiness(payload).unwrap();
        const updatedBusiness = {
          ...activeBusiness,
          ...result.data.business,
        };
        dispatch(updateBusinessInList(updatedBusiness));
        dispatch(setActiveBusiness(updatedBusiness));
        dispatch(addToast({ type: 'success', message: 'Business settings saved.' }));
        setActiveEditCard(null);
        setFocusFieldId(null);
      } catch (err) {
        dispatch(
          addToast({
            type: 'error',
            message: err?.data?.message || 'Failed to save settings.',
          })
        );
      }
    },
    [activeBusiness, formData, updateBusiness, dispatch]
  );

  const handleUploadLogo = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const data = new FormData();
        data.append('image', file);
        const res = await uploadImage(data).unwrap();
        if (res?.data?.url) {
          handleChangeField('logo_url', res.data.url);
          dispatch(addToast({ type: 'success', message: 'Logo uploaded. Save changes to persist.' }));
        }
      } catch (err) {
        dispatch(
          addToast({
            type: 'error',
            message: err?.data?.message || 'Failed to upload logo.',
          })
        );
      }
    },
    [uploadImage, handleChangeField, dispatch]
  );

  const handleRemoveLogo = useCallback(() => {
    handleChangeField('logo_url', '');
  }, [handleChangeField]);

  const completeness = useMemo(() => calculateCompleteness(formData), [formData]);

  return (
    <div className="bs-page">
      <div className="bs-header">
        <h1 className="bs-title">Business settings</h1>
        <p className="bs-sub">
          Keep your business details up to date. They appear on every invoice, bill and receipt you send.
        </p>
      </div>

      <div className="bs-cols">
        <div className="bs-stack">
          {/* 1. IDENTITY */}
          <IdentityCard
            business={activeBusiness}
            formData={formData}
            isEditing={activeEditCard === 'c-ident'}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            isSaving={isSaving}
            onChangeField={handleChangeField}
            onUploadLogo={handleUploadLogo}
            onRemoveLogo={handleRemoveLogo}
            isUploadingLogo={isUploadingLogo}
            completeness={completeness}
            onEditCard={handleEdit}
            focusFieldId={focusFieldId}
          />

          {/* 2. BUSINESS INFORMATION */}
          <BusinessInfoCard
            formData={formData}
            isEditing={activeEditCard === 'c-info'}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            isSaving={isSaving}
            onChangeField={handleChangeField}
            focusFieldId={focusFieldId}
          />

          {/* 3. ADDRESS */}
          <AddressCard
            formData={formData}
            isEditing={activeEditCard === 'c-addr'}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            isSaving={isSaving}
            onChangeField={handleChangeField}
            focusFieldId={focusFieldId}
          />

          {/* 4. TAX */}
          <TaxCard
            formData={formData}
            isEditing={activeEditCard === 'c-tax'}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            isSaving={isSaving}
            onChangeField={handleChangeField}
            focusFieldId={focusFieldId}
          />
        </div>

        {/* ASIDE */}
        <aside className="bs-aside" aria-label="Preview and workspace details">
          <InvoiceLetterheadPreview data={formData} />
          <WorkspaceFacts business={activeBusiness} />
        </aside>
      </div>
    </div>
  );
}
