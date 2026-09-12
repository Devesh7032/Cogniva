import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Layers,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  fetchStudentAttendanceSummaryRecord,
  StudentAttendanceSummaryRecord,
  fetchStudentGradeSummaryRecord,
  StudentGradeSummaryRecord,
  fetchStudentCgpaRecord,
  StudentCgpaRecord,
  fetchAssignments,
  Assignment,
  fetchStudentAssignmentStatuses,
  StudentAssignmentStatus,
  fetchExaminations,
  Examination,
  fetchStudentGoals,
  Goal,
  fetchHackathons,
  Hackathon,
  getCurrentStudentContext,
  StudentContext,
  getTodayClassSchedule,
  getTomorrowClassSchedule,
  TodayScheduleResult,
  calculateAttendanceImpact,
  AttendanceImpactResult,
  fetchSubjects,
  Subject
} from '../lib/academic-api';
import { askStudentAi } from '../lib/ai-service';
import { useAuth } from '../lib/auth-context';

export interface SubjectHealthItem {
  subjectName: string;
  subjectCode: string;
  attendancePct: number | null;
  attendedClasses: number;
  totalClasses: number;
  grade: string | null;
  credits: number;
  status: 'SAFE' | 'ON_TRACK' | 'WATCH' | 'NEEDS_ATTENTION' | 'HIGH_RISK';
  statusLabel: string;
  explanation: string;
  upcomingExam?: Examination | null;
  upcomingAssignment?: Assignment | null;
}

export function StrategyCenter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Supabase Records
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [attendanceRec, setAttendanceRec] = useState<StudentAttendanceSummaryRecord | null>(null);
  const [gradeRec, setGradeRec] = useState<StudentGradeSummaryRecord | null>(null);
  const [cgpaRec, setCgpaRec] = useState<StudentCgpaRecord | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentStatuses, setAssignmentStatuses] = useState<StudentAssignmentStatus[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Timetable Schedules
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleResult | null>(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<TodayScheduleResult | null>(null);

  // Interactive Drawers & Modals
  const [selectedSubjectDrawer, setSelectedSubjectDrawer] = useState<SubjectHealthItem | null>(null);
  const [attendanceImpactSubject, setAttendanceImpactSubject] = useState<{
    subjectName: string;
    attended: number;
    total: number;
    currentPct: number;
    time?: string;
    room?: string;
  } | null>(null);
  const [whatIfSimulatedState, setWhatIfSimulatedState] = useState<'ATTEND' | 'MISS'>('MISS');

  // Collapsible Analytics State
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  // AI Strategy Guidance State
  const [aiStrategyAdvice, setAiStrategyAdvice] = useState<string | null>(null);
  const [aiStrategyLoading, setAiStrategyLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [user?.email]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const email = user?.email || 'student@cogniva.edu';
      const ctx = await getCurrentStudentContext(email);
      setStudentCtx(ctx);

      const sec = ctx?.sectionName || 'CSE-C';

      const [att, grd, cg, asgns, statuses, exams, gls, hcks, subs, todaySch, tomorrowSch] = await Promise.all([
        fetchStudentAttendanceSummaryRecord(email),
        fetchStudentGradeSummaryRecord(email),
        fetchStudentCgpaRecord(email),
        fetchAssignments({ section: sec }),
        fetchStudentAssignmentStatuses(email),
        fetchExaminations(sec),
        fetchStudentGoals(email),
        fetchHackathons(),
        fetchSubjects({ section: sec }),
        getTodayClassSchedule(sec),
        getTomorrowClassSchedule(sec)
      ]);

      setAttendanceRec(att);
      setGradeRec(grd);
      setCgpaRec(cg);
      setAssignments(asgns);
      setAssignmentStatuses(statuses);
      setExaminations(exams);
      setGoals(gls);
      setHackathons(hcks);
      setSubjects(subs);
      setTodaySchedule(todaySch);
      setTomorrowSchedule(tomorrowSch);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Fetch AI strategy advice
      if (att || grd) {
        fetchAiStrategyAdvice(att, grd, gls);
      }
    } catch (err) {
      console.error('Failed to load Strategy Center data:', err);
      setErrorMessage('Unable to synchronize strategy data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiStrategyAdvice = async (
    att: StudentAttendanceSummaryRecord | null,
    grd: StudentGradeSummaryRecord | null,
    gls: Goal[]
  ) => {
    setAiStrategyLoading(true);
    try {
      const prompt = `Student Academic Profile:
Attendance: ${att?.overall_percentage != null ? att.overall_percentage + '%' : 'Not available'}
Overall Grade: ${grd?.overall_grade || 'Not available'}
Goals Count: ${gls.length}

Provide 2 short bullet points advising what the student should focus on today for optimal academic progress.`;

      const res = await askStudentAi(prompt, user?.email);
      if (res && res.answer) {
        setAiStrategyAdvice(res.answer);
      } else {
        setAiStrategyAdvice('• Focus on core subjects near the 75% attendance threshold.\n• Complete pending coursework assignments due this week.');
      }
    } catch {
      setAiStrategyAdvice('• Focus on core subjects near the 75% attendance threshold.\n• Complete pending coursework assignments due this week.');
    } finally {
      setAiStrategyLoading(false);
    }
  };

  // Deterministic Subject Health Calculation
  const subjectHealthList = useMemo<SubjectHealthItem[]>(() => {
    const list: SubjectHealthItem[] = [];
    const attMap = new Map<string, { percentage: number; attended: number; total: number }>();

    if (attendanceRec && attendanceRec.subject_attendances) {
      attendanceRec.subject_attendances.forEach(sa => {
        attMap.set(sa.subject_name.toLowerCase().trim(), {
          percentage: sa.percentage,
          attended: sa.attended_classes,
          total: sa.total_classes
        });
      });
    }

    const gradeMap = new Map<string, string>();
    if (gradeRec && gradeRec.subject_grades) {
      gradeRec.subject_grades.forEach(sg => {
        gradeMap.set(sg.subject_name.toLowerCase().trim(), sg.grade);
      });
    }

    const rosterSubjects = subjects.length > 0 ? subjects : [
      { subject_name: 'Compiler Design', subject_code: 'CS401', credits: 4 },
      { subject_name: 'Data Analytics', subject_code: 'CS402', credits: 4 },
      { subject_name: 'Cloud Computing', subject_code: 'CS403', credits: 3 },
      { subject_name: 'Embedded Programming', subject_code: 'CS404', credits: 3 }
    ];

    rosterSubjects.forEach(s => {
      const sKey = s.subject_name.toLowerCase().trim();
      const attData = attMap.get(sKey);
      const grade = gradeMap.get(sKey) || null;

      const attPct = attData?.percentage ?? null;
      const attended = attData?.attended ?? 0;
      const total = attData?.total ?? 0;

      let status: SubjectHealthItem['status'] = 'ON_TRACK';
      let statusLabel = '✓ On Track';
      let explanation = 'Performance is stable.';

      if ((attPct !== null && attPct < 75) || grade === 'F' || grade === 'D') {
        status = 'HIGH_RISK';
        statusLabel = '🔴 High Risk';
        explanation = 'Attendance or grade is below required threshold.';
      } else if ((attPct !== null && attPct < 80) || grade === 'C' || grade === 'C+') {
        status = 'NEEDS_ATTENTION';
        statusLabel = '⚠ Needs Attention';
        explanation = 'Grade and attendance indicate improvement opportunity.';
      } else if ((attPct !== null && attPct < 85) || grade === 'B-') {
        status = 'WATCH';
        statusLabel = '⚠ Watch';
        explanation = 'Performance is acceptable but close to safety limit.';
      } else if (attPct !== null && attPct >= 90 && (grade === 'A' || grade === 'A+')) {
        status = 'SAFE';
        statusLabel = '✓ Strong';
        explanation = 'Keep up your current study pace!';
      }

      const upExam = examinations.find(e => e.subject_name?.toLowerCase().includes(sKey) || e.subject_code?.toLowerCase() === s.subject_code.toLowerCase());
      const upAsgn = assignments.find(a => a.subject?.toLowerCase().includes(sKey));

      list.push({
        subjectName: s.subject_name,
        subjectCode: s.subject_code,
        attendancePct: attPct,
        attendedClasses: attended,
        totalClasses: total,
        grade,
        credits: s.credits || 3,
        status,
        statusLabel,
        explanation,
        upcomingExam: upExam || null,
        upcomingAssignment: upAsgn || null
      });
    });

    return list;
  }, [attendanceRec, gradeRec, subjects, examinations, assignments]);

  // Determine #1 Priority Subject
  const topPrioritySubject = useMemo(() => {
    if (subjectHealthList.length === 0) return null;
    const sorted = [...subjectHealthList].sort((a, b) => {
      const order = { HIGH_RISK: 1, NEEDS_ATTENTION: 2, WATCH: 3, ON_TRACK: 4, SAFE: 5 };
      return order[a.status] - order[b.status];
    });
    return sorted[0];
  }, [subjectHealthList]);

  // Calculate Attendance Impact Modal Result
  const impactAnalysis = useMemo<AttendanceImpactResult | null>(() => {
    if (!attendanceImpactSubject) return null;

    const { subjectName, attended, total, currentPct } = attendanceImpactSubject;
    const effectiveAttended = whatIfSimulatedState === 'ATTEND' ? attended + 1 : attended;
    const effectiveTotal = total > 0 ? total + 1 : 0;

    return calculateAttendanceImpact(
      subjectName,
      effectiveAttended,
      effectiveTotal,
      currentPct,
      75
    );
  }, [attendanceImpactSubject, whatIfSimulatedState]);

  // Counts for KPI Cards
  const activePrioritiesCount = useMemo(() => {
    return subjectHealthList.filter(s => s.status === 'HIGH_RISK' || s.status === 'NEEDS_ATTENTION' || s.status === 'WATCH').length;
  }, [subjectHealthList]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Academic Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Your Academic Game Plan.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Know what needs your attention and decide where your next hour matters most.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Data</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            Last updated: {lastUpdated}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* 2. ACADEMIC SNAPSHOT (4 KPI CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: CGPA */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Current CGPA</span>
            <Award size={18} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {cgpaRec?.currentCgpa ? cgpaRec.currentCgpa.toFixed(2) : 'Not available'}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">↑ {cgpaRec?.trend || 'Stable'}</span>
            <span>vs prior term</span>
          </div>
        </div>

        {/* KPI 2: Attendance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Attendance</span>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {attendanceRec?.overall_percentage != null ? `${attendanceRec.overall_percentage}%` : 'Not available'}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${attendanceRec?.overall_percentage != null && attendanceRec.overall_percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{attendanceRec?.overall_percentage != null ? (attendanceRec.overall_percentage >= 75 ? '● Healthy Status' : '● Needs Attention') : 'No records yet'}</span>
          </div>
        </div>

        {/* KPI 3: Overall Grade */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Overall Grade</span>
            <BookOpen size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {gradeRec?.overall_grade || 'Not available'}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-bold">● Academic Track</span>
          </div>
        </div>

        {/* KPI 4: Active Priorities */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Priorities</span>
            <Target size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {activePrioritiesCount}
          </div>
          <div className="text-xs font-medium text-amber-700 mt-1 font-bold">
            {activePrioritiesCount > 0 ? `${activePrioritiesCount} Subject${activePrioritiesCount > 1 ? 's' : ''} Need Attention` : 'All Subjects On Track'}
          </div>
        </div>
      </div>

      {/* 3. ACADEMIC HEALTH SUMMARY */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Your Academic Health
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Performance</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">✓ Good</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">CGPA trajectory is consistent across completed terms.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Attendance</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${attendanceRec?.overall_percentage != null && attendanceRec.overall_percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {attendanceRec?.overall_percentage != null && attendanceRec.overall_percentage >= 80 ? '✓ Good' : '⚠ Watch'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {attendanceRec?.overall_percentage != null && attendanceRec.overall_percentage < 80 ? 'Core subjects are close to the 75% threshold.' : 'Overall attendance is above mandatory threshold.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Workload</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">✓ Balanced</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{assignments.length} assignments scheduled for section {studentCtx?.sectionName || 'CSE-C'}.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Deadlines</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${assignments.length > 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {assignments.length > 2 ? '⚠ Attention' : '✓ Normal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Assessments and assignments scheduled this term.</p>
          </div>
        </div>
      </div>

      {/* 4. YOUR #1 PRIORITY */}
      {topPrioritySubject && (
        <div className="bg-white border-2 border-indigo-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              Your #1 Priority
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">
              {topPrioritySubject.credits} Credits • {studentCtx?.sectionName || 'CSE-C'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {topPrioritySubject.subjectName}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-slate-600">
                <span>Grade: <strong>{topPrioritySubject.grade || 'Pending'}</strong></span>
                <span>•</span>
                <span>Attendance: <strong>{topPrioritySubject.attendancePct != null ? `${topPrioritySubject.attendancePct}%` : 'N/A'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedSubjectDrawer(topPrioritySubject)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>View Subject Details</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800 font-mono uppercase">Why does this need attention?</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {topPrioritySubject.explanation} Current attendance is at {topPrioritySubject.attendancePct != null ? `${topPrioritySubject.attendancePct}%` : 'unrecorded level'}, close to the 75% condonation threshold.
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-700 font-mono">Recommended Action:</span>
              <span className="text-slate-700 font-medium">Protect upcoming classes and review the weak topics before assessment.</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. TOMORROW AT A GLANCE & ATTENDANCE IMPACT ANALYZER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              Tomorrow at a Glance
            </div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              {tomorrowSchedule?.dayName ? `${tomorrowSchedule.dayName.toUpperCase()} · ${tomorrowSchedule.dateStr}` : 'Tomorrow Schedule'}
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-semibold rounded-lg">
            {studentCtx?.sectionName || 'CSE-C'} Section
          </span>
        </div>

        {tomorrowSchedule?.isHoliday ? (
          <div className="p-6 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-center space-y-2">
            <div className="text-2xl">🎉</div>
            <h4 className="text-base font-bold text-emerald-900 font-serif">NO CLASSES TOMORROW</h4>
            <p className="text-xs text-emerald-700 font-medium max-w-md mx-auto">
              {tomorrowSchedule.holidayReason || 'No classes are scheduled on the official timetable.'} Enjoy your study and rest window!
            </p>
          </div>
        ) : (tomorrowSchedule?.classes && tomorrowSchedule.classes.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tomorrowSchedule.classes.map(cls => {
              const matchingSub = subjectHealthList.find(s => s.subjectName.toLowerCase().includes(cls.subject_name.toLowerCase()));
              const currentAttPct = matchingSub?.attendancePct ?? 82;
              const attendedCount = matchingSub?.attendedClasses ?? 16;
              const totalCount = matchingSub?.totalClasses ?? 20;

              return (
                <div key={cls.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                      <span className="font-bold text-indigo-700">{cls.start_time} – {cls.end_time}</span>
                      <span>Room {cls.room_number}</span>
                    </div>
                    <h4 className="text-base font-bold font-serif text-slate-900">{cls.subject_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">Faculty: {cls.faculty_name}</p>

                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-600">Current Attendance:</span>
                      <strong className={currentAttPct < 80 ? 'text-amber-600' : 'text-emerald-600'}>{currentAttPct}%</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${currentAttPct < 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {currentAttPct < 80 ? '⚠ Priority Session' : '✓ On Track'}
                    </span>
                    <button
                      onClick={() => setAttendanceImpactSubject({
                        subjectName: cls.subject_name,
                        attended: attendedCount,
                        total: totalCount,
                        currentPct: currentAttPct,
                        time: `${cls.start_time} – ${cls.end_time}`,
                        room: cls.room_number
                      })}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                    >
                      Check Attendance Impact
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-2">
            <h4 className="text-base font-bold text-slate-800 font-serif">NO CLASSES TOMORROW</h4>
            <p className="text-xs text-slate-500 font-medium">No class periods listed on section timetable for tomorrow.</p>
          </div>
        )}
      </div>

      {/* 6. SUBJECT HEALTH GRID */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              Course Analysis
            </div>
            <h3 className="text-lg font-bold font-serif text-slate-900">Subject Health Overview</h3>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">{subjectHealthList.length} Courses Tracked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectHealthList.map(item => (
            <div key={item.subjectCode} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-400 font-bold text-[10px]">{item.subjectCode}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${item.status === 'HIGH_RISK' ? 'bg-rose-100 text-rose-800' : item.status === 'NEEDS_ATTENTION' ? 'bg-amber-100 text-amber-800' : item.status === 'WATCH' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {item.statusLabel}
                  </span>
                </div>
                <h4 className="text-sm font-bold font-serif text-slate-900 leading-snug">{item.subjectName}</h4>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Grade</span>
                    <strong className="text-slate-900 font-bold">{item.grade || 'Pending'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Attendance</span>
                    <strong className={item.attendancePct != null && item.attendancePct < 80 ? 'text-amber-600' : 'text-slate-900'}>
                      {item.attendancePct != null ? `${item.attendancePct}%` : 'N/A'}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                  {item.explanation}
                </p>
              </div>

              <button
                onClick={() => setSelectedSubjectDrawer(item)}
                className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <span>View Details</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. WHAT SHOULD YOU DO NEXT? (TOP 3 ACTIONS) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
          Action Roadmap
        </div>
        <h3 className="text-lg font-bold font-serif text-slate-900">What Should You Do Next?</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-indigo-600">01</span>
              <h4 className="text-sm font-bold text-slate-900 font-serif">Review {topPrioritySubject?.subjectName || 'Core Subject'}</h4>
              <p className="text-xs text-slate-500 font-medium">Reason: Attendance/grade requires early boost before assessment.</p>
            </div>
            <button
              onClick={() => setLocation('/student/subjects')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Start Review
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600">02</span>
              <h4 className="text-sm font-bold text-slate-900 font-serif">Prepare for Assessment</h4>
              <p className="text-xs text-slate-500 font-medium">Reason: Upcoming term tests and internal assessments scheduled.</p>
            </div>
            <button
              onClick={() => setLocation('/student/materials')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Prepare Materials
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-600">03</span>
              <h4 className="text-sm font-bold text-slate-900 font-serif">Complete Pending Assignments</h4>
              <p className="text-xs text-slate-500 font-medium">Reason: {assignments.length} assignments listed in section queue.</p>
            </div>
            <button
              onClick={() => setLocation('/student/priorities')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Open Tasks
            </button>
          </div>
        </div>
      </div>

      {/* 8. COGNIVA AI INSIGHT PANEL */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs font-bold uppercase">
            <BrainCircuit size={16} />
            <span>Cogniva AI Strategy Advisor</span>
          </div>
          <button
            onClick={() => setLocation('/student/ask')}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-lg border border-white/20 transition-all cursor-pointer"
          >
            Ask Cogniva
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {aiStrategyAdvice || 'Prioritize subjects near the 75% attendance threshold while maintaining momentum in core high-credit modules.'}
        </p>
      </div>

      {/* 9. COLLAPSIBLE DETAILED ACADEMIC ANALYTICS */}
      <div className="border border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
          className="w-full p-4 md:p-5 text-left flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-600" />
            <span className="text-sm font-bold font-serif text-slate-900">Detailed Academic Analytics</span>
            <span className="text-xs font-mono text-slate-400 font-normal">Opportunity map, effort vs impact, risk charts</span>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600">
            {showDetailedAnalytics ? 'Hide Analytics ▲' : 'Show Analytics ▼'}
          </span>
        </button>

        {showDetailedAnalytics && (
          <div className="p-5 border-t border-slate-200/80 space-y-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold font-mono text-slate-700 uppercase">Opportunity Score Map</h5>
                <p className="text-xs text-slate-500 font-medium">Subject priority matrix mapped by credits and grade gaps.</p>
                {subjectHealthList.slice(0, 3).map(s => (
                  <div key={s.subjectCode} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{s.subjectName}</span>
                    <span className="font-mono text-indigo-600 font-bold">{s.credits * 25} Opportunity Pt</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold font-mono text-slate-700 uppercase">Attendance Risk Breakdown</h5>
                <p className="text-xs text-slate-500 font-medium">Safe margins above the 75% condonation line.</p>
                {subjectHealthList.slice(0, 3).map(s => (
                  <div key={s.subjectCode} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{s.subjectName}</span>
                    <span className="font-mono text-emerald-600 font-bold">{s.attendancePct != null ? `${s.attendancePct}%` : 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBJECT DETAIL DRAWER */}
      {selectedSubjectDrawer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-fade">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selectedSubjectDrawer.subjectCode}</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">{selectedSubjectDrawer.subjectName}</h3>
              </div>
              <button
                onClick={() => setSelectedSubjectDrawer(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Grade</span>
                  <strong className="text-sm font-bold text-slate-900">{selectedSubjectDrawer.grade || 'Pending'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Attendance</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {selectedSubjectDrawer.attendancePct != null ? `${selectedSubjectDrawer.attendancePct}%` : 'N/A'}
                  </strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 font-mono uppercase text-[10px]">Why this needs attention:</span>
                <p className="p-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl font-medium">
                  {selectedSubjectDrawer.explanation}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 font-mono uppercase text-[10px]">What to do next:</span>
                <p className="p-3 bg-blue-50 text-blue-900 border border-blue-200/80 rounded-xl font-medium">
                  Review weak module topics and complete pending tasks before internal tests.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => {
                  setSelectedSubjectDrawer(null);
                  setLocation('/student/subjects');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Go to Subject Hub
              </button>
              <button
                onClick={() => {
                  setSelectedSubjectDrawer(null);
                  setAttendanceImpactSubject({
                    subjectName: selectedSubjectDrawer.subjectName,
                    attended: selectedSubjectDrawer.attendedClasses,
                    total: selectedSubjectDrawer.totalClasses,
                    currentPct: selectedSubjectDrawer.attendancePct ?? 82
                  });
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Check Attendance Impact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE IMPACT ANALYZER MODAL ("Can I Miss This?") */}
      {attendanceImpactSubject && impactAnalysis && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">Attendance Impact Analyzer</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">{attendanceImpactSubject.subjectName}</h3>
              </div>
              <button
                onClick={() => setAttendanceImpactSubject(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive Simulation Toggle */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-700">Simulate Tomorrow Session:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setWhatIfSimulatedState('ATTEND')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${whatIfSimulatedState === 'ATTEND' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  ○ Attend Class
                </button>
                <button
                  onClick={() => setWhatIfSimulatedState('MISS')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${whatIfSimulatedState === 'MISS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  ○ Miss Class
                </button>
              </div>
            </div>

            {/* Metric Comparison */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Current Attendance</span>
                <strong className="text-2xl font-bold font-serif text-slate-900">{attendanceImpactSubject.currentPct}%</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">Threshold: 75%</span>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
                <span className="text-[10px] font-mono text-indigo-600 uppercase block">
                  Projected ({whatIfSimulatedState === 'ATTEND' ? 'If Attended' : 'If Missed'})
                </span>
                <strong className={`text-2xl font-bold font-serif ${impactAnalysis.statusIfMissed === 'AT_RISK' && whatIfSimulatedState === 'MISS' ? 'text-rose-600' : 'text-indigo-900'}`}>
                  {whatIfSimulatedState === 'ATTEND' ? `${impactAnalysis.projectedIfAttended}%` : `${impactAnalysis.projectedIfMissed}%`}
                </strong>
                <span className="text-[10px] text-indigo-700 block mt-0.5 font-bold">
                  Buffer: {impactAnalysis.bufferIfMissed > 0 ? `+${impactAnalysis.bufferIfMissed}` : impactAnalysis.bufferIfMissed} pp
                </span>
              </div>
            </div>

            {/* Responsible Recommendation */}
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 font-mono">
                <Info size={14} className="text-amber-600 shrink-0" />
                <span>Academic Recommendation</span>
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                {impactAnalysis.recommendation}
              </p>
            </div>

            {/* Max Missable Calculation */}
            {impactAnalysis.maxMissableClassesBeforeThreshold > 0 && (
              <div className="text-center text-xs font-mono text-slate-500">
                Potential missable classes before reaching 75% threshold: <strong className="text-slate-900 font-bold">{impactAnalysis.maxMissableClassesBeforeThreshold} sessions</strong>
              </div>
            )}

            <button
              onClick={() => setAttendanceImpactSubject(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Close Analyzer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
