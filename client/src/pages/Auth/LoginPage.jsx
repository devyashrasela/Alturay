import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../store/api/authApi';
import { addToast } from '../../store/slices/uiSlice';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials(result.data));
      dispatch(addToast({ type: 'success', message: `Welcome back, ${result.data.user.name}!` }));
      navigate('/businesses');
    } catch (err) {
      const msg = err?.data?.error?.message || 'Login failed. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-card__logo">
          <div style={{ width: 44, height: 44, background: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22 }}>
            A
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>Alturay</span>
        </div>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your account to continue</p>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <FormField label="Email address" required error={errors.email}>
            <InputField
              type="email"
              name="email"
              id="login-email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password" required error={errors.password}>
            <InputField
              type="password"
              name="password"
              id="login-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />
          </FormField>

          <Button type="submit" variant="primary" size="lg" loading={isLoading} style={{ width: '100%', marginTop: 8 }}>
            Sign in
          </Button>
        </form>

        <div className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__link">Create one</Link>
        </div>
      </div>
    </div>
  );
}
