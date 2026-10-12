import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { useRegisterMutation } from '../../store/api/authApi';
import { addToast } from '../../store/slices/uiSlice';
import Button from '../../components/ui/Button/Button';
import FormField from '../../components/ui/FormField/FormField';
import InputField from '../../components/ui/Input/InputField';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <div style={{ width: 44, height: 44, background: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22 }}>
            A
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>Alturay</span>
        </div>

        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start managing your business for free</p>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <FormField label="Full name" required>
            <InputField type="text" name="name" id="register-name" placeholder="Your full name" value={form.name} onChange={handleChange} autoComplete="name" />
          </FormField>
          <FormField label="Email address" required>
            <InputField type="email" name="email" id="register-email" placeholder="you@company.com" value={form.email} onChange={handleChange} autoComplete="email" />
          </FormField>
          <FormField label="Password" required helper="Minimum 8 characters">
            <InputField type="password" name="password" id="register-password" placeholder="Choose a strong password" value={form.password} onChange={handleChange} autoComplete="new-password" />
          </FormField>
          <Button type="submit" variant="primary" size="lg" loading={isLoading} style={{ width: '100%', marginTop: 8 }}>
            Create account
          </Button>
        </form>

        <div className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
