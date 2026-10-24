import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { setCredentials } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../store/api/authApi';
import { addToast } from '../../store/slices/uiSlice';
import { getLoginErrorMessage } from '../../utils/authErrorMessage';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setSubmitError('');
    if (!validate()) return;

    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials(result.data));
      dispatch(addToast({ type: 'success', message: `Welcome back, ${result.data.user.name}!` }));
      navigate('/businesses');
    } catch (err) {
      setSubmitError(getLoginErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your email and password to access your account"
      footer={(
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-panel__link">Sign Up</Link>
        </>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Email" htmlFor="login-email" error={errors.email}>
          <InputField
            type="email"
            name="email"
            id="login-email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" error={errors.password}>
          <PasswordInput
            name="password"
            id="login-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errors.password)}
          />
        </FormField>

        {submitError && (
          <div className="auth-alert" role="alert" aria-atomic="true">
            <AlertCircle className="auth-alert__icon" size={18} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <Button type="submit" className="auth-submit" loading={isLoading}>
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
