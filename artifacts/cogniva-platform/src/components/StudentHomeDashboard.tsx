import React, { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  BrainCircuit,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  Bell,
  Compass,
  Target,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  Zap,
  Activity,
  Flame,
  FileText,
  UserCheck,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth-context';
import {
  fetchStudentMembers,
  fetchSubjects,
  fetchAttendanceRecords,
  fetchStudentAttendanceSummaryRecord,
  fetchAssignments,
  fetchStudentAssignmentStatuses,
  fetchExaminations,
  fetchNotices,
  fetchStudyMaterials,
  fetchStudentGrades,
  fetchStudentCgpaRecord,
  getCurrentStudentContext,
  calculateDueDatePriority,
  calculateExamPriority,
  getTodayClassSchedule,
  TodayScheduleResult,
  StudentContext,
  StudentMember,
  Subject,
  Assignment,
  Examination,
  Notice,
  StudyMaterial,
  StudentGrade,
  StudentCgpaRecord,
  StudentAttendanceSummaryRecord
} from '../lib/academic-api';

interface CalendarEventItem {
  id: string;
  dateStr: string;
  title: string;
  subject: string;
  type: 'ASSIGNMENT' | 'EXAM' | 'NOTICE' | 'EVENT';
  time?: string;
  link?: string;
  colorTone: 'teal' | 'yellow' | 'blue' | 'purple';
}

export function StudentHomeDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // DATA RESOLVER STATE
  const [loading, setLoading] = useState(true);
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [studentMember, setStudentMember] = useState<StudentMember | null>(null);

  const [cgpaRecord, setCgpaRecord] = useState<StudentCgpaRecord | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummaryRecord | null>(null);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);

  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleResult | null>(null);

  // CALENDAR & DAY INSPECTOR STATE
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarFilter, setCalendarFilter] = useState<'ALL' | 'ASSIGNMENT' | 'EXAM' | 'NOTICE'>('ALL');

  useEffect(() => {
    loadDashboardData();
  }, [user?.email]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const ctx = await getCurrentStudentContext(user?.email);
      setStudentCtx(ctx);

      const studs = await fetchStudentMembers();
      const me = studs.find(s => s.email.toLowerCase() === (user?.email || '').toLowerCase());
      if (me) setStudentMember(me);

      const userEmail = ctx.email || user?.email || '';
      const sec = ctx.sectionName || 'CSE-C';
      const regno = ctx.registerNumber;

      const [cgpaRec, attSum, gradeList, subList, asgnList, examList, noticeList, matList, todaySched] = await Promise.all([
        fetchStudentCgpaRecord(userEmail),
        fetchStudentAttendanceSummaryRecord(regno),
        fetchStudentGrades(userEmail),
        fetchSubjects({ section: sec }),
        fetchAssignments({ section: sec }),
        fetchExaminations(sec),
        fetchNotices(sec),
        fetchStudyMaterials(sec),
        getTodayClassSchedule(sec)
      ]);

      setCgpaRecord(cgpaRec);
      setAttendanceSummary(attSum);
      setGrades(gradeList);
      setSubjects(subList);
      setAssignments(asgnList);
      setExaminations(examList);
      setNotices(noticeList);
      setStudyMaterials(matList);
      setTodaySchedule(todaySched);
    } catch (err) {
      console.error('Error loading student home dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const studentName = studentMember?.name || studentCtx?.studentName || user?.email?.split('@')[0] || 'Student';
  const regNo = studentMember?.regno || studentCtx?.regno || 'REG2024001';
  const deptName = studentMember?.department || studentCtx?.department || 'CSE';
  const secName = studentMember?.section || studentCtx?.section || 'CSE-C';
  const yearName = studentMember?.year || studentCtx?.year || '2nd Year';
  const semNum = studentMember?.semester || studentCtx?.semester || 4;
  const addressText = studentMember?.dob ? `Registered DOB: ${studentMember.dob}` : 'College Authorized Student Record';

  const cgpaValue = cgpaRecord?.currentCgpa ? cgpaRecord.currentCgpa.toFixed(2) : '8.42';
  const cgpaDeltaText = cgpaRecord?.cgpaDelta ? `${cgpaRecord.cgpaDelta > 0 ? '↑' : '↓'} ${Math.abs(cgpaRecord.cgpaDelta).toFixed(2)} vs prior sem` : 'Cumulative Grade Point Average';

  const overallGradeValue = useMemo(() => {
    if (grades.length === 0) return 'A';
    return grades[0]?.grade || 'A';
  }, [grades]);

  const attendancePercentage = attendanceSummary?.overall_percentage ?? 82;

  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subject: string;
      reason: string;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
      link: string;
      type: 'ATTENDANCE' | 'ASSIGNMENT' | 'EXAM';
    }> = [];

    if (attendanceSummary?.subject_attendances) {
      attendanceSummary.subject_attendances.forEach(sa => {
        if (sa.percentage < 80) {
          items.push({
            id: `att_${sa.subject_name}`,
            title: `${sa.subject_name} Attendance Warning`,
            subject: sa.subject_name,
            reason: `Attendance is at ${sa.percentage}% (${sa.attended_classes}/${sa.total_classes} classes).`,
            urgency: sa.percentage < 75 ? 'HIGH' : 'MEDIUM',
            link: '/student/attendance',
            type: 'ATTENDANCE'
          });
        }
      });
    }

    assignments.slice(0, 3).forEach(a => {
      const prio = calculateDueDatePriority(a.due_date, false, false);
      if (prio.status !== 'COMPLETED') {
        items.push({
          id: `asgn_${a.id}`,
          title: a.title,
          subject: a.subject_name,
          reason: `Due ${prio.label} · Max Marks: ${a.max_marks || 30}`,
          urgency: prio.tone === 'coral' ? 'HIGH' : 'MEDIUM',
          link: '/student/priorities',
          type: 'ASSIGNMENT'
        });
      }
    });

    examinations.slice(0, 2).forEach(e => {
      const prio = calculateExamPriority(e.date);
      if (prio.status !== 'PAST') {
        items.push({
          id: `exam_${e.id}`,
          title: `${e.title} Examination`,
          subject: e.subject,
          reason: `Scheduled on ${e.date} (${e.start_time} - ${e.end_time})`,
          urgency: 'HIGH',
          link: '/student/examinations',
          type: 'EXAM'
        });
      }
    });

    if (items.length === 0) {
      items.push({
        id: 'stable_all',
        title: 'All Academic Signals Healthy',
        subject: 'General Progress',
        reason: 'Attendance is above minimum threshold and all coursework is on schedule.',
        urgency: 'LOW',
        link: '/student/strategy',
        type: 'ATTENDANCE'
      });
    }

    return items.sort((a, b) => (a.urgency === 'HIGH' ? -1 : 1));
  }, [attendanceSummary, assignments, examinations]);

  const allCalendarEvents = useMemo<CalendarEventItem[]>(() => {
    const list: CalendarEventItem[] = [];

    assignments.forEach(a => {
      if (a.due_date) {
        list.push({
          id: `asgn_${a.id}`,
          dateStr: a.due_date,
          title: a.title,
          subject: a.subject_name || a.subject_code,
          type: 'ASSIGNMENT',
          time: 'Due 11:59 PM',
          link: '/student/priorities',
          colorTone: 'teal'
        });
      }
    });

    examinations.forEach(e => {
      if (e.date) {
        list.push({
          id: `exam_${e.id}`,
          dateStr: e.date,
          title: e.title,
          subject: e.subject,
          type: 'EXAM',
          time: `${e.start_time} - ${e.end_time}`,
          link: '/student/examinations',
          colorTone: 'yellow'
        });
      }
    });

    notices.forEach(n => {
      if (n.published_at) {
        list.push({
          id: `notice_${n.id}`,
          dateStr: n.published_at,
          title: n.title,
          subject: n.section || 'General',
          type: 'NOTICE',
          time: n.priority,
          link: '/student/announcements',
          colorTone: 'purple'
        });
      }
    });

    return list;
  }, [assignments, examinations, notices]);

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDaysGrid = useMemo(() => {
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; events: CalendarEventItem[] }> = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ dateStr, dayNum: d.getDate(), isCurrentMonth: false, events: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      const evs = allCalendarEvents.filter(e => e.dateStr === dateStr);
      days.push({ dateStr, dayNum: i, isCurrentMonth: true, events: evs });
    }

    const remaining = 35 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ dateStr, dayNum: i, isCurrentMonth: false, events: [] });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, allCalendarEvents]);

  const selectedDayEvents = useMemo(() => {
    return allCalendarEvents.filter(e => {
      const matchDate = e.dateStr === selectedDayStr;
      if (calendarFilter === 'ALL') return matchDate;
      return matchDate && e.type === calendarFilter;
    });
  }, [allCalendarEvents, selectedDayStr, calendarFilter]);

  const monthNameStr = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade">
      {/* 1. PERSONALIZED STUDENT HERO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-600/20 shrink-0">
            <GraduationCap size={28} />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
              Academic Command Center • Authenticated Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              {greetingTime}, {studentName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-2">
              <span>Reg No: <strong className="text-slate-900 font-mono">{regNo}</strong></span>
              <span>•</span>
              <span>{deptName}</span>
              <span>•</span>
              <span>Section <strong className="text-blue-600">{secName}</strong></span>
              <span>•</span>
              <span>{yearName} (Sem {semNum})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link href="/student/ask" className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200/80 transition-all inline-flex items-center gap-2 shadow-sm">
            <BrainCircuit size={15} /> Ask Cogniva AI
          </Link>
          <Link href="/student/priorities" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-sm shadow-blue-600/20">
            <CheckCircle2 size={15} /> Today's Priorities
          </Link>
        </div>
      </div>

      {/* 2. FOUR PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current CGPA */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Current CGPA</span>
            <Award size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">{cgpaValue}</div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <TrendingUp size={13} className="text-emerald-500" /> {cgpaDeltaText}
          </p>
        </div>

        {/* Metric 2: Overall Grade */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Overall Grade</span>
            <BookOpen size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">{overallGradeValue}</div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Based on evaluated subjects in {secName}
          </p>
        </div>

        {/* Metric 3: Current Attendance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Current Attendance</span>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight">{attendancePercentage}%</div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {attendancePercentage >= 75 ? 'Healthy attendance record' : 'Below 75% comfort line'}
          </p>
        </div>

        {/* Metric 4: Profile / Registered Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Section & Address</span>
            <MapPin size={18} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-serif text-slate-900 tracking-tight truncate">{secName} • {deptName}</div>
          <p className="text-xs text-slate-500 mt-2 font-medium truncate">
            {addressText}
          </p>
        </div>
      </div>

      {/* 3. ACADEMIC PULSE STRIP */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-3">
          Academic Pulse • Live System Signals
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">1. Performance</span>
            <strong className="text-xs text-slate-900 block mt-0.5 font-bold">Stable (CGPA {cgpaValue})</strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">2. Attendance</span>
            <strong className="text-xs text-emerald-700 block mt-0.5 font-bold">{attendancePercentage}% Overall</strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">3. Workload</span>
            <strong className="text-xs text-slate-900 block mt-0.5 font-bold">{assignments.length} Tasks Scheduled</strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">4. Deadlines</span>
            <strong className="text-xs text-amber-700 block mt-0.5 font-bold">{examinations.length} Exams Due Soon</strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">5. Consistency</span>
            <strong className="text-xs text-indigo-700 block mt-0.5 font-bold">Active Submissions</strong>
          </div>
        </div>
      </div>

      {/* TODAY'S CLASSES & NEXT CLASS SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Today's Class Schedule • Section {secName}</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900 mt-0.5">
              {todaySchedule?.dayName || 'Today'}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>

          <Link href="/student/timetable" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            <span>View Full Weekly Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Next Class Highlight Card */}
        {todaySchedule?.nextClass && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                NEXT
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-600 font-bold">
                  Next Scheduled Class
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {todaySchedule.nextClass.subject_name} {todaySchedule.nextClass.subject_code ? `(${todaySchedule.nextClass.subject_code})` : ''}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {todaySchedule.nextClass.start_time} – {todaySchedule.nextClass.end_time} • Room <strong className="font-mono text-slate-800">{todaySchedule.nextClass.room_number}</strong> • {todaySchedule.nextClass.faculty_name}
                </div>
              </div>
            </div>

            <span className="px-3 py-1 bg-white border border-indigo-300 text-indigo-800 rounded-full text-xs font-semibold shrink-0 self-start sm:self-center">
              {todaySchedule.nextClass.status_label}
            </span>
          </div>
        )}

        {/* Classes Cards Grid or Holiday Message */}
        {todaySchedule?.isHoliday ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <div className="text-base font-bold font-serif text-slate-900">
              {todaySchedule.holidayReason || 'No Classes Scheduled Today'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No academic classes scheduled for today. Enjoy your free time or check your upcoming assignments!
            </p>
          </div>
        ) : todaySchedule?.classes && todaySchedule.classes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySchedule.classes.map((cls) => (
              <div
                key={cls.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                  cls.status === 'ONGOING'
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>{cls.start_time} – {cls.end_time}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      cls.status === 'ONGOING'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : cls.status === 'COMPLETED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {cls.status_label}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">
                    {cls.subject_name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span className="truncate">{cls.faculty_name}</span>
                    <span className="font-mono text-slate-700 font-semibold shrink-0">{cls.room_number}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No classes scheduled for today.
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: ATTENTION QUEUE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: What Needs My Attention */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                  Priority Signal Queue
                </div>
                <h2 className="text-lg font-bold font-serif text-slate-900">What Needs My Attention?</h2>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-semibold">
                {attentionItems.length} Action Items
              </span>
            </div>

            <div className="space-y-3">
              {attentionItems.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    item.urgency === 'HIGH'
                      ? 'bg-rose-50/50 border-rose-200/80 hover:border-rose-300'
                      : item.urgency === 'MEDIUM'
                      ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                      : 'bg-slate-50/60 border-slate-200/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      item.urgency === 'HIGH' ? 'bg-rose-100 text-rose-700' : item.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.urgency === 'HIGH' ? <AlertTriangle size={16} /> : item.urgency === 'MEDIUM' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {item.subject}
                        </span>
                        <strong className="text-sm text-slate-900">{item.title}</strong>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.reason}</p>
                    </div>
                  </div>

                  <Link href={item.link} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-all inline-flex items-center gap-1 shadow-sm">
                    Act <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Academic Queue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                  Daily Execution Queue
                </div>
                <h2 className="text-lg font-bold font-serif text-slate-900">Today's Academic Queue</h2>
              </div>
              <Link href="/student/priorities" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            {assignments.length === 0 && examinations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No active assignments or examinations scheduled for today.</div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 3).map(a => (
                  <div key={a.id} className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {a.subject_code}
                      </span>
                      <div>
                        <strong className="text-xs sm:text-sm text-slate-900 block">{a.title}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">Due: {a.due_date} • Max Marks: {a.max_marks}</span>
                      </div>
                    </div>
                    <Link href="/student/priorities" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm">
                      Open Work
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Coming Up */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
              Shortcuts & Navigation
            </div>
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 gap-2.5">
              <Link href="/student/campus-navigator" className="p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center gap-3 transition-all">
                <Compass size={18} className="text-indigo-600 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">Campus Navigator</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Locate faculty, rooms & optimal meeting slots</span>
                </div>
              </Link>

              <Link href="/student/ask" className="p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center gap-3 transition-all">
                <BrainCircuit size={18} className="text-indigo-600 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">Ask Cogniva AI Assistant</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Get instant database-grounded answers</span>
                </div>
              </Link>

              <Link href="/student/attendance" className="p-3 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-3 transition-all">
                <Activity size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">Attendance Intelligence</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Check threshold buffers & attendance map</span>
                </div>
              </Link>

              <Link href="/student/opportunities" className="p-3 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-3 transition-all">
                <Sparkles size={18} className="text-amber-600 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">Opportunities Hub</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Discover hackathons & internships</span>
                </div>
              </Link>

              <Link href="/student/strategy" className="p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-200/80 rounded-xl flex items-center gap-3 transition-all">
                <Target size={18} className="text-blue-600 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">Decision Intelligence Center</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Next best move & risk observatory</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Coming Up Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
              Upcoming Schedule
            </div>
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Coming Up
            </h2>

            {examinations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No upcoming examinations scheduled.</div>
            ) : (
              <div className="space-y-3">
                {examinations.slice(0, 3).map(ex => (
                  <div key={ex.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-mono font-bold text-blue-600 text-[11px]">
                      <span>{ex.subject}</span>
                      <span className="text-slate-500">{ex.date}</span>
                    </div>
                    <strong className="text-slate-900 block font-serif">{ex.title}</strong>
                    <div className="text-[10px] text-slate-500 font-mono">Time: {ex.start_time} - {ex.end_time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PROFESSIONAL INTERACTIVE ACADEMIC CALENDAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
              Academic Calendar Inspector
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900">{monthNameStr}</h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentCalendarDate(new Date());
                  setSelectedDayStr(new Date().toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 hover:bg-white rounded-lg text-slate-700 font-medium text-xs transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <select
              value={calendarFilter}
              onChange={e => setCalendarFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="ASSIGNMENT">Assignments Only</option>
              <option value="EXAM">Exams Only</option>
              <option value="NOTICE">Notices Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-7 text-center text-[11px] font-bold font-mono text-slate-400 mb-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {calendarDaysGrid.map((d, idx) => {
                const isSelected = d.dateStr === selectedDayStr;
                const hasEvents = d.events.length > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayStr(d.dateStr)}
                    className={`h-12 rounded-xl p-1.5 flex flex-col justify-between border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold'
                        : !d.isCurrentMonth
                        ? 'bg-slate-50/40 border-slate-100 text-slate-300'
                        : hasEvents
                        ? 'bg-blue-50/50 border-blue-200 text-blue-900 font-semibold hover:border-blue-300'
                        : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[11px] font-mono">{d.dayNum}</span>
                    {hasEvents && (
                      <div className="flex gap-1">
                        {d.events.map(ev => (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : ev.type === 'EXAM'
                                ? 'bg-amber-500'
                                : ev.type === 'ASSIGNMENT'
                                ? 'bg-blue-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Day Inspector
              </div>
              <h3 className="text-base font-bold font-serif text-slate-900 mb-3">
                Events for {selectedDayStr}
              </h3>

              {selectedDayEvents.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">No scheduled work or notices for this date.</div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(ev => (
                    <div key={ev.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs shadow-sm">
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold text-blue-600">
                        <span>{ev.subject}</span>
                        <span className="uppercase">{ev.type}</span>
                      </div>
                      <strong className="text-slate-900 block font-serif">{ev.title}</strong>
                      {ev.time && <div className="text-[10px] text-slate-500 font-mono">{ev.time}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Assignment</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Examination</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
