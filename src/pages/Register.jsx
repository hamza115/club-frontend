import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Phone, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Toast from '../components/Toast';
import AuthCard from '../components/AuthCard';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await register(form.name, form.email, form.password, form.phone);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
    if (apiError) setApiError('');
    if (success) setSuccess('');
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen w-screen flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-0 py-xl">
      <div className="relative z-10 w-full max-w-[520px]">
        <Toast message={apiError} type="error" onClose={() => setApiError('')} />
        <Toast message={success} type="success" />

        <AuthCard
          title="CueMaster Elite"
          subtitle="Create Admin Account"
          description="Register to set up your club management"
          icon={Building2}
          footer={
            <p className="font-caption text-caption text-on-surface-variant">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-item-title text-item-title text-primary hover:text-outline transition-colors"
              >
                Login here
              </Link>
            </p>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-lg">
            <FormInput
              label="Full Name"
              icon={User}
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
              autoComplete="name"
            />

            <FormInput
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="admin@cuemaster.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
              autoComplete="email"
            />

            <FormInput
              label="Phone Number"
              icon={Phone}
              type="tel"
              placeholder="0300-0000000"
              value={form.phone}
              onChange={update('phone')}
              error={errors.phone}
              autoComplete="tel"
            />

            <FormInput
              label="Password"
              icon={Lock}
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              autoComplete="new-password"
            />

            <FormInput
              label="Confirm Password"
              icon={KeyRound}
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading}>
              Create Account
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
