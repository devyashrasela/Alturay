import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Eye, Save, Check } from 'lucide-react';
import { useUpdateBusinessMutation } from '../../../store/api/businessApi';
import { updateBusinessInList, setActiveBusiness } from '../../../store/slices/businessSlice';
import { addToast } from '../../../store/slices/uiSlice';
import { TEMPLATE_META, TEMPLATE_POOLS, FIELD_BY_TYPE } from '../../../constants/templates';
import { openPdf } from '../../../utils/openPdf';
import TemplateCard from '../TemplateCard/TemplateCard';
import Button from '../../ui/Button/Button';
import './TemplateSelector.css';

export default function TemplateSelector({ type = 'invoice' }) {
  const dispatch = useDispatch();
  const { activeBusiness } = useSelector((s) => s.business);
  const [updateBusiness, { isLoading: isSaving }] = useUpdateBusinessMutation();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const fieldKey = FIELD_BY_TYPE[type];
  const pool = TEMPLATE_POOLS[type] || [];
  const defaultTemplateId = type === 'bill' ? 'receipt' : 'classic';

  const savedTemplateId = activeBusiness?.[fieldKey] || defaultTemplateId;
  const savedWidth = Number(activeBusiness?.receipt_paper_width) === 58 ? 58 : 80;

  const [selected, setSelected] = useState(savedTemplateId);
  const [width, setWidth] = useState(savedWidth);

  useEffect(() => {
    if (activeBusiness) {
      if (activeBusiness[fieldKey]) {
        setSelected(activeBusiness[fieldKey]);
      }
      if (activeBusiness.receipt_paper_width) {
        setWidth(Number(activeBusiness.receipt_paper_width) === 58 ? 58 : 80);
      }
    }
  }, [activeBusiness, fieldKey]);

  const hasChanges =
    selected !== savedTemplateId || (type === 'bill' && selected === 'receipt' && width !== savedWidth);

  const handleSave = async () => {
    if (!activeBusiness?.id) return;

    const body = {
      id: activeBusiness.id,
      [fieldKey]: selected,
    };

    if (type === 'bill') {
      body.receipt_paper_width = width;
    }

    try {
      const result = await updateBusiness(body).unwrap();
      const updatedBusiness = {
        ...activeBusiness,
        ...result.data.business,
      };
      dispatch(updateBusinessInList(updatedBusiness));
      dispatch(setActiveBusiness(updatedBusiness));
      dispatch(addToast({ type: 'success', message: `${type === 'bill' ? 'Bill' : 'Invoice'} template saved successfully.` }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Could not save template settings.' }));
    }
  };

  const handlePreview = async () => {
    if (!activeBusiness?.id) return;
    setIsPreviewing(true);
    try {
      await openPdf(
        `/businesses/${activeBusiness.id}/templates/preview?type=${type}&template=${selected}&width=${width}`
      );
    } catch {
      dispatch(addToast({ type: 'error', message: 'Could not open template preview.' }));
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="template-selector">
      {/* Templates Grid */}
      <div
        className="template-grid"
        role="radiogroup"
        aria-label={`Select ${type} template`}
      >
        {pool.map((templateId) => {
          const meta = TEMPLATE_META[templateId];
          if (!meta) return null;
          return (
            <TemplateCard
              key={templateId}
              template={meta}
              isSelected={selected === templateId}
              isActive={savedTemplateId === templateId}
              isDefault={defaultTemplateId === templateId}
              onSelect={setSelected}
            />
          );
        })}
      </div>

      {/* Thermal Paper Width Options (for Bills with Receipt template selected) */}
      {type === 'bill' && selected === 'receipt' ? (
        <div className="template-options-panel">
          <div className="template-options-panel__info">
            <h4 className="template-options-panel__title">Thermal Paper Roll Width</h4>
            <p className="template-options-panel__desc">
              Select standard width matching your receipt printer roll (58 mm or 80 mm).
            </p>
          </div>
          <div className="segmented-control" role="group" aria-label="Receipt paper width">
            <button
              type="button"
              className={`segmented-control__btn ${width === 80 ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setWidth(80)}
            >
              80 mm (Standard POS)
            </button>
            <button
              type="button"
              className={`segmented-control__btn ${width === 58 ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setWidth(58)}
            >
              58 mm (Compact)
            </button>
          </div>
        </div>
      ) : null}

      {/* Action Bar */}
      <div className="template-selector__actions">
        <span className="template-selector__status">
          {hasChanges ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div className="template-selector__btn-group">
          <Button
            type="button"
            variant="secondary"
            size="md"
            id="preview-template-btn"
            onClick={handlePreview}
            loading={isPreviewing}
          >
            <Eye size={15} /> Preview Template
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            id="save-template-btn"
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasChanges}
          >
            {hasChanges ? <Save size={15} /> : <Check size={15} />} Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
