import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail, UserCheck, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

import { getUserFriendlyError } from '@/lib/error-handler';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, role, loading, login, enterGuestMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  React.useEffect(() => {
    if (!loading && user && role) {
      if (role === 'faculty') {
        setLocation('/faculty');
      } else if (role === 'student') {
        setLocation('/student');
      } else if (role === 'admin') {
        setLocation('/admin');
      }
    }
  }, [user, role, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      if (res.role === 'faculty') {
        setLocation('/faculty');
      } else if (res.role === 'student') {
        setLocation('/student');
      } else {
        setLocation('/admin');
      }
    } else {
      setError(getUserFriendlyError(res.error, 'AUTHENTICATION', 'Invalid email or password. Please try again.'));
    }
  };

  const handleGuestSelect = (gRole: 'admin' | 'faculty' | 'student') => {
    enterGuestMode(gRole);
    setShowGuestModal(false);
    if (gRole === 'faculty') {
      setLocation('/faculty');
    } else if (gRole === 'student') {
      setLocation('/student');
    } else {
      setLocation('/admin');
    }
  };

  return (
    <main className="gateway-page noise flex items-center justify-center min-h-screen p-4">
      <div className="gateway-grid" />
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="gateway-brand-mark mb-3 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Cogniva</h1>
          <p className="text-sm text-slate-400 mt-1">Academic Intelligence Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm animate-fade">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your email"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30 disabled:opacity-50 text-sm mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setShowGuestModal(true)}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <UserCheck size={16} className="text-teal-400" />
            <span>Continue as Guest (Demo Mode)</span>
          </button>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Connected to Supabase Auth</span>
          </div>
        </div>
      </div>

      {/* Guest Role Selection Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles size={20} className="text-teal-400" />
                Explore Cogniva as Guest
              </h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Select a workspace below to explore Cogniva in an isolated sandbox environment. No credentials required.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleGuestSelect('admin')}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-teal-400 transition-colors flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-400" />
                    Guest Admin
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Explore institutional intelligence, structure & reports</div>
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => handleGuestSelect('faculty')}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-violet-400 transition-colors flex items-center gap-2">
                    <UserCheck size={16} className="text-violet-400" />
                    Guest Faculty
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Explore classroom intelligence, risk radar & attendance</div>
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => handleGuestSelect('student')}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    Guest Student
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Explore student priorities, what-if simulator & career lab</div>
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
