import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import InputField from '../ui/Input/InputField';

export default function PasswordInput({ id, className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password">
      <InputField
        id={id}
        type={visible ? 'text' : 'password'}
        className={`auth-password__input ${className}`}
        {...props}
      />
      <button
        type="button"
        className="auth-password__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
