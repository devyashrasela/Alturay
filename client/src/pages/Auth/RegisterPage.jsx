import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { setCredentials } from '../../store/slices/authSlice';
import { useRegisterMutation } from '../../store/api/authApi';
import { addToast } from '../../store/slices/uiSlice';
import { getRegisterErrorMessage } from '../../utils/authErrorMessage';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Minimum 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current || isLoading) return;

    setSubmitError('');
    if (!validate()) return;

    submittingRef.current = true;
    try {
      const result = await register(form).unwrap();
      dispatch(setCredentials(result.data));
      dispatch(addToast({ type: 'success', message: `Account created! Welcome, ${result.data.user.name}!` }));
      navigate('/businesses');
    } catch (err) {
      setSubmitError(getRegisterErrorMessage(err));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Enter your details to get started with Alturay."
      footer={(
        <>
          Already have an account?{' '}
          <Link to="/login" className="auth-panel__link">Sign in</Link>
        </>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Full Name" htmlFor="register-name" error={errors.name} required>
          <InputField
            type="text"
            name="name"
            id="register-name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
          />
        </FormField>

        <FormField label="Email" htmlFor="register-email" error={errors.email} required>
          <InputField
            type="email"
            name="email"
            id="register-email"
            placeholder="name@company.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="register-password"
          helper="Minimum 8 characters"
          error={errors.password}
          required
        >
          <PasswordInput
            name="password"
            id="register-password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
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

        <Button type="submit" size="lg" className="auth-submit" loading={isLoading}>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}
