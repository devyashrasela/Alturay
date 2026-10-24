import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { useRegisterMutation } from '../../store/api/authApi';
import { addToast } from '../../store/slices/uiSlice';
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

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
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
    if (isLoading) return;
    if (!validate()) return;
    try {
      const result = await register(form).unwrap();
      dispatch(setCredentials(result.data));
      dispatch(addToast({ type: 'success', message: `Account created! Welcome, ${result.data.user.name}!` }));
      navigate('/businesses');
    } catch (err) {
      const details = err?.data?.error?.details;
      const msg = details?.length
        ? details.map((d) => d.message).join('. ')
        : err?.data?.error?.message || 'Registration failed.';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to get started with Alturay"
      footer={(
        <>
          Already have an account?{' '}
          <Link to="/login" className="auth-panel__link">Sign In</Link>
        </>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Full Name" htmlFor="register-name" error={errors.name}>
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

        <FormField label="Email" htmlFor="register-email" error={errors.email}>
          <InputField
            type="email"
            name="email"
            id="register-email"
            placeholder="Enter your email"
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
        >
          <PasswordInput
            name="password"
            id="register-password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors.password)}
          />
        </FormField>

        <Button type="submit" className="auth-submit" loading={isLoading}>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}
