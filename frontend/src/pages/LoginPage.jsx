import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Clock, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = new URLSearchParams(location.search).get('redirect') || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'INFO');

      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Queue<span className="text-brand-600">Less</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Universal multi-role access for Customers, Staff, and Admins.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        
        {/* ONE-CLICK DEMO BUTTONS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Click to fill Demo Login Credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@queueless.com', 'admin123')}
              className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg border border-purple-200 transition"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('staff@queueless.com', 'staff123')}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition"
            >
              🩺 Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user@queueless.com', 'user123')}
              className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition"
            >
              👤 Customer
            </button>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In to QueueLess'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
