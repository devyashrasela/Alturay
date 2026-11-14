import { useRef, useEffect } from 'react';
import { MapPin, Pencil } from 'lucide-react';
import SearchableStateDropdown from '../../../../components/ui/Select/SearchableStateDropdown/SearchableStateDropdown';

export default function AddressCard({
  formData,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  onChangeField,
  focusFieldId,
}) {
  const line1Ref = useRef(null);

  useEffect(() => {
    if (isEditing) {
      if (focusFieldId) {
        document.getElementById(focusFieldId)?.focus();
      } else {
        line1Ref.current?.focus();
      }
    }
  }, [isEditing, focusFieldId]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(['address_line1', 'address_line2', 'city', 'state', 'pincode']);
  };

  return (
    <section className="bcard" id="c-addr" aria-labelledby="t-addr">
      <div className="bcard__head">
        <span className="bcard__ico">
          <MapPin size={18} />
        </span>
        <div className="bcard__txt">
          <h2 className="bcard__title" id="t-addr">Address</h2>
          <p className="bcard__sub">Printed in the header of your documents.</p>
        </div>
        {!isEditing && (
          <button
            className="edit-btn"
            type="button"
            onClick={() => onEdit('c-addr')}
            aria-label="Edit address"
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
                <span className="bk">Address line 1</span>
                <span className="bv">
                  {formData.address_line1 ? (
                    formData.address_line1
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-addr', 'a-1')}
                    >
                      Add address line 1
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Address line 2</span>
                <span className="bv">
                  {formData.address_line2 ? (
                    formData.address_line2
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-addr', 'a-2')}
                    >
                      Add address line 2
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">City</span>
                <span className="bv">
                  {formData.city ? (
                    formData.city
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-addr', 'a-city')}
                    >
                      Add city
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">State</span>
                <span className="bv">
                  {formData.state ? (
                    formData.state
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-addr', 'a-state')}
                    >
                      Select state
                    </button>
                  )}
                </span>
              </li>

              <li className="brow">
                <span className="bk">Pin code</span>
                <span className="bv">
                  {formData.pincode ? (
                    <span className="mono">{formData.pincode}</span>
                  ) : (
                    <button
                      className="linkbtn"
                      type="button"
                      onClick={() => onEdit('c-addr', 'a-pin')}
                    >
                      Add pin code
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
                <label htmlFor="a-1">
                  Address line 1 <span className="breq">*</span>
                </label>
                <input
                  ref={line1Ref}
                  className="binput"
                  id="a-1"
                  value={formData.address_line1}
                  onChange={(e) => onChangeField('address_line1', e.target.value)}
                  placeholder="Shop/Floor/Building number, Street name"
                  required
                />
              </div>

              <div className="bfield bspan-2">
                <label htmlFor="a-2">Address line 2</label>
                <input
                  className="binput"
                  id="a-2"
                  value={formData.address_line2}
                  onChange={(e) => onChangeField('address_line2', e.target.value)}
                  placeholder="Area, Locality or Landmark"
                />
              </div>

              <div className="bfield">
                <label htmlFor="a-city">
                  City <span className="breq">*</span>
                </label>
                <input
                  className="binput"
                  id="a-city"
                  value={formData.city}
                  onChange={(e) => onChangeField('city', e.target.value)}
                  placeholder="City / District"
                  required
                />
              </div>

              <div className="bfield">
                <label htmlFor="a-state">
                  State <span className="breq">*</span>
                </label>
                <SearchableStateDropdown
                  id="a-state"
                  value={formData.state}
                  onChange={(val) => onChangeField('state', val)}
                  placeholder="Select State"
                />
              </div>

              <div className="bfield">
                <label htmlFor="a-pin">
                  Pin code <span className="breq">*</span>
                </label>
                <input
                  className="binput"
                  id="a-pin"
                  value={formData.pincode}
                  onChange={(e) => onChangeField('pincode', e.target.value)}
                  placeholder="e.g. 474001"
                  required
                />
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
