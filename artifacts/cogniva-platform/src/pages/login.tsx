import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, role, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError(res.error || 'Invalid email or password.');
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

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Connected to Supabase Auth</span>
        </div>
      </div>
    </main>
  );
}
