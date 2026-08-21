import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/common/ErrorAlert';
import { Building2, Lock, Mail, Loader2, ArrowRight, Shield, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      // Route admin to /admin/dashboard and resident to /dashboard
      const defaultDest = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      const fromPath = location.state?.from?.pathname;
      let destination = defaultDest;

      if (fromPath) {
        if (user.role === 'ADMIN') {
          destination = fromPath;
        } else {
          // Resident: only preserve non-admin routes; redirect to /dashboard if previous route was /admin/*
          destination = fromPath.startsWith('/admin') ? '/dashboard' : fromPath;
        }
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to sign in. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen editorial-page-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-4">
          <div className="w-10 h-10 bg-[#24211e] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#24211e] flex items-center justify-center rounded-none">
            <Building2 className="h-5 w-5" />
          </div>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#24211e] dark:text-[#f5f2ec] font-normal tracking-tight">
          Socivio
        </h1>
        <p className="mt-2 text-sm text-[#6b665e] dark:text-[#c8bfb3]">
          Sign in to manage and track apartment society requests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#faf8f3] dark:bg-[#24211e] py-8 px-6 sm:px-10 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm rounded-none">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778] dark:text-[#a89e91]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@society.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] placeholder-[#a8a196] dark:placeholder-[#887e72] text-sm focus:border-[#5f4b3b] focus:outline-none rounded-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778] dark:text-[#a89e91]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] placeholder-[#a8a196] dark:placeholder-[#887e72] text-sm focus:border-[#5f4b3b] focus:outline-none rounded-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full inline-flex justify-center items-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] disabled:opacity-50 transition-colors shadow-sm rounded-none"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5f4b3b] dark:text-[#d8cdbc] uppercase tracking-wider">
                Quick Demo Access
              </span>
              <span className="text-[11px] text-[#6b665e] dark:text-[#c8bfb3]">Click to fill credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.demo@society-tracker.com');
                  setPassword('DemoAdmin@2026');
                  setError(null);
                }}
                className="flex items-center justify-center px-3 py-2.5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] bg-[#ebe5da] dark:bg-[#342d27] hover:bg-[#d8cdbc] dark:hover:bg-[#433931] text-[#24211e] dark:text-[#f5f2ec] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-none"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5 text-[#5f4b3b] dark:text-[#d8cdbc]" />
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('resident.demo@society-tracker.com');
                  setPassword('DemoResident@2026');
                  setError(null);
                }}
                className="flex items-center justify-center px-3 py-2.5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] bg-[#FAF8F5] dark:bg-[#2b2723] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] text-[#24211e] dark:text-[#f5f2ec] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-none"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-[#5f4b3b] dark:text-[#d8cdbc]" />
                Resident Demo
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-center">
            <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3]">
              New resident?{' '}
              <Link to="/register" className="font-semibold text-[#5f4b3b] dark:text-[#d8cdbc] hover:text-[#24211e] dark:hover:text-[#f5f2ec] underline underline-offset-2 transition-colors">
                Register an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
