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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ marginBottom: 32 }}>
          <img
            className="auth-logo__icon"
            src="/alturay_light.png"
            alt=""
            width="44"
            height="44"
            draggable="false"
          />
          <span className="auth-logo__name">Alturay</span>
        </div>

        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start managing your business for free</p>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <FormField label="Full name" required error={errors.name}>
            <InputField type="text" name="name" id="register-name" placeholder="Your full name" value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" />
          </FormField>
          <FormField label="Email address" required error={errors.email}>
            <InputField type="email" name="email" id="register-email" placeholder="you@company.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
          </FormField>
          <FormField label="Password" required helper="Minimum 8 characters" error={errors.password}>
            <InputField type="password" name="password" id="register-password" placeholder="Choose a strong password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
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
