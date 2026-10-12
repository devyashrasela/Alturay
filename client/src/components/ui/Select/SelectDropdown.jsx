export default function SelectDropdown({ error, className = '', children, ...props }) {
  return (
    <select
      className={`form-field__input ${error ? 'form-field__input--error' : ''} ${className}`}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </select>
  );
}
