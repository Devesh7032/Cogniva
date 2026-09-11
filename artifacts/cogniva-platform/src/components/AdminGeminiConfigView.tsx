import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export interface GeminiConfigItem {
  id: 'admin' | 'faculty' | 'student';
  name: string;
  serviceName: string;
  envVar: string;
  maskedKey: string;
  isConfigured: boolean;
  source: string;
  status: 'Connected' | 'Configuration Missing' | 'Invalid Credential' | 'Connection Error' | 'Untested';
  message?: string;
}

export function AdminGeminiConfigView() {
  const { role } = useAuth();
  const [configs, setConfigs] = useState<GeminiConfigItem[]>([
    {
      id: 'admin',
      name: 'Admin Gemini',
      serviceName: 'AdminGeminiService',
      envVar: 'GEMINI_ADMIN_API_KEY',
      maskedKey: '••••••••••••••••',
      isConfigured: false,
      source: 'Server Environment',
      status: 'Untested'
    },
    {
      id: 'faculty',
      name: 'Faculty Gemini',
      serviceName: 'FacultyGeminiService',
      envVar: 'GEMINI_FACULTY_API_KEY',
      maskedKey: '••••••••••••••••',
      isConfigured: false,
      source: 'Server Environment',
      status: 'Untested'
    },
    {
      id: 'student',
      name: 'Student Gemini',
      serviceName: 'StudentGeminiService',
      envVar: 'GEMINI_STUDENT_API_KEY',
      maskedKey: '••••••••••••••••',
      isConfigured: false,
      source: 'Server Environment',
      status: 'Untested'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    fetchStatus();
  }, [isAdmin]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gemini-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: role })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.configs) {
          setConfigs(data.configs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Gemini status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id: 'admin' | 'faculty' | 'student') => {
    setTestingId(id);
    try {
      const res = await fetch('/api/admin/gemini-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: role, serviceId: id })
      });
      const data = await res.json();
      if (data && data.status) {
        setConfigs(prev =>
          prev.map(c => (c.id === id ? { ...c, status: data.status, message: data.message } : c))
        );
      }
    } catch (err: any) {
      setConfigs(prev =>
        prev.map(c =>
          c.id === id ? { ...c, status: 'Connection Error', message: err?.message || 'Failed to trigger test endpoint' } : c
        )
      );
    } finally {
      setTestingId(null);
    }
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    for (const c of configs) {
      await handleTestConnection(c.id);
    }
    setTestingAll(false);
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const connectedCount = configs.filter(c => c.status === 'Connected').length;
  const missingCount = configs.filter(c => c.status === 'Configuration Missing' || (!c.isConfigured && c.status === 'Untested')).length;
  const failedCount = configs.filter(c => c.status === 'Invalid Credential' || c.status === 'Connection Error').length;

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 inline-block">
          <XCircle size={32} className="mx-auto mb-2 text-rose-400" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-xs text-rose-200/80 mt-1">
            Gemini AI Configuration Status is restricted exclusively to authorized Administrator accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase tracking-wider font-semibold mb-1">
            <Sparkles size={14} /> Developer & Admin Control Panel
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Gemini AI Configuration</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor the connection status of Cogniva's role-specific Gemini AI services.
          </p>
        </div>

        <button
          onClick={handleTestAll}
          disabled={testingAll || loading}
          className="button button-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={testingAll || loading ? 'animate-spin' : ''} />
          {testingAll ? 'Testing All Connections...' : 'Re-test All Connections'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Services</span>
            <span className="text-2xl font-extrabold text-slate-100 font-mono">3 Configurations</span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
            <Server size={20} />
          </div>
        </div>

        <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-wider block">Connected</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{connectedCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-5 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400/80 font-semibold uppercase tracking-wider block">Missing</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{missingCount}</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-5 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-rose-400/80 font-semibold uppercase tracking-wider block">Failed / Invalid</span>
            <span className="text-2xl font-extrabold text-rose-400 font-mono">{failedCount}</span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configs.map((config) => {
          const isTesting = testingId === config.id;

          const roleTheme =
            config.id === 'admin'
              ? { icon: ShieldCheck, color: 'violet', border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' }
              : config.id === 'faculty'
              ? { icon: UserCheck, color: 'teal', border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-400' }
              : { icon: GraduationCap, color: 'emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };

          const RoleIcon = roleTheme.icon;

          let statusBadge = (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Untested
            </span>
          );

          if (config.status === 'Connected') {
            statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ● Connected
              </span>
            );
          } else if (config.status === 'Configuration Missing') {
            statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> ○ Configuration Missing
              </span>
            );
          } else if (config.status === 'Invalid Credential') {
            statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle size={12} /> ⚠ Invalid Credential
              </span>
            );
          } else if (config.status === 'Connection Error') {
            statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <XCircle size={12} /> ⚠ Connection Error
              </span>
            );
          }

          return (
            <div
              key={config.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${roleTheme.border} ${roleTheme.bg} ${roleTheme.text}`}>
                      <RoleIcon size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-1.5">
                        ✦ {config.name.toUpperCase()}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 block">{config.serviceName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">{statusBadge}</div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {config.id === 'admin'
                    ? 'Powers administrative analytics, syllabus governance, and executive query synthesis.'
                    : config.id === 'faculty'
                    ? 'Powers faculty Ask Cogniva queries, IA-2 comeback plans, and class risk reports.'
                    : 'Powers student Ask Cogniva queries, study guidance, and assignment prioritizing.'}
                </p>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Environment Variable
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-teal-300">
                      <span className="truncate">{config.envVar}</span>
                      <button
                        onClick={() => handleCopyText(config.envVar, `var_${config.id}`)}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                        title="Copy Variable Name"
                      >
                        {copiedField === `var_${config.id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Masked Key
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-slate-300">
                      <span className="tracking-widest truncate">{config.maskedKey}</span>
                      <button
                        onClick={() => handleCopyText(config.maskedKey, `key_${config.id}`)}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                        title="Copy Masked Value"
                      >
                        {copiedField === `key_${config.id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500">Configuration Source:</span>
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Database size={11} className="text-teal-400" /> {config.source}
                    </span>
                  </div>
                </div>

                {config.message && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                      config.status === 'Connected'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : config.status === 'Configuration Missing'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {config.message}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleTestConnection(config.id)}
                  disabled={isTesting}
                  className="button button-secondary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-800"
                >
                  <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Testing Connection...' : 'Test Connection'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-3">
        <ShieldCheck size={20} className="text-teal-400 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Security Guarantee:</strong> Gemini API Keys are stored securely in backend server environment variables. Unmasked secrets are never rendered in HTML, logged to console, or returned in client API payloads.
        </p>
      </div>
    </div>
  );
}
