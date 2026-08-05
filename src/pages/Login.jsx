import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/useAuth';

import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Toast from '../components/Toast';
import AuthCard from '../components/AuthCard';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await login(form.email, form.password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Please check your login credentials.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
    if (apiError) setApiError('');
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen w-screen flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-0 py-xl">
      <div className="relative z-10 w-full max-w-[420px]">
        <Toast message={apiError} type="error" onClose={() => setApiError('')} />

        <AuthCard
          title="CueMaster Elite"
          subtitle="Welcome Back, Manager"
          description="Sign in to manage your club"
          icon={Coffee}
          footer={
            <p className="font-caption text-caption text-on-surface-variant">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-item-title text-item-title text-primary hover:text-outline transition-colors"
              >
                Create Account
              </Link>
            </p>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-lg">
            <FormInput
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="manager@cuemaster.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
              autoComplete="email"
            />

            <FormInput
              label="Password"
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-background"
                  id="remember-me"
                />
                <label className="ml-2 block font-body text-body text-on-surface-variant" htmlFor="remember-me">
                  Remember Me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-item-title text-item-title text-primary hover:text-outline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading}>
              Login
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
