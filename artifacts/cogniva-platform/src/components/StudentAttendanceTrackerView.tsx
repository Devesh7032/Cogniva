import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap
} from 'lucide-react';
import {
  fetchStudentAttendanceSummaryRecord,
  StudentAttendanceSummaryRecord,
  DynamicSubjectAttendance
} from '../lib/academic-api';
import { askStudentAi } from '../lib/ai-service';
import { useAuth } from '../lib/auth-context';

type StatusFilter = 'ALL' | 'AT_RISK' | 'WATCH' | 'SAFE';

export function StudentAttendanceTrackerView() {
  const { user } = useAuth();
  const [summaryRecord, setSummaryRecord] = useState<StudentAttendanceSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Advisor State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Interactive Filters & Focus Mode
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);

  // Selected Subject Detail Modal
  const [selectedSubject, setSelectedSubject] = useState<DynamicSubjectAttendance | null>(null);
  const [simulatedClasses, setSimulatedClasses] = useState<number>(0);
  const [simulatedAction, setSimulatedAction] = useState<'ATTEND' | 'MISS'>('ATTEND');

  useEffect(() => {
    if (!user?.email) return;
    loadAttendanceData();
  }, [user?.email]);

  const loadAttendanceData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rec = await fetchStudentAttendanceSummaryRecord(user?.email || '');
      setSummaryRecord(rec);
      if (rec && rec.subjectAttendances && rec.subjectAttendances.length > 0) {
        generateAiAdvice(rec);
      }
    } catch {
      setErrorMessage('Unable to load dynamic attendance records. Please try refreshing.');
    } fontally: {
      setLoading(false);
    }
  };

  const generateAiAdvice = async (rec: StudentAttendanceSummaryRecord) => {
    setAiLoading(true);
    try {
      const overallText = typeof rec.overallAttendancePercentage === 'number' && !isNaN(rec.overallAttendancePercentage)
        ? `${rec.overallAttendancePercentage}%`
        : 'N/A';
      
      const prompt = `Student Attendance Analysis:
Overall Attendance: ${overallText}
Status: ${rec.overallStatus}
Subject Breakdown:
${rec.subjectAttendances.map(s => `- ${s.subjectName}: ${s.attendancePercentage}% (${s.status})`).join('\n')}

Provide a concise, 2-3 sentence personalized academic advice to this student regarding mandatory 75% attendance criteria, highlight any critical subject risks, and give clear action guidance for exam eligibility.`;
      
      const response = await askStudentAi(prompt, user?.email);
      if (response && response.answer && typeof response.answer === 'string') {
        setAiAdvice(response.answer);
      } else {
        setAiAdvice("Maintain at least 75% attendance across all core subjects to fulfill departmental eligibility criteria for end-semester examinations.");
      }
    } catch {
      setAiAdvice("Maintain at least 75% attendance across all core subjects to fulfill departmental eligibility criteria for end-semester examinations.");
    } finally {
      setAiLoading(false);
    }
  };

  // Safe percentage extractor
  const safeOverallPct = useMemo(() => {
    if (!summaryRecord || summaryRecord.overallAttendancePercentage === null || summaryRecord.overallAttendancePercentage === undefined) {
      return null;
    }
    const val = Number(summaryRecord.overallAttendancePercentage);
    return isNaN(val) ? null : Math.round(val * 10) / 10;
  }, [summaryRecord]);

  // Threshold Overall Buffer
  const overallBuffer = useMemo(() => {
    if (safeOverallPct === null) return 0;
    return Math.round((safeOverallPct - 75) * 10) / 10;
  }, [safeOverallPct]);

  // Filtered Subject List
  const filteredSubjects = useMemo(() => {
    if (!summaryRecord || !summaryRecord.subjectAttendances) return [];
    
    return summaryRecord.subjectAttendances.filter(sub => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!sub.subjectName.toLowerCase().includes(q)) return false;
      }

      // Focus Mode (Hides Safe >=85% subjects)
      if (focusMode && sub.attendancePercentage >= 85) {
        return false;
      }

      // Status Tab Filter
      if (statusFilter === 'AT_RISK') return sub.attendancePercentage < 75;
      if (statusFilter === 'WATCH') return sub.attendancePercentage >= 75 && sub.attendancePercentage < 85;
      if (statusFilter === 'SAFE') return sub.attendancePercentage >= 85;

      return true;
    });
  }, [summaryRecord, searchQuery, statusFilter, focusMode]);

  // Stats Counts
  const counts = useMemo(() => {
    if (!summaryRecord || !summaryRecord.subjectAttendances) {
      return { total: 0, atRisk: 0, watch: 0, safe: 0 };
    }
    const list = summaryRecord.subjectAttendances;
    return {
      total: list.length,
      atRisk: list.filter(s => s.attendancePercentage < 75).length,
      watch: list.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 85).length,
      safe: list.filter(s => s.attendancePercentage >= 85).length
    };
  }, [summaryRecord]);

  // Overall Ring Stroke Calculation
  const strokeDashoffset = useMemo(() => {
    const radius = 64;
    const circumference = 2 * Math.PI * radius; // ~402.12
    if (safeOverallPct === null) return circumference;
    const pct = Math.min(100, Math.max(0, safeOverallPct));
    return circumference - (pct / 100) * circumference;
  }, [safeOverallPct]);

  // Class Estimation Helper for Detail Modal
  const getSubjectImpactMetrics = (sub: DynamicSubjectAttendance, simCount: number, simType: 'ATTEND' | 'MISS') => {
    const pct = sub.attendancePercentage;
    const estimatedTotalClasses = 30; // Standard semester benchmark
    const estimatedAttended = Math.round((pct / 100) * estimatedTotalClasses);

    let newAttended = estimatedAttended;
    let newTotal = estimatedTotalClasses;

    if (simType === 'ATTEND') {
      newAttended += simCount;
      newTotal += simCount;
    } else {
      newTotal += simCount;
    }

    const projectedPct = Math.min(100, Math.max(0, Math.round((newAttended / newTotal) * 1000) / 10));
    
    // Classes needed to reach 75%
    let classesNeededToReach75 = 0;
    if (pct < 75) {
      // Formula: (Attended + x) / (Total + x) >= 0.75 => x >= 3*Total - 4*Attended
      const rawNeeded = 3 * estimatedTotalClasses - 4 * estimatedAttended;
      classesNeededToReach75 = Math.max(1, Math.ceil(rawNeeded));
    }

    // Skips allowed before dropping below 75%
    let safeSkipsAllowed = 0;
    if (pct >= 75) {
      // Formula: Attended / (Total + y) >= 0.75 => y <= (Attended / 0.75) - Total
      const rawSkips = (estimatedAttended / 0.75) - estimatedTotalClasses;
      safeSkipsAllowed = Math.max(0, Math.floor(rawSkips));
    }

    return {
      projectedPct,
      classesNeededToReach75,
      safeSkipsAllowed,
      delta: Math.round((projectedPct - pct) * 10) / 10
    };
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-2">
      {/* 1. HERO HEADER */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-semibold block mb-1">
            STUDENT WORKSPACE · ATTENDANCE INTELLIGENCE
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Cogniva Attendance Pulse
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
              {counts.total} Dynamic Subjects Tracked
            </span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Real-time subject attendance tracking, 75% mandatory threshold buffer monitor, and AI eligibility advisor.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadAttendanceData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-3">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="inline-block p-3 rounded-full bg-blue-50 mb-3 animate-pulse">
            <Activity className="text-blue-600 animate-spin" size={28} />
          </div>
          <p className="text-slate-800 font-semibold text-sm">Synchronizing live attendance records from Supabase...</p>
          <p className="text-slate-500 text-xs mt-1">Calculating threshold buffers and subject health status...</p>
        </div>
      ) : !summaryRecord || !summaryRecord.subjectAttendances || summaryRecord.subjectAttendances.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-500">
          <ShieldAlert size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Attendance Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No dynamic attendance data has been published for your student profile yet. Please check back after your faculty uploads subject evaluation records.
          </p>
        </div>
      ) : (
        <>
          {/* CRITICAL SHORTAGE WARNING (If overall or any subject < 75%) */}
          {(counts.atRisk > 0 || (safeOverallPct !== null && safeOverallPct < 75)) && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 text-rose-900 shadow-sm">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5 border border-rose-200">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono font-bold text-rose-900 uppercase tracking-wider">
                    Mandatory 75% Attendance Alert
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono border border-rose-200">
                    ACTION REQUIRED
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {safeOverallPct !== null && safeOverallPct < 75 ? (
                    <>Your overall attendance (<strong className="text-rose-800 font-bold">{safeOverallPct}%</strong>) is below the required 75% departmental minimum threshold. </>
                  ) : null}
                  {counts.atRisk > 0 ? (
                    <>You have shortage in <strong className="text-rose-800 font-bold">{counts.atRisk} subject{counts.atRisk > 1 ? 's' : ''}</strong> ({summaryRecord.subjectAttendances.filter(s => s.attendancePercentage < 75).map(s => `${s.subjectName} [${s.attendancePercentage}%]`).join(', ')}). </>
                  ) : null}
                  Contact course instructors immediately to make up missing sessions and ensure exam hall ticket clearance.
                </p>
              </div>
            </div>
          )}

          {/* 2. MAIN ATTENDANCE PULSE + AI ADVISOR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MAIN VISUAL PULSE GAUGE CARD */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-blue-600" />
                  <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Attendance Pulse</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                  safeOverallPct !== null && safeOverallPct >= 85
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : safeOverallPct !== null && safeOverallPct >= 75
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {summaryRecord.overallStatus === 'Good' ? 'GOOD STANDING' : summaryRecord.overallStatus === 'Watch' ? 'WATCH LIST' : 'ATTENDANCE ALERT'}
                </span>
              </div>

              {/* CIRCULAR GAUGE DISPLAY */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {/* Outer Track Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      className="stroke-slate-100"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Threshold 75% Marker Line */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      className="stroke-slate-200"
                      strokeWidth="12"
                      strokeDasharray="2 6"
                      fill="transparent"
                    />
                    {/* Animated Radial Value Arc */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      className={`transition-all duration-1000 ease-out ${
                        safeOverallPct !== null && safeOverallPct >= 85
                          ? 'stroke-emerald-500'
                          : safeOverallPct !== null && safeOverallPct >= 75
                          ? 'stroke-amber-500'
                          : 'stroke-rose-500'
                      }`}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Center Value Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {safeOverallPct !== null ? `${safeOverallPct}%` : '—'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Overall
                    </span>
                  </div>
                </div>

                {/* THRESHOLD BUFFER MARGIN BOX */}
                <div className="flex-1 w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">Minimum Required:</span>
                    <span className="font-mono font-bold text-slate-800">75.0%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-mono">Dynamic Buffer Margin:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                      overallBuffer >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {overallBuffer >= 0 ? `+${overallBuffer}% Buffer` : `${overallBuffer}% Shortfall`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal pt-1">
                    {overallBuffer >= 0 ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} className="inline text-emerald-600 shrink-0" />
                        Operating safely {overallBuffer}% above minimum department criteria.
                      </span>
                    ) : (
                      <span className="text-rose-700 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} className="inline text-rose-600 shrink-0" />
                        Currently {Math.abs(overallBuffer)}% short of eligibility requirements.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* COGNIVA AI ACADEMIC ADVISOR PANEL */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                      <Sparkles size={16} className="animate-pulse" />
                    </div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-900">
                      Cogniva AI Academic Advisor
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-mono font-bold">
                    Gemini Live
                  </span>
                </div>

                <div className="min-h-[100px] flex items-center">
                  {aiLoading ? (
                    <div className="space-y-2 w-full py-4">
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4"></div>
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse w-full"></div>
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse w-5/6"></div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                      <p className="whitespace-pre-line">
                        {aiAdvice || "Maintain at least 75% attendance across all core subjects to ensure hall ticket clearance and avoid exam eligibility restrictions."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Info size={13} className="text-blue-600" />
                  Calculated dynamically based on real academic evaluation logs.
                </span>
                {summaryRecord.lowestSubject && (
                  <span className="text-amber-800 font-mono text-[11px] font-semibold">
                    Lowest Focus: {summaryRecord.lowestSubject.subjectName} ({summaryRecord.lowestSubject.percentage}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. KEY METRICS ROW (4 CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Overall Attendance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Overall Attendance</span>
              <div className="my-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {safeOverallPct !== null ? `${safeOverallPct}%` : '—'}
                </span>
                <span className={`text-xs font-semibold font-mono ${safeOverallPct !== null && safeOverallPct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {safeOverallPct !== null && safeOverallPct >= 75 ? '✓ Compliant' : '⚠ Shortage'}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Status: <strong className="text-slate-800">{summaryRecord.overallStatus}</strong>
              </span>
            </div>

            {/* CARD 2: Total Tracked Subjects */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Tracked Roster</span>
              <div className="my-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-blue-600">
                  {counts.total}
                </span>
                <span className="text-xs font-semibold font-mono text-slate-400">Subjects</span>
              </div>
              <span className="text-xs text-slate-500">
                At Risk: <strong className="text-rose-600 font-mono">{counts.atRisk}</strong> | Watch: <strong className="text-amber-600 font-mono">{counts.watch}</strong>
              </span>
            </div>

            {/* CARD 3: Strongest Subject */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1">
                <Award size={13} />
                Strongest Subject
              </span>
              <div className="my-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {summaryRecord.highestSubject ? summaryRecord.highestSubject.subjectName : 'None'}
                </p>
                <p className="text-xl font-black font-mono text-emerald-600">
                  {summaryRecord.highestSubject ? `${summaryRecord.highestSubject.percentage}%` : '—'}
                </p>
              </div>
              <span className="text-xs text-slate-500">Highest recorded score</span>
            </div>

            {/* CARD 4: Lowest / Needs Attention */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold flex items-center gap-1">
                <AlertTriangle size={13} />
                Needs Attention
              </span>
              <div className="my-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {summaryRecord.lowestSubject ? summaryRecord.lowestSubject.subjectName : 'None'}
                </p>
                <p className={`text-xl font-black font-mono ${summaryRecord.lowestSubject && summaryRecord.lowestSubject.percentage >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {summaryRecord.lowestSubject ? `${summaryRecord.lowestSubject.percentage}%` : '—'}
                </p>
              </div>
              <span className="text-xs text-slate-500">Requires focus monitoring</span>
            </div>
          </div>

          {/* 4. INTERACTIVE TOOLBAR (FILTERS, SEARCH & FOCUS MODE) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* STATUS FILTER TABS */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({counts.total})
                </button>
                <button
                  onClick={() => setStatusFilter('AT_RISK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'AT_RISK'
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  At Risk (&lt;75%)
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                    {counts.atRisk}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('WATCH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'WATCH'
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Watch (75-84%)
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                    {counts.watch}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('SAFE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'SAFE'
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Safe (&ge;85%)
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold">
                    {counts.safe}
                  </span>
                </button>
              </div>

              {/* SEARCH & FOCUS MODE TOGGLE */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subject..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    focusMode
                      ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Hide safe subjects (>=85%) to focus on subjects needing attention"
                >
                  <Zap size={14} className={focusMode ? 'text-amber-600 fill-amber-600' : 'text-slate-400'} />
                  Focus Mode {focusMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 5. SUBJECT HEALTH MAP (CARDS GRID) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                Subject Health Map
                <span className="text-xs font-normal text-slate-500 lowercase font-mono">
                  ({filteredSubjects.length} of {summaryRecord.subjectAttendances.length} displayed)
                </span>
              </h3>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-500">
                <p className="text-xs text-slate-500 font-medium">No subjects match the selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub, idx) => {
                  const subPct = sub.attendancePercentage;
                  const subBuffer = Math.round((subPct - 75) * 10) / 10;
                  const isSafe = subPct >= 85;
                  const isWatch = subPct >= 75 && subPct < 85;

                  return (
                    <div
                      key={idx}
                      className="bg-white transition-all p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Subject Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                            {sub.subjectName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono border shrink-0 ${
                              isSafe
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isWatch
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isSafe ? 'SAFE' : isWatch ? 'WATCH' : 'AT RISK'}
                          </span>
                        </div>

                        {/* Percentage & Buffer Pill */}
                        <div className="flex items-baseline justify-between my-2">
                          <span className={`text-2xl font-black font-mono ${
                            isSafe ? 'text-emerald-600' : isWatch ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {subPct}%
                          </span>

                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            subBuffer >= 0
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {subBuffer >= 0 ? `+${subBuffer}% Buffer` : `${subBuffer}% Deficit`}
                          </span>
                        </div>

                        {/* Progress Bar with 75% Threshold Marker */}
                        <div className="relative my-3">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full transition-all duration-700 rounded-full ${
                                isSafe ? 'bg-emerald-500' : isWatch ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, subPct))}%` }}
                            />
                          </div>
                          {/* 75% Line Marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                            style={{ left: '75%' }}
                            title="75% Department Minimum Threshold"
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedSubject(sub);
                          setSimulatedClasses(0);
                          setSimulatedAction('ATTEND');
                        }}
                        className="mt-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} className="text-blue-600" />
                        Analyze Buffer & Impact
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. DETAILED ATTENDANCE ROSTER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Dynamic Subject Attendance Roster
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Minimum Eligibility Target: 75.0%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/40">
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-4 text-center">Attendance %</th>
                    <th className="py-3.5 px-4">Threshold Bar (75%)</th>
                    <th className="py-3.5 px-4 text-center">Buffer Margin</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryRecord.subjectAttendances.map((sub, idx) => {
                    const pct = sub.attendancePercentage;
                    const buf = Math.round((pct - 75) * 10) / 10;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {sub.subjectName}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className={pct >= 85 ? 'text-emerald-700' : pct >= 75 ? 'text-amber-700' : 'text-rose-700'}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full ${pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400" style={{ left: '75%' }} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span className={buf >= 0 ? 'text-blue-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {buf >= 0 ? `+${buf}%` : `${buf}%`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono border ${
                            pct >= 85
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : pct >= 75
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {pct >= 85 ? 'Safe' : pct >= 75 ? 'Watch' : 'At Risk'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSubject(sub);
                              setSimulatedClasses(0);
                              setSimulatedAction('ATTEND');
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            Analyze
                            <ChevronRight size={13} className="text-blue-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 7. SUBJECT DETAIL & CLASS IMPACT SIMULATOR MODAL */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 relative" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-bold">
                  Subject Buffer Analysis
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedSubject.subjectName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Current Attendance:</span>
                <span className={`text-2xl font-black font-mono ${
                  selectedSubject.attendancePercentage >= 85
                    ? 'text-emerald-700'
                    : selectedSubject.attendancePercentage >= 75
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {selectedSubject.attendancePercentage}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span>Threshold Standard:</span>
                <span className="font-mono font-bold text-slate-800">75.0% Minimum</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Buffer Margin:</span>
                <span className={`font-mono font-bold ${
                  selectedSubject.attendancePercentage >= 75 ? 'text-blue-700' : 'text-rose-700'
                }`}>
                  {selectedSubject.attendancePercentage >= 75
                    ? `+${Math.round((selectedSubject.attendancePercentage - 75) * 10) / 10}% Buffer`
                    : `${Math.round((selectedSubject.attendancePercentage - 75) * 10) / 10}% Deficit`}
                </span>
              </div>
            </div>

            {/* Threshold Action Intelligence */}
            {(() => {
              const metrics = getSubjectImpactMetrics(selectedSubject, simulatedClasses, simulatedAction);
              return (
                <div className="space-y-4">
                  {selectedSubject.attendancePercentage < 75 ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                      <strong className="block text-rose-900 font-bold flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600" />
                        Eligibility Shortfall Recovery Strategy
                      </strong>
                      <p className="leading-relaxed text-slate-700">
                        To reach the mandatory 75% eligibility mark, you need to attend approximately{' '}
                        <strong className="text-rose-900 font-bold font-mono text-sm underline">
                          {metrics.classesNeededToReach75} consecutive lectures
                        </strong>{' '}
                        without missing any.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                      <strong className="block text-emerald-900 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Attendance Cushion Buffer
                      </strong>
                      <p className="leading-relaxed text-slate-700">
                        You are currently in good standing! You can safely miss up to{' '}
                        <strong className="text-emerald-900 font-bold font-mono text-sm underline">
                          {metrics.safeSkipsAllowed} upcoming lectures
                        </strong>{' '}
                        before your attendance falls below the 75% threshold.
                      </p>
                    </div>
                  )}

                  {/* Class Impact Simulator Controls */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Zap size={14} className="text-blue-600" />
                        Lecture Attendance Simulator
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSimulatedAction('ATTEND')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          simulatedAction === 'ATTEND'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        + Attend Classes
                      </button>
                      <button
                        onClick={() => setSimulatedAction('MISS')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          simulatedAction === 'MISS'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        - Miss Classes
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Simulate {simulatedAction === 'ATTEND' ? 'attending' : 'missing'} next:
                      </span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 5, 8].map(num => (
                          <button
                            key={num}
                            onClick={() => setSimulatedClasses(num)}
                            className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              simulatedClasses === num
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {simulatedClasses > 0 && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Projected Outcome:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{selectedSubject.attendancePercentage}%</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <span className={`font-bold ${metrics.projectedPct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metrics.projectedPct}%
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${metrics.delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            ({metrics.delta >= 0 ? `+${metrics.delta}%` : `${metrics.delta}%`})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
