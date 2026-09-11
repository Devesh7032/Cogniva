import React from 'react';
import { Sparkles, BrainCircuit, AlertCircle, Info, Database, RefreshCw } from 'lucide-react';

export type Tone = 'blue' | 'teal' | 'amber' | 'coral' | 'violet';

export function StudentPageHeader({
  eyebrow,
  title,
  subtitle,
  actions
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1 flex items-center gap-1.5">
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

export function StudentSectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-0.5">
            {eyebrow}
          </div>
        )}
        <h2 className="text-lg font-bold font-serif text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StudentMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  trend
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: Tone;
  trend?: 'up' | 'down';
}) {
  const toneClasses = {
    blue: 'border-blue-100 bg-white text-blue-700',
    teal: 'border-emerald-100 bg-white text-emerald-700',
    amber: 'border-amber-100 bg-white text-amber-700',
    coral: 'border-rose-100 bg-white text-rose-700',
    violet: 'border-indigo-100 bg-white text-indigo-700'
  };

  const badgeTones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    teal: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60',
    coral: 'bg-rose-50 text-rose-700 border-rose-200/60',
    violet: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon size={16} className={toneClasses[tone].split(' ').pop()} />}
      </div>
      <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight my-1">
        {value}
      </div>
      {detail && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${tone === 'teal' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'coral' ? 'bg-rose-500' : tone === 'violet' ? 'bg-indigo-500' : 'bg-blue-500'}`} />
          <span className="truncate">{detail}</span>
        </div>
      )}
    </div>
  );
}

export function StudentStatusBadge({
  children,
  tone = 'blue',
  size = 'md'
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    teal: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60',
    coral: 'bg-rose-50 text-rose-700 border-rose-200/60',
    violet: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded-lg border ${tones[tone]} ${sizeClasses} whitespace-nowrap`}>
      {children}
    </span>
  );
}

export function StudentAiCallout({
  title = 'Cogniva AI Intelligence',
  content,
  loading = false,
  action
}: {
  title?: string;
  content: string;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white border border-indigo-200/80 rounded-2xl shadow-sm mb-6 flex items-start gap-3.5">
      <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
        <BrainCircuit size={18} className={loading ? 'animate-pulse' : ''} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
            <Sparkles size={12} /> {title}
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-100/70 text-indigo-800 text-[10px] font-mono border border-indigo-200">
            Gemini AI
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {loading ? 'Analyzing your academic data with Gemini AI...' : content}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StudentEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Database
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="p-8 sm:p-12 bg-white border border-slate-200/80 rounded-2xl text-center shadow-sm my-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-bold font-serif text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function StudentSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 my-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-5 bg-white border border-slate-200/80 rounded-2xl animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
