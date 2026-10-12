export function InputField({ error, className = '', textarea = false, ...props }) {
  const cls = `form-field__input${textarea ? ' form-field__textarea' : ''} ${error ? 'form-field__input--error' : ''} ${className}`;
  if (textarea) return <textarea className={cls} {...props} />;
  return <input className={cls} {...props} />;
}

export default InputField;
