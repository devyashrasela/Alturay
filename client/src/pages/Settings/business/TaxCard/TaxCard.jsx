import { useRef, useEffect } from 'react';
import { FileText, Pencil } from 'lucide-react';

export default function TaxCard({
  formData,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  onChangeField,
  focusFieldId,
}) {
  const taxInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      taxInputRef.current?.focus();
    }
  }, [isEditing, focusFieldId]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(['tax_id']);
  };

  return (
    <section className="bcard" id="c-tax" aria-labelledby="t-tax">
      <div className="bcard__head">
        <span className="bcard__ico">
          <FileText size={18} aria-hidden="true" />
        </span>
        <div className="bcard__txt">
          <h2 className="bcard__title" id="t-tax">Tax details</h2>
          <p className="bcard__sub">Your GSTIN appears on every PDF.</p>
        </div>
        {!isEditing && (
          <button
            className="edit-btn"
            type="button"
            onClick={() => onEdit('c-tax')}
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
        )}
      </div>

      <div className="bcard__body">
        {!isEditing ? (
          <div className="view">
            <ul className="brows">
              <li className="brow">
                <span className="bk">Tax ID / GSTIN</span>
                <span className={`bv mono ${!formData.tax_id ? 'bv--empty' : ''}`}>
                  {formData.tax_id ? (
                    formData.tax_id
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-tax', 't-id')}
                    >
                      Add Tax ID / GSTIN
                    </button>
                  )}
                </span>
              </li>
            </ul>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="bfgrid">
              <div className="bfield bspan-2">
                <label htmlFor="t-id">Tax ID / GSTIN</label>
                <input
                  ref={taxInputRef}
                  className="binput mono"
                  id="t-id"
                  value={formData.tax_id || ''}
                  onChange={(e) => onChangeField('tax_id', e.target.value.toUpperCase())}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  maxLength={15}
                  disabled={isSaving}
                />
                <span className="bhelp">15 characters, for example 22AAAAA0000A1Z5.</span>
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
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
