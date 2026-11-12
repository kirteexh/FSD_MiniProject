'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  Pill,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'cashier') => {
    if (role === 'admin') {
      setEmail('admin@pharmacare.io');
      setPassword('admin123');
    } else {
      setEmail('cashier@pharmacare.io');
      setPassword('cashier123');
    }
    setErrorMsg('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      toast.info(res.message);
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Section: Visual & Value Proposition */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pharma<span className="text-sky-400">Care</span>
            </h1>
            <p className="text-xs text-sky-200/70 uppercase tracking-widest font-semibold">
              Clinical & Retail Pharmacy Platform
            </p>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative z-10 my-12 max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-4 border border-sky-400/20">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Pharmacy Management
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Streamline your pharmacy operations with precision.
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Real-time inventory tracking, intelligent FEFO-based Point-of-Sale billing, automated low-stock and expiry alerts, and comprehensive financial reports — all in one modern clinical system.
            </p>
          </motion.div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-sky-400 font-semibold text-xs mb-1">
                <Zap className="w-4 h-4" /> Live WebSockets
              </div>
              <p className="text-[11px] text-slate-300">Instant alerts when stock falls below reorder thresholds.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-xs mb-1">
                <CheckCircle className="w-4 h-4" /> FEFO Auto-Deduction
              </div>
              <p className="text-[11px] text-slate-300">First-Expiry, First-Out batch selection safeguards medicine freshness.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          © 2026 PharmaCare Chemist & Druggist. Compliant with Drugs and Cosmetics Act & CDSCO Rules, India.
        </div>
      </div>

      {/* Right Section: Split Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-16">
        <div className="w-full max-w-md space-y-7">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your pharmacist or store manager credentials.</p>
          </div>

          {/* Demo Auto-fill Helper Banner */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" /> Demo Credentials Quick-Fill:
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="flex-1 text-xs py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-800 font-medium rounded-lg border border-sky-200 transition-colors shadow-xs"
              >
                Fill Admin (Dr. Kirteesh)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cashier')}
                className="flex-1 text-xs py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-800 font-medium rounded-lg border border-sky-200 transition-colors shadow-xs"
              >
                Fill Cashier (Pooja Sharma)
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pharmacare.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-600">
                Remember this workstation
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* System Security Notice */}
          <div className="pt-2 text-center text-xs text-slate-400">
            Protected by PharmaCare RBAC & JWT security. Unauthorized access is monitored.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password"
        subtitle="We'll send password recovery instructions to your email."
        maxWidth="md"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. admin@pharmacare.io"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={forgotLoading}
              className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition-colors"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

