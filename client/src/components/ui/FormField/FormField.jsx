export default function FormField({
  label,
  required,
  error,
  helper,
  children,
  className = '',
}) {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-field__label">
          {label}
          {required && <span className="form-field__required"> *</span>}
        </label>
      )}
      {children}
      {error && <span className="form-field__error">{error}</span>}
      {helper && !error && <span className="form-field__helper">{helper}</span>}
    </div>
  );
}
