import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell,
  BookOpen, BookMarked, BrainCircuit, Building2, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, ClipboardList,
  Clock3, Database, Download, ExternalLink, FileSpreadsheet, FileText, Filter,
  Gauge, GraduationCap, HeartPulse, History, Info, LayoutDashboard, Lightbulb, ListChecks,
  LogOut, Menu, MessageSquare, MoreHorizontal, Network, PanelLeftClose, PanelLeftOpen,
  Play, Plus, Radar, RefreshCw, Save, Search, Send, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, TrendingDown, TrendingUp, Upload,
  UserCheck, UserCog, UsersRound, X, XCircle, Zap
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/pages/login';
import {
  AdminHomeView,
  AcademicStructureView,
  FacultyAccessView,
  StudentManagementView,
  FacultyManagementView
} from '@/components/admin-dashboard';
import {
  fetchFacultyAssignedSections,
  fetchFacultyAssignedStudents,
  fetchStudentsBySection,
  fetchStudentMembers,
  fetchAttendanceRecords,
  saveAttendanceBatch,
  fetchAttendanceHistory,
  validateAttendanceExcelHeaders,
  importAttendanceExcel,
  createExamination,
  fetchExaminations,
  createStudyMaterial,
  fetchStudyMaterials,
  uploadFileToSupabaseStorage,
  fetchSubjects,
  createSubject,
  deleteSubject,
  fetchFacultySubjectAssignments,
  assignFacultyToSubject,
  facultyAddSubject,
  removeFacultySubjectAssignment,
  fetchStudentGrades,
  saveStudentGradesBatch,
  validateGradesExcelHeaders,
  importGradesExcel,
  calculateGradeAndTotal,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchAssignmentSubmissions,
  submitAssignment,
  gradeSubmission,
  fetchStudentAssignmentStatuses,
  toggleAssignmentCompletion,
  calculateDueDatePriority,
  calculateExamPriority,
  StudentMember,
  Section,
  AttendanceRecord,
  Examination,
  StudyMaterial,
  ImportResult,
  Subject,
  FacultySubjectAssignment,
  StudentGrade,
  Assignment,
  AssignmentSubmission,
  StudentAssignmentStatus
} from '@/lib/academic-api';

const queryClient = new QueryClient();
type Role = 'student' | 'faculty' | 'admin';
type Tone = 'teal' | 'amber' | 'coral' | 'violet';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] };
const nav: NavItem[] = [
  { href: '/student', label: 'Home / Overview', icon: LayoutDashboard, roles: ['student'] },
  { href: '/student/priorities', label: "Today's Priorities", icon: ListChecks, roles: ['student'] },
  { href: '/student/explain', label: 'Explain Panel', icon: BrainCircuit, roles: ['student'] },
  { href: '/student/subjects', label: 'My Subjects', icon: GraduationCap, roles: ['student'] },
  { href: '/student/attendance', label: 'Attendance Tracker', icon: CheckCircle2, roles: ['student'] },
  { href: '/student/insights', label: 'Risk & Workload', icon: HeartPulse, roles: ['student'] },
  { href: '/student/planner', label: 'Adaptive Action Planner', icon: ClipboardList, roles: ['student'] },
  { href: '/student/simulator', label: 'What-if Simulator', icon: Radar, roles: ['student'] },
  { href: '/student/goals', label: 'Goals', icon: Target, roles: ['student'] },
  { href: '/student/analytics', label: 'Progress & Analytics', icon: TrendingUp, roles: ['student'] },
  { href: '/student/timetable', label: 'Timetable', icon: CalendarDays, roles: ['student'] },
  { href: '/student/examinations', label: 'Examinations', icon: FileText, roles: ['student'] },
  { href: '/student/materials', label: 'Study Materials', icon: BookOpen, roles: ['student'] },
  { href: '/student/alerts', label: 'Notifications / Alerts', icon: Bell, roles: ['student'] },
  { href: '/student/ask', label: 'Ask Cogniva', icon: MessageSquare, roles: ['student'] },
  { href: '/faculty', label: 'Home / Overview', icon: LayoutDashboard, roles: ['faculty'] },
  { href: '/faculty/classes', label: 'My Classes', icon: GraduationCap, roles: ['faculty'] },
  { href: '/faculty/risk', label: 'Student Risk Radar', icon: HeartPulse, roles: ['faculty'] },
  { href: '/faculty/explain', label: 'Explain Panel', icon: BrainCircuit, roles: ['faculty'] },
  { href: '/faculty/attendance', label: 'Attendance Management', icon: CheckCircle2, roles: ['faculty'] },
  { href: '/faculty/assignments', label: 'Assignments & Grading', icon: ClipboardCheck, roles: ['faculty'] },
  { href: '/faculty/examinations', label: 'Examinations', icon: FileText, roles: ['faculty'] },
  { href: '/faculty/analytics', label: 'Class Analytics', icon: TrendingUp, roles: ['faculty'] },
  { href: '/faculty/engagement', label: 'Workload & Engagement', icon: Activity, roles: ['faculty'] },
  { href: '/faculty/interventions', label: 'Intervention Recommendations', icon: Zap, roles: ['faculty'] },
  { href: '/faculty/notices', label: 'Notices & Announcements', icon: Bell, roles: ['faculty'] },
  { href: '/faculty/materials', label: 'Study Material Upload', icon: Upload, roles: ['faculty'] },
  { href: '/faculty/students', label: 'Student Progress Drilldown', icon: UsersRound, roles: ['faculty'] },
  { href: '/faculty/simulator', label: 'What-if Simulation', icon: Radar, roles: ['faculty'] },
  { href: '/faculty/ask', label: 'Ask Cogniva', icon: MessageSquare, roles: ['faculty'] },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/admin/structure', label: 'Academic Structure', icon: Building2, roles: ['admin'] },
  { href: '/admin/students', label: 'Students', icon: GraduationCap, roles: ['admin'] },
  { href: '/admin/faculty-mgmt', label: 'Faculty', icon: UsersRound, roles: ['admin'] },
  { href: '/admin/faculty-access', label: 'Faculty Access', icon: UserCog, roles: ['admin'] },
];

const subjects = [
  { code: 'CS402', name: 'Machine Learning', grade: 'A−', score: 86, attendance: 88, trend: 'up', color: 'teal' as Tone, next: 'Model evaluation due tomorrow' },
  { code: 'CS404', name: 'Distributed Systems', grade: 'B+', score: 78, attendance: 76, trend: 'steady', color: 'amber' as Tone, next: '2 resources unread' },
  { code: 'MA301', name: 'Probability & Statistics', grade: 'B', score: 71, attendance: 69, trend: 'down', color: 'coral' as Tone, next: 'Recovery plan recommended' },
  { code: 'HS210', name: 'Design & Society', grade: 'A', score: 91, attendance: 93, trend: 'up', color: 'violet' as Tone, next: 'Seminar Friday at 11:00' },
];
const priorities = [
  { id: 'p1', title: 'Submit ML model evaluation', urgency: 'High priority', due: 'Due tomorrow', impact: 'Protects A− trajectory', tone: 'teal' as Tone, reason: 'Your evaluation notebook is 72% complete and this is the closest high-impact deadline.' },
  { id: 'p2', title: 'Recover Probability attendance', urgency: 'Needs attention', due: 'This week', impact: 'Below 75% comfort line', tone: 'coral' as Tone, reason: 'Two missed sessions moved attendance to 69%. Two consistent sessions can recover the buffer.' },
  { id: 'p3', title: 'Book mentor office hours', urgency: 'Goal aligned', due: 'By Friday', impact: 'Research internship', tone: 'amber' as Tone, reason: 'A short check-in unblocks the portfolio milestone connected to your research goal.' },
];
const facultyStudents = [
  { id: 1, name: 'Aditya Menon', program: 'B.Tech CSE · Sem 4', risk: 86, level: 'High', trend: 'up', factors: ['Attendance dropped 12% in 2 weeks', '3 missed submissions', 'LMS activity down 28%'], next: 'Schedule 1:1' },
  { id: 2, name: 'Nandini Rao', program: 'B.Des · Sem 6', risk: 72, level: 'Moderate', trend: 'up', factors: ['Assessment trend declining', 'Low LMS activity', 'Upcoming review in 8 days'], next: 'Review plan' },
  { id: 3, name: 'Rohan Kulkarni', program: 'B.Tech ECE · Sem 2', risk: 64, level: 'Moderate', trend: 'down', factors: ['Attendance at 71%', 'Exam in 9 days', 'Stable assignment completion'], next: 'Send nudge' },
  { id: 4, name: 'Meera Iyer', program: 'B.Sc DS · Sem 4', risk: 28, level: 'Low', trend: 'down', factors: ['Stable performance', 'Goal progress on track', 'No recent missed work'], next: 'View profile' },
];
const departments = [
  { name: 'Computer Science', short: 'CSE', students: '1,240', attendance: 86, pass: 92, score: 82, delta: '+4.2', color: 'teal' as Tone },
  { name: 'Electronics & Communication', short: 'ECE', students: '964', attendance: 83, pass: 88, score: 76, delta: '+1.7', color: 'amber' as Tone },
  { name: 'Design & Architecture', short: 'D&A', students: '612', attendance: 89, pass: 94, score: 74, delta: '+3.8', color: 'violet' as Tone },
  { name: 'Business & Economics', short: 'B&E', students: '1,108', attendance: 78, pass: 81, score: 69, delta: '−0.8', color: 'coral' as Tone },
];

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');
const toneFor = (level: string): Tone => level === 'High' ? 'coral' : level === 'Moderate' ? 'amber' : 'teal';

function Chip({ children, tone = 'teal' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}
function ProgressBar({ value, color = 'teal' }: { value: number; color?: Tone }) {
  return <div className="progress-track"><div className={`progress-fill fill-${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
function Metric({ label, value, detail, trend, tone = 'teal' }: { label: string; value: string; detail: string; trend?: 'up' | 'down'; tone?: Tone }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span>{trend === 'up' ? <ArrowUpRight size={15} /> : trend === 'down' ? <ArrowDownRight size={15} /> : <Activity size={15} />}</div><div className="metric-value">{value}</div><div className={cx('metric-detail', trend === 'down' && 'metric-negative')}><span className={`metric-dot dot-${tone}`} />{detail}</div></div>;
}

function ExplainDrawer({ title, subtitle, factors, recommendation, onClose, onAction }: { title: string; subtitle: string; factors: string[]; recommendation: string; onClose: () => void; onAction?: () => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="detail-drawer explain-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow">Explainability trail</div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Close explanation" onClick={onClose}><X size={18} /></button></div><div className="explain-confidence"><div className="confidence-ring"><strong>87</strong><span>%</span></div><div><strong>High-confidence explanation</strong><p>Three independent signals agree on this recommendation.</p></div></div><h3>Why this matters</h3><div className="factor-list">{factors.map((factor, index) => <div className="factor-row" key={factor}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{factor}</strong><small>Observed in connected academic data</small></div><CheckCircle2 size={16} /></div>)}</div><div className="explain-box"><BrainCircuit size={17} /><div><strong>Recommended response</strong><p>{recommendation}</p></div></div>{onAction && <button className="button button-primary full-width" onClick={onAction}><Check size={15} />Use this recommendation</button>}</aside></div>;
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><Database size={20} /></div><strong>{title}</strong><p>{description}</p>{action && <button className="button button-secondary" onClick={onAction}><Plus size={15} />{action}</button>}</div>;
}

function ChatWorkspace({ role }: { role: Role }) {
  const roleCopy = role === 'student' ? 'your timetable, attendance, goals, and current workload' : role === 'faculty' ? 'your classes, students, attendance, and interventions' : 'institution-wide performance, risk, and source health';
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'ai'; text: string }>>([{ from: 'ai', text: `I’m ready to help you make a decision using ${roleCopy}. Ask for a summary, explanation, or next action.` }]);
  const [loading, setLoading] = useState(false);
  const suggestions = role === 'student' ? ['Why is Probability a priority?', 'Plan a 45-minute study block', 'What changed this week?'] : role === 'faculty' ? ['Who needs attention in Chemistry?', 'Summarize this week’s risk movement', 'Draft a student check-in'] : ['Which department has highest risk?', 'Explain the attendance drop', 'Prepare an executive summary'];
  const ask = (value = prompt) => {
    if (!value.trim() || loading) return;
    setMessages((current) => [...current, { from: 'user', text: value }]);
    setPrompt('');
    setLoading(true);
    window.setTimeout(() => {
      const answer = role === 'student' ? 'Probability is prioritized because attendance is 69%, the next assessment is close, and a focused 45-minute practice block gives the highest recoverable lift this week.' : role === 'faculty' ? 'Aditya Menon needs attention first: attendance is down 12% in two weeks, three submissions are missing, and LMS activity has fallen 28%. I recommend a 1:1 before Friday.' : 'Business & Economics has the most fragile momentum: attendance is 78%, pass rate is 81%, and its semester score is the only department trending down.';
      setMessages((current) => [...current, { from: 'ai', text: answer }]);
      setLoading(false);
    }, 650);
  };
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Cogniva copilot · {role} mode</div><h1>Ask the next useful question.</h1><p className="lede">Answers are grounded in the live signals available in this workspace.</p></div><Chip tone="violet"><span className="assistant-live"><i />Context connected</span></Chip></div><div className="chat-layout"><section className="panel chat-panel"><div className="chat-messages">{messages.map((message, index) => <div className={cx('chat-message', message.from === 'user' && 'chat-message-user')} key={`${message.from}-${index}`}><div className="chat-avatar">{message.from === 'ai' ? <BrainCircuit size={15} /> : 'AM'}</div><div><small>{message.from === 'ai' ? 'Cogniva' : 'You'}</small><p>{message.text}</p></div></div>)}{loading && <div className="chat-message"><div className="chat-avatar"><BrainCircuit size={15} /></div><div><small>Cogniva</small><p className="typing">Thinking through your signals…</p></div></div>}</div><div className="chat-composer"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && ask()} placeholder="Ask about your workspace" aria-label="Ask Cogniva" /><button className="button button-primary" onClick={() => ask()}><Send size={15} />Ask</button></div></section><aside className="panel chat-context"><SectionHeading eyebrow="Try a grounded prompt" title="Start with a decision" /><div className="suggestion-list">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => ask(suggestion)}><Sparkles size={14} /><span>{suggestion}</span><ArrowRight size={14} /></button>)}</div><div className="context-footer"><Database size={15} /><span>Using current workspace signals<br /><strong>Last refreshed 4 minutes ago</strong></span></div></aside></div></PageFrame>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, role: authRole, logout } = useAuth();
  const role: Role = authRole || (location.startsWith('/faculty') ? 'faculty' : location.startsWith('/admin') ? 'admin' : 'student');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const roleLabels = { student: 'Student view', faculty: 'Faculty view', admin: 'Admin view' };
  const roleRoutes = { student: '/student', faculty: '/faculty', admin: '/admin' };
  const announce = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const currentNav = nav.filter((item) => item.roles.includes(role));
  const visibleNav = search.trim() ? currentNav.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())) : currentNav;
  const isActive = (href: string) => location === href || (href !== roleRoutes[role] && location.startsWith(`${href}/`));
  return (
    <div className="app-shell noise">
      <aside className={cx('sidebar', collapsed && 'sidebar-collapsed', mobileMenu && 'sidebar-mobile-open')}>
        <div className="brand-block">
          <div className="brand-mark"><Sparkles size={17} /></div>
          {!collapsed && (
            <div>
              <div className="brand-name">cogniva</div>
              <div className="brand-sub">student intelligence</div>
            </div>
          )}
          <button className="icon-button sidebar-collapse" aria-label="Collapse navigation" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {!collapsed && role && (
          <div className="role-switcher">
            <div className="role-label">Workspace mode</div>
            <div className="role-options">
              <button key={role} className="role-option role-option-active cursor-default">
                <span className={`role-pip role-pip-${role}`} />
                {roleLabels[role]}
              </button>
            </div>
          </div>
        )}
        <nav className="main-nav">
          {!collapsed && <div className="nav-label">Workspace</div>}
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cx('nav-item', active && 'nav-item-active')} onClick={() => setMobileMenu(false)}>
                <Icon size={17} />
                <span>{item.label}</span>
                {active && <span className="active-line" />}
              </Link>
            );
          })}
          {!collapsed && <div className="nav-label nav-label-lower">System</div>}
          <Link href="/settings" className={cx('nav-item', location === '/settings' && 'nav-item-active')} onClick={() => setMobileMenu(false)}>
            <Settings2 size={17} />
            <span>Preferences</span>
          </Link>
        </nav>
        {!collapsed && (
          <div className="sidebar-foot">
            <div className="signal-orb"><span /><span /><span /></div>
            <div><strong>Signals are live</strong><small>Last re-reasoned 4 min ago</small></div>
            <RefreshCw size={14} />
          </div>
        )}
      </aside>
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}>
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            <strong>{roleLabels[role]}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter sections" aria-label="Filter sections" />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button notification-button" aria-label="Open notifications" onClick={() => setNotifications(true)}>
              <Bell size={18} />
              <i />
            </button>
            {user && (
              <div className="flex items-center gap-2.5 ml-1">
                <span className="text-xs text-teal-400/90 font-mono hidden sm:inline">{user.email}</span>
                <button onClick={() => logout()} title="Logout" className="button button-secondary flex items-center gap-1.5 text-xs py-1 px-3 text-rose-300 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer">
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="content-wrap">
          <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>
        </div>
      </main>
      {notifications && (
        <div className="drawer-backdrop" onClick={() => setNotifications(false)}>
          <aside className="notification-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">Signal center</div>
                <h2>Adaptive alerts</h2>
              </div>
              <button className="icon-button" aria-label="Close notifications" onClick={() => setNotifications(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="notice notice-accent">
              <div className="notice-icon"><Zap size={16} /></div>
              <div>
                <strong>Recommendation updated</strong>
                <p>Your highest-impact next action changed after a new attendance signal.</p>
                <small>4 minutes ago</small>
              </div>
            </div>
            <div className="notice">
              <div className="notice-icon notice-icon-soft"><AlertTriangle size={16} /></div>
              <div>
                <strong>Early warning threshold crossed</strong>
                <p>One connected learner moved into moderate support need.</p>
                <small>Yesterday</small>
              </div>
            </div>
            <button className="button button-secondary full-width" onClick={() => { setNotifications(false); announce('All adaptive alerts marked as read'); }}>
              <Check size={15} />Mark all as read
            </button>
          </aside>
        </div>
      )}
      {toast && <div className="toast" role="status"><CheckCircle2 size={16} />{toast}</div>}
    </div>
  );
}

function PageFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('page-frame animate-fade', className)}>{children}</div>;
}

function StudentTodayPriorities() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [statuses, setStatuses] = useState<StudentAssignmentStatus[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadPrioritiesData();
  }, [user?.email]);

  const loadPrioritiesData = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const userEmail = user?.email || '';
    const me = studs.find(s => s.email.toLowerCase() === userEmail.toLowerCase());
    if (me) setStudentRecord(me);
    const sec = me?.section || 'CSE-C';

    const [asgnList, examList, subList, statusList] = await Promise.all([
      fetchAssignments({ section: sec }),
      fetchExaminations(sec),
      fetchAssignmentSubmissions(undefined, userEmail),
      fetchStudentAssignmentStatuses(userEmail)
    ]);

    setAssignments(asgnList);
    setExaminations(examList);
    setSubmissions(subList);
    setStatuses(statusList);
    setLoading(false);
  };

  const handleToggleComplete = async (assignmentId: string) => {
    if (!studentRecord?.regno || !user?.email) return;
    await toggleAssignmentCompletion(assignmentId, studentRecord.regno, user.email);
    loadPrioritiesData();
  };

  const asgnItems = assignments.map(a => {
    const isCompleted = statuses.some(s => s.assignment_id === a.id && s.status === 'COMPLETED');
    const isSubmitted = submissions.some(s => s.assignment_id === a.id);
    const prio = calculateDueDatePriority(a.due_date, isCompleted, isSubmitted);
    return {
      id: a.id,
      type: 'assignment' as const,
      title: a.title,
      subject: a.subject_name,
      code: a.subject_code,
      dueDate: a.due_date,
      maxMarks: a.max_marks,
      time: undefined,
      isCompleted,
      isSubmitted,
      prio,
      link: '/student/assignments'
    };
  });

  const examItems = examinations.map(e => {
    const prio = calculateExamPriority(e.date);
    const isPast = prio.status === 'PAST';
    return {
      id: e.id,
      type: 'exam' as const,
      title: e.title,
      subject: e.subject,
      code: 'EXAM',
      dueDate: e.date,
      maxMarks: undefined,
      time: `${e.start_time} - ${e.end_time}`,
      isCompleted: isPast,
      isSubmitted: false,
      prio,
      link: '/student/examinations'
    };
  });

  const priorityItems = [...asgnItems, ...examItems].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return a.prio.daysDiff - b.prio.daysDiff;
  });

  const activeItems = priorityItems.filter(i => !i.isCompleted);

  return (
    <section className="panel">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div>
          <div className="eyebrow">Dynamic Academic Queue ({studentRecord?.section || 'CSE-C'})</div>
          <h2 className="text-xl font-bold text-slate-100">Today's Priorities & Work</h2>
        </div>
        <Chip tone="coral">{activeItems.length} Open Tasks</Chip>
      </div>

      {loading ? (
        <div className="p-6 text-center text-teal-400">Loading academic priorities from database...</div>
      ) : activeItems.length === 0 ? (
        <EmptyState title="No academic tasks for today" description="You have no pending assignments or upcoming examinations for your section." />
      ) : (
        <div className="space-y-3">
          {activeItems.map(item => (
            <div key={item.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3.5">
                {item.type === 'assignment' ? (
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item.id)}
                    title="Mark assignment as completed"
                    className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-400 transition-all cursor-pointer"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-amber-500/50 bg-amber-500/10 flex items-center justify-center text-amber-400" title="Scheduled Examination">
                    <Calendar size={13} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      item.type === 'exam' 
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
                        : 'text-teal-400 bg-teal-500/10 border-teal-500/30'
                    }`}>
                      {item.code}
                    </span>
                    <strong className="text-slate-100 text-sm">{item.title}</strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Subject: <strong>{item.subject}</strong>
                    {item.maxMarks !== undefined && <> • Max Marks: <strong>{item.maxMarks}</strong></>}
                    {item.time && <> • Time: <strong>{item.time}</strong></>}
                    • Date: <strong>{item.dueDate}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Chip tone={item.prio.tone}>{item.prio.label}</Chip>
                <Link href={item.link} className="button button-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                  View <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentAcademicCalendar() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-09-09');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadCalendarData();
  }, [user?.email]);

  const loadCalendarData = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const userEmail = user?.email || '';
    const me = studs.find(s => s.email.toLowerCase() === userEmail.toLowerCase());
    const sec = me?.section || 'CSE-C';

    const [asgns, exams] = await Promise.all([
      fetchAssignments({ section: sec }),
      fetchExaminations(sec)
    ]);

    setAssignments(asgns);
    setExaminations(exams);

    // Auto-select date with work if today has none
    const todayStr = '2026-09-09';
    const hasTodayWork = asgns.some(a => a.due_date === todayStr) || exams.some(e => e.date === todayStr);
    if (!hasTodayWork) {
      const firstAsgnDate = asgns[0]?.due_date;
      const firstExamDate = exams[0]?.date;
      if (firstAsgnDate) setSelectedDate(firstAsgnDate);
      else if (firstExamDate) setSelectedDate(firstExamDate);
      else setSelectedDate(todayStr);
    } else {
      setSelectedDate(todayStr);
    }

    setLoading(false);
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
    const dayAsgns = assignments.filter(a => a.due_date === dateStr);
    const dayExams = examinations.filter(e => e.date === dateStr);
    const hasWork = dayAsgns.length > 0 || dayExams.length > 0;

    return {
      dayNum,
      dateStr,
      asgns: dayAsgns,
      exams: dayExams,
      hasWork
    };
  });

  const activeDayObj = daysInMonth.find(d => d.dateStr === selectedDate) || {
    dayNum: parseInt(selectedDate.split('-')[2] || '9', 10),
    dateStr: selectedDate,
    asgns: assignments.filter(a => a.due_date === selectedDate),
    exams: examinations.filter(e => e.date === selectedDate),
    hasWork: false
  };

  return (
    <section className="panel mt-6">
      <SectionHeading eyebrow="Academic Calendar" title="September 2026 Schedule" detail="Click any date on the calendar to inspect scheduled assignments and examinations." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2 py-1 border-b border-slate-800">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-xs font-mono">
            <div className="h-10" />
            <div className="h-10" />
            {daysInMonth.map(d => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold shadow-lg shadow-teal-500/10'
                      : d.hasWork
                      ? 'bg-slate-900 border-amber-500/40 text-amber-300 font-medium hover:bg-slate-800'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs">{d.dayNum}</span>
                  {d.hasWork && (
                    <div className="flex gap-0.5">
                      {d.asgns.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" title={`${d.asgns.length} Assignment(s)`} />}
                      {d.exams.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${d.exams.length} Exam(s)`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="eyebrow">Work Inspector</div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">Work for {selectedDate}</h3>

            {loading ? (
              <p className="text-xs text-teal-400 py-6 text-center">Loading schedule details...</p>
            ) : activeDayObj.asgns.length === 0 && activeDayObj.exams.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assignments or examinations scheduled for this date.</p>
            ) : (
              <div className="space-y-3">
                {activeDayObj.asgns.map(a => (
                  <div key={a.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-teal-400 font-bold">{a.subject_code}</span>
                      <Chip tone="teal">Assignment Due</Chip>
                    </div>
                    <strong className="text-slate-100 block">{a.title}</strong>
                    <p className="text-slate-400 text-xs">{a.description}</p>
                    <div className="text-slate-400 pt-1 text-xs">Max Marks: <strong className="text-slate-200">{a.max_marks}</strong></div>
                  </div>
                ))}
                {activeDayObj.exams.map(e => (
                  <div key={e.id} className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold">{e.subject}</span>
                      <Chip tone="amber">Examination</Chip>
                    </div>
                    <strong className="text-slate-100 block">{e.title}</strong>
                    <p className="text-slate-400 text-xs">{e.description}</p>
                    <div className="text-slate-400 pt-1 text-xs">Time: <strong className="text-slate-200">{e.start_time} - {e.end_time}</strong></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400" /> Assignment</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Examination</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentAssignmentsView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [statuses, setStatuses] = useState<StudentAssignmentStatus[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedAsgn, setSelectedAsgn] = useState<Assignment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadAssignmentsData();
  }, [user?.email]);

  const loadAssignmentsData = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const userEmail = user?.email || '';
    const me = studs.find(s => s.email.toLowerCase() === userEmail.toLowerCase());
    if (me) setStudentRecord(me);
    const sec = me?.section || 'CSE-C';

    const [asgns, subs, stats] = await Promise.all([
      fetchAssignments({ section: sec }),
      fetchAssignmentSubmissions(undefined, userEmail),
      fetchStudentAssignmentStatuses(userEmail)
    ]);

    setAssignments(asgns);
    setSubmissions(subs);
    setStatuses(stats);
    setLoading(false);
  };

  const handleToggleComplete = async (asgnId: string) => {
    if (!studentRecord?.regno || !user?.email) return;
    await toggleAssignmentCompletion(asgnId, studentRecord.regno, user.email);
    loadAssignmentsData();
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgn || !studentRecord || !user?.email) return;

    setIsSubmitting(true);
    let fileUrl = '';
    let filePath = '';

    if (selectedFile) {
      const uploadRes = await uploadFileToSupabaseStorage(
        selectedFile,
        studentRecord.year || 'Second Year',
        studentRecord.department || 'CSE',
        studentRecord.section || 'CSE-C',
        studentRecord.semester || '4',
        selectedAsgn.subject_code,
        'assignment-submissions'
      );
      if (uploadRes.success) {
        fileUrl = uploadRes.url || '';
        filePath = uploadRes.path || '';
      }
    }

    const todayStr = '2026-09-09';
    const isLate = todayStr > selectedAsgn.due_date;

    await submitAssignment({
      assignment_id: selectedAsgn.id,
      student_id: studentRecord.id,
      regno: studentRecord.regno,
      student_name: studentRecord.name,
      student_email: user.email,
      submitted_at: new Date().toISOString(),
      file_url: fileUrl,
      file_path: filePath,
      response_text: responseText,
      status: isLate ? 'LATE' : 'SUBMITTED'
    });

    setIsSubmitting(false);
    setSelectedAsgn(null);
    setResponseText('');
    setSelectedFile(null);
    loadAssignmentsData();
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Assignments & Tasks</div>
          <h1>Course Assignments ({studentRecord?.section || 'CSE-C'})</h1>
          <p className="lede">Assignments automatically synchronized with your section & due date priority.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading assignments from Supabase...
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState title="No upcoming assignments" description="No assignments have been published for your section yet." />
      ) : (
        <div className="space-y-4">
          {assignments.map(asgn => {
            const sub = submissions.find(s => s.assignment_id === asgn.id);
            const isCompleted = statuses.some(s => s.assignment_id === asgn.id && s.status === 'COMPLETED');
            const prio = calculateDueDatePriority(asgn.due_date, isCompleted, !!sub);

            return (
              <div key={asgn.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(asgn.id)}
                    title="Toggle completion status"
                    className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'border-slate-600 text-slate-500 hover:border-teal-400'
                    }`}
                  >
                    <Check size={14} />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded">
                        {asgn.subject_code}
                      </span>
                      <strong className="text-slate-100 text-base">{asgn.title}</strong>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{asgn.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
                      <span>Due: <strong>{asgn.due_date}</strong></span>
                      <span>Max Marks: <strong>{asgn.max_marks}</strong></span>
                      <span>Faculty: <strong>{asgn.faculty_email}</strong></span>
                    </div>

                    {sub?.status === 'GRADED' && (
                      <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs">
                        <div className="flex items-center justify-between font-bold text-teal-300 mb-1">
                          <span>Evaluation Result:</span>
                          <span>Marks: {sub.marks} / {asgn.max_marks} | Grade: {sub.grade}</span>
                        </div>
                        {sub.feedback && <p className="text-slate-300 italic">"{sub.feedback}"</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end md:items-center gap-3">
                  <Chip tone={prio.tone}>{prio.label}</Chip>

                  {sub ? (
                    <span className="px-3 py-1 bg-slate-800 text-teal-300 border border-slate-700 rounded-lg text-xs font-semibold">
                      {sub.status === 'GRADED' ? 'GRADED' : 'SUBMITTED'}
                    </span>
                  ) : (
                    <button
                      className="button button-primary text-xs py-1.5 px-4 cursor-pointer"
                      onClick={() => setSelectedAsgn(asgn)}
                    >
                      <Upload size={14} /> Submit Work
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAsgn && (
        <div className="modal-backdrop" onClick={() => setSelectedAsgn(null)}>
          <div className="modal-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">{selectedAsgn.subject_code} · Submission</div>
                <h2>{selectedAsgn.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedAsgn(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Response Text / Solution Notes</label>
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Enter your answers or submission notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Upload Submission File (PDF / Document)</label>
                <input
                  type="file"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" className="button button-secondary" onClick={() => setSelectedAsgn(null)}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="button button-primary">
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function FacultyAssignmentsManagement() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [selectedAssignmentClass, setSelectedAssignmentClass] = useState<FacultySubjectAssignment | null>(null);
  const [createdAssignments, setCreatedAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState('2026-09-09');
  const [dueDate, setDueDate] = useState('2026-09-11');
  const [maxMarks, setMaxMarks] = useState(10);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewingAsgn, setViewingAsgn] = useState<Assignment | null>(null);
  const [rosterStudents, setRosterStudents] = useState<StudentMember[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { marks: number; grade: string; feedback: string }>>({});

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetchFacultySubjectAssignments(user.email).then(list => {
      setAssignments(list);
      if (list.length > 0) setSelectedAssignmentClass(list[0]);
      setLoading(false);
    });
  }, [user?.email]);

  useEffect(() => {
    if (!selectedAssignmentClass) return;
    loadClassAssignments();
  }, [selectedAssignmentClass]);

  const loadClassAssignments = async () => {
    if (!selectedAssignmentClass) return;
    setLoading(true);
    const secName = selectedAssignmentClass.section_name || selectedAssignmentClass.section || 'CSE-C';
    const data = await fetchAssignments({ section: secName, subject_code: selectedAssignmentClass.subject_code });
    setCreatedAssignments(data);
    setLoading(false);
  };

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentClass || !user?.email || !title) return;

    setIsSubmitting(true);
    let attachUrl = '';
    let attachPath = '';
    const secName = selectedAssignmentClass.section_name || selectedAssignmentClass.section || 'CSE-C';

    if (attachmentFile) {
      const uploadRes = await uploadFileToSupabaseStorage(
        attachmentFile,
        selectedAssignmentClass.academic_year || 'Second Year',
        selectedAssignmentClass.department || 'CSE',
        secName,
        '4',
        selectedAssignmentClass.subject_code,
        'study-materials'
      );
      if (uploadRes.success) {
        attachUrl = uploadRes.url || '';
        attachPath = uploadRes.path || '';
      }
    }

    await createAssignment({
      subject_code: selectedAssignmentClass.subject_code,
      subject_name: selectedAssignmentClass.subject_name,
      academic_year: selectedAssignmentClass.academic_year || 'Second Year',
      department: selectedAssignmentClass.department || 'CSE',
      section: secName,
      faculty_email: user.email,
      title: title.trim(),
      description: description.trim(),
      assigned_date: assignedDate,
      due_date: dueDate,
      max_marks: Number(maxMarks) || 10,
      attachment_url: attachUrl,
      attachment_path: attachPath
    });

    setIsSubmitting(false);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setAttachmentFile(null);
    loadClassAssignments();
  };

  const handleOpenSubmissions = async (asgn: Assignment) => {
    setViewingAsgn(asgn);
    const [studs, subs] = await Promise.all([
      fetchStudentsBySection(asgn.section),
      fetchAssignmentSubmissions(asgn.id)
    ]);
    setRosterStudents(studs);
    setSubmissions(subs);

    const initialInputs: Record<string, { marks: number; grade: string; feedback: string }> = {};
    studs.forEach(st => {
      const foundSub = subs.find(s => s.regno.toLowerCase() === st.regno.toLowerCase());
      initialInputs[st.regno] = {
        marks: foundSub?.marks ?? asgn.max_marks,
        grade: foundSub?.grade ?? 'A',
        feedback: foundSub?.feedback ?? 'Good work.'
      };
    });
    setGradeInputs(initialInputs);
  };

  const handleSaveStudentGrade = async (regno: string) => {
    if (!viewingAsgn || !user?.email) return;
    const inp = gradeInputs[regno] || { marks: viewingAsgn.max_marks, grade: 'A', feedback: 'Good work.' };

    await gradeSubmission(
      '',
      viewingAsgn.id,
      regno,
      inp.marks,
      inp.grade,
      inp.feedback,
      user.email
    );

    const updatedSubs = await fetchAssignmentSubmissions(viewingAsgn.id);
    setSubmissions(updatedSubs);
    alert(`Saved evaluation for student ${regno}!`);
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · Assignments & Grading</div>
          <h1>Subject Assignments & Student Submissions</h1>
          <p className="lede">Create assignments for your assigned section & grade submitted student work.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowCreateModal(true)} disabled={!selectedAssignmentClass}>
          <Plus size={15} /> Create Assignment
        </button>
      </div>

      <section className="panel mb-6">
        <SectionHeading eyebrow="Class Context" title="Select Assigned Subject Class" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex flex-col text-sm font-medium text-slate-300">
            Assigned Subject Class
            <select
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={selectedAssignmentClass?.id || ''}
              onChange={e => {
                const found = assignments.find(a => a.id === e.target.value);
                if (found) setSelectedAssignmentClass(found);
              }}
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.subject_name} ({a.subject_code}) — {a.section_name || a.section}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <SectionHeading eyebrow="Active Assignments" title={`Published Assignments (${createdAssignments.length})`} />

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading assignments...</div>
        ) : createdAssignments.length === 0 ? (
          <EmptyState title="No assignments published yet" description="Create an assignment for this class." />
        ) : (
          <div className="space-y-4 mt-4">
            {createdAssignments.map(asgn => (
              <div key={asgn.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded">
                      {asgn.subject_code}
                    </span>
                    <strong className="text-slate-100">{asgn.title}</strong>
                  </div>
                  <p className="text-xs text-slate-400">{asgn.description}</p>
                  <div className="text-xs text-slate-500 mt-1">
                    Assigned: {asgn.assigned_date} | Due: <strong className="text-amber-400">{asgn.due_date}</strong> | Max Marks: {asgn.max_marks}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="button button-primary text-xs py-1.5 px-3" onClick={() => handleOpenSubmissions(asgn)}>
                    <ClipboardCheck size={14} /> Review Submissions & Grade
                  </button>
                  <button className="button button-secondary text-xs py-1.5 px-2 text-rose-400 border-rose-500/30" onClick={() => deleteAssignment(asgn.id).then(loadClassAssignments)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showCreateModal && selectedAssignmentClass && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">{selectedAssignmentClass.subject_code} · {selectedAssignmentClass.section_name || selectedAssignmentClass.section}</div>
                <h2>Create Assignment</h2>
              </div>
              <button className="icon-button" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assignment Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Normalization Problems" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Instructions</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Assignment details..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Date</label>
                  <input type="date" required value={assignedDate} onChange={e => setAssignedDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
                  <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Max Marks</label>
                  <input type="number" min={1} required value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Attachment (Optional PDF)</label>
                <input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} className="text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 cursor-pointer" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" className="button button-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="button button-primary">
                  {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAsgn && (
        <div className="modal-backdrop" onClick={() => setViewingAsgn(null)}>
          <div className="modal-card max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">{viewingAsgn.subject_code} · {viewingAsgn.section}</div>
                <h2>Submissions: {viewingAsgn.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setViewingAsgn(null)}><X size={18} /></button>
            </div>

            <div className="mt-4 max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 uppercase font-semibold text-slate-400 bg-slate-900/60">
                    <th className="py-2.5 px-3">Reg No</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Submission</th>
                    <th className="py-2.5 px-3 text-center">Marks ({viewingAsgn.max_marks})</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3">Feedback</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rosterStudents.map(st => {
                    const sub = submissions.find(s => s.regno.toLowerCase() === st.regno.toLowerCase());
                    const inp = gradeInputs[st.regno] || { marks: viewingAsgn.max_marks, grade: 'A', feedback: 'Good work.' };

                    return (
                      <tr key={st.id || st.regno} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono text-teal-300 font-bold">{st.regno}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{st.name}</td>
                        <td className="py-2.5 px-3">
                          {sub ? (
                            <div>
                              <Chip tone={sub.status === 'LATE' ? 'coral' : 'teal'}>{sub.status}</Chip>
                              {sub.file_url && (
                                <a href={sub.file_url} target="_blank" rel="noreferrer" className="block text-teal-400 underline mt-1">
                                  View File
                                </a>
                              )}
                              {sub.response_text && <p className="text-slate-400 italic font-mono mt-0.5">{sub.response_text}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={viewingAsgn.max_marks}
                            className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-100 font-mono"
                            value={inp.marks}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [st.regno]: { ...prev[st.regno], marks: Number(e.target.value) } }))}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="text"
                            className="w-12 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-100 font-mono"
                            value={inp.grade}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [st.regno]: { ...prev[st.regno], grade: e.target.value } }))}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100"
                            value={inp.feedback}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [st.regno]: { ...prev[st.regno], feedback: e.target.value } }))}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            className="button button-primary text-xs py-1 px-2"
                            onClick={() => handleSaveStudentGrade(st.regno)}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function StudentHome() {
  const { user } = useAuth();
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);
  const [selected, setSelected] = useState<typeof priorities[number] | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    fetchStudentMembers().then((studs) => {
      const me = studs.find(s => s.email.toLowerCase() === user.email?.toLowerCase());
      if (me) setStudentRecord(me);
    });
  }, [user?.email]);

  const displayName = studentRecord?.name || user?.email || 'Student';

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            Student Workspace · {studentRecord ? `${studentRecord.year || '2nd Year'} - ${studentRecord.department || 'CSE'} (${studentRecord.section || 'C'})` : 'Authenticated Account'}
          </div>
          <h1>Welcome, {displayName}.</h1>
          <p className="lede">A clear snapshot of your momentum, workload, and next useful move.</p>
        </div>
        <div className="header-actions">
          <Link className="button button-secondary" href="/student/analytics"><TrendingUp size={15} />View analytics</Link>
          <Link className="button button-primary" href="/student/planner"><ListChecks size={15} />Open action plan</Link>
        </div>
      </div>

      <div className="student-hero-grid">
        <div className="welcome-hero-card">
          <div className="welcome-hero-orbit"><GraduationCap size={42} /></div>
          <div>
            <div className="eyebrow">Authenticated Student Profile</div>
            <h2>Hello, {displayName}</h2>
            <p>
              Reg No: <strong className="text-teal-300 font-mono">{studentRecord?.regno || 'N/A'}</strong> · Department: <strong>{studentRecord?.department || 'CSE'}</strong> · Section: <strong>{studentRecord?.section || 'CSE-C'}</strong>
            </p>
            <div className="hero-pills">
              <span>{studentRecord?.year || '2nd Year'}</span>
              <span>Sem {studentRecord?.semester || '4'}</span>
              <span><i />Signals live</span>
            </div>
          </div>
        </div>

        <div className="assistant-panel">
          <div className="assistant-head">
            <div className="assistant-avatar"><BrainCircuit size={21} /></div>
            <div><strong>Ask Cogniva AI</strong><small>Grounded in your current signals</small></div>
            <span className="assistant-live"><i /></span>
          </div>
          <p>Get a decision, explanation, or study plan that fits your day.</p>
          <Link className="assistant-input" href="/student/ask">
            <span>Ask anything about your semester</span>
            <span className="assistant-send"><ArrowRight size={16} /></span>
          </Link>
          <div className="assistant-suggestions">
            <Link href="/student/explain"><Lightbulb size={12} />Why this priority?</Link>
            <Link href="/student/planner"><Clock3 size={12} />Plan my day</Link>
            <Link href="/student/ask"><CircleHelp size={12} />Explain a topic</Link>
          </div>
        </div>
      </div>

      <div className="metric-grid metric-grid-five mb-6">
        <Metric label="Register No" value={studentRecord?.regno || 'N/A'} detail="Authenticated student ID" tone="amber" />
        <Metric label="Department" value={studentRecord?.department || 'CSE'} detail={studentRecord?.year || '2nd Year'} tone="violet" />
        <Metric label="Section" value={studentRecord?.section || 'CSE-C'} detail={`Semester ${studentRecord?.semester || '4'}`} tone="teal" />
        <Metric label="Account Status" value="Active" detail="Database connected" trend="up" tone="teal" />
      </div>

      <StudentTodayPriorities />
      <StudentAcademicCalendar />
    </PageFrame>
  );
}

function StudentAlertsView() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<{ id: string; title: string; impact: string; tone: 'coral' | 'amber' | 'teal' }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadAlerts();
  }, [user?.email]);

  const loadAlerts = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const me = studs.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
    const sec = me?.section || 'CSE-C';

    const [asgns, exams] = await Promise.all([
      fetchAssignments({ section: sec }),
      fetchExaminations(sec)
    ]);

    const generatedAlerts: { id: string; title: string; impact: string; tone: 'coral' | 'amber' | 'teal' }[] = [];

    exams.forEach(e => {
      const prio = calculateExamPriority(e.date);
      if (prio.status !== 'PAST') {
        generatedAlerts.push({
          id: `exam-${e.id}`,
          title: `Upcoming Exam: ${e.title} (${e.subject}) on ${e.date}`,
          impact: `Scheduled ${e.start_time} - ${e.end_time} · Examination calendar`,
          tone: prio.tone === 'coral' ? 'coral' : 'amber'
        });
      }
    });

    asgns.forEach(a => {
      const prio = calculateDueDatePriority(a.due_date, false, false);
      if (prio.status !== 'COMPLETED') {
        generatedAlerts.push({
          id: `asgn-${a.id}`,
          title: `Assignment Due: ${a.title} (${a.subject_code}) due on ${a.due_date}`,
          impact: `Max Marks: ${a.max_marks} · Deadline planning`,
          tone: prio.tone === 'coral' ? 'coral' : 'teal'
        });
      }
    });

    setAlerts(generatedAlerts);
    setLoading(false);
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student workspace · adaptive alerts</div>
          <h1>Alerts that know when to interrupt.</h1>
          <p className="lede">Real-time alerts derived from your section's active assignments and scheduled examinations.</p>
        </div>
        <Chip tone="coral">{alerts.length} active</Chip>
      </div>
      <section className="panel">
        <SectionHeading eyebrow="Signal center" title="Your adaptive alerts" detail="Dismiss an alert once you have acted on it." />
        {loading ? (
          <div className="p-6 text-center text-teal-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <EmptyState title="All clear for now" description="No active exam or assignment alerts for your section." />
        ) : (
          <div className="alert-list">
            {alerts.map(item => (
              <div className="alert-row" key={item.id}>
                <div className={`alert-icon alert-${item.tone}`}>
                  <Zap size={15} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.impact}</small>
                </div>
                <button className="icon-button" aria-label="Dismiss alert" onClick={() => handleDismiss(item.id)}>
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageFrame>
  );
}

function StudentSection({ section }: { section: string }) {
  const [selected, setSelected] = useState<typeof subjects[number] | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<typeof priorities[number] | null>(null);
  const [range, setRange] = useState('30 days');
  const [done, setDone] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  if (section === 'ask') return <ChatWorkspace role="student" />;
  if (section === 'planner') return <PlannerSection />;
  if (section === 'simulator') return <SimulatorSection role="student" />;
  if (section === 'subjects') return <StudentSubjectsView />;
  if (section === 'attendance') return <StudentAttendanceTracker />;
  if (section === 'grades') return <StudentGradesView />;
  if (section === 'priorities' || section === 'assignments') return <StudentAssignmentsView />;
  if (section === 'explain') return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Student workspace · explainability</div><h1>See the why behind every recommendation.</h1><p className="lede">Cogniva keeps the reasoning visible so you can decide with confidence.</p></div><Chip tone="teal">Updated 4 min ago</Chip></div><div className="insights-layout"><section className="panel reasoning-panel"><SectionHeading eyebrow="Latest recommendation" title="Finish the ML evaluation notebook" detail="Confidence 87% · generated from 3 independent signals" /><div className="reasoning-score"><div className="reasoning-score-number">87<span>%</span></div><div><strong>Recommendation confidence</strong><p>Deadline proximity, course trajectory, and goal alignment agree.</p></div></div><div className="reasoning-steps">{['Deadline proximity · due tomorrow at 6 PM', 'Current trajectory · notebook is 72% complete', 'Goal alignment · directly supports your applied ML portfolio'].map((text, index) => <div className="reasoning-step" key={text}><span className={`step-number step-${(['teal', 'amber', 'violet'] as Tone[])[index]}`}>0{index + 1}</span><div><strong>{text.split(' · ')[0]}</strong><p>{text.split(' · ')[1]}</p></div><CheckCircle2 size={17} className="reasoning-check" /></div>)}</div><button className="button button-primary" onClick={() => window.location.assign('/student/planner')}><Play size={15} />Use recommendation in plan</button></section><aside className="panel signal-panel"><SectionHeading eyebrow="Signal health" title="Your context is current" /><div className="signal-health"><div className="signal-health-ring"><span>96</span><small>%</small></div><div><strong>Good coverage</strong><p>All core sources refreshed</p></div></div><div className="source-mini-list">{['LMS activity', 'Attendance records', 'Examination calendar', 'Student goals'].map((source) => <div key={source}><span><i className="online-dot" />{source}</span><small>Current</small></div>)}</div></aside></div></PageFrame>;
  if (section === 'insights') return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Student workspace · risk & workload</div><h1>See pressure before it peaks.</h1><p className="lede">Early warnings combine workload, attendance, deadlines, and your own goal rhythm.</p></div><Link className="button button-secondary" href="/student/explain"><BrainCircuit size={15} />Open explain panel</Link></div><div className="insight-banner"><div className="insight-banner-icon"><HeartPulse size={20} /></div><div><strong>Your current risk is recoverable.</strong><p>Probability is the only subject below the comfort line; your workload is high but still inside the sustainable range.</p></div><Chip tone="amber">Monitor</Chip></div><div className="two-column-grid"><section className="panel"><SectionHeading eyebrow="Workload heatmap" title="This week at a glance" detail="Darker cells mean more scheduled academic load." /><div className="heatmap"><div className="heatmap-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div className="heatmap-grid">{Array.from({ length: 35 }, (_, index) => <button key={index} className={`heat-cell heat-${(index * 3) % 5}`} aria-label={`Workload cell ${index + 1}`} onClick={() => undefined} />)}</div><div className="heatmap-legend"><span>Light</span><i className="heat-cell heat-0" /><i className="heat-cell heat-2" /><i className="heat-cell heat-4" /><span>Heavy</span></div></div></section><section className="panel"><SectionHeading eyebrow="Early warning flags" title="Signals to watch" /><div className="flag-list">{[['Probability attendance', '69%', 'coral'], ['Assessment collision', '2 deadlines', 'amber'], ['Study load', '3.5h / day', 'teal']].map(([label, value, tone]) => <button className="flag-row" key={label} onClick={() => setSelected(subjects.find((subject) => subject.name.includes('Probability')) || subjects[0])}><span className={`flag-icon flag-${tone}`}><AlertTriangle size={15} /></span><span><strong>{label}</strong><small>{value} · Tap to understand</small></span><ArrowRight size={15} /></button>)}</div></section></div>{selected && <ExplainDrawer title={`${selected.name} risk signal`} subtitle="Student risk & workload insight" factors={[`Attendance is currently ${selected.attendance}%`, 'Two learning sessions were missed in the last fortnight', 'The next assessment creates a narrow recovery window']} recommendation="Keep the next two sessions protected and add one short practice block before the assessment." onClose={() => setSelected(null)} />}</PageFrame>;
  if (section === 'analytics') return <AnalyticsPage role="student" />;
  if (section === 'timetable') return <TimetablePage />;
  if (section === 'examinations') return <ExaminationsPage role="student" />;
  if (section === 'materials') return <MaterialsPage role="student" saved={saved} setSaved={setSaved} />;
  if (section === 'alerts') return <StudentAlertsView />;

  if (section === 'goals') return <GoalsPage />;
  return <PageFrame><EmptyState title="Student section ready" description="Choose a section from the workspace navigation to continue." /></PageFrame>;
}

function StudentSubjectsView() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadStudentSubjectsData();
  }, [user?.email]);

  const loadStudentSubjectsData = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const userEmail = user?.email || '';
    const me = studs.find(s => s.email.toLowerCase() === userEmail.toLowerCase());
    if (me) setStudentRecord(me);
    const sec = me?.section || 'CSE-C';

    const [subList, gradeList, attList, facAssigns] = await Promise.all([
      fetchSubjects({ section: sec }),
      fetchStudentGrades(userEmail),
      fetchAttendanceRecords({ regno: me?.regno }),
      fetchFacultySubjectAssignments(undefined, sec)
    ]);

    setSubjects(subList);
    setGrades(gradeList);
    setAttendanceRecords(attList);
    setFacultyAssignments(facAssigns);
    setLoading(false);
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Enrolled Subjects</div>
          <h1>My Subjects ({studentRecord?.section || 'CSE-C'})</h1>
          <p className="lede">Subjects offered in your section with live attendance & overall grade status.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading subjects from Supabase...
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects assigned yet."
          description={`No subjects have been created for section ${studentRecord?.section || 'CSE-C'} by Admin yet.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map(sub => {
            const subGrade = grades.find(g => g.subject_code?.toLowerCase() === sub.subject_code.toLowerCase() || g.subject_name?.toLowerCase() === sub.subject_name.toLowerCase());
            const subAtts = attendanceRecords.filter(a => a.subject?.toLowerCase() === sub.subject_name.toLowerCase() || a.subject?.toLowerCase() === sub.subject_code.toLowerCase());
            const presentCount = subAtts.filter(a => a.status === 'Present').length;
            const attPct = subAtts.length > 0 ? Math.round((presentCount / subAtts.length) * 100) : 100;

            const facAss = facultyAssignments.find(
              fa => fa.subject_code.toLowerCase() === sub.subject_code.toLowerCase() ||
                    fa.subject_name.toLowerCase() === sub.subject_name.toLowerCase()
            );
            const facultyName = facAss?.faculty_name || facAss?.faculty_email || 'Not Assigned';

            return (
              <div key={sub.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-teal-400 font-bold px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                      {sub.subject_code}
                    </span>
                    <Chip tone={attPct >= 75 ? 'teal' : 'coral'}>{attPct}% Attendance</Chip>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">{sub.subject_name}</h3>
                  <div className="text-xs text-teal-300 font-semibold mb-2">
                    Faculty: {facultyName}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mb-4">
                    {sub.academic_year || 'Second Year'} • {sub.department || 'CSE'} • {sub.section || 'CSE-C'}
                  </div>

                  <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <div className="flex justify-between text-slate-300">
                      <span>Attendance:</span>
                      <strong className="text-teal-300">{presentCount} / {subAtts.length} sessions ({attPct}%)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Grade:</span>
                      <strong className="text-amber-300 font-bold">{subGrade?.grade ? `${subGrade.grade} (${subGrade.total}/100)` : 'Not Graded Yet'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                  <span className="text-slate-400">Semester {sub.semester || '4'}</span>
                  <Link href="/student/attendance" className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1">
                    View Details <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function StudentAttendanceTracker() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadAttendanceData();
  }, [user?.email]);

  const loadAttendanceData = async () => {
    setLoading(true);
    const studs = await fetchStudentMembers();
    const me = studs.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
    if (me) setStudentRecord(me);
    const sec = me?.section || 'CSE-C';

    const [subList, attList] = await Promise.all([
      fetchSubjects({ section: sec }),
      fetchAttendanceRecords({ regno: me?.regno })
    ]);

    setSubjects(subList);
    setAttendanceRecords(attList);
    setLoading(false);
  };

  const totalSessions = attendanceRecords.length;
  const totalPresent = attendanceRecords.filter(a => a.status === 'Present').length;
  const totalAbsent = totalSessions - totalPresent;
  const overallPct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Attendance Tracker</div>
          <h1>Subject-Wise Attendance Breakdown</h1>
          <p className="lede">Real-time attendance record computed from database entries.</p>
        </div>
      </div>

      <div className="metric-grid mb-6">
        <Metric label="Overall Attendance" value={`${overallPct}%`} detail={`${totalPresent} of ${totalSessions} sessions`} tone={overallPct >= 75 ? 'teal' : 'coral'} />
        <Metric label="Total Sessions" value={`${totalSessions}`} detail="Across all subjects" tone="violet" />
        <Metric label="Sessions Present" value={`${totalPresent}`} detail="Attended" tone="teal" />
        <Metric label="Sessions Absent" value={`${totalAbsent}`} detail="Missed" tone="coral" />
      </div>

      <section className="panel">
        <SectionHeading eyebrow="Subject-Wise Performance" title="Subject Attendance Records" />

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading attendance data from Supabase...</div>
        ) : subjects.length === 0 ? (
          <EmptyState title="No subjects found for your section." description="No subjects have been registered for your section." />
        ) : (
          <div className="divide-y divide-slate-800 mt-4">
            {subjects.map(sub => {
              const subAtts = attendanceRecords.filter(a => a.subject?.toLowerCase() === sub.subject_name.toLowerCase() || a.subject?.toLowerCase() === sub.subject_code.toLowerCase());
              const pCount = subAtts.filter(a => a.status === 'Present').length;
              const aCount = subAtts.length - pCount;
              const pct = subAtts.length > 0 ? Math.round((pCount / subAtts.length) * 100) : 100;

              return (
                <div key={sub.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded">
                        {sub.subject_code}
                      </span>
                      <strong className="text-slate-100 text-base">{sub.subject_name}</strong>
                    </div>
                    <span className="text-xs text-slate-400">
                      Present: <strong className="text-teal-300">{pCount}</strong> | Absent: <strong className="text-rose-400">{aCount}</strong> | Total: {subAtts.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Attendance</span>
                        <strong className={pct >= 75 ? 'text-teal-300' : 'text-rose-400'}>{pct}%</strong>
                      </div>
                      <ProgressBar value={pct} color={pct >= 75 ? 'teal' : 'coral'} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageFrame>
  );
}

function StudentGradesView() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetchStudentGrades(user.email).then(list => {
      setGrades(list);
      setLoading(false);
    });
  }, [user?.email]);

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Grades & Marks</div>
          <h1>My Subject Grades</h1>
          <p className="lede">Strictly private report of your internal, assignment, and examination scores.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading grades from Supabase...
        </div>
      ) : grades.length === 0 ? (
        <EmptyState
          title="No grade records published yet."
          description="Your faculty has not entered grades for your assigned subjects yet."
        />
      ) : (
        <section className="panel">
          <SectionHeading eyebrow="Academic Evaluation" title="Subject Marks Report" />
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4 text-center">Internal (20)</th>
                  <th className="py-3 px-4 text-center">Assignment (10)</th>
                  <th className="py-3 px-4 text-center">Exam (70)</th>
                  <th className="py-3 px-4 text-center">Total (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {grades.map(g => (
                  <tr key={g.id || g.subject_code} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-mono text-teal-400 font-bold">{g.subject_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{g.subject_name}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{g.internal_marks ?? '-'}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{g.assignment_marks ?? '-'}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{g.exam_marks ?? '-'}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">{g.total ?? '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold rounded-lg text-xs font-mono">
                        {g.grade || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageFrame>
  );
}

function PlannerSection() {
  const [tasks, setTasks] = useState([{ id: 1, time: '10:00', title: 'Finish ML evaluation notebook', course: 'CS402 · Deep work', duration: '90 min', complete: false, tone: 'teal' as Tone }, { id: 2, time: '14:30', title: 'Probability practice set', course: 'MA301 · Recovery block', duration: '45 min', complete: false, tone: 'coral' as Tone }, { id: 3, time: '17:00', title: 'Research mentor office hours', course: 'Career goal · Conversation', duration: '20 min', complete: false, tone: 'amber' as Tone }]);
  const [view, setView] = useState('Today');
  const done = tasks.filter((task) => task.complete).length;
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Adaptive action planner</div><h1>Make progress feel possible.</h1><p className="lede">Time blocks adapt around deadlines, energy, and the work that matters most.</p></div><div className="header-actions"><div className="segmented-control">{['Today', 'This week'].map((item) => <button className={view === item ? 'segment-active' : ''} key={item} onClick={() => setView(item)}>{item}</button>)}</div><button className="button button-primary" onClick={() => setTasks((current) => [...current, { id: Date.now(), time: '19:30', title: 'Review distributed systems flashcards', course: 'CS404 · Light study', duration: '30 min', complete: false, tone: 'violet' }])}><Plus size={15} />Add block</button></div></div><div className="planner-overview"><div><div className="eyebrow">Thursday, 13 March</div><h3>{tasks.length - done} useful blocks left today.</h3><p>Cogniva protected 45 minutes of recovery time after your morning lecture.</p></div><div className="planner-score"><strong>{Math.round((done / tasks.length) * 100)}%</strong><span>complete</span></div><div className="planner-progress"><ProgressBar value={(done / tasks.length) * 100} color="amber" /><small>{done} complete · {tasks.length - done} remaining</small></div></div><div className="planner-layout"><section className="panel planner-list-panel"><SectionHeading eyebrow="Focus blocks" title={view === 'Today' ? 'Your day in sequence' : 'Your week in sequence'} action={<button className="text-button" onClick={() => setTasks((current) => [...current].reverse())}><RefreshCw size={14} />Rebalance</button>} /><div className="planner-list">{tasks.map((task) => <div className={cx('planner-task', task.complete && 'planner-task-complete')} key={task.id}><span className="planner-time">{task.time}</span><button className={cx('task-check', task.complete && 'task-check-done')} aria-label={`Complete ${task.title}`} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))}>{task.complete && <Check size={14} />}</button><div className="task-body"><strong>{task.title}</strong><small>{task.course}</small></div><Chip tone={task.tone}>{task.duration}</Chip><button className="icon-button subtle-button" aria-label="Remove task" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><MoreHorizontal size={16} /></button></div>)}</div></section><aside className="planner-aside"><section className="panel"><SectionHeading eyebrow="Planning logic" title="Why this order?" /><div className="logic-list"><div><div className="logic-icon logic-teal"><Clock3 size={15} /></div><p><strong>Deadline first</strong><span>ML notebook is due tomorrow.</span></p></div><div><div className="logic-icon logic-coral"><HeartPulse size={15} /></div><p><strong>Risk recovery</strong><span>Probability needs a small, consistent lift.</span></p></div><div><div className="logic-icon logic-amber"><Target size={15} /></div><p><strong>Goal aware</strong><span>Mentor time compounds your internship plan.</span></p></div></div><Link href="/student/explain" className="button button-secondary full-width"><BrainCircuit size={15} />See full explanation</Link></section><section className="panel planner-note"><Lightbulb size={19} /><div><strong>Protect your energy</strong><p>You've planned 3.5 hours of focus today, inside your sustainable range.</p></div></section></aside></div></PageFrame>;
}

function SimulatorSection({ role }: { role: Role }) {
  const [attendance, setAttendance] = useState(76);
  const [studyHours, setStudyHours] = useState(6);
  const [scenario, setScenario] = useState(role === 'admin' ? 'Attendance threshold policy' : role === 'faculty' ? 'Intervention impact' : 'Probability recovery');
  const projected = Math.min(97, Math.round(68 + (attendance - 70) * .55 + studyHours * 1.2));
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">{role === 'admin' ? 'Policy simulator' : role === 'faculty' ? 'Faculty what-if simulation' : 'What-if decision simulator'}</div><h1>Try a different scenario.</h1><p className="lede">Explore likely impact before you commit a policy, intervention, or hour of your time.</p></div><Chip tone="violet"><Sparkles size={13} />Model preview</Chip></div><div className="simulator-layout"><section className="panel simulator-controls"><SectionHeading eyebrow="Scenario builder" title="Change the variables" detail="The model estimates directional impact from the current seeded signals." /><label className="scenario-label">Scenario<select value={scenario} onChange={(event) => setScenario(event.target.value)}><option>{role === 'admin' ? 'Attendance threshold policy' : role === 'faculty' ? 'Intervention impact' : 'Probability recovery'}</option><option>{role === 'admin' ? 'Department support allocation' : role === 'faculty' ? 'Attendance recovery' : 'ML grade protection'}</option><option>{role === 'admin' ? 'Exam calendar shift' : role === 'faculty' ? 'Extra office hours' : 'Research internship focus'}</option></select></label><div className="slider-control"><div><span>Target attendance</span><strong>{attendance}%</strong></div><input type="range" min="65" max="95" value={attendance} onChange={(event) => setAttendance(Number(event.target.value))} aria-label="Target attendance" /></div><div className="slider-control"><div><span>Support / study hours</span><strong>{studyHours} hrs</strong></div><input type="range" min="2" max="14" value={studyHours} onChange={(event) => setStudyHours(Number(event.target.value))} aria-label="Support or study hours" /></div><div className="scenario-presets"><span>Quick scenarios</span><div>{[['Minimum viable', 76, 4], ['Balanced', 82, 7], ['Ambitious', 90, 11]].map(([label, target, hours]) => <button key={label as string} className="preset-button" onClick={() => { setAttendance(target as number); setStudyHours(hours as number); }}>{label}</button>)}</div></div><button className="button button-primary full-width" onClick={() => undefined}><Play size={15} />Run simulation</button></section><section className="simulation-result"><div className="result-head"><div><div className="eyebrow">Projected outcome</div><h2>{scenario}</h2></div><span className="model-status"><i />Model ready</span></div><div className="projection-card"><div className="projection-number">{projected}<span>/100</span></div><div><strong>{role === 'admin' ? 'Institution health' : 'Academic confidence'}</strong><p>Up from current baseline</p><div className="confidence-delta"><ArrowUpRight size={14} />+{Math.max(1, projected - 68)} points</div></div></div><div className="projection-bars"><div><span>Attendance outcome</span><strong>{attendance}%</strong><ProgressBar value={attendance} color="coral" /></div><div><span>Support consistency</span><strong>{Math.round((studyHours / 14) * 100)}%</strong><ProgressBar value={(studyHours / 14) * 100} color="amber" /></div><div><span>Projected momentum</span><strong>{projected}%</strong><ProgressBar value={projected} color="violet" /></div></div><div className="result-explain"><BrainCircuit size={18} /><div><strong>What changes in this scenario</strong><p>Raising the target to {attendance}% and allocating {studyHours} hours improves recovery capacity, especially when the action starts before the next assessment window.</p></div></div><button className="button button-secondary full-width" onClick={() => window.location.assign(role === 'student' ? '/student/planner' : role === 'faculty' ? '/faculty/interventions' : '/admin/interventions')}><Check size={15} />Apply this scenario</button></section></div><div className="simulator-footnote"><Info size={15} />Directional estimate only. Cogniva re-reasons when new source data arrives.</div></PageFrame>;
}

function GoalsPage() {
  const [goals, setGoals] = useState([{ title: 'Research internship', detail: 'Build a credible applied ML portfolio', progress: 64, date: '28 Mar 2025', color: 'violet' as Tone }, { title: 'Semester distinction', detail: 'Finish above 8.5 GPA', progress: 78, date: '30 Apr 2025', color: 'amber' as Tone }, { title: 'Complete systems project', detail: 'Ship a distributed systems demo', progress: 42, date: '12 Apr 2025', color: 'teal' as Tone }]);
  const [showForm, setShowForm] = useState(false);
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Student workspace · goals</div><h1>Keep the north star visible.</h1><p className="lede">Cogniva checks whether today’s actions are actually aligned with what you want next.</p></div><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add goal</button></div><div className="goal-detail-grid">{goals.map((goal) => <div className="goal-card" key={goal.title}><div className="goal-card-icon"><Target size={18} /></div><div className="eyebrow">Target · {goal.date}</div><h3>{goal.title}</h3><p>{goal.detail}</p><div className="goal-card-progress"><strong>{goal.progress}% aligned</strong><ProgressBar value={goal.progress} color={goal.color} /></div><button className="text-button" onClick={() => setGoals((current) => current.map((item) => item.title === goal.title ? { ...item, progress: Math.min(100, item.progress + 5) } : item))}>Log milestone <ArrowRight size={14} /></button></div>)}</div>{showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><div className="modal-card form-card" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">Goal editor</div><h2>Add an aligned goal</h2></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={18} /></button></div><label>Goal title<input placeholder="e.g. Publish my first case study" /></label><label>Target date<input type="date" /></label><label>Why it matters<textarea placeholder="What future decision will this goal support?" /></label><button className="button button-primary full-width" onClick={() => setShowForm(false)}><Check size={15} />Save goal</button></div></div>}</PageFrame>;
}

function AnalyticsPage({ role }: { role: Role }) {
  const [range, setRange] = useState('Last 30 days');
  const isStudent = role === 'student';
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">{isStudent ? 'Student progress & analytics' : 'Faculty class analytics'}</div><h1>{isStudent ? 'Track the movement, not just the mark.' : 'Turn class data into a better intervention.'}</h1><p className="lede">{isStudent ? 'Performance trends make the next decision easier to see.' : 'Compare sections, performance trends, grade distribution, and engagement.'}</p></div><div className="header-actions"><select className="select-compact" value={range} onChange={(event) => setRange(event.target.value)}><option>Last 30 days</option><option>Last 90 days</option><option>Semester to date</option></select><button className="button button-secondary"><Download size={15} />Export view</button></div></div><div className="metric-grid"><Metric label={isStudent ? 'Academic confidence' : 'Class average'} value={isStudent ? '82.4' : '78.6%'} detail={isStudent ? '+12.8 pts in 30 days' : '+3.2 pts this term'} trend="up" tone="teal" /><Metric label={isStudent ? 'Study consistency' : 'Submission rate'} value={isStudent ? '76%' : '91.4%'} detail={isStudent ? '+8% from baseline' : '+4.8% month on month'} trend="up" tone="amber" /><Metric label={isStudent ? 'Strongest subject' : 'Pass rate'} value={isStudent ? 'HS210' : '88.2%'} detail={isStudent ? '91% current score' : '+2.4% from last exam'} tone="violet" /><Metric label={isStudent ? 'Pressure signal' : 'Students needing review'} value={isStudent ? '2' : '18'} detail={isStudent ? 'Down from 4 last month' : '9.8% of cohort'} trend={isStudent ? 'up' : 'down'} tone="coral" /></div><div className="analytics-grid"><section className="panel"><SectionHeading eyebrow="Movement over time" title={isStudent ? 'Momentum by week' : 'Performance by assessment'} /><div className="big-chart"><div className="big-chart-value">{isStudent ? '+12.8' : '78.6'}<span>{isStudent ? ' pts' : '%'}</span></div><div className="big-chart-sub">{range} · connected academic signals</div><svg viewBox="0 0 720 240"><path d="M0 195 C85 184 100 156 160 170 S245 135 300 145 S390 110 440 130 S525 75 580 91 S660 50 720 42" fill="none" stroke="#277681" strokeWidth="4" /><path d="M0 195 C85 184 100 156 160 170 S245 135 300 145 S390 110 440 130 S525 75 580 91 S660 50 720 42 L720 240 L0 240Z" fill="#277681" opacity=".09" /></svg><div className="chart-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Now</span></div></div></section><section className="panel"><SectionHeading eyebrow={isStudent ? 'Contributors' : 'Grade distribution'} title={isStudent ? 'What is moving the needle' : 'Where the class stands'} /><div className="distribution-list">{(isStudent ? [['Consistent study blocks', '36%', 'teal'], ['Attendance recovery', '28%', 'amber'], ['Goal activity', '22%', 'violet'], ['Assessment pressure', '14%', 'coral']] : [['A / A−', '32%', 'teal'], ['B+ / B', '41%', 'amber'], ['C range', '19%', 'violet'], ['Needs review', '8%', 'coral']]).map(([label, value, tone]) => <div className="distribution-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><ProgressBar value={Number(value.replace('%', '')) * 2.2} color={tone as Tone} /></div>)}</div></section></div></PageFrame>;
}

function TimetablePage() {
  const [day, setDay] = useState('Thursday');
  const schedule: Record<string, Array<[string, string, string, Tone]>> = { Monday: [['09:00', 'Distributed Systems', 'Room B-204 · Lecture', 'amber'], ['14:00', 'Open focus block', 'ML evaluation · 90 min', 'teal']], Tuesday: [['10:30', 'Probability & Statistics', 'Lab 3 · Practice session', 'coral'], ['16:00', 'Design & Society', 'Studio 2 · Seminar', 'violet']], Wednesday: [['09:00', 'Machine Learning', 'Room C-204 · Lecture', 'teal'], ['15:00', 'Mentor office hours', 'Career goal · 20 min', 'amber']], Thursday: [['10:00', 'Machine Learning', 'Room C-204 · Lecture', 'teal'], ['14:30', 'Probability & Statistics', 'Lab 3 · Recovery block', 'coral'], ['17:00', 'Mentor office hours', 'Research internship · 20 min', 'amber']], Friday: [['11:00', 'Design & Society', 'Studio 2 · Seminar', 'violet'], ['15:30', 'Open focus block', 'Weekly review · 45 min', 'teal']] };
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Student workspace · timetable</div><h1>A week with room to think.</h1><p className="lede">Classes and focus blocks arranged around the energy you actually have.</p></div><button className="button button-secondary"><CalendarDays size={15} />Add calendar event</button></div><div className="day-tabs">{Object.keys(schedule).map((item) => <button key={item} className={day === item ? 'day-tab-active' : ''} onClick={() => setDay(item)}><span>{item.slice(0, 3)}</span><strong>{13 + Object.keys(schedule).indexOf(item)}</strong></button>)}</div><section className="panel schedule-panel"><SectionHeading eyebrow={`Thursday, 13 March · ${day}`} title="Your schedule" action={<Chip tone="teal">2 focus blocks protected</Chip>} /><div className="schedule-list">{schedule[day].map(([time, title, detail, tone]) => <div className="schedule-row" key={`${time}-${title}`}><span className="schedule-time">{time}</span><span className={`schedule-dot dot-${tone}`} /><div><strong>{title}</strong><small>{detail}</small></div><button className="icon-button"><MoreHorizontal size={16} /></button></div>)}</div></section></PageFrame>;
}

function ExaminationsPage({ role }: { role: Role }) {
  const { user } = useAuth();
  const isStudent = role === 'student';
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Machine Learning');
  const [date, setDate] = useState('2026-09-12');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [targetYear, setTargetYear] = useState('Second Year');
  const [targetDept, setTargetDept] = useState('CSE');
  const [targetSection, setTargetSection] = useState('CSE-C');
  const [noticeFile, setNoticeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExams();
  }, [user?.email, role]);

  const loadExams = async () => {
    setLoading(true);
    if (isStudent && user?.email) {
      const studs = await fetchStudentMembers();
      const me = studs.find(s => s.email.toLowerCase() === user.email?.toLowerCase());
      if (me) setStudentRecord(me);
      const studentSec = me?.section || 'CSE-C';
      const data = await fetchExaminations(studentSec);
      setExams(data);
    } else if (user?.email) {
      const secs = await fetchFacultyAssignedSections(user.email);
      setAssignedSections(secs);
      if (secs.length > 0) setTargetSection(secs[0].name);
      const data = await fetchExaminations();
      setExams(data);
    }
    setLoading(false);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !title) return;
    setIsSubmitting(true);

    let noticeImageUrl = '';
    if (noticeFile) {
      const uploadRes = await uploadFileToSupabaseStorage(noticeFile, 'Second Year', 'CSE', 'CSE-C', '4', 'General', 'notices');
      noticeImageUrl = uploadRes.url || '';
    }

    const res = await createExamination({
      title,
      subject,
      date,
      start_time: startTime,
      end_time: endTime,
      description,
      instructions,
      year: targetYear,
      department: targetDept,
      section: targetSection,
      faculty_email: user.email,
      notice_image_url: noticeImageUrl
    });

    setIsSubmitting(false);
    if (res.success) {
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      setNoticeFile(null);
      loadExams();
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">{isStudent ? 'Student Workspace · Examinations' : 'Faculty Workspace · Examination Operations'}</div>
          <h1>{isStudent ? 'Targeted Examinations & Exam Notices' : 'Publish Examination / Notice'}</h1>
          <p className="lede">
            {isStudent
              ? 'Examinations published specifically for your target section.'
              : 'Target your examination to your assigned sections. Automatically visible on student dashboards.'}
          </p>
        </div>
        {!isStudent && (
          <button className="button button-primary flex items-center gap-1.5 cursor-pointer" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} />Publish Examination
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading examinations from Supabase...
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          title="No examinations published yet."
          description={isStudent ? "No examinations have been scheduled for your section." : "Create and target an examination to your assigned section."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((ex) => (
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between" key={ex.id}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-teal-400 font-mono font-bold">{ex.subject}</span>
                  <Chip tone="teal">{ex.section}</Chip>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">{ex.title}</h3>
                <p className="text-xs text-slate-400 mb-3">{ex.description}</p>
                {ex.notice_image_url && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950">
                    <img src={ex.notice_image_url} alt="Exam Notice" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div>🗓 <strong>Date:</strong> {ex.date}</div>
                  <div>⏰ <strong>Time:</strong> {ex.start_time} - {ex.end_time}</div>
                  <div>🎯 <strong>Target:</strong> {ex.year} • {ex.department} • {ex.section}</div>
                  {ex.instructions && <div>📝 <strong>Instructions:</strong> {ex.instructions}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Assessment Publisher</div>
                <h2>Create Examination / Notice</h2>
              </div>
              <button className="icon-button" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Examination Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Aptitude Test" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Section</label>
                  <select value={targetSection} onChange={e => setTargetSection(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100">
                    {assignedSections.length > 0 ? (
                      assignedSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    ) : (
                      <option value="CSE-C">CSE-C</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Time</label>
                  <input required value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="10:00 AM" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">End Time</label>
                  <input required value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="11:30 AM" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Exam scope and details" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Exam Notice Image (Optional)</label>
                <input type="file" accept="image/*" onChange={e => setNoticeFile(e.target.files?.[0] || null)} className="text-xs text-slate-400 file:bg-teal-600 file:text-white file:border-0 file:rounded-xl file:px-3 file:py-1.5 cursor-pointer" />
              </div>
              <button type="submit" disabled={isSubmitting} className="button button-primary full-width mt-2 py-2.5 cursor-pointer">
                {isSubmitting ? 'Publishing...' : 'Publish Examination to Section'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function MaterialsPage({ role, saved, setSaved }: { role: Role; saved: string[]; setSaved: (value: string[]) => void }) {
  const { user } = useAuth();
  const isStudent = role === 'student';
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [studentRecord, setStudentRecord] = useState<StudentMember | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Database Systems');
  const [description, setDescription] = useState('');
  const [targetYear, setTargetYear] = useState('Second Year');
  const [targetDept, setTargetDept] = useState('CSE');
  const [targetSection, setTargetSection] = useState('CSE-C');
  const [availableDate, setAvailableDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, [user?.email, role]);

  const loadMaterials = async () => {
    setLoading(true);
    if (isStudent && user?.email) {
      const studs = await fetchStudentMembers();
      const me = studs.find(s => s.email.toLowerCase() === user.email?.toLowerCase());
      if (me) setStudentRecord(me);
      const studentSec = me?.section || 'CSE-C';
      const data = await fetchStudyMaterials(studentSec);
      setMaterials(data);
    } else if (user?.email) {
      const secs = await fetchFacultyAssignedSections(user.email);
      setAssignedSections(secs);
      if (secs.length > 0) setTargetSection(secs[0].name);
      const data = await fetchStudyMaterials();
      setMaterials(data);
    }
    setLoading(false);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !title) return;

    if (!selectedFile) {
      alert('Please select a valid PDF file.');
      return;
    }

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    if (selectedFile.size <= 0) {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsSubmitting(true);

    const uploadRes = await uploadFileToSupabaseStorage(
      selectedFile,
      targetYear,
      targetDept,
      targetSection,
      '4',
      subject,
      'study-materials'
    );

    if (!uploadRes.success || !uploadRes.url || !uploadRes.path) {
      setIsSubmitting(false);
      alert('Upload failed. Please try again.');
      return;
    }

    const res = await createStudyMaterial({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      year: targetYear,
      department: targetDept,
      section: targetSection,
      file_name: selectedFile.name,
      file_url: uploadRes.url,
      file_path: uploadRes.path,
      storage_bucket: 'study-materials',
      file_type: selectedFile.type || 'application/pdf',
      file_size: selectedFile.size,
      faculty_email: user.email,
      upload_date: availableDate,
      due_date: dueDate
    });

    setIsSubmitting(false);
    if (res.success) {
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      await loadMaterials();
    } else {
      alert('Upload failed. Please try again.');
    }
  };

  const handleDownloadFile = (m: StudyMaterial) => {
    let url = m.file_url;
    const bucket = m.storage_bucket || 'study-materials';

    if (m.file_path && (!url || url.includes('undefined') || url.includes('null'))) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(m.file_path);
      if (data?.publicUrl) url = data.publicUrl;
    }

    if (!url || url === 'undefined' || url === 'null' || url.trim() === '') {
      alert('Unable to open this study material. The file may no longer exist.');
      return;
    }

    if (url.startsWith('data:application/pdf') || url.startsWith('data:')) {
      try {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = m.file_name || 'study_material.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } catch {
        alert('Unable to open this study material. The file format is invalid.');
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">{isStudent ? 'Student Workspace · Study Materials' : 'Faculty Workspace · Material Library'}</div>
          <h1>{isStudent ? 'Study Materials & Course Resources' : 'Upload Course Study Materials'}</h1>
          <p className="lede">
            {isStudent
              ? 'PDFs and study notes uploaded for your section.'
              : 'Upload materials targeted to your assigned section. Automatically stored in Supabase Storage.'}
          </p>
        </div>
        {!isStudent && (
          <button className="button button-primary flex items-center gap-1.5 cursor-pointer" onClick={() => setShowUploadModal(true)}>
            <Upload size={15} />Upload Study Material
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading study materials from Supabase...
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No study materials uploaded yet."
          description={isStudent ? "No materials found for your section." : "Upload a PDF or document for your assigned section."}
        />
      ) : (
        <div className="material-list">
          {materials.map((m) => (
            <div className="material-row flex items-center justify-between" key={m.id}>
              <div className="flex items-center gap-3">
                <div className="material-icon"><BookMarked size={18} /></div>
                <div>
                  <strong className="text-slate-100">{m.title}</strong>
                  <div className="text-xs text-slate-400">{m.subject} • Target: {m.section} • File: {m.file_name}</div>
                  {m.description && <div className="text-xs text-slate-500 mt-0.5">{m.description}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Chip tone="teal">Due {m.due_date}</Chip>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(m)}
                  className="button button-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <Download size={14} />Download / View PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Material Publisher</div>
                <h2>Upload Study Material PDF</h2>
              </div>
              <button className="icon-button" onClick={() => setShowUploadModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Material Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Normalization - Unit 3" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Section</label>
                  <select value={targetSection} onChange={e => setTargetSection(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100">
                    {assignedSections.length > 0 ? (
                      assignedSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    ) : (
                      <option value="CSE-C">CSE-C</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Available Date</label>
                  <input type="date" required value={availableDate} onChange={e => setAvailableDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
                  <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Unit syllabus and reading notes" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Upload File (PDF only)</label>
                <input
                  type="file"
                  required
                  accept="application/pdf,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        alert('Please select a valid PDF file.');
                        setSelectedFile(null);
                        e.target.value = '';
                        return;
                      }
                      if (file.size <= 0) {
                        alert('Please select a valid PDF file.');
                        setSelectedFile(null);
                        e.target.value = '';
                        return;
                      }
                    }
                    setSelectedFile(file);
                  }}
                  className="text-xs text-slate-400 file:bg-teal-600 file:text-white file:border-0 file:rounded-xl file:px-3 file:py-1.5 cursor-pointer"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="button button-primary full-width mt-2 py-2.5 cursor-pointer">
                {isSubmitting ? 'Uploading...' : 'Save & Publish to Supabase'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function FacultyHome() {
  const { user } = useAuth();
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentMember | null>(null);

  useEffect(() => {
    loadFacultyData();
  }, [user?.email]);

  const loadFacultyData = async () => {
    if (!user?.email) return;
    setLoading(true);
    const [secs, studs] = await Promise.all([
      fetchFacultyAssignedSections(user.email),
      fetchFacultyAssignedStudents(user.email)
    ]);
    setAssignedSections(secs);
    setAssignedStudents(studs);
    setLoading(false);
  };

  const sectionNamesStr = assignedSections.length > 0
    ? assignedSections.map(s => s.name).join(', ')
    : 'No sections assigned';

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · {sectionNamesStr}</div>
          <h1>Welcome, {user?.email}</h1>
          <p className="lede">View and manage students in your assigned sections.</p>
        </div>
        <div className="header-actions">
          <Link className="button button-secondary" href="/faculty/analytics"><TrendingUp size={15} />Class analytics</Link>
          <Link className="button button-primary" href="/faculty/interventions"><Zap size={15} />Review queue</Link>
        </div>
      </div>

      <div className="signal-banner signal-banner-faculty">
        <div className="signal-banner-icon"><HeartPulse size={21} /></div>
        <div>
          <strong>Assigned Sections: {sectionNamesStr}</strong>
          <p>
            {assignedSections.length > 0
              ? `You have access to ${assignedStudents.length} student records across ${assignedSections.length} section(s).`
              : 'Contact administrator to assign sections (e.g. CSE-C) to your faculty account.'}
          </p>
        </div>
        <Chip tone={assignedSections.length > 0 ? 'teal' : 'amber'}>
          {assignedSections.length > 0 ? 'Assigned' : 'Pending Access'}
        </Chip>
      </div>

      <div className="metric-grid">
        <Metric label="Assigned Sections" value={String(assignedSections.length)} detail={sectionNamesStr} tone="teal" />
        <Metric label="Assigned Students" value={String(assignedStudents.length)} detail="Real database count" tone="amber" />
        <Metric label="Department" value={assignedSections[0] ? 'CSE' : 'Unassigned'} detail="Active faculty assignment" tone="violet" />
        <Metric label="Access Boundary" value={assignedSections.length > 0 ? 'Restricted' : 'No Sections'} detail="Enforced at database layer" tone="coral" />
      </div>

      <section className="panel risk-panel">
        <SectionHeading
          eyebrow="Assigned Section Students"
          title={`Enrolled Students (${assignedStudents.length})`}
          detail="Only students belonging to sections assigned to you are fetched from Supabase."
          action={<Link className="text-button" href="/faculty/students">View roster <ArrowRight size={14} /></Link>}
        />

        {loading ? (
          <div className="p-6 text-center text-teal-400 font-medium">Loading assigned section students from Supabase...</div>
        ) : assignedStudents.length === 0 ? (
          <EmptyState
            title="No students imported yet."
            description="No students found in your assigned sections. Ask admin to import students into your sections."
          />
        ) : (
          <div className="risk-table">
            <div className="risk-table-head">
              <span>Student Name</span>
              <span>Reg No</span>
              <span>Section</span>
              <span>Department</span>
              <span>Email</span>
            </div>
            {assignedStudents.map((st) => (
              <div className="risk-row cursor-pointer hover:bg-slate-800/40" key={st.id} onClick={() => setSelected(st)}>
                <div className="student-cell">
                  <div className="avatar avatar-table">{st.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{st.name}</strong>
                    <small>{st.year || 'Second Year'}</small>
                  </div>
                </div>
                <div>
                  <span className="font-mono text-xs text-teal-300 font-bold">{st.regno}</span>
                </div>
                <div>
                  <Chip tone="teal">{st.section || 'CSE-C'}</Chip>
                </div>
                <span className="muted-cell">{st.department || 'CSE'}</span>
                <span className="text-xs font-mono text-slate-400">{st.email}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <ExplainDrawer
          title={selected.name}
          subtitle={`Reg No: ${selected.regno} · Section: ${selected.section || 'N/A'}`}
          factors={[
            `Department: ${selected.department || 'CSE'}`,
            `Email: ${selected.email}`,
            `DOB: ${selected.dob || 'Not specified'}`
          ]}
          recommendation="Student record fetched directly from Supabase database based on your assigned section access."
          onClose={() => setSelected(null)}
        />
      )}
    </PageFrame>
  );
}

function FacultySection({ section }: { section: string }) {
  const { user } = useAuth();
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentMember | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([
      fetchFacultyAssignedSections(user.email),
      fetchFacultyAssignedStudents(user.email)
    ]).then(([secs, studs]) => {
      setAssignedSections(secs);
      setAssignedStudents(studs);
      setLoading(false);
    });
  }, [user?.email]);

  if (section === 'ask') return <ChatWorkspace role="faculty" />;
  if (section === 'simulator') return <SimulatorSection role="faculty" />;
  if (section === 'analytics') return <AnalyticsPage role="faculty" />;
  if (section === 'attendance') return <AttendanceManagement />;
  if (section === 'examinations') return <ExaminationsPage role="faculty" />;
  if (section === 'materials') return <MaterialsPage role="faculty" saved={[]} setSaved={() => undefined} />;
  if (section === 'notices') return <NoticesPage role="faculty" />;

  if (section === 'students' || section === 'risk' || section === 'explain') {
    const secNames = assignedSections.map(s => s.name).join(', ');
    return (
      <PageFrame>
        <div className="welcome-row">
          <div>
            <div className="eyebrow">Faculty Workspace · {secNames || 'Assigned Sections'}</div>
            <h1>{section === 'students' ? 'Student Progress Roster' : 'Section Risk Radar'}</h1>
            <p className="lede">Showing only students belonging to sections assigned to your account ({secNames || 'None'}).</p>
          </div>
          <Chip tone={assignedStudents.length > 0 ? 'teal' : 'amber'}>{assignedStudents.length} Students</Chip>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            Loading section students from Supabase...
          </div>
        ) : assignedStudents.length === 0 ? (
          <EmptyState
            title="No students imported yet."
            description="When admin imports students into your assigned sections, they will appear here automatically."
          />
        ) : (
          <div className="student-grid">
            {assignedStudents.map((st) => (
              <button className="student-profile-card text-left" key={st.id} onClick={() => setSelected(st)}>
                <div className="student-profile-head">
                  <div className="avatar avatar-large">{st.name.slice(0, 2).toUpperCase()}</div>
                  <Chip tone="teal">{st.section}</Chip>
                </div>
                <h3>{st.name}</h3>
                <p className="font-mono text-xs text-teal-400">{st.regno}</p>
                <div className="student-profile-metrics mt-3">
                  <span><small>Dept</small><strong>{st.department || 'CSE'}</strong></span>
                  <span><small>Sem</small><strong>{st.semester || '4'}</strong></span>
                  <span><small>DOB</small><strong>{st.dob || '2004'}</strong></span>
                </div>
                <span className="text-button mt-2">View details →</span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <ExplainDrawer
            title={selected.name}
            subtitle={`Reg No: ${selected.regno} · Section: ${selected.section || 'N/A'}`}
            factors={[
              `Department: ${selected.department || 'CSE'}`,
              `Year: ${selected.year || 'Second Year'}`,
              `Email: ${selected.email}`,
              `DOB: ${selected.dob || 'N/A'}`
            ]}
            recommendation="Data fetched dynamically from Supabase database. Only authorized section records are displayed."
            onClose={() => setSelected(null)}
          />
        )}
      </PageFrame>
    );
  }

  if (section === 'classes') return <FacultyClassesView />;
  if (section === 'assignments') return <FacultyAssignmentsManagement />;
  if (section === 'grades') return <FacultyGradesManagement />;
  return <PageFrame><EmptyState title="Faculty section ready" description="Choose a section from the workspace navigation to continue." /></PageFrame>;
}

function FacultyClassesView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<FacultySubjectAssignment | null>(null);

  // Add Subject Modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cogniva_subject_assignments');
        if (saved && (saved.includes('Database Management Systems') || saved.includes('Computer Networks') || saved.includes('DBMS') || saved.includes('CN'))) {
          localStorage.removeItem('cogniva_subject_assignments');
        }
        const savedSubjs = localStorage.getItem('cogniva_subjects');
        if (savedSubjs && (savedSubjs.includes('Database Management Systems') || savedSubjs.includes('Computer Networks') || savedSubjs.includes('DBMS') || savedSubjs.includes('CN'))) {
          localStorage.removeItem('cogniva_subjects');
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    loadFacultyClasses();
  }, [user?.email]);

  const loadFacultyClasses = async () => {
    setLoading(true);
    const [assList, studList] = await Promise.all([
      fetchFacultySubjectAssignments(user?.email || ''),
      fetchStudentMembers()
    ]);
    setAssignments(assList);
    setStudents(studList);
    setLoading(false);
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !newSubjectName.trim()) return;

    setSubmitting(true);
    setModalError(null);

    const res = await facultyAddSubject(user.email, newSubjectName.trim());
    setSubmitting(false);

    if (res.success) {
      setShowAddSubjectModal(false);
      setNewSubjectName('');
      await loadFacultyClasses();
    } else {
      setModalError(res.error || 'Failed to add subject.');
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Faculty Workspace · My Classes & Subjects</div>
          <h1>My Assigned Subject Classes</h1>
          <p className="lede">Subject assignments associated with your faculty account.</p>
        </div>
        <button
          className="button button-primary text-xs py-2.5 px-4 flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setModalError(null);
            setNewSubjectName('');
            setShowAddSubjectModal(true);
          }}
        >
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading assigned classes from Supabase...
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No subjects assigned yet."
          description="Ask the administrator to assign subjects to your faculty account."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map(ass => {
            const secName = ass.section_name || 'CSE-C';
            const enrolled = students.filter(s => s.section?.toLowerCase() === secName.toLowerCase() || s.section?.toLowerCase().endsWith(secName.toLowerCase()));

            return (
              <div
                key={ass.id}
                onClick={() => setSelectedClass(ass)}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-teal-400 font-bold px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                      {ass.subject_code}
                    </span>
                    <Chip tone="teal">{enrolled.length} Students</Chip>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors mb-1">
                    {ass.subject_name}
                  </h3>
                  <div className="text-xs text-slate-400 font-medium">
                    {ass.academic_year || 'Second Year'} • {ass.department || 'CSE'} • {ass.section_name || 'CSE-C'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 mt-4 border-t border-slate-800/80 text-slate-400">
                  <span>Semester {ass.semester || '4'}</span>
                  <span className="text-teal-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Roster <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Student Roster Drawer */}
      {selectedClass && (
        <div className="modal-backdrop" onClick={() => setSelectedClass(null)}>
          <div className="modal-card max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">{selectedClass.subject_code} · {selectedClass.section_name}</div>
                <h2>Subject: {selectedClass.subject_name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Department: {selectedClass.department} | Year: {selectedClass.academic_year} | Section: {selectedClass.section_name}
                </p>
              </div>
              <button className="icon-button" onClick={() => setSelectedClass(null)}><X size={18} /></button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-200 mb-3">
                Enrolled Students ({students.filter(s => s.section?.toLowerCase() === selectedClass.section_name?.toLowerCase()).length})
              </h3>
              <div className="divide-y divide-slate-800">
                {students
                  .filter(s => s.section?.toLowerCase() === selectedClass.section_name?.toLowerCase())
                  .map((st, idx) => (
                    <div key={st.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar avatar-table">{st.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong className="text-slate-100 block">{st.name}</strong>
                          <span className="text-slate-400">{st.email}</span>
                        </div>
                      </div>
                      <span className="font-mono text-teal-300 font-bold">{st.regno}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal for Faculty */}
      {showAddSubjectModal && (
        <div className="modal-backdrop" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Class Management</div>
                <h2>Add Subject</h2>
              </div>
              <button className="icon-button" onClick={() => setShowAddSubjectModal(false)}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 my-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} /> {modalError}
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:border-teal-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  className="button button-secondary text-xs py-2 px-4"
                  onClick={() => setShowAddSubjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newSubjectName.trim()}
                  className={`button button-primary text-xs py-2 px-4 ${submitting || !newSubjectName.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {submitting ? 'Adding Subject...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function FacultyGradesManagement() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<FacultySubjectAssignment | null>(null);
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, { internal: number; assignment: number; exam: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Excel Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetchFacultySubjectAssignments(user.email).then(list => {
      setAssignments(list);
      if (list.length > 0) setSelectedAssignment(list[0]);
      setLoading(false);
    });
  }, [user?.email]);

  useEffect(() => {
    if (!selectedAssignment) return;
    loadRosterAndGrades();
  }, [selectedAssignment]);

  const loadRosterAndGrades = async () => {
    if (!selectedAssignment) return;
    setLoading(true);

    const secName = selectedAssignment.section_name || selectedAssignment.section || 'CSE-C';
    const [studs, existingGrades] = await Promise.all([
      fetchStudentsBySection(secName),
      fetchStudentGrades(undefined, secName, selectedAssignment.subject_code)
    ]);

    setStudents(studs);

    const initialMap: Record<string, { internal: number; assignment: number; exam: number }> = {};
    studs.forEach(st => {
      const found = existingGrades.find(g => g.regno.toLowerCase() === st.regno.toLowerCase());
      initialMap[st.regno] = {
        internal: found?.internal_marks ?? 0,
        assignment: found?.assignment_marks ?? 0,
        exam: found?.exam_marks ?? 0
      };
    });

    setGradesMap(initialMap);
    setLoading(false);
  };

  const handleScoreChange = (regno: string, field: 'internal' | 'assignment' | 'exam', val: number) => {
    setGradesMap(prev => ({
      ...prev,
      [regno]: {
        ...prev[regno],
        [field]: Math.max(0, val)
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    const secName = selectedAssignment.section_name || selectedAssignment.section || 'CSE-C';

    const batchRecords: StudentGrade[] = students.map(st => {
      const g = gradesMap[st.regno] || { internal: 0, assignment: 0, exam: 0 };
      const calc = calculateGradeAndTotal(g.internal, g.assignment, g.exam);

      return {
        id: `grd_${st.regno}_${selectedAssignment.subject_code}`,
        regno: st.regno,
        student_name: st.name,
        student_email: st.email,
        faculty_email: user?.email || 'faculty@cogniva.edu',
        subject_code: selectedAssignment.subject_code,
        subject_name: selectedAssignment.subject_name,
        section: secName,
        section_name: secName,
        department: selectedAssignment.department || 'CSE',
        academic_year: selectedAssignment.academic_year || 'Second Year',
        internal: g.internal,
        assignment: g.assignment,
        exam: g.exam,
        internal_marks: g.internal,
        assignment_marks: g.assignment,
        exam_marks: g.exam,
        total: calc.total,
        grade: calc.grade,
        updated_at: new Date().toISOString()
      };
    });

    const res = await saveStudentGradesBatch(batchRecords);
    setSaving(false);

    if (res.success) {
      setToastMsg(`Saved grades for ${res.count} students!`);
      setTimeout(() => setToastMsg(null), 3000);
    } else {
      setToastMsg(`Error: ${res.error || 'Failed to save grades.'}`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleImportExcelGrades = async () => {
    if (!excelFile || !selectedAssignment) return;
    setIsImporting(true);

    const res = await importGradesExcel(
      excelFile,
      user?.email || '',
      selectedAssignment.subject_code,
      selectedAssignment.section_name
    );

    setIsImporting(false);
    setImportResult(res);
    loadRosterAndGrades();
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · Grades & Evaluation</div>
          <h1>Subject Grades & Marks Management</h1>
          <p className="lede">Enter student grades manually or import from Excel for your assigned subjects.</p>
        </div>
        <div className="header-actions">
          <button className="button button-primary" onClick={() => { setImportResult(null); setShowImportModal(true); }}>
            <FileSpreadsheet size={15} /> Import Excel Grades
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      {/* Class Selector */}
      <section className="panel mb-6">
        <SectionHeading eyebrow="Subject Context" title="Select Assigned Subject Class" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex flex-col text-sm font-medium text-slate-300">
            Assigned Subject Class
            <select
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={selectedAssignment?.id || ''}
              onChange={e => {
                const found = assignments.find(a => a.id === e.target.value);
                if (found) setSelectedAssignment(found);
              }}
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.subject_name} ({a.subject_code}) — {a.section_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Roster & Marks Table */}
      <section className="panel">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Grade Sheet: {selectedAssignment?.subject_name} ({selectedAssignment?.subject_code})
            </h2>
            <p className="text-xs text-slate-400">
              Section: <strong className="text-teal-400">{selectedAssignment?.section_name}</strong> | Enrolled: {students.length} Students
            </p>
          </div>
          <button className="button button-primary" onClick={handleSaveGrades} disabled={saving || !selectedAssignment}>
            <Save size={15} /> {saving ? 'Saving Grades...' : 'Save All Grades'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading student roster from Supabase...</div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found in section"
            description={`No student records found for section ${selectedAssignment?.section_name}. Admin must import students first.`}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Internal (20)</th>
                  <th className="py-3 px-4 text-center">Assignment (10)</th>
                  <th className="py-3 px-4 text-center">Exam (70)</th>
                  <th className="py-3 px-4 text-center">Total (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((st, idx) => {
                  const currentScores = gradesMap[st.regno] || { internal: 0, assignment: 0, exam: 0 };
                  const calc = calculateGradeAndTotal(currentScores.internal, currentScores.assignment, currentScores.exam);

                  return (
                    <tr key={st.id || st.regno} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-medium">{st.regno}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{st.name}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-100 font-mono text-xs"
                          value={currentScores.internal}
                          onChange={e => handleScoreChange(st.regno, 'internal', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-100 font-mono text-xs"
                          value={currentScores.assignment}
                          onChange={e => handleScoreChange(st.regno, 'assignment', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={70}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-100 font-mono text-xs"
                          value={currentScores.exam}
                          onChange={e => handleScoreChange(st.regno, 'exam', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">{calc.total}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold rounded text-xs font-mono">
                          {calc.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Excel Grade Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card form-card max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Excel Integration</div>
                <h2>Import Section Grades</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {!importResult ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Upload a grade sheet for <strong className="text-teal-300">{selectedAssignment?.subject_name} ({selectedAssignment?.section_name})</strong>.
                </p>
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl mb-4 text-xs text-slate-300">
                  <p className="font-semibold text-slate-200 mb-1">Expected Excel Columns:</p>
                  <p className="font-mono text-teal-400">REGISTER_NO | EMAIL | SUBJECT_CODE | INTERNAL | ASSIGNMENT | EXAM | TOTAL | GRADE</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={e => setExcelFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer"
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button className="button button-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                  <button
                    className="button button-primary"
                    onClick={handleImportExcelGrades}
                    disabled={!excelFile || isImporting}
                  >
                    <Upload size={15} /> {isImporting ? 'Processing Excel...' : 'Upload & Import Grades'}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Import Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-teal-400">{importResult.importedCount}</span>
                    <span className="text-xs text-slate-300 font-semibold">Imported / Updated</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-rose-400">{importResult.skippedCount}</span>
                    <span className="text-xs text-slate-300 font-semibold">Skipped</span>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg max-h-40 overflow-y-auto text-xs text-rose-300 font-mono mb-4">
                    <p className="font-bold mb-1">Skipped / Validation Details:</p>
                    {importResult.errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <button
                  className="button button-primary full-width"
                  onClick={() => { setShowImportModal(false); setImportResult(null); setExcelFile(null); }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function AttendanceManagement() {
  const { user } = useAuth();
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [selectedYear, setSelectedYear] = useState('Second Year');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSection, setSelectedSection] = useState('CSE-C');
  const [subject, setSubject] = useState('Machine Learning');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<StudentMember[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);

  // Excel Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    invalidCount: number;
    errors: string[];
  } | null>(null);

  const [assignedSubjects, setAssignedSubjects] = useState<FacultySubjectAssignment[]>([]);

  // Load faculty's assigned sections
  useEffect(() => {
    if (!user?.email) return;
    fetchFacultyAssignedSections(user.email).then((secs) => {
      setAssignedSections(secs);
      if (secs.length > 0) {
        setSelectedSection(secs[0].name);
      }
    });
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email || !selectedSection) return;
    fetchFacultySubjectAssignments(user.email, selectedSection).then((assList) => {
      setAssignedSubjects(assList);
      if (assList.length > 0 && (!subject || subject === 'Machine Learning')) {
        setSubject(assList[0].subject_name);
      }
    });
  }, [user?.email, selectedSection]);

  // Load students and saved attendance when section, subject, or date changes
  useEffect(() => {
    if (!selectedSection) return;
    loadRosterAndAttendance();
  }, [selectedSection, date, subject]);

  const loadRosterAndAttendance = async () => {
    setLoading(true);
    const studs = await fetchStudentsBySection(selectedSection);
    setStudents(studs);

    // Fetch existing attendance from Supabase for this section + date + subject
    const existing = await fetchAttendanceRecords(selectedSection, date, subject);
    const initialMap: Record<string, 'Present' | 'Absent'> = {};

    studs.forEach(st => {
      const found = existing.find(r => r.regno.toLowerCase() === st.regno.toLowerCase());
      initialMap[st.regno] = found ? found.status : 'Present';
    });

    setAttendanceMap(initialMap);
    setLoading(false);
  };

  const handleToggleStatus = (regno: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [regno]: prev[regno] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: Record<string, 'Present' | 'Absent'> = {};
    students.forEach(st => {
      updated[st.regno] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    const records: Omit<AttendanceRecord, 'id' | 'created_at'>[] = students.map(st => ({
      regno: st.regno,
      student_name: st.name,
      faculty_email: user?.email || 'faculty@cogniva.edu',
      year: selectedYear,
      department: selectedDept,
      section: selectedSection,
      subject: subject,
      date: date,
      status: attendanceMap[st.regno] || 'Present'
    }));

    const res = await saveAttendanceBatch(records);
    setSaving(false);
    if (res.success) {
      setToastMessage(`Saved attendance for ${res.count} students to Supabase!`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage(`Error: ${res.error || 'Failed to save attendance.'}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    const history = await fetchAttendanceHistory(selectedSection);
    setHistoryRecords(history);
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;
    setIsImporting(true);
    const res = await importAttendanceExcel(
      excelFile,
      user?.email || '',
      selectedYear,
      selectedDept,
      selectedSection,
      subject,
      date
    );
    setIsImporting(false);
    setImportResult(res);
    loadRosterAndAttendance();
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
  const absentCount = students.length - presentCount;

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · Attendance Management</div>
          <h1>Mark & Manage Class Attendance</h1>
          <p className="lede">Save attendance permanently in Supabase. Restrict access strictly to your assigned sections.</p>
        </div>
        <div className="header-actions">
          <button className="button button-secondary" onClick={handleOpenHistory}>
            <History size={15} /> History & Audit
          </button>
          <button className="button button-primary" onClick={() => { setImportResult(null); setShowImportModal(true); }}>
            <FileSpreadsheet size={15} /> Import Excel Attendance
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {/* Filter / Selector Controls */}
      <section className="panel mb-6">
        <SectionHeading eyebrow="Session Configuration" title="Select Class & Session Parameters" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          <label className="flex flex-col text-sm font-medium text-slate-300">
            Assigned Year
            <select
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              <option value="Second Year">Second Year (2nd Year)</option>
              <option value="First Year">First Year (1st Year)</option>
              <option value="Third Year">Third Year (3rd Year)</option>
              <option value="Fourth Year">Fourth Year (4th Year)</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-300">
            Assigned Department
            <select
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ECE">ECE (Electronics)</option>
              <option value="EEE">EEE (Electrical)</option>
              <option value="MECH">MECH (Mechanical)</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-300">
            Assigned Section (Restricted)
            <select
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
            >
              {assignedSections.length > 0 ? (
                assignedSections.map(sec => (
                  <option key={sec.id} value={sec.name}>{sec.name}</option>
                ))
              ) : (
                <option value="CSE-C">CSE-C (Assigned)</option>
              )}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-300">
            Subject
            {assignedSubjects.length > 0 ? (
              <select
                className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                {assignedSubjects.map(a => (
                  <option key={a.id} value={a.subject_name}>{a.subject_name} ({a.subject_code})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Machine Learning"
              />
            )}
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-300">
            Date
            <input
              type="date"
              className="mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Roster & Attendance Controls */}
      <div className="metric-grid">
        <Metric label="Target Section" value={selectedSection} detail={`Year: ${selectedYear}`} tone="teal" />
        <Metric label="Total Students" value={`${students.length}`} detail="Enrolled in section" tone="violet" />
        <Metric label="Marked Present" value={`${presentCount}`} detail={`${((presentCount / (students.length || 1)) * 100).toFixed(0)}% present`} tone="amber" />
        <Metric label="Marked Absent" value={`${absentCount}`} detail={`${((absentCount / (students.length || 1)) * 100).toFixed(0)}% absent`} tone="coral" />
      </div>

      <section className="panel mt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Student Attendance Table</h2>
            <p className="text-sm text-slate-400">Section: <span className="text-teal-400 font-semibold">{selectedSection}</span> | Date: {date} | Subject: {subject}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="button button-secondary text-xs px-3 py-1.5" onClick={() => handleMarkAll('Present')}>
              <CheckCircle2 size={14} className="text-teal-400" /> Mark All Present
            </button>
            <button className="button button-secondary text-xs px-3 py-1.5" onClick={() => handleMarkAll('Absent')}>
              <XCircle size={14} className="text-rose-400" /> Mark All Absent
            </button>
            <button className="button button-primary" onClick={handleSaveAttendance} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading student roster from Supabase...</div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found in section"
            description={`No student records found for section ${selectedSection}. Admin must import students first.`}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((st, idx) => {
                  const isPresent = attendanceMap[st.regno] === 'Present';
                  return (
                    <tr key={st.id || st.regno} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-medium">{st.regno}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{st.name}</td>
                      <td className="py-3 px-4"><Chip tone="teal">{st.section}</Chip></td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(st.regno)}
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isPresent
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {isPresent ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {isPresent ? 'PRESENT' : 'ABSENT'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* History Modal */}
      {showHistory && (
        <div className="modal-backdrop" onClick={() => setShowHistory(false)}>
          <div className="modal-card max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Database Audit Trail</div>
                <h2>Attendance History ({selectedSection})</h2>
              </div>
              <button className="icon-button" onClick={() => setShowHistory(false)}><X size={18} /></button>
            </div>
            <div className="max-h-96 overflow-y-auto mt-4">
              {historyRecords.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No saved attendance records found for this section.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Reg No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {historyRecords.slice(0, 100).map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="py-2 px-3 text-slate-300">{r.date}</td>
                        <td className="py-2 px-3 font-mono text-teal-400">{r.regno}</td>
                        <td className="py-2 px-3 font-medium text-slate-200">{r.student_name || 'N/A'}</td>
                        <td className="py-2 px-3 text-slate-400">{r.subject}</td>
                        <td className="py-2 px-3">
                          <span className={r.status === 'Present' ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card form-card max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Excel Integration</div>
                <h2>Import Section Attendance</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {!importResult ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Upload an attendance Excel sheet for <strong className="text-teal-300">{selectedSection}</strong>. The system validates registration numbers against your assigned section students.
                </p>
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl mb-4 text-xs text-slate-300">
                  <p className="font-semibold text-slate-200 mb-1">Expected Excel Columns:</p>
                  <p className="font-mono text-teal-400">Regno | Student Name | Subject | Date | Status</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={e => setExcelFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30"
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button className="button button-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                  <button
                    className="button button-primary"
                    onClick={handleImportExcel}
                    disabled={!excelFile || isImporting}
                  >
                    <Upload size={15} /> {isImporting ? 'Processing Excel...' : 'Upload & Import'}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Import Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-teal-400">{importResult.importedCount}</span>
                    <span className="text-xs text-slate-300">Imported</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-amber-400">{importResult.updatedCount}</span>
                    <span className="text-xs text-slate-300">Updated</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-rose-400">{importResult.skippedCount}</span>
                    <span className="text-xs text-slate-300">Skipped (Outside Sec)</span>
                  </div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-slate-400">{importResult.invalidCount}</span>
                    <span className="text-xs text-slate-300">Invalid Rows</span>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg max-h-40 overflow-y-auto text-xs text-rose-300 font-mono mb-4">
                    <p className="font-bold mb-1">Skipped / Validation Details:</p>
                    {importResult.errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <button
                  className="button button-primary full-width"
                  onClick={() => { setShowImportModal(false); setImportResult(null); setExcelFile(null); }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function AssignmentsManagement() {
  const [showForm, setShowForm] = useState(false);
  const [published, setPublished] = useState<string[]>([]);
  const assignments = [['ML model evaluation', 'CS402', '38 / 41 submitted', 'Due tomorrow'], ['Probability practice set', 'MA301', '61 / 81 submitted', 'Due in 3 days'], ['Distributed systems lab', 'CS404', '41 / 41 submitted', 'Graded']];
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Faculty workspace · assignments & grading</div><h1>Keep the work loop moving.</h1><p className="lede">Create tasks, see submission status, grade work, and surface missing or late submissions.</p></div><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={15} />Create assignment</button></div><section className="panel"><SectionHeading eyebrow="Active assignments" title="Submission status" /><div className="assignment-list">{assignments.map(([title, code, status, due]) => <div className="assignment-row" key={title}><div className="material-icon"><ClipboardCheck size={17} /></div><div><strong>{title}</strong><small>{code} · {due}</small></div><span className="assignment-status">{status}</span><button className="action-link" onClick={() => setPublished((current) => current.includes(title) ? current : [...current, title])}>{published.includes(title) ? 'Published' : 'Review'} <ArrowRight size={14} /></button></div>)}</div></section>{showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><div className="modal-card form-card" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">Assignment editor</div><h2>Create an assignment</h2></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={18} /></button></div><label>Title<input placeholder="Assignment title" /></label><label>Class<select><option>CS402 · Machine Learning</option><option>MA301 · Probability & Statistics</option></select></label><label>Due date<input type="date" /></label><button className="button button-primary full-width" onClick={() => setShowForm(false)}><Check size={15} />Publish assignment</button></div></div>}</PageFrame>;
}

function EngagementPage() {
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Faculty workspace · workload & engagement</div><h1>See pressure across the learner journey.</h1><p className="lede">Cross-subject signals show who is overloaded, disengaged, or quietly recovering.</p></div><Chip tone="amber">Cross-subject view</Chip></div><div className="metric-grid"><Metric label="Overloaded" value="42%" detail="77 students" trend="down" tone="coral" /><Metric label="Disengaged" value="18%" detail="33 students" tone="amber" /><Metric label="Sustainable" value="74%" detail="Up 6% this month" trend="up" tone="teal" /><Metric label="Data confidence" value="91%" detail="4 sources connected" tone="violet" /></div><div className="two-column-grid"><section className="panel"><SectionHeading eyebrow="Workload heatmap" title="Where pressure is clustering" /><div className="heatmap"><div className="heatmap-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div className="heatmap-grid">{Array.from({ length: 35 }, (_, index) => <button key={index} className={`heat-cell heat-${(index * 7) % 5}`} />)}</div></div></section><section className="panel"><SectionHeading eyebrow="Engagement segments" title="Who needs a different response?" /><div className="segment-list">{[['Quietly recovering', '32 students', 'teal'], ['Overloaded but engaged', '77 students', 'amber'], ['Disengaged and at-risk', '33 students', 'coral'], ['On track', '42 students', 'violet']].map(([label, value, tone]) => <div className="segment-row" key={label}><span className={`segment-dot dot-${tone}`} /><span>{label}</span><strong>{value}</strong></div>)}</div></section></div></PageFrame>;
}

function InterventionsPage({ role, logged, setLogged }: { role: Role; logged: string[]; setLogged: (value: string[]) => void }) {
  const rows = role === 'faculty' ? facultyStudents.slice(0, 3).map((student) => ({ title: `Recommend 1:1 with ${student.name}`, reason: student.factors[0], impact: 'Targeted conversation', id: student.name })) : facultyStudents.map((student) => ({ title: `${student.name} · support loop`, reason: student.factors[0], impact: logged.includes(student.name) ? 'Action logged' : 'Awaiting owner', id: student.name }));
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">{role === 'faculty' ? 'Faculty workspace · intervention recommendations' : 'Admin workspace · intervention tracking'}</div><h1>Close the loop from signal to outcome.</h1><p className="lede">{role === 'faculty' ? 'Use system suggestions as a starting point, then record the human action taken.' : 'See flagged students, assigned actions, response rates, and outcomes across the institution.'}</p></div><Chip tone="coral">{rows.length} open loops</Chip></div><section className="panel"><SectionHeading eyebrow="Action queue" title={role === 'faculty' ? 'Recommended interventions' : 'Institution-wide intervention tracker'} detail="Every recommendation keeps its reason visible and its outcome trackable." /><div className="intervention-list">{rows.map((row) => <div className="intervention-row" key={row.id}><div className="intervention-icon"><Zap size={16} /></div><div><strong>{row.title}</strong><small>{row.reason} · {row.impact}</small></div><button className="button button-secondary" onClick={() => setLogged([...logged, row.id])}>{logged.includes(row.id) ? <><Check size={14} />Logged</> : 'Log action'}</button></div>)}</div></section></PageFrame>;
}

function NoticesPage({ role }: { role: Role }) {
  const [posted, setPosted] = useState(false);
  const notices = role === 'faculty' ? [['Research methods workshop', 'Semester 4 · 62 recipients', '88% acknowledged'], ['Probability revision hour', 'MA301 · 81 recipients', '64% acknowledged']] : [['Mid-semester examination calendar updated', 'All departments · 4,826 recipients', '92% reached'], ['Student support week', 'Institution-wide · 4,826 recipients', '76% acknowledged'], ['Library access window extended', 'All departments · 4,826 recipients', '81% reached']];
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">{role === 'faculty' ? 'Faculty workspace · notices' : 'Admin workspace · system notices'}</div><h1>Make communication measurable.</h1><p className="lede">Publish the right notice to the right audience and see whether it was actually received.</p></div><button className="button button-primary" onClick={() => setPosted(true)}><Plus size={15} />Post notice</button></div><section className="panel"><SectionHeading eyebrow="Published notices" title="Reach & acknowledgement" /><div className="notice-list">{notices.map(([title, audience, reach]) => <div className="notice-row" key={title}><div className="notice-icon notice-icon-soft"><Bell size={16} /></div><div><strong>{title}</strong><small>{audience}</small></div><Chip tone="teal">{reach}</Chip><button className="icon-button"><MoreHorizontal size={16} /></button></div>)}</div></section>{posted && <div className="toast" role="status"><CheckCircle2 size={16} />Notice draft ready to publish</div>}</PageFrame>;
}

function AdminHome() {
  const [, setLocation] = useLocation();
  return <AdminHomeView onNavigate={(path) => setLocation(path)} />;
}

function AdminSection({ section }: { section: string }) {
  if (section === 'structure') return <AcademicStructureView />;
  if (section === 'faculty-access') return <FacultyAccessView />;
  if (section === 'students') return <StudentManagementView />;
  if (section === 'faculty-mgmt') return <FacultyManagementView />;
  return <PageFrame><EmptyState title="Admin Section Ready" description="Select a valid section from the Admin navigation." /></PageFrame>;
}

function AdminAnalytics({ section }: { section: string }) {
  const [department, setDepartment] = useState('All departments');
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · {section === 'faculty' ? 'faculty performance' : 'department & class analytics'}</div><h1>{section === 'faculty' ? 'See where support is moving.' : 'Compare momentum across the institution.'}</h1><p className="lede">{section === 'faculty' ? 'Intervention response rates and engagement reveal where teams need support.' : 'Performance, attendance, grade distribution, and pass rates in one decision surface.'}</p></div><div className="filter-row"><select className="select-compact" value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option><option>Computer Science</option><option>Business & Economics</option><option>Design & Architecture</option></select><button className="button button-secondary"><Download size={15} />Export view</button></div></div><div className="metric-grid"><Metric label="Average performance" value="78.6" detail="+3.2 points this term" trend="up" tone="teal" /><Metric label="Attendance" value="84.1%" detail="+1.8% from last month" trend="up" tone="amber" /><Metric label="Pass rate" value="88.2%" detail="+2.4% after mid-semester" trend="up" tone="violet" /><Metric label={section === 'faculty' ? 'Response rate' : 'Risk movement'} value={section === 'faculty' ? '68%' : '−1.1%'} detail={section === 'faculty' ? 'Of recommended actions' : 'From baseline'} trend="up" tone="coral" /></div><div className="analytics-grid"><section className="panel"><SectionHeading eyebrow="Movement over time" title={`${department} · 30 day trend`} /><div className="big-chart"><div className="big-chart-value">+3.2<span> pts</span></div><div className="big-chart-sub">Performance confidence · {department}</div><svg viewBox="0 0 720 240"><path d="M0 185 C75 178 105 154 160 170 S245 125 300 146 S390 110 440 124 S525 83 580 94 S660 48 720 38" fill="none" stroke="#277681" strokeWidth="4" /><path d="M0 185 C75 178 105 154 160 170 S245 125 300 146 S390 110 440 124 S525 83 580 94 S660 48 720 38 L720 240 L0 240Z" fill="#277681" opacity=".09" /></svg><div className="chart-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Now</span></div></div></section><section className="panel"><SectionHeading eyebrow="Department comparison" title="Who needs capacity?" /><div className="department-list">{departments.map((dept) => <div className="department-row" key={dept.name}><div className={`dept-icon dept-${dept.color}`}><Network size={16} /></div><div className="dept-name"><strong>{dept.short}</strong><small>{dept.attendance}% attendance</small></div><div className="dept-bar"><ProgressBar value={dept.score} color={dept.color} /></div><strong className="dept-score">{dept.pass}%</strong><span className={dept.delta.startsWith('−') ? 'delta-negative' : 'delta-positive'}>{dept.delta}</span></div>)}</div></section></div></PageFrame>;
}

function CalendarManagement() {
  const [events, setEvents] = useState([['18 Mar', 'Mid-semester examinations', 'Institution-wide · Draft'], ['02 Apr', 'Research showcase', 'All departments · Confirmed'], ['08 Apr', 'End-term timetable release', 'Exam cell · Pending review']]);
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · academic calendar</div><h1>Keep the academic year coherent.</h1><p className="lede">Manage examinations, key dates, and syllabus completion across departments.</p></div><button className="button button-primary" onClick={() => setEvents((current) => [...current, ['15 Apr', 'Student support week', 'Institution-wide · Draft']])}><Plus size={15} />Add calendar event</button></div><section className="panel"><SectionHeading eyebrow="Academic calendar" title="Institution events" /><div className="calendar-list">{events.map(([date, title, detail]) => <div className="calendar-row" key={title}><span className="exam-date">{date}</span><div><strong>{title}</strong><small>{detail}</small></div><Chip tone={detail.includes('Confirmed') ? 'teal' : 'amber'}>{detail.split('·')[1]}</Chip><button className="icon-button"><MoreHorizontal size={16} /></button></div>)}</div></section></PageFrame>;
}

function PredictiveTrends() {
  const [threshold, setThreshold] = useState(75);
  const flagged = threshold >= 80 ? 414 : threshold >= 75 ? 309 : 188;
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · predictive trends</div><h1>See where the semester is heading.</h1><p className="lede">Early-warning reports turn current momentum into a conversation about capacity and support.</p></div><Chip tone="violet">Projection refreshed</Chip></div><div className="two-column-grid"><section className="panel"><SectionHeading eyebrow="Semester projection" title="If the current trend continues" /><div className="projection-list"><div><span>Students below attendance threshold</span><strong>6.4%</strong><ProgressBar value={64} color="coral" /></div><div><span>Students at risk of failed assessment</span><strong>4.1%</strong><ProgressBar value={41} color="amber" /></div><div><span>Students likely to recover with support</span><strong>72%</strong><ProgressBar value={72} color="teal" /></div></div><div className="insight-inline"><BrainCircuit size={15} /><span>Attendance drift in second-year engineering is the largest leading indicator.</span></div></section><section className="panel"><SectionHeading eyebrow="Leading indicators" title="Where to look next" /><div className="trend-list">{[['Second-year CSE', '+3.4% risk', 'coral'], ['Business & Economics', '−0.8 score', 'amber'], ['First-year ECE', '+6% recovery', 'teal']].map(([label, value, tone]) => <div className="trend-row" key={label}><span className={`trend-icon trend-${tone}`}><TrendingUp size={15} /></span><span>{label}</span><strong>{value}</strong></div>)}</div></section></div><section className="panel policy-preview"><SectionHeading eyebrow="Threshold preview" title="How many more students would be flagged?" action={<span className="font-mono-ui">{threshold}% threshold</span>} /><input type="range" min="70" max="85" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /><div className="policy-number"><strong>{flagged}</strong><span>students at or below the selected attendance threshold</span></div></section></PageFrame>;
}

function IntegrationHealth() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const integrations = [['Learning management system', 'Moodle · LMS', '42,810', 'Healthy'], ['Attendance register', 'Campus ERP', '18,442', 'Healthy'], ['Examination calendar', 'Exam cell', '1,208', 'Healthy'], ['Student profile system', 'Campus ERP', '4,826', 'Review']];
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · data integration health</div><h1>Know whether the signal layer is trustworthy.</h1><p className="lede">Source health, record counts, refresh status, and coverage for the modular systems Cogniva reads.</p></div><button className="button button-secondary" onClick={() => setSyncing('all')}><RefreshCw size={15} />Refresh all</button></div><section className="panel"><SectionHeading eyebrow="Connected sources" title="System health" detail="Healthy sources are current; review sources need an owner." /><div className="integration-list">{integrations.map(([name, system, records, status]) => <div className="integration-row" key={name}><div className="integration-icon"><Database size={18} /></div><div className="integration-name"><strong>{name}</strong><small>{system}</small></div><span className="integration-records">{records} records</span><Chip tone={status === 'Review' ? 'amber' : 'teal'}>{status}</Chip><span className="integration-sync">{syncing === name || syncing === 'all' ? 'Syncing…' : 'Synced 4 min ago'}</span><button className="icon-button" onClick={() => { setSyncing(name); window.setTimeout(() => setSyncing(null), 800); }}>{syncing === name || syncing === 'all' ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}</button></div>)}</div></section></PageFrame>;
}

function ReportsPage() {
  const [generated, setGenerated] = useState<string | null>(null);
  const reports = [['Semester academic health', 'Institution-wide · 4,826 students'], ['Department risk register', 'Department-wise · current semester'], ['Attendance compliance pack', 'Threshold analysis · accreditation'], ['Intervention outcomes', 'Actions taken · response rate']];
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · reports & export</div><h1>Turn insight into a reviewable record.</h1><p className="lede">Generate management and accreditation-ready views without losing the reasoning behind the numbers.</p></div><Chip tone="teal">Export center</Chip></div><section className="panel"><SectionHeading eyebrow="Report library" title="Available report packs" /><div className="report-list">{reports.map(([title, detail]) => <div className="report-row" key={title}><div className="report-icon"><FileSpreadsheet size={18} /></div><div><strong>{title}</strong><small>{detail}</small></div><button className="button button-secondary" onClick={() => setGenerated(title)}><Download size={14} />{generated === title ? 'Ready' : 'Generate'}</button></div>)}</div></section></PageFrame>;
}

function GovernancePage() {
  const [consent, setConsent] = useState(true);
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · privacy & governance</div><h1>Make trust visible at system level.</h1><p className="lede">Review access patterns, consent settings, and the governance controls behind learner intelligence.</p></div><Chip tone="teal">Governance healthy</Chip></div><div className="two-column-grid"><section className="panel"><SectionHeading eyebrow="Privacy controls" title="Institution settings" /><div className="setting-row"><div><strong>Parent visibility</strong><p>Parents can view approved attendance and progress summaries.</p></div><button className={cx('toggle', consent && 'toggle-on')} onClick={() => setConsent(!consent)}><span /></button></div><div className="setting-row"><div><strong>Explainability required</strong><p>Every automated recommendation must show its factors.</p></div><button className="toggle toggle-on"><span /></button></div><div className="setting-row"><div><strong>Data retention window</strong><p>Keep source records for governance and audit review.</p></div><select className="select-compact"><option>24 months</option><option>36 months</option><option>Until graduation</option></select></div></section><section className="panel"><SectionHeading eyebrow="Access log" title="Recent governance events" /><div className="activity-table">{['Advisor viewed student risk profile', 'Admin exported department risk register', 'Consent settings reviewed', 'LMS source health acknowledged'].map((event, index) => <div className="activity-row" key={event}><span className="activity-time">{index + 1}h ago</span><span className="activity-source">Governance</span><span className="activity-event">{event}</span><Chip tone="teal">Logged</Chip></div>)}</div></section></div></PageFrame>;
}

function AccessPage() {
  const [users, setUsers] = useState([['Ananya Mehta', 'Student', 'CSE · Sem 4', 'Active'], ['Dr. Priya Iyer', 'Faculty', 'CSE Department', 'Active'], ['Ravi Narang', 'Admin', 'Academic office', 'Active'], ['Nandini Rao', 'Student', 'Design · Sem 6', 'Review']]);
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Admin workspace · user & access management</div><h1>Keep access aligned with responsibility.</h1><p className="lede">Manage users, roles, and review states for role-based academic intelligence.</p></div><button className="button button-primary" onClick={() => setUsers((current) => [...current, ['New faculty member', 'Faculty', 'Pending assignment', 'Invite sent']])}><Plus size={15} />Invite user</button></div><section className="panel"><SectionHeading eyebrow="Role-based access control" title="Users & roles" detail="Access is scoped to the role and academic context shown here." /><div className="access-list">{users.map(([name, role, scope, status]) => <div className="access-row" key={name}><div className="avatar avatar-table">{name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{name}</strong><small>{scope}</small></div><Chip tone={role === 'Admin' ? 'violet' : role === 'Faculty' ? 'amber' : 'teal'}>{role}</Chip><span className="muted-cell">{status}</span><button className="icon-button"><MoreHorizontal size={16} /></button></div>)}</div></section></PageFrame>;
}

function Settings() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Preferences & integrations</div><h1>Make Cogniva yours.</h1><p className="lede">Choose how signals arrive, what connects, and how much context you see.</p></div><button className="button button-primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }}><Check size={15} />{saved ? 'Saved' : 'Save changes'}</button></div><div className="settings-grid"><section className="panel settings-panel"><SectionHeading eyebrow="Guidance preferences" title="How Cogniva speaks" /><div className="setting-row"><div><strong>Adaptive notifications</strong><p>Get a quiet nudge when a meaningful change needs your attention.</p></div><button className={cx('toggle', notifications && 'toggle-on')} onClick={() => setNotifications(!notifications)}><span /></button></div><div className="setting-row"><div><strong>Explain recommendations</strong><p>Show the evidence and signals behind each action.</p></div><button className="toggle toggle-on"><span /></button></div><div className="setting-row"><div><strong>Digest cadence</strong><p>A short review of your momentum and open loops.</p></div><select className="select-compact"><option>Weekly</option><option>Daily</option><option>Never</option></select></div></section><section className="panel settings-panel"><SectionHeading eyebrow="Data connections" title="Your signal layer" action={<ShieldCheck size={18} className="section-icon" />} /><div className="privacy-callout"><ShieldCheck size={20} /><div><strong>Built for trust</strong><p>Your guidance is personal. You can inspect, pause, or remove any data source at any time.</p></div></div><Link href="/admin/integrations" className="button button-secondary full-width"><Database size={15} />Review data sources</Link></section></div></PageFrame>;
}

function ProtectedRoute({
  allowedRole,
  children
}: {
  allowedRole: Role;
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-teal-400 font-medium font-mono text-sm">
        <div className="flex items-center gap-3 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl">
          <RefreshCw size={18} className="animate-spin text-teal-400" />
          <span>Authenticating Cogniva session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/');
    return null;
  }

  if (role !== allowedRole) {
    const targetRoute = role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student';
    setLocation(targetRoute);
    return null;
  }

  return <Shell>{children}</Shell>;
}

function ProtectedSettingsRoute() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-teal-400 font-medium font-mono text-sm">
        <div className="flex items-center gap-3 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl">
          <RefreshCw size={18} className="animate-spin text-teal-400" />
          <span>Authenticating Cogniva session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/');
    return null;
  }

  return <Shell><Settings /></Shell>;
}

function AppRouter() {
  const student = (section: string) => () => (
    <ProtectedRoute allowedRole="student">
      {section === 'home' ? <StudentHome /> : <StudentSection section={section} />}
    </ProtectedRoute>
  );

  const faculty = (section: string) => () => (
    <ProtectedRoute allowedRole="faculty">
      {section === 'home' ? <FacultyHome /> : <FacultySection section={section} />}
    </ProtectedRoute>
  );

  const admin = (section: string) => () => (
    <ProtectedRoute allowedRole="admin">
      {section === 'home' ? <AdminHome /> : <AdminSection section={section} />}
    </ProtectedRoute>
  );

  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/admin" component={admin('home')} />
      <Route path="/admin/structure" component={admin('structure')} />
      <Route path="/admin/faculty-access" component={admin('faculty-access')} />
      <Route path="/admin/students" component={admin('students')} />
      <Route path="/admin/faculty-mgmt" component={admin('faculty-mgmt')} />
      <Route path="/admin/risk" component={admin('risk')} />
      <Route path="/admin/analytics" component={admin('analytics')} />
      <Route path="/admin/faculty" component={admin('faculty')} />
      <Route path="/admin/explain" component={admin('explain')} />
      <Route path="/admin/access" component={admin('access')} />
      <Route path="/admin/notices" component={admin('notices')} />
      <Route path="/admin/calendar" component={admin('calendar')} />
      <Route path="/admin/interventions" component={admin('interventions')} />
      <Route path="/admin/trends" component={admin('trends')} />
      <Route path="/admin/integrations" component={admin('integrations')} />
      <Route path="/admin/reports" component={admin('reports')} />
      <Route path="/admin/governance" component={admin('governance')} />
      <Route path="/admin/simulator" component={admin('simulator')} />
      <Route path="/admin/ask" component={admin('ask')} />

      <Route path="/student" component={student('home')} />
      <Route path="/student/priorities" component={student('priorities')} />
      <Route path="/student/assignments" component={student('assignments')} />
      <Route path="/student/subjects" component={student('subjects')} />
      <Route path="/student/attendance" component={student('attendance')} />
      <Route path="/student/examinations" component={student('examinations')} />
      <Route path="/student/materials" component={student('materials')} />
      <Route path="/student/planner" component={student('planner')} />
      <Route path="/student/insights" component={student('insights')} />
      <Route path="/student/analytics" component={student('analytics')} />
      <Route path="/student/timetable" component={student('timetable')} />
      <Route path="/student/alerts" component={student('alerts')} />
      <Route path="/student/goals" component={student('goals')} />
      <Route path="/student/explain" component={student('explain')} />
      <Route path="/student/simulator" component={student('simulator')} />
      <Route path="/student/ask" component={student('ask')} />

      <Route path="/faculty" component={faculty('home')} />
      <Route path="/faculty/classes" component={faculty('classes')} />
      <Route path="/faculty/assignments" component={faculty('assignments')} />
      <Route path="/faculty/attendance" component={faculty('attendance')} />
      <Route path="/faculty/examinations" component={faculty('examinations')} />
      <Route path="/faculty/materials" component={faculty('materials')} />
      <Route path="/faculty/students" component={faculty('students')} />
      <Route path="/faculty/analytics" component={faculty('analytics')} />
      <Route path="/faculty/notices" component={faculty('notices')} />
      <Route path="/faculty/risk" component={faculty('risk')} />
      <Route path="/faculty/explain" component={faculty('explain')} />
      <Route path="/faculty/interventions" component={faculty('interventions')} />
      <Route path="/faculty/simulator" component={faculty('simulator')} />
      <Route path="/faculty/ask" component={faculty('ask')} />

      <Route path="/settings" component={ProtectedSettingsRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;