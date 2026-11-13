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

  // Password Reset state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'submit'>('request');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Google Authentication State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const isDemo = process.env.NEXT_PUBLIC_DEMO !== 'false';

  const handleGoogleSignIn = async (userEmail?: string, userName?: string) => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const emailToUse = userEmail || 'dr.kirteesh.rakshe@gmail.com';
      const nameToUse = userName || 'Dr. Kirteesh Rakshe';
      const data = await api.googleLogin({ email: emailToUse, name: nameToUse });
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success(`Google sign-in successful: Welcome ${data.user.name}!`);
      setGoogleModalOpen(false);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
      if ((res as any).demoResetToken) {
        setResetToken((res as any).demoResetToken);
      }
      setResetStep('submit');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request reset instructions.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.resetPassword({
        email: forgotEmail,
        resetToken: resetToken || 'demo-reset-token',
        newPassword: newResetPassword,
      });
      toast.success('Password reset successfully. Please log in with your new password.');
      setForgotModalOpen(false);
      setResetStep('request');
      setForgotEmail('');
      setResetToken('');
      setNewResetPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed.');
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
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PharmaCare
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-sky-200/70 font-medium">Enterprise Pharmacy Management</p>
          </div>
        </div>

        {/* Middle Value Pitch */}
        <div className="relative z-10 my-10 md:my-0 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Smart FEFO Dispensing & POS</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Clinical precision meets retail speed.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Secure batch management, automated expiry tracking, real-time inventory alerts, and rapid
              point-of-sale billing built for Indian healthcare standards.
            </p>
          </motion.div>

          {/* Key Feature Highlights */}
          <div className="space-y-3 pt-2">
            {[
              'First-Expiry, First-Out (FEFO) automated batch prioritization',
              'Proactive 7, 30 & 90-day expiry monitoring and write-offs',
              'Real-time WebSocket alerts on critical reorder thresholds',
              'Role-based access control protecting clinical audits',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>PharmaCare Chemist & Druggist</span>
          <span>Version 2.0 • INR (₹)</span>
        </div>
      </div>

      {/* Right Section: Split Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-16">
        <div className="w-full max-w-md space-y-7">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your pharmacist or store manager credentials.</p>
          </div>

          {/* Demo Auto-fill Helper Banner - Gated by NEXT_PUBLIC_DEMO */}
          {isDemo && (
            <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" /> Demo Credentials Quick-Fill (Test Mode):
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="flex-1 text-xs py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-800 font-medium rounded-lg border border-sky-200 transition-colors shadow-2xs"
                >
                  Admin (Dr. Kirteesh)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('cashier')}
                  className="flex-1 text-xs py-1.5 px-2.5 bg-white hover:bg-sky-100 text-sky-800 font-medium rounded-lg border border-sky-200 transition-colors shadow-2xs"
                >
                  Cashier (Pooja Sharma)
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Continue with Google Button */}
          <div>
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={() => setGoogleModalOpen(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">Or use email & password</span>
            </div>
          </div>

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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('request');
                    setForgotModalOpen(true);
                  }}
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
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-2xs"
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

      {/* Forgot / Reset Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title={resetStep === 'request' ? 'Password Recovery' : 'Set New Password'}
        subtitle={
          resetStep === 'request'
            ? 'Enter your registered email to request recovery instructions.'
            : 'Enter the recovery token and your new password.'
        }
        maxWidth="md"
      >
        {resetStep === 'request' ? (
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
                {forgotLoading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reset Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token or leave default in demo"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetStep('request')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors"
              >
                {forgotLoading ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Google Authentication Dialog */}
      <Modal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        title="Google Authentication"
        subtitle="Fast, secure pharmacist & admin sign-in through Google Identity."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* Quick Google Profiles */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Choose Google Account to Sign In:</label>
            
            <button
              type="button"
              onClick={() => handleGoogleSignIn('dr.kirteesh.rakshe@gmail.com', 'Dr. Kirteesh Rakshe')}
              className="w-full p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                  KR
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-sky-700">Dr. Kirteesh Rakshe (Admin)</div>
                  <div className="text-[11px] text-slate-400">dr.kirteesh.rakshe@gmail.com</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => handleGoogleSignIn('pooja.sharma.pharmacy@gmail.com', 'Pooja Sharma')}
              className="w-full p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  PS
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-sky-700">Pooja Sharma (Staff)</div>
                  <div className="text-[11px] text-slate-400">pooja.sharma.pharmacy@gmail.com</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Cashier</span>
            </button>
          </div>

          {/* Custom Google Email Input */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1.5">Or use any custom Google Account:</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                disabled={!customGoogleEmail}
                onClick={() => handleGoogleSignIn(customGoogleEmail, customGoogleName || customGoogleEmail.split('@')[0])}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
