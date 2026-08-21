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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Building2 className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Society Maintenance
        </h2>
        <p className="mt-1 text-center text-sm text-gray-600">
          Sign in to manage and track apartment society requests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
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
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Quick Demo Access
              </span>
              <span className="text-[11px] text-gray-400">Click to fill credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.demo@society-tracker.com');
                  setPassword('DemoAdmin@2026');
                  setError(null);
                }}
                className="flex items-center justify-center px-3 py-2 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('resident.demo@society-tracker.com');
                  setPassword('DemoResident@2026');
                  setError(null);
                }}
                className="flex items-center justify-center px-3 py-2 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Resident Demo
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              New resident?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
