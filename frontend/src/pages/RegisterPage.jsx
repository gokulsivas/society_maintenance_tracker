import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/common/ErrorAlert';
import Logo from '../components/common/Logo';
import { User, Mail, Lock, Home, Phone, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    flat_no: '',
    phone_number: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        flat_no: formData.flat_no.trim() || undefined,
        phone_number: formData.phone_number.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to register account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen editorial-page-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 sm:-translate-x-10">
        <Link
          to="/"
          className="inline-flex items-center px-3.5 py-1.5 bg-[#faf8f3] hover:bg-[#ebe5da] border border-[#d8cdbc] text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] hover:text-[#24211e] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-4">
          <div className="w-10 h-10 bg-[#24211e] text-[#FAF8F5] flex items-center justify-center">
            <Logo className="h-5 w-5" />
          </div>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#24211e] font-normal tracking-tight">
          Resident Registration
        </h1>
        <p className="mt-2 text-sm text-[#6b665e]">
          Create an account to raise maintenance requests and receive updates
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#faf8f3] py-8 px-6 sm:px-10 border border-[#d8cdbc] shadow-sm">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Full Name <span className="text-[#8a4d43]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm focus:border-[#5f4b3b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Email Address <span className="text-[#8a4d43]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@society.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm focus:border-[#5f4b3b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Password <span className="text-[#8a4d43]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm focus:border-[#5f4b3b] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="flat_no" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                  Flat Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8778]">
                    <Home className="h-4 w-4" />
                  </div>
                  <input
                    id="flat_no"
                    name="flat_no"
                    type="text"
                    value={formData.flat_no}
                    onChange={handleChange}
                    placeholder="e.g. A-302"
                    className="block w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm focus:border-[#5f4b3b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8778]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="block w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm focus:border-[#5f4b3b] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.password}
                className="w-full inline-flex justify-center items-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] border border-[#24211e] disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#d8cdbc] text-center">
            <p className="text-sm text-[#6b665e]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#5f4b3b] hover:text-[#24211e] underline underline-offset-2 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
