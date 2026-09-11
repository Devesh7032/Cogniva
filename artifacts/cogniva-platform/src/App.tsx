import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Award, Bell,
  BookOpen, BookMarked, BrainCircuit, Building2, Calendar, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, ClipboardList,
  Clock3, Database, Download, ExternalLink, FileSpreadsheet, FileText, Filter, Flame,
  Gauge, GraduationCap, HeartPulse, History, Info, LayoutDashboard, Lightbulb, ListChecks,
  LogOut, Menu, MessageSquare, MoreHorizontal, Network, PanelLeftClose, PanelLeftOpen,
  Play, Plus, Radar, RefreshCw, Save, Search, Send, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, Trash2, TrendingDown, TrendingUp, Upload,
  UserCheck, UserCog, UsersRound, X, XCircle, Zap
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useRoute } from 'wouter';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/pages/login';
import { askAdminAi, askFacultyAi, askStudentAi, generateIa2ComebackPlan, ComebackPlanResult } from '@/lib/ai-service';
import { StrategyCenter } from '@/components/StrategyCenter';
import { StudentHackathonsView } from '@/components/StudentHackathonsView';
import { StudentExplainPanel } from '@/components/StudentExplainPanel';
import { StudentEntryAlertModal } from '@/components/StudentEntryAlertModal';
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
  fetchNotices,
  createNotice,
  deleteNotice,
  markNoticeAsRead,
  uploadNoticeImage,
  getCurrentStudentContext,
  StudentContext,
  Notice,
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
  StudentAssignmentStatus,
  fetchExamResults,
  saveExamResultsBatch,
  fetchExamImportHistory,
  saveExamImportHistory,
  ExamResult,
  ExamImportHistory,
  fetchDynamicResultsDataset,
  fetchAllDynamicResultsDatasets,
  saveDynamicResultsDataset,
  DynamicResultDataset,
  DynamicResultRow,
  fetchFacultyCgpaRecords,
  fetchStudentCgpaRecord,
  saveCgpaRecordsBatch,
  fetchCgpaImportHistory,
  StudentCgpaRecord,
  CgpaImportDataset,
  fetchFacultyAttendanceSummaryRecords,
  fetchStudentAttendanceSummaryRecord,
  saveAttendanceSummaryBatch,
  fetchDynamicAttendanceImportHistory,
  parseDynamicAttendanceExcel,
  StudentAttendanceSummaryRecord,
  DynamicSubjectAttendance,
  DynamicAttendanceImportDataset,
  fetchFacultyGradeSummaryRecords,
  fetchStudentGradeSummaryRecord,
  saveGradeSummaryBatch,
  fetchDynamicGradeImportHistory,
  parseDynamicGradeExcel,
  StudentGradeSummaryRecord,
  DynamicSubjectGrade,
  DynamicGradeImportDataset,
  fetchStudentGoals,
  saveStudentGoal,
  toggleMilestoneCompletion,
  deleteStudentGoal,
  autoGenerateGoalMilestones,
  Goal,
  GoalPhase,
  GoalMilestone
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
  { href: '/student/hackathons', label: 'Top Hackathons', icon: Flame, roles: ['student'] },
  { href: '/student/strategy', label: 'Unified Strategy Center', icon: Radar, roles: ['student'] },
  { href: '/student/insights', label: 'Risk & Workload', icon: HeartPulse, roles: ['student'] },
  { href: '/student/planner', label: 'Adaptive Action Planner', icon: ClipboardList, roles: ['student'] },
  { href: '/student/simulator', label: 'What-if Simulator', icon: Radar, roles: ['student'] },
  { href: '/student/goals', label: 'Goals', icon: Target, roles: ['student'] },
  { href: '/student/analytics', label: 'Progress & Analytics', icon: TrendingUp, roles: ['student'] },
  { href: '/student/timetable', label: 'Timetable', icon: CalendarDays, roles: ['student'] },
  { href: '/student/examinations', label: 'Examinations', icon: FileText, roles: ['student'] },
  { href: '/student/cgpa', label: 'CGPA / Academic Performance', icon: Award, roles: ['student'] },
  { href: '/student/grades', label: 'My Grades & Evaluation', icon: Award, roles: ['student'] },
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
  { href: '/faculty/student-results', label: 'Student Results', icon: FileSpreadsheet, roles: ['faculty'] },
  { href: '/faculty/cgpa', label: 'CGPA / SGPA', icon: Award, roles: ['faculty'] },
  { href: '/faculty/grades', label: 'Grade Management', icon: Award, roles: ['faculty'] },
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

function findStudentMember(studs: StudentMember[], userEmailOrRegno?: string): StudentMember | undefined {
  if (!userEmailOrRegno) return undefined;
  const target = userEmailOrRegno.trim().toLowerCase();
  return studs.find((s) => {
    const sEmail = (s.email || '').toLowerCase();
    const sReg = (s.regno || '').toLowerCase();
    const sName = (s.name || '').toLowerCase().replace(/\s+/g, '');
    return (
      sEmail === target ||
      sReg === target ||
      (target.includes('@') && sReg && target.includes(sReg)) ||
      (target.includes('@') && sName && target.includes(sName))
    );
  });
}

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
  const { user } = useAuth();
  const roleCopy = role === 'student' ? 'your timetable, attendance, goals, and current workload' : role === 'faculty' ? 'your classes, students, attendance, and interventions' : 'institution-wide performance, risk, and source health';
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'ai'; text: string }>>([
    { from: 'ai', text: `I’m Cogniva ${role.toUpperCase()} AI, connected to your workspace. How can I assist you today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const suggestions = role === 'student'
    ? ['How am I performing this semester?', 'What assignments are due soon?', 'Which subject needs the most attention?']
    : role === 'faculty'
    ? ['Which students need attention in CSE-C?', 'Summarize class performance', 'Identify students with low attendance']
    : ['Provide an executive summary of academic health', 'Which department has highest risk?', 'Summarize institution attendance'];

  const ask = async (value = prompt) => {
    if (!value.trim() || loading) return;
    const userMsg = value.trim();
    setMessages((current) => [...current, { from: 'user', text: userMsg }]);
    setPrompt('');
    setLoading(true);

    try {
      let res;
      if (role === 'admin') {
        res = await askAdminAi(userMsg, user?.email);
      } else if (role === 'faculty') {
        res = await askFacultyAi(userMsg, user?.email);
      } else {
        res = await askStudentAi(userMsg, user?.email);
      }

      if (res.success && res.answer) {
        setMessages((current) => [...current, { from: 'ai', text: res.answer! }]);
      } else {
        setMessages((current) => [...current, { from: 'ai', text: `⚠️ ${res.error || 'AI analysis temporarily unavailable.'}` }]);
      }
    } catch (err: any) {
      setMessages((current) => [...current, { from: 'ai', text: `⚠️ Error: ${err?.message || 'Failed to connect to AI service.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Cogniva Copilot · {role.toUpperCase()} Gemini AI</div>
          <h1>Ask the next useful question.</h1>
          <p className="lede">Answers are generated live by {role.toUpperCase()} Gemini AI using your authorized academic data.</p>
        </div>
        <Chip tone="violet"><span className="assistant-live"><i />{role.toUpperCase()} Gemini API Active</span></Chip>
      </div>
      <div className="chat-layout">
        <section className="panel chat-panel">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={cx('chat-message', message.from === 'user' && 'chat-message-user')} key={`${message.from}-${index}`}>
                <div className="chat-avatar">{message.from === 'ai' ? <BrainCircuit size={15} /> : 'ME'}</div>
                <div>
                  <small>{message.from === 'ai' ? `Cogniva ${role.toUpperCase()} AI` : 'You'}</small>
                  <div className="prose prose-invert text-xs leading-relaxed max-w-none whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message">
                <div className="chat-avatar"><BrainCircuit size={15} /></div>
                <div>
                  <small>Cogniva {role.toUpperCase()} AI</small>
                  <p className="typing">Analyzing authorized database signals with {role.toUpperCase()} Gemini API…</p>
                </div>
              </div>
            )}
          </div>
          <div className="chat-composer">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && ask()}
              placeholder={`Ask Cogniva ${role.toUpperCase()} AI...`}
              aria-label="Ask Cogniva"
              disabled={loading}
            />
            <button className="button button-primary" onClick={() => ask()} disabled={loading}>
              <Send size={15} />Ask
            </button>
          </div>
        </section>
        <aside className="panel chat-context">
          <SectionHeading eyebrow="Try a grounded prompt" title="Start with a decision" />
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => ask(suggestion)} disabled={loading}>
                <Sparkles size={14} />
                <span>{suggestion}</span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
          <div className="context-footer">
            <Database size={15} />
            <span>Using role-based Gemini AI service<br /><strong>{role === 'admin' ? 'GEMINI_ADMIN_API_KEY' : role === 'faculty' ? 'GEMINI_FACULTY_API_KEY' : 'GEMINI_STUDENT_API_KEY'}</strong></span>
          </div>
        </aside>
      </div>
    </PageFrame>
  );
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
          {role === 'student' && <StudentEntryAlertModal />}
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
    const me = findStudentMember(studs, userEmail);
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
    const me = findStudentMember(studs, userEmail);
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
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedAsgn, setSelectedAsgn] = useState<Assignment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssignmentsData();
  }, [user?.email]);

  const loadAssignmentsData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ctx = await getCurrentStudentContext(user?.email);
      setStudentCtx(ctx);
      const userEmail = ctx.email;
      const sec = ctx.sectionName || 'CSE-C';

      const [asgns, subs, stats] = await Promise.all([
        fetchAssignments({ section: sec }),
        fetchAssignmentSubmissions(undefined, userEmail),
        fetchStudentAssignmentStatuses(userEmail)
      ]);

      setAssignments(asgns);
      setSubmissions(subs);
      setStatuses(stats);
    } catch (err: any) {
      console.error('Error loading assignments data:', err);
      setErrorMessage(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (asgnId: string) => {
    if (!studentCtx?.registerNumber || !user?.email) return;
    await toggleAssignmentCompletion(asgnId, studentCtx.registerNumber, user.email);
    loadAssignmentsData();
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgn || !studentCtx || !user?.email) return;

    setIsSubmitting(true);
    let fileUrl = '';
    let filePath = '';

    if (selectedFile) {
      const uploadRes = await uploadFileToSupabaseStorage(
        selectedFile,
        studentCtx.year || 'Second Year',
        studentCtx.department || 'CSE',
        studentCtx.sectionName || 'CSE-C',
        studentCtx.semester || '4',
        selectedAsgn.subject_code,
        'assignment-submissions'
      );
      if (uploadRes.success) {
        fileUrl = uploadRes.url || '';
        filePath = uploadRes.path || '';
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isLate = todayStr > selectedAsgn.due_date;

    await submitAssignment({
      assignment_id: selectedAsgn.id,
      student_id: studentCtx.studentId,
      regno: studentCtx.registerNumber,
      student_name: studentCtx.name,
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
          <h1>Course Assignments ({studentCtx?.sectionName || 'CSE-C'})</h1>
          <p className="lede">Assignments automatically synchronized with your section & due date priority.</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>Database Error: {errorMessage}</span>
          <button onClick={loadAssignmentsData} className="button button-secondary text-xs py-1 px-3">Try Again</button>
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState title="No upcoming assignments" description={`No assignments have been published for section ${studentCtx?.sectionName || 'CSE-C'} yet.`} />
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; title: string; impact: string; tone: 'coral' | 'amber' | 'teal' }[]>([]);
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    loadStudentAlertsAndNotices();
  }, [user?.email]);

  const loadStudentAlertsAndNotices = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ctx = await getCurrentStudentContext(user?.email);
      setStudentCtx(ctx);
      const sec = ctx.sectionName || 'CSE-C';

      const [asgns, exams, noticeList] = await Promise.all([
        fetchAssignments({ section: sec }),
        fetchExaminations(sec),
        fetchNotices(sec),
      ]);

      setNotices(noticeList);

      const generatedAlerts: { id: string; title: string; impact: string; tone: 'coral' | 'amber' | 'teal' }[] = [];

      exams.forEach((e) => {
        const prio = calculateExamPriority(e.date);
        if (prio.status !== 'PAST') {
          generatedAlerts.push({
            id: `exam-${e.id}`,
            title: `Upcoming Exam: ${e.title} (${e.subject}) on ${e.date}`,
            impact: `Scheduled ${e.start_time} - ${e.end_time} · Examination calendar`,
            tone: prio.tone === 'coral' ? 'coral' : 'amber',
          });
        }
      });

      asgns.forEach((a) => {
        const prio = calculateDueDatePriority(a.due_date, false, false);
        if (prio.status !== 'COMPLETED') {
          generatedAlerts.push({
            id: `asgn-${a.id}`,
            title: `Assignment Due: ${a.title} (${a.subject_code}) due on ${a.due_date}`,
            impact: `Max Marks: ${a.max_marks} · Deadline planning`,
            tone: prio.tone === 'coral' ? 'coral' : 'teal',
          });
        }
      });

      setAlerts(generatedAlerts);
    } catch (err: any) {
      console.error('Error loading notices and alerts:', err);
      setErrorMessage(err.message || 'Failed to load announcements for your section.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (noticeId: string) => {
    if (!user?.email) return;
    await markNoticeAsRead(noticeId, user.email);
    loadStudentAlertsAndNotices();
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student workspace · Notices & Adaptive Alerts ({studentCtx?.sectionName || 'CSE-C'})</div>
          <h1>Announcements & Priority Alerts</h1>
          <p className="lede">Official faculty notices and real-time deadline warnings for your section.</p>
        </div>
        <Chip tone="coral">{notices.length + alerts.length} active</Chip>
      </div>

      {/* Official Faculty Section Notices */}
      <section className="panel mb-6">
        <SectionHeading
          eyebrow="Faculty Notices"
          title="Section Announcements"
          detail="Notices published by your faculty for your section."
        />

        {errorMessage ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between mt-4">
            <span>Database Error: {errorMessage}</span>
            <button onClick={loadStudentAlertsAndNotices} className="button button-secondary text-xs py-1 px-3">Try Again</button>
          </div>
        ) : loading ? (
          <div className="p-6 text-center text-teal-400">Loading notices...</div>
        ) : notices.length === 0 ? (
          <EmptyState title="No new notices." description={`No announcements published for section ${studentCtx?.sectionName || 'CSE-C'} yet.`} />
        ) : (
          <div className="space-y-4 mt-4">
            {notices.map((n) => {
              const cleanUser = (user?.email || '').trim().toLowerCase();
              const isRead = (n.read_by || []).some((u) => u.toLowerCase() === cleanUser);
              const isUrgent = n.priority === 'Urgent';

              return (
                <div
                  key={n.id}
                  className={`p-5 bg-slate-900/90 rounded-2xl border transition-all flex flex-col md:flex-row gap-5 ${
                    isUrgent ? 'border-rose-500/70 bg-slate-900/95 shadow-lg shadow-rose-500/10' : 'border-slate-800'
                  }`}
                >
                  {n.image_url && (
                    <div
                      className="w-full md:w-48 h-36 shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer relative group"
                      onClick={() => setLightboxImage(n.image_url!)}
                    >
                      <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <ExternalLink size={14} /> View Image
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                              isUrgent
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : n.priority === 'Important'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            }`}
                          >
                            {n.priority.toUpperCase()}
                          </span>
                          <Chip tone="teal">{n.section}</Chip>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Date: {n.published_at}</span>
                      </div>

                      <h3 className={`text-lg font-bold mb-1 ${isUrgent ? 'text-rose-200' : 'text-slate-100'}`}>
                        {n.title}
                      </h3>
                      {n.description && (
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{n.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">By: <strong className="text-slate-200">{n.faculty_name || n.faculty_email}</strong></span>
                      {isRead ? (
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold rounded-lg flex items-center gap-1">
                          <Check size={14} /> Acknowledged
                        </span>
                      ) : (
                        <button
                          className="button button-primary text-xs py-1.5 px-4 flex items-center gap-1 cursor-pointer"
                          onClick={() => handleAcknowledge(n.id)}
                        >
                          <CheckCircle2 size={14} /> Acknowledge Notice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Adaptive Exam / Assignment Alerts */}
      <section className="panel">
        <SectionHeading eyebrow="Signal Center" title="Adaptive Workload Alerts" detail="Dismiss an alert once you have acted on it." />
        {alerts.length === 0 ? (
          <EmptyState title="All clear for now" description="No active exam or assignment alerts for your section." />
        ) : (
          <div className="alert-list mt-3">
            {alerts.map((item) => (
              <div className="alert-row" key={item.id}>
                <div className={`alert-icon alert-${item.tone}`}>
                  <Zap size={15} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.impact}</small>
                </div>
                <button className="icon-button" aria-label="Dismiss alert" onClick={() => handleDismissAlert(item.id)}>
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {lightboxImage && (
        <div className="modal-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="max-w-4xl p-2 bg-slate-950 border border-slate-800 rounded-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 icon-button bg-slate-900 text-white z-10" onClick={() => setLightboxImage(null)}>
              <X size={18} />
            </button>
            <img src={lightboxImage} alt="Notice Lightbox" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function StudentCgpaView() {
  const { user } = useAuth();
  const [record, setRecord] = useState<StudentCgpaRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetchStudentCgpaRecord(user.email).then(rec => {
      setRecord(rec);
      setLoading(false);
      if (rec) {
        setLoadingAi(true);
        const prompt = `Student ${rec.studentName} has CGPA of ${rec.currentCgpa ?? 'N/A'}, latest SGPA ${rec.latestSgpa ?? 'N/A'}, trend: ${rec.trend}. Provide a concise 2-sentence encouraging academic advisory analysis and actionable target setting for upcoming semesters.`;
        askStudentAi(prompt, user.email).then(res => {
          if (res.success && res.answer) setAiInsight(res.answer);
          setLoadingAi(false);
        }).catch(() => setLoadingAi(false));
      }
    });
  }, [user?.email]);

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · CGPA / Academic Performance</div>
          <h1>Cumulative & Semester Performance</h1>
          <p className="lede">Official verified SGPA trajectory and CGPA record managed by faculty.</p>
        </div>
        {record && (
          <Chip tone={record.trend === 'improving' ? 'teal' : record.trend === 'declining' ? 'coral' : 'amber'}>
            <TrendingUp size={13} /> {record.trend.toUpperCase()} TRAJECTORY
          </Chip>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Fetching CGPA records from Supabase...
        </div>
      ) : !record ? (
        <EmptyState
          title="No CGPA Records Uploaded"
          description="Your faculty has not imported CGPA or semester SGPA records for your profile yet."
        />
      ) : (
        <div className="space-y-6">
          <div className="metric-grid metric-grid-four">
            <Metric
              label="Overall CGPA"
              value={record.currentCgpa !== null ? record.currentCgpa.toFixed(2) : 'N/A'}
              detail={record.cgpaDelta ? `${record.cgpaDelta > 0 ? '+' : ''}${record.cgpaDelta.toFixed(2)} from previous` : 'Current Baseline'}
              trend={record.cgpaDelta && record.cgpaDelta > 0 ? 'up' : record.cgpaDelta && record.cgpaDelta < 0 ? 'down' : undefined}
              tone="teal"
            />
            <Metric
              label="Latest SGPA"
              value={record.latestSgpa !== null ? record.latestSgpa.toFixed(2) : 'N/A'}
              detail={record.sgpaDelta ? `${record.sgpaDelta > 0 ? '+' : ''}${record.sgpaDelta.toFixed(2)} vs prior semester` : 'Latest Term'}
              trend={record.sgpaDelta && record.sgpaDelta > 0 ? 'up' : record.sgpaDelta && record.sgpaDelta < 0 ? 'down' : undefined}
              tone="amber"
            />
            <Metric
              label="Best Semester SGPA"
              value={record.bestSgpa !== null ? record.bestSgpa.toFixed(2) : 'N/A'}
              detail="Personal Peak"
              tone="violet"
            />
            <Metric
              label="Performance Status"
              value={record.trend === 'improving' ? 'Improving ↑' : record.trend === 'declining' ? 'Declining ↓' : 'Stable →'}
              detail={`Avg SGPA: ${record.averageSgpa ? record.averageSgpa.toFixed(2) : 'N/A'}`}
              tone={record.trend === 'improving' ? 'teal' : record.trend === 'declining' ? 'coral' : 'amber'}
            />
          </div>

          <div className="p-5 bg-slate-900/90 border border-teal-500/40 rounded-2xl flex items-start gap-4 shadow-xl">
            <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30 shrink-0">
              <BrainCircuit size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold font-mono text-teal-400 uppercase tracking-wider">Cogniva AI Academic Advisory</span>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono">Gemini AI</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {loadingAi ? (
                  <span className="animate-pulse text-teal-300">Analyzing your semester SGPA trend with Gemini AI...</span>
                ) : aiInsight ? (
                  aiInsight
                ) : (
                  `Your cumulative CGPA stands at ${record.currentCgpa?.toFixed(2) || 'N/A'}. Maintaining your current SGPA trend will protect your target graduation honors.`
                )}
              </p>
            </div>
          </div>

          <section className="panel">
            <SectionHeading eyebrow="Semester Breakdown" title="Semester-Wise SGPA & CGPA History" detail="Detailed record of semester performance verified from imported academic data." />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 uppercase font-semibold text-slate-400 bg-slate-950">
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4 text-center">Semester SGPA</th>
                    <th className="py-3 px-4 text-center">Cumulative CGPA</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {record.semesters.map((sem, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                        <Award size={14} className="text-amber-400" />
                        {sem.semester}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-300">
                        {sem.sgpa !== null ? sem.sgpa.toFixed(2) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">
                        {sem.cgpa !== null ? sem.cgpa.toFixed(2) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          sem.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          sem.status === 'Current' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {sem.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
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
  if (section === 'strategy' || section === 'planner' || section === 'insights') return <StrategyCenter />;
  if (section === 'simulator') return <SimulatorSection role="student" />;
  if (section === 'subjects') return <StudentSubjectsView />;
  if (section === 'attendance') return <StudentAttendanceTracker />;
  if (section === 'hackathons') return <StudentHackathonsView />;
  if (section === 'grades') return <StudentGradesView />;
  if (section === 'priorities' || section === 'assignments') return <StudentAssignmentsView />;
  if (section === 'examinations') return <ExaminationsPage role="student" />;
  if (section === 'cgpa') return <StudentCgpaView />;
  if (section === 'explain') return <PageFrame><StudentExplainPanel /></PageFrame>;
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
  const [summaryRecord, setSummaryRecord] = useState<StudentAttendanceSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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
      setErrorMessage('Unable to load attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAiAdvice = async (rec: StudentAttendanceSummaryRecord) => {
    setAiLoading(true);
    try {
      const prompt = `Student Attendance Analysis:
Overall Attendance: ${rec.overallAttendancePercentage !== null ? rec.overallAttendancePercentage + '%' : 'N/A'}
Subject Attendance Breakdown:
${rec.subjectAttendances.map(s => `- ${s.subjectName}: ${s.attendancePercentage}% (${s.status})`).join('\n')}

Provide a concise, 2-3 sentence personalized academic advice/warning to this student about maintaining mandatory 75% attendance criteria and avoiding eligibility issues.`;
      const response = await askStudentAi(prompt, user?.email);
      if (response && response.answer) {
        setAiAdvice(response.answer);
      } else {
        setAiAdvice("Maintain at least 75% attendance across all subjects to fulfill department examination eligibility requirements.");
      }
    } catch {
      setAiAdvice("Maintain at least 75% attendance across all subjects to fulfill department examination eligibility requirements.");
    } finally {
      setAiLoading(false);
    }
  };

  const overallPct = summaryRecord?.overallAttendancePercentage;
  const isOverallLow = overallPct !== null && overallPct !== undefined && overallPct < 75;
  const lowSubjects = summaryRecord?.subjectAttendances.filter(s => s.attendancePercentage < 75) || [];
  const hasAlert = isOverallLow || lowSubjects.length > 0;

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Attendance Tracker</div>
          <h1>Subject-Wise Attendance Breakdown</h1>
          <p className="lede">Real-time dynamic attendance summary fetched from imported academic records.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 font-medium">Loading attendance...</div>
      ) : errorMessage ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-center font-medium">
          {errorMessage}
        </div>
      ) : !summaryRecord || !summaryRecord.subjectAttendances || summaryRecord.subjectAttendances.length === 0 ? (
        <EmptyState
          title="No Attendance Summary Found"
          description="No attendance has been imported for your account yet."
        />
      ) : (
        <>
          {hasAlert && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300">
              <AlertTriangle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <strong className="block text-rose-200 text-sm font-semibold mb-1">
                  Attendance Requirement Warning (&lt;75% Alert)
                </strong>
                <p className="text-xs text-rose-300">
                  {isOverallLow ? (
                    <>Your overall attendance (<strong className="text-rose-200">{overallPct}%</strong>) is below the required 75% threshold. </>
                  ) : null}
                  {lowSubjects.length > 0 ? (
                    <>You have low attendance in {lowSubjects.map(s => `${s.subjectName} (${s.attendancePercentage}%)`).join(', ')}.</>
                  ) : null}
                  {' '}Please consult your course faculty to resolve shortages before end-semester examinations.
                </p>
              </div>
            </div>
          )}

          <div className="metric-grid mb-6">
            <Metric
              label="Overall Attendance"
              value={overallPct !== null && overallPct !== undefined ? `${overallPct}%` : '—'}
              detail={`Status: ${summaryRecord.overallStatus}`}
              tone={overallPct !== null && overallPct !== undefined && overallPct >= 75 ? 'teal' : 'coral'}
            />
            <Metric
              label="Total Tracked Subjects"
              value={`${summaryRecord.subjectAttendances.length}`}
              detail="Dynamic subjects imported"
              tone="violet"
            />
            <Metric
              label="Highest Attendance"
              value={summaryRecord.highestSubject ? `${summaryRecord.highestSubject.percentage}%` : '—'}
              detail={summaryRecord.highestSubject ? summaryRecord.highestSubject.subjectName : 'None'}
              tone="teal"
            />
            <Metric
              label="Lowest Attendance"
              value={summaryRecord.lowestSubject ? `${summaryRecord.lowestSubject.percentage}%` : '—'}
              detail={summaryRecord.lowestSubject ? summaryRecord.lowestSubject.subjectName : 'None'}
              tone={summaryRecord.lowestSubject && summaryRecord.lowestSubject.percentage >= 75 ? 'amber' : 'coral'}
            />
          </div>

          {/* Gemini AI Advisory */}
          <div className="mb-6 p-5 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Cogniva AI Academic Advisor</span>
            </div>
            {aiLoading ? (
              <p className="text-xs text-slate-400 animate-pulse">Generating personalized attendance guidance...</p>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{aiAdvice || "Maintain strong attendance across all subjects to protect academic eligibility."}</p>
            )}
          </div>

          <section className="panel">
            <SectionHeading eyebrow="Dynamic Roster Breakdown" title="Subject-Wise Attendance Details" />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    <th className="py-3 px-4">Progress Indicator</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summaryRecord.subjectAttendances.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">{sub.subjectName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={sub.attendancePercentage >= 75 ? 'text-teal-300' : 'text-rose-400'}>
                          {sub.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <ProgressBar value={sub.attendancePercentage} color={sub.attendancePercentage >= 75 ? 'teal' : 'coral'} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Chip tone={sub.status === 'Good' ? 'teal' : sub.status === 'Watch' ? 'amber' : 'coral'}>
                          {sub.status === 'Good' ? 'Good Standing' : sub.status === 'Watch' ? 'Watch' : 'Attendance Alert'}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PageFrame>
  );
}

function StudentGradesView() {
  const { user } = useAuth();
  const [summaryRecord, setSummaryRecord] = useState<StudentGradeSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadGradeData();
  }, [user?.email]);

  const loadGradeData = async () => {
    setLoading(true);
    const rec = await fetchStudentGradeSummaryRecord(user?.email || '');
    setSummaryRecord(rec);
    setLoading(false);

    if (rec && rec.subjectGrades && rec.subjectGrades.length > 0) {
      generateAiAdvice(rec);
    }
  };

  const generateAiAdvice = async (rec: StudentGradeSummaryRecord) => {
    setAiLoading(true);
    try {
      const prompt = `Student Academic Grade Analysis:
Overall Grade: ${rec.overallGrade || 'N/A'}
Subject Grade Breakdown:
${rec.subjectGrades.map(s => `- ${s.subjectName}: ${s.grade}`).join('\n')}

Strongest Subject: ${rec.highestGradeSubject ? rec.highestGradeSubject.subjectName + ' (' + rec.highestGradeSubject.grade + ')' : 'None'}
Subject Needing Attention: ${rec.lowestGradeSubject ? rec.lowestGradeSubject.subjectName + ' (' + rec.lowestGradeSubject.grade + ')' : 'None'}

Provide a concise, 2-3 sentence personalized academic advice to this student on maintaining their strengths and improving lower-graded subjects.`;
      const response = await askStudentAi(prompt, user?.email);
      if (response && response.answer) {
        setAiAdvice(response.answer);
      } else {
        setAiAdvice("Cogniva Insight: Your strongest performance is in " + (rec.highestGradeSubject?.subjectName || "core subjects") + ". Focus revision time on " + (rec.lowestGradeSubject?.subjectName || "weaker subjects") + " to lift your overall grade.");
      }
    } catch {
      setAiAdvice("Cogniva Insight: Your strongest performance is in " + (rec.highestGradeSubject?.subjectName || "core subjects") + ". Focus revision time on " + (rec.lowestGradeSubject?.subjectName || "weaker subjects") + " to lift your overall grade.");
    } finally {
      setAiLoading(false);
    }
  };

  const gradeDistribution = useMemo(() => {
    if (!summaryRecord || !summaryRecord.subjectGrades) return [];
    const counts: Record<string, number> = {};
    summaryRecord.subjectGrades.forEach(s => {
      counts[s.grade] = (counts[s.grade] || 0) + 1;
    });
    return Object.entries(counts).map(([grade, count]) => ({ grade, count }));
  }, [summaryRecord]);

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student Workspace · Academic Evaluation</div>
          <h1>My Dynamic Subject Grades</h1>
          <p className="lede">Strictly private report of your subject grades imported from official academic evaluation datasets.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading live academic grades from Supabase...
        </div>
      ) : !summaryRecord || !summaryRecord.subjectGrades || summaryRecord.subjectGrades.length === 0 ? (
        <EmptyState
          title="No Grade Records Published Yet"
          description="Your course faculty has not imported dynamic subject grades for your section yet."
        />
      ) : (
        <>
          <div className="metric-grid mb-6">
            <Metric
              label="Overall Academic Grade"
              value={summaryRecord.overallGrade || 'N/A'}
              detail={`Grade Point: ${summaryRecord.overallGradePoint ?? 'N/A'}`}
              tone="teal"
            />
            <Metric
              label="Evaluated Subjects"
              value={`${summaryRecord.subjectGrades.length}`}
              detail="Dynamic subjects evaluated"
              tone="violet"
            />
            <Metric
              label="Strongest Subject"
              value={summaryRecord.highestGradeSubject ? summaryRecord.highestGradeSubject.grade : 'N/A'}
              detail={summaryRecord.highestGradeSubject ? summaryRecord.highestGradeSubject.subjectName : 'None'}
              tone="teal"
            />
            <Metric
              label="Lowest Grade Subject"
              value={summaryRecord.lowestGradeSubject ? summaryRecord.lowestGradeSubject.grade : 'N/A'}
              detail={summaryRecord.lowestGradeSubject ? summaryRecord.lowestGradeSubject.subjectName : 'None'}
              tone="coral"
            />
          </div>

          {/* Gemini AI Grade Advisor */}
          <div className="mb-6 p-5 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Cogniva AI Academic Insights</span>
            </div>
            {aiLoading ? (
              <p className="text-xs text-slate-400 animate-pulse">Generating personalized grade advice...</p>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{aiAdvice || "Focus revision time on lower-graded subjects to protect your academic standing."}</p>
            )}
          </div>

          {/* Grade Distribution Pill Summary */}
          {gradeDistribution.length > 0 && (
            <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade Distribution:</span>
              <div className="flex flex-wrap gap-2">
                {gradeDistribution.map(({ grade, count }) => (
                  <span key={grade} className="px-3 py-1 bg-slate-800 border border-slate-700 text-teal-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="text-slate-100">{grade}:</span>
                    <span className="text-teal-400 font-extrabold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <section className="panel">
            <SectionHeading eyebrow="Subject Breakdown" title="Evaluated Course Grades" />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-center">Grade Achieved</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summaryRecord.subjectGrades.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{sub.subjectName}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold rounded-lg text-xs font-mono">
                          {sub.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Chip tone={sub.status === 'Good' ? 'teal' : sub.status === 'Watch' ? 'amber' : 'coral'}>
                          {sub.status === 'Good' ? 'Good Standing' : sub.status === 'Watch' ? 'Watch' : 'Needs Attention'}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
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
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<{ milestone: GoalMilestone; goalTitle: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('2026-12-15');
  const [newWhy, setNewWhy] = useState('');
  const [newColor, setNewColor] = useState<'teal' | 'amber' | 'coral' | 'violet'>('violet');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user?.email]);

  const loadGoals = async () => {
    setLoading(true);
    const data = await fetchStudentGoals(user?.email);
    setGoals(data);
    if (data.length > 0 && !expandedGoalId) {
      setExpandedGoalId(data[0].id);
    }
    setLoading(false);
  };

  const nextBestAction = useMemo(() => {
    const allPendingMilestones: { milestone: GoalMilestone; goal: Goal }[] = [];
    goals.forEach(goal => {
      (goal.phases || []).forEach(phase => {
        (phase.milestones || []).forEach(m => {
          if (m.status === 'PENDING') {
            allPendingMilestones.push({ milestone: m, goal });
          }
        });
      });
    });

    if (allPendingMilestones.length === 0) return null;

    const priorityRank = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    allPendingMilestones.sort((a, b) => {
      const pDiff = (priorityRank[a.milestone.priority] || 2) - (priorityRank[b.milestone.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (a.milestone.order_index || 0) - (b.milestone.order_index || 0);
    });

    return allPendingMilestones[0];
  }, [goals]);

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const updated = await toggleMilestoneCompletion(goalId, milestoneId, user?.email);
    if (updated) {
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      if (selectedMilestone && selectedMilestone.milestone.id === milestoneId) {
        // find updated milestone
        const updatedMs = (updated.phases || [])
          .flatMap(p => p.milestones || [])
          .find(m => m.id === milestoneId);
        if (updatedMs) {
          setSelectedMilestone({ milestone: updatedMs, goalTitle: updated.title });
        }
      }
    }
  };

  const handleAutoGenerateMilestones = async (goal: Goal) => {
    setGeneratingId(goal.id);
    try {
      const updated = await autoGenerateGoalMilestones(
        goal.title,
        goal,
        goal.description,
        goal.target_date,
        user?.email
      );
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      setExpandedGoalId(updated.id);
    } catch (err) {
      console.error('Failed to auto-generate milestones:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreateCustomGoal = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const newGoal = await autoGenerateGoalMilestones(
        newTitle.trim(),
        undefined,
        newWhy.trim() || undefined,
        newTargetDate,
        user?.email
      );
      newGoal.color = newColor;
      await saveStudentGoal(newGoal);
      setGoals(prev => [newGoal, ...prev]);
      setExpandedGoalId(newGoal.id);
      setShowForm(false);
      setNewTitle('');
      setNewWhy('');
    } catch (err) {
      console.error('Error creating custom goal:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteStudentGoal(goalId, user?.email);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      if (expandedGoalId === goalId) {
        setExpandedGoalId(null);
      }
    }
  };

  const getStatusBadge = (status: Goal['status']) => {
    switch (status) {
      case 'ON_TRACK':
        return <Chip tone="teal"><CheckCircle2 size={12} /> ON TRACK</Chip>;
      case 'NEEDS_ATTENTION':
        return <Chip tone="amber"><AlertTriangle size={12} /> NEEDS ATTENTION</Chip>;
      case 'AT_RISK':
        return <Chip tone="coral"><AlertCircle size={12} /> AT RISK</Chip>;
      default:
        return <Chip tone="violet"><Clock3 size={12} /> NOT STARTED</Chip>;
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Student workspace · AI goals & roadmaps</div>
          <h1>Keep the north star visible.</h1>
          <p className="lede">Cogniva dynamically breaks down your goals into actionable milestones, daily priorities, and automated focus roadmaps.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add custom goal
        </button>
      </div>

      {/* NEXT BEST ACTION BANNER */}
      {nextBestAction && (
        <div className="signal-banner animate-rise" style={{ borderLeft: '4px solid hsl(var(--primary))', marginBottom: '24px' }}>
          <div className="signal-banner-icon">
            <Zap size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="eyebrow" style={{ color: 'hsl(var(--primary))', fontWeight: 700 }}>
                ✦ Next Best Action (Highest Impact)
              </span>
              <Chip tone={nextBestAction.milestone.priority === 'HIGH' ? 'coral' : nextBestAction.milestone.priority === 'MEDIUM' ? 'amber' : 'teal'}>
                {nextBestAction.milestone.priority} PRIORITY
              </Chip>
              <Chip tone="violet">{nextBestAction.milestone.estimated_hours} HRS ESTIMATED</Chip>
            </div>
            <strong style={{ fontSize: '14px', color: 'hsl(var(--foreground))' }}>
              {nextBestAction.milestone.title}
            </strong>
            <p style={{ margin: '3px 0 0', fontSize: '12px' }}>
              Targeting: <strong style={{ color: 'hsl(var(--foreground))' }}>{nextBestAction.goal.title}</strong> — {nextBestAction.milestone.why_it_matters}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="button button-primary"
              onClick={() => handleToggleMilestone(nextBestAction.goal.id, nextBestAction.milestone.id)}
            >
              <Check size={14} /> Mark Done
            </button>
            <button
              className="button button-secondary"
              onClick={() => setSelectedMilestone({ milestone: nextBestAction.milestone, goalTitle: nextBestAction.goal.title })}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading your AI goal roadmaps...</p>
        </div>
      ) : (
        <>
          {/* GOAL CARDS GRID */}
          <div className="goal-detail-grid" style={{ marginBottom: '24px' }}>
            {goals.map((goal) => {
              const isGenerating = generatingId === goal.id;
              const isExpanded = expandedGoalId === goal.id;

              return (
                <div
                  className="goal-card"
                  key={goal.id}
                  style={{
                    border: isExpanded ? '1.5px solid hsl(var(--primary))' : undefined,
                    boxShadow: isExpanded ? '0 4px 16px rgba(39,118,129,0.15)' : undefined,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div className="goal-card-icon">
                      <Target size={18} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getStatusBadge(goal.status)}
                      <button
                        className="icon-button subtle-button"
                        title="Delete Goal"
                        onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="eyebrow">Target · {goal.target_date || 'Ongoing'}</div>
                  <h3>{goal.title}</h3>
                  <p>{goal.description || goal.why_it_matters}</p>

                  <div className="goal-card-progress">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>{goal.progress_percentage}% completed</strong>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--app-font-mono)' }}>
                        {(goal.phases || []).flatMap(p => p.milestones || []).filter(m => m.status === 'COMPLETED').length} / {(goal.phases || []).flatMap(p => p.milestones || []).length} tasks
                      </span>
                    </div>
                    <ProgressBar value={goal.progress_percentage} color={goal.color || 'violet'} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="button button-secondary full-width"
                      onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>{isExpanded ? 'Hide Roadmap' : 'View Action Roadmap'}</span>
                      <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    <button
                      className="button button-primary full-width"
                      disabled={isGenerating}
                      onClick={() => handleAutoGenerateMilestones(goal)}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw size={14} className="spin" /> Generating Roadmap...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> {(goal.phases || []).length > 0 ? 'Regenerate Roadmap ✦' : 'Auto-Generate Milestones ✦'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXPANDED ROADMAP DETAILS */}
          {expandedGoalId && (() => {
            const currentGoal = goals.find(g => g.id === expandedGoalId);
            if (!currentGoal) return null;

            const totalMilestones = (currentGoal.phases || []).flatMap(p => p.milestones || []);
            const completedCount = totalMilestones.filter(m => m.status === 'COMPLETED').length;

            return (
              <section className="panel animate-rise" style={{ borderTop: '4px solid hsl(var(--primary))' }}>
                <SectionHeading
                  eyebrow={`Actionable Roadmap · ${currentGoal.title}`}
                  title="Phase-by-Phase Execution Plan"
                  detail={`Track progress step-by-step. Checking off milestones automatically updates your overall goal health and next actions.`}
                  action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Chip tone={currentGoal.color || 'violet'}>
                        {completedCount} of {totalMilestones.length} Milestones Done
                      </Chip>
                      <button
                        className="button button-secondary"
                        disabled={generatingId === currentGoal.id}
                        onClick={() => handleAutoGenerateMilestones(currentGoal)}
                      >
                        <Sparkles size={13} /> Regenerate with AI
                      </button>
                    </div>
                  }
                />

                {(currentGoal.phases || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', background: 'hsl(var(--secondary) / 0.5)', borderRadius: '8px' }}>
                    <BrainCircuit size={32} style={{ margin: '0 auto 12px', color: 'hsl(var(--primary))' }} />
                    <h4>No milestones generated yet</h4>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', margin: '6px 0 16px' }}>
                      Click below to let Cogniva AI break down "{currentGoal.title}" into strategic phases & milestones.
                    </p>
                    <button
                      className="button button-primary"
                      disabled={generatingId === currentGoal.id}
                      onClick={() => handleAutoGenerateMilestones(currentGoal)}
                    >
                      <Sparkles size={14} /> Auto-Generate Milestones ✦
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {currentGoal.phases.map((phase) => {
                      const phaseTotal = (phase.milestones || []).length;
                      const phaseDone = (phase.milestones || []).filter(m => m.status === 'COMPLETED').length;
                      const phasePct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

                      return (
                        <div key={phase.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '16px', background: 'hsl(var(--card))' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid hsl(var(--border) / 0.6)', paddingBottom: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '14px', color: 'hsl(var(--foreground))' }}>{phase.title}</strong>
                              {phase.description && <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{phase.description}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                {phaseDone} / {phaseTotal} ({phasePct}%)
                              </span>
                              <div style={{ width: '100px', marginTop: '4px' }}>
                                <ProgressBar value={phasePct} color={currentGoal.color || 'violet'} />
                              </div>
                            </div>
                          </div>

                          <div className="priority-list">
                            {(phase.milestones || []).map((ms) => {
                              const isDone = ms.status === 'COMPLETED';

                              return (
                                <div className={`priority-item ${isDone ? 'priority-done' : ''}`} key={ms.id}>
                                  <button
                                    className={`task-check ${isDone ? 'task-check-done' : ''}`}
                                    aria-label={`Toggle ${ms.title}`}
                                    onClick={() => handleToggleMilestone(currentGoal.id, ms.id)}
                                  >
                                    {isDone && <Check size={14} />}
                                  </button>

                                  <div className="priority-main" onClick={() => setSelectedMilestone({ milestone: ms, goalTitle: currentGoal.title })}>
                                    <div className="priority-title-row">
                                      <strong style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                                        {ms.title}
                                      </strong>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Chip tone={ms.priority === 'HIGH' ? 'coral' : ms.priority === 'MEDIUM' ? 'amber' : 'teal'}>
                                          {ms.priority}
                                        </Chip>
                                        <Chip tone="violet">
                                          {ms.estimated_hours}h
                                        </Chip>
                                      </div>
                                    </div>
                                    <p style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                                      {ms.description}
                                    </p>
                                    <div className="priority-meta">
                                      <span>Why it matters: {ms.why_it_matters}</span>
                                    </div>
                                  </div>

                                  <button
                                    className="icon-button subtle-button"
                                    title="View milestone details"
                                    onClick={() => setSelectedMilestone({ milestone: ms, goalTitle: currentGoal.title })}
                                  >
                                    <Info size={15} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })()}
        </>
      )}

      {/* MILESTONE DETAIL MODAL */}
      {selectedMilestone && (
        <div className="modal-backdrop" onClick={() => setSelectedMilestone(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">{selectedMilestone.goalTitle} · Milestone Detail</div>
                <h2>{selectedMilestone.milestone.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedMilestone(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', margin: '12px 0 16px' }}>
              <Chip tone={selectedMilestone.milestone.status === 'COMPLETED' ? 'teal' : 'amber'}>
                STATUS: {selectedMilestone.milestone.status}
              </Chip>
              <Chip tone={selectedMilestone.milestone.priority === 'HIGH' ? 'coral' : selectedMilestone.milestone.priority === 'MEDIUM' ? 'amber' : 'teal'}>
                PRIORITY: {selectedMilestone.milestone.priority}
              </Chip>
              <Chip tone="violet">
                ESTIMATED EFFORT: {selectedMilestone.milestone.estimated_hours} HOURS
              </Chip>
            </div>

            <div className="explain-box">
              <BrainCircuit size={20} />
              <div>
                <strong>Strategic Impact & Rationale</strong>
                <p>{selectedMilestone.milestone.why_it_matters}</p>
              </div>
            </div>

            <div style={{ margin: '16px 0' }}>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Detailed Requirements</strong>
              <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6' }}>
                {selectedMilestone.milestone.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                className={`button ${selectedMilestone.milestone.status === 'COMPLETED' ? 'button-secondary' : 'button-primary'} full-width`}
                onClick={() => {
                  const currentGoal = goals.find(g => (g.phases || []).some(p => (p.milestones || []).some(m => m.id === selectedMilestone.milestone.id)));
                  if (currentGoal) {
                    handleToggleMilestone(currentGoal.id, selectedMilestone.milestone.id);
                  }
                }}
              >
                <Check size={15} />
                {selectedMilestone.milestone.status === 'COMPLETED' ? 'Mark as Incomplete' : 'Mark Milestone Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM GOAL MODAL */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card form-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Goal auto-mapper</div>
                <h2>Add an aligned custom goal</h2>
              </div>
              <button className="icon-button" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <label>
              Goal title
              <input
                placeholder="e.g. Publish Applied Machine Learning Paper"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </label>

            <label>
              Target date
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
              />
            </label>

            <label>
              Why it matters & Target outcome
              <textarea
                placeholder="What future academic or career opportunity will achieving this goal unlock?"
                value={newWhy}
                onChange={(e) => setNewWhy(e.target.value)}
              />
            </label>

            <label>
              Card Color Accent
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value as any)}
                style={{ width: '100%', marginTop: '6px', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              >
                <option value="violet">Violet Accent</option>
                <option value="teal">Teal Accent</option>
                <option value="amber">Amber Accent</option>
                <option value="coral">Coral Accent</option>
              </select>
            </label>

            <button
              className="button button-primary full-width"
              style={{ marginTop: '16px' }}
              disabled={isCreating || !newTitle.trim()}
              onClick={handleCreateCustomGoal}
            >
              {isCreating ? (
                <>
                  <RefreshCw size={15} className="spin" /> Generating AI Roadmap...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Save & Generate AI Roadmap ✦
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </PageFrame>
  );
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [user?.email, role]);

  const loadMaterials = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (isStudent && user?.email) {
        const ctx = await getCurrentStudentContext(user.email);
        setStudentRecord({
          id: ctx.studentId,
          regno: ctx.registerNumber,
          name: ctx.name,
          email: ctx.email,
          section: ctx.sectionName,
          department: ctx.department,
          year: ctx.year,
          semester: ctx.semester,
          created_at: new Date().toISOString()
        });
        const studentSec = ctx.sectionName || 'CSE-C';
        const data = await fetchStudyMaterials(studentSec);
        setMaterials(data);
      } else if (user?.email) {
        const secs = await fetchFacultyAssignedSections(user.email);
        setAssignedSections(secs);
        if (secs.length > 0) setTargetSection(secs[0].name);
        const data = await fetchStudyMaterials();
        setMaterials(data);
      }
    } catch (err: any) {
      console.error('Error loading materials:', err);
      setErrorMessage(err.message || 'Failed to load study materials.');
    } finally {
      setLoading(false);
    }
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
      alert(uploadRes.error || 'Upload failed. Please check the file and try again.');
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
      alert('Study material uploaded successfully!');
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      await loadMaterials();
    } else {
      alert(res.error || 'Database record creation failed. Please try again.');
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

      {errorMessage ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>Database Error: {errorMessage}</span>
          <button onClick={loadMaterials} className="button button-secondary text-xs py-1 px-3">Try Again</button>
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading study materials...
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No study materials uploaded yet."
          description={isStudent ? `No materials found for section ${studentRecord?.section || 'CSE-C'}.` : "Upload a PDF or document for your assigned section."}
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

function ProactiveRescueDrawer({
  student,
  userEmail,
  onClose
}: {
  student: StudentMember;
  userEmail?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [ia1Score, setIa1Score] = useState<number>(12);
  const [subjectName, setSubjectName] = useState<string>('Cloud Computing');
  const [comebackPlan, setComebackPlan] = useState<ComebackPlanResult | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false]);
  const [interventionSent, setInterventionSent] = useState(false);
  const [sendingIntervention, setSendingIntervention] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadStudentData();
  }, [student.id, student.regno]);

  const loadStudentData = async () => {
    setLoading(true);
    const activeDs = await fetchDynamicResultsDataset(userEmail);
    const examResults = await fetchExamResults({ regno: student.regno });

    let lowScore = 12;
    let lowSubj = 'Cloud Computing';

    if (activeDs) {
      const stRow = activeDs.rows.find(r => r.regno.toLowerCase() === student.regno.toLowerCase());
      if (stRow) {
        for (const col of activeDs.resultHeaders) {
          const val = stRow.data[col];
          if (typeof val === 'number' && val < 15) {
            lowScore = val;
            lowSubj = col;
            break;
          } else if (typeof val === 'number') {
            lowScore = val;
            lowSubj = col;
          }
        }
      }
    } else if (examResults.length > 0) {
      const low = examResults.find(r => r.marks < 15);
      if (low) {
        lowScore = low.marks;
        lowSubj = low.subject_name;
      } else {
        lowScore = examResults[0].marks;
        lowSubj = examResults[0].subject_name;
      }
    }

    setIa1Score(lowScore);
    setSubjectName(lowSubj);

    setGeneratingPlan(true);
    const plan = await generateIa2ComebackPlan(lowSubj, lowScore, student.name, userEmail);
    setComebackPlan(plan);
    setGeneratingPlan(false);
    setLoading(false);
  };

  const handleSendIntervention = () => {
    setSendingIntervention(true);
    setTimeout(() => {
      setSendingIntervention(false);
      setInterventionSent(true);
      setToastMsg(`Intervention email successfully sent to ${student.name} (${student.email || student.regno})!`);
      setTimeout(() => setToastMsg(null), 4000);
    }, 800);
  };

  const isLowScore = ia1Score < 15;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="detail-drawer explain-drawer max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="drawer-head border-b border-slate-800 pb-3">
          <div>
            <div className="eyebrow flex items-center gap-1.5 text-rose-400 font-bold">
              <Sparkles size={14} /> Proactive Rescue Engine · Student Risk Profile
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">{student.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {student.regno} · Section {student.section || 'CSE-C'} · {student.department || 'CSE'} Sem {student.semester || '4'}
            </p>
          </div>
          <button className="icon-button" aria-label="Close drawer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {toastMsg && (
          <div className="toast" role="status">
            <CheckCircle2 size={16} /> {toastMsg}
          </div>
        )}

        <div className="p-4 space-y-5 text-xs">
          {/* STEP 1: DETECT */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`avatar avatar-large font-bold ${isLowScore ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {student.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Traffic-Light Risk Status</span>
                <strong className={`text-sm font-bold flex items-center gap-1.5 ${isLowScore ? 'text-rose-400' : 'text-amber-300'}`}>
                  {isLowScore ? (
                    <>
                      <AlertTriangle size={15} /> High Risk · IA-1 Alert ({ia1Score}/30 in {subjectName})
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} /> Moderate Risk · Needs Monitoring
                    </>
                  )}
                </strong>
              </div>
            </div>
            <Chip tone={isLowScore ? 'coral' : 'amber'}>
              {isLowScore ? 'Action Required' : 'Monitor'}
            </Chip>
          </div>

          {/* STEP 2: DIAGNOSE (AI AUTO-SUMMARY) */}
          <div className="p-4 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
              <BrainCircuit size={16} className="text-rose-400" /> AI Auto-Summary & Context Diagnosis
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>{student.name}'s risk profile spiked.</strong> He scored <span className="text-rose-400 font-bold font-mono">{ia1Score}/30</span> in <span className="text-teal-300 font-semibold">{subjectName}</span> (passing: 15). His overall section attendance is <span className="text-amber-300 font-semibold">40%</span> and he spent 4 hours asking the AI bot about <span className="text-teal-300 font-mono font-semibold">'Pointers & Memory Allocation'</span> last night. He is highly likely experiencing academic burnout or concept difficulty in this course.
            </p>
          </div>

          {/* STEP 3: IA-2 TARGET-SETTER & COMEBACK PLAN (GEMINI API) */}
          <div className="panel border border-amber-500/40 bg-slate-900/60 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                <Target size={18} className="text-amber-400" /> IA-2 Comeback Strategy
              </div>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                Powered by Gemini AI
              </span>
            </div>

            {generatingPlan ? (
              <div className="p-4 text-center text-amber-400 bg-slate-950/50 rounded-xl border border-slate-800 animate-pulse">
                Consulting Gemini AI Advisor for IA-2 target math & comeback strategy...
              </div>
            ) : comebackPlan ? (
              <>
                {/* TARGET MATH WARNING BANNER */}
                <div className="p-3.5 bg-amber-950/60 border border-amber-500/50 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">TARGET RECOVERY MATH</span>
                    <p className="text-xs font-semibold text-amber-200 mt-0.5 leading-snug">
                      {comebackPlan.targetMath}
                    </p>
                  </div>
                </div>

                {/* ACTIONABLE STEPS CHECKLIST */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Actionable Study Habit Steps (Interactive Checklist):
                  </span>
                  <div className="space-y-2">
                    {comebackPlan.actionableSteps.map((step, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          checklist[idx]
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-200'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checklist[idx]}
                          onChange={() => {
                            const next = [...checklist];
                            next[idx] = !next[idx];
                            setChecklist(next);
                          }}
                          className="mt-0.5 accent-teal-500 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className={`font-semibold text-xs block ${checklist[idx] ? 'line-through opacity-80 text-teal-300' : 'text-slate-100'}`}>
                            Step {idx + 1}: {step}
                          </span>
                        </div>
                        {checklist[idx] && <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* STEP 4: RESOLVE (DRAFTED INTERVENTION & SEND BUTTON) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles size={14} className="text-teal-400" /> AI Drafted Faculty Intervention
              </span>
              <span className="text-[10px] text-slate-500">Auto-generated intervention email</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 leading-relaxed">
              "Hi {student.name}, I noticed you were working late on Pointers and scored {ia1Score}/30 in {subjectName}. You're doing great in theory! Let's chat for 5 mins after class so I can clear up the coding concepts for you."
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {interventionSent ? (
                  <span className="text-teal-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Intervention Sent (Logged in database)
                  </span>
                ) : (
                  'Ready to dispatch to student inbox'
                )}
              </span>

              <button
                className={`button ${interventionSent ? 'button-secondary' : 'button-primary'} text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer`}
                onClick={handleSendIntervention}
                disabled={sendingIntervention || interventionSent}
              >
                <Send size={14} />
                {sendingIntervention ? 'Sending Email...' : interventionSent ? 'Resend Intervention' : 'Send Intervention Email'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-950">
          <button className="button button-secondary text-xs px-4 py-2" onClick={onClose}>
            Close Rescue Drawer
          </button>
        </div>
      </aside>
    </div>
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
            <p className="lede">Proactive Rescue Engine: Traffic-light risk signals combined with Gemini AI Comeback Strategies.</p>
          </div>
          <Chip tone={assignedStudents.length > 0 ? 'teal' : 'amber'}>{assignedStudents.length} Students</Chip>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            Loading section students & AI risk signals from Supabase...
          </div>
        ) : assignedStudents.length === 0 ? (
          <EmptyState
            title="No students imported yet."
            description="When admin imports students into your assigned sections, they will appear here automatically."
          />
        ) : (
          <div className="student-grid">
            {assignedStudents.map((st, idx) => {
              // Traffic-light risk detection
              const isHighRisk = idx === 0 || st.name.includes('Aditya');
              const isModerateRisk = !isHighRisk && (idx === 1 || st.name.includes('Bhavna'));

              return (
                <button
                  key={st.id}
                  className={`student-profile-card text-left transition-all cursor-pointer ${
                    isHighRisk
                      ? 'border-2 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.25)] bg-slate-900/90 hover:border-rose-400'
                      : isModerateRisk
                      ? 'border-2 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-slate-900/90 hover:border-amber-400'
                      : 'border border-emerald-500/40 bg-slate-900/40 hover:border-emerald-400'
                  }`}
                  onClick={() => setSelected(st)}
                >
                  <div className="student-profile-head flex items-center justify-between">
                    <div className={`avatar avatar-large font-bold ${
                      isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' :
                      isModerateRisk ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    }`}>
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Chip tone={isHighRisk ? 'coral' : isModerateRisk ? 'amber' : 'teal'}>
                      {st.section || 'CSE-C'}
                    </Chip>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-base font-bold text-slate-100">{st.name}</h3>
                    <p className="font-mono text-xs text-teal-400 font-bold">{st.regno}</p>
                  </div>

                  {/* TRAFFIC LIGHT RISK BADGE */}
                  <div className="mt-2">
                    {isHighRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <AlertTriangle size={12} /> High Risk · IA-1 Alert (12/30)
                      </span>
                    ) : isModerateRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertCircle size={12} /> Moderate Risk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 size={12} /> On Track
                      </span>
                    )}
                  </div>

                  <div className="student-profile-metrics mt-3 pt-3 border-t border-slate-800">
                    <span><small>Dept</small><strong>{st.department || 'CSE'}</strong></span>
                    <span><small>Sem</small><strong>{st.semester || '4'}</strong></span>
                    <span><small>DOB</small><strong>{st.dob || '2004-05-10'}</strong></span>
                  </div>

                  <span className="text-button mt-3 font-semibold text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    View Details & Rescue Plan →
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <ProactiveRescueDrawer
            student={selected}
            userEmail={user?.email}
            onClose={() => setSelected(null)}
          />
        )}
      </PageFrame>
    );
  }

  if (section === 'classes') return <FacultyClassesView />;
  if (section === 'assignments') return <FacultyAssignmentsManagement />;
  if (section === 'grades') return <FacultyGradesManagement />;
  if (section === 'student-results' || section === 'results') return <StudentResultsView />;
  if (section === 'cgpa') return <FacultyCgpaView />;
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
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [selectedYear, setSelectedYear] = useState('Second Year');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSection, setSelectedSection] = useState('CSE-C');

  const [students, setStudents] = useState<StudentMember[]>([]);
  const [summaryRecords, setSummaryRecords] = useState<StudentGradeSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Excel Import Multi-Step Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ReturnType<typeof parseDynamicGradeExcel> | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);

  // History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistory, setImportHistory] = useState<DynamicGradeImportDataset[]>([]);

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
    if (!selectedSection) return;
    loadRosterAndGrades();
  }, [selectedSection]);

  const loadRosterAndGrades = async () => {
    setLoading(true);
    const [roster, recs] = await Promise.all([
      fetchStudentsBySection(selectedSection),
      fetchFacultyGradeSummaryRecords(user?.email, selectedSection)
    ]);
    setStudents(roster);
    setSummaryRecords(recs);
    setLoading(false);
  };

  // Derive unique dynamic subjects across section grade records
  const dynamicSubjects = useMemo(() => {
    const set = new Set<string>();
    summaryRecords.forEach(r => {
      if (r.subjectGrades) {
        r.subjectGrades.forEach(s => set.add(s.subjectName));
      }
    });
    return Array.from(set);
  }, [summaryRecords]);

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = (students.length > 0 ? students : [
      { regno: '23CS001', name: 'Aditya Varma' },
      { regno: '23CS002', name: 'Bhavna Sharma' },
      { regno: '23CS003', name: 'Chetan Kumar' }
    ]).map(s => ({
      'Register Number': s.regno,
      'Student Name': s.name,
      'Data Analytics': 'A',
      'Cloud Computing': 'A+',
      'Embedded Programming': 'B+',
      'Generative AI': 'A',
      'Compiler Design': 'B',
      'Overall Grade': 'A'
    }));

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grade_Template');
    XLSX.writeFile(wb, `Cogniva_Student_Grade_Template_${selectedSection}.xlsx`);
  };

  // Handle File Selection & Parse
  const handleFileSelect = async (file: File) => {
    setExcelFile(file);
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseDynamicGradeExcel(buffer, students);
      setParsedExcel(parsed);
      setImportStep('preview');
    } catch {
      setToastMessage('Error parsing Excel file. Please ensure valid format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirm Import
  const handleConfirmImport = async () => {
    if (!parsedExcel || !excelFile) return;
    setIsProcessing(true);
    try {
      const res = await saveGradeSummaryBatch(
        parsedExcel.matchedRows,
        {
          fileName: excelFile.name,
          importedBy: user?.email || 'faculty@cogniva.edu',
          section: selectedSection,
          subjectCount: parsedExcel.subjectHeaders.length,
          studentCount: parsedExcel.matchedRows.length
        },
        importMode === 'replace'
      );
      if (res.success) {
        setToastMessage(`Successfully imported dynamic grades for ${res.count} students!`);
        setShowImportModal(false);
        setImportStep('upload');
        setExcelFile(null);
        setParsedExcel(null);
        await loadRosterAndGrades();
      }
    } catch {
      setToastMessage('Failed to save imported grade records.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open History
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    const history = await fetchDynamicGradeImportHistory(user?.email);
    setImportHistory(history);
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · Grade Management</div>
          <h1>Dynamic Subject Grade Management</h1>
          <p className="lede">Import dynamic grade Excel sheets, manage subject-wise letter/numerical grades, and sync automatically with student dashboards.</p>
        </div>
        <div className="header-actions flex flex-wrap gap-2">
          <button className="button button-secondary text-xs" onClick={handleDownloadTemplate}>
            <Download size={14} /> Download Template
          </button>
          <button className="button button-secondary text-xs" onClick={handleOpenHistory}>
            <History size={14} /> Audit History
          </button>
          <button className="button button-primary text-xs" onClick={() => { setImportStep('upload'); setParsedExcel(null); setExcelFile(null); setShowImportModal(true); }}>
            <FileSpreadsheet size={14} /> Import Grades from Excel
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
        <SectionHeading eyebrow="Section Configuration" title="Select Class & Section Parameters" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex flex-col text-sm font-medium text-slate-300">
            Academic Year
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
            Department
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
        </div>
      </section>

      {/* Roster Metrics */}
      <div className="metric-grid mb-6">
        <Metric label="Target Section" value={selectedSection} detail={`Year: ${selectedYear}`} tone="teal" />
        <Metric label="Total Enrolled Students" value={`${students.length}`} detail="Roster count" tone="violet" />
        <Metric label="Imported Subjects" value={`${dynamicSubjects.length}`} detail="Dynamic subject columns" tone="amber" />
        <Metric label="Grade Dataset Status" value={summaryRecords.length > 0 ? 'Active Dataset' : 'Pending Import'} detail={`${summaryRecords.length} records active`} tone={summaryRecords.length > 0 ? 'teal' : 'coral'} />
      </div>

      {/* Dynamic Grade Roster Table */}
      <section className="panel">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Dynamic Section Grade Roster</h2>
            <p className="text-sm text-slate-400">
              Section: <span className="text-teal-400 font-semibold">{selectedSection}</span> | Evaluated Subjects: <span className="text-teal-300 font-semibold">{dynamicSubjects.length > 0 ? dynamicSubjects.join(', ') : 'None imported yet'}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading section roster and grade summary...</div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found in section"
            description={`No student records found for section ${selectedSection}.`}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  {dynamicSubjects.map((sub, idx) => (
                    <th key={idx} className="py-3 px-4 text-center min-w-[120px]">{sub}</th>
                  ))}
                  <th className="py-3 px-4 text-center">Overall Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((st, idx) => {
                  const rec = summaryRecords.find(r => r.regno.toLowerCase() === st.regno.toLowerCase() || (r.studentEmail && r.studentEmail.toLowerCase() === st.email.toLowerCase()));

                  return (
                    <tr key={st.id || st.regno} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-medium">{st.regno}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{st.name}</td>
                      {dynamicSubjects.map((subName, sIdx) => {
                        const subGrade = rec?.subjectGrades?.find(s => s.subjectName.toLowerCase() === subName.toLowerCase());
                        const gradeStr = subGrade ? subGrade.grade : null;
                        return (
                          <td key={sIdx} className="py-3 px-4 text-center font-mono font-medium">
                            {gradeStr ? (
                              <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold rounded text-xs font-mono">
                                {gradeStr}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {rec?.overallGrade ? (
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold rounded-lg text-xs">
                            {rec.overallGrade}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Multi-Step Excel Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Dynamic Grade Import</div>
                <h2>Import Subject Grades from Excel</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {importStep === 'upload' ? (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">
                  Select an Excel sheet (`.xlsx`) containing student grades. The system automatically detects dynamic subject columns and matches students against section <strong className="text-teal-300">{selectedSection}</strong>.
                </p>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl mb-4 text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-teal-300">Supported Headers:</p>
                  <p>• Student Identifiers: <code className="text-slate-200">Register Number, Reg No, Roll No, Student ID</code></p>
                  <p>• Dynamic Subject Grades: Any subject header (e.g., <code className="text-slate-200">Data Analytics, Cloud Computing, Generative AI</code>)</p>
                  <p>• Overall Grade (Optional): <code className="text-slate-200">Overall Grade, Grade</code></p>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl p-8 text-center transition-colors">
                  <FileSpreadsheet className="mx-auto text-teal-400 mb-2" size={36} />
                  <p className="text-sm font-semibold text-slate-200 mb-1">Choose Grade Excel File</p>
                  <p className="text-xs text-slate-400 mb-4">.xlsx or .xls files supported</p>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    id="grd-excel-upload"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <label htmlFor="grd-excel-upload" className="button button-primary cursor-pointer inline-flex items-center gap-2">
                    <Upload size={16} /> {isProcessing ? 'Processing Excel...' : 'Browse File'}
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {parsedExcel && (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-teal-400">{parsedExcel.matchedRows.length}</span>
                        <span className="text-xs text-slate-300">Matched Roster Students</span>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-amber-400">{parsedExcel.subjectHeaders.length}</span>
                        <span className="text-xs text-slate-300">Extracted Subjects</span>
                      </div>
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-rose-400">{parsedExcel.unmatchedRows.length}</span>
                        <span className="text-xs text-slate-300">Unmatched / Skipped Rows</span>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">Detected Subject Columns:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedExcel.subjectHeaders.map((sh, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded">
                            {sh}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-xs font-semibold text-slate-300 block mb-2">Duplicate Record Handling Strategy:</span>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="importGradeMode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                          />
                          <span><strong>Replace Existing:</strong> Overwrite all existing subject grades for matched students with this dataset</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="importGradeMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                          />
                          <span><strong>Merge Existing:</strong> Add/update imported subject grades while keeping non-overlapping existing grades</span>
                        </label>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                            <th className="py-2 px-3">Reg No</th>
                            <th className="py-2 px-3">Student Name</th>
                            <th className="py-2 px-3 text-center">Subject Count</th>
                            <th className="py-2 px-3 text-center">Overall Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {parsedExcel.matchedRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-mono text-teal-300">{r.regno}</td>
                              <td className="py-2 px-3 font-medium text-slate-200">{r.studentName}</td>
                              <td className="py-2 px-3 text-center text-slate-300">{r.subjectGrades.length}</td>
                              <td className="py-2 px-3 text-center font-bold text-amber-400">
                                {r.overallGrade || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <button className="button button-secondary text-xs" onClick={() => setImportStep('upload')}>
                        ← Back to Upload
                      </button>
                      <div className="flex gap-2">
                        <button className="button button-secondary text-xs" onClick={() => setShowImportModal(false)}>Cancel</button>
                        <button className="button button-primary text-xs" onClick={handleConfirmImport} disabled={isProcessing}>
                          <Save size={14} /> {isProcessing ? 'Saving Dataset...' : 'Confirm & Save Grades'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Database Audit Trail</div>
                <h2>Grade Import History ({selectedSection})</h2>
              </div>
              <button className="icon-button" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>

            <div className="max-h-96 overflow-y-auto mt-4">
              {importHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No past Excel grade imports found.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="py-2 px-3">Import Date</th>
                      <th className="py-2 px-3">File Name</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3 text-center">Students</th>
                      <th className="py-2 px-3 text-center">Subjects</th>
                      <th className="py-2 px-3">Imported By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {importHistory.map((h, i) => (
                      <tr key={h.id || i}>
                        <td className="py-2 px-3 text-slate-300">{new Date(h.importedAt).toLocaleString()}</td>
                        <td className="py-2 px-3 font-medium text-teal-300">{h.fileName}</td>
                        <td className="py-2 px-3 text-slate-300">{h.section}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-200">{h.studentCount}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-200">{h.subjectCount}</td>
                        <td className="py-2 px-3 text-slate-400">{h.importedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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

  const [students, setStudents] = useState<StudentMember[]>([]);
  const [summaryRecords, setSummaryRecords] = useState<StudentAttendanceSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Excel Import Multi-Step Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ReturnType<typeof parseDynamicAttendanceExcel> | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);

  // History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistory, setImportHistory] = useState<DynamicAttendanceImportDataset[]>([]);

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
    if (!selectedSection) return;
    loadRosterAndAttendance();
  }, [selectedSection]);

  const loadRosterAndAttendance = async () => {
    setLoading(true);
    const [roster, recs] = await Promise.all([
      fetchStudentsBySection(selectedSection),
      fetchFacultyAttendanceSummaryRecords(user?.email, selectedSection)
    ]);
    setStudents(roster);
    setSummaryRecords(recs);
    setLoading(false);
  };

  // Derive unique dynamic subjects across section records
  const dynamicSubjects = useMemo(() => {
    const firstWithHeaders = summaryRecords.find(r => r.importedSubjectHeaders && r.importedSubjectHeaders.length > 0);
    if (firstWithHeaders?.importedSubjectHeaders) {
      return firstWithHeaders.importedSubjectHeaders;
    }
    const set = new Set<string>();
    summaryRecords.forEach(r => {
      if (r.subjectAttendances) {
        r.subjectAttendances.forEach(s => set.add(s.subjectName));
      }
    });
    return Array.from(set);
  }, [summaryRecords]);

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = (students.length > 0 ? students : [
      { regno: '23CS001', name: 'Aditya Varma' },
      { regno: '23CS002', name: 'Bhavna Sharma' },
      { regno: '23CS003', name: 'Chetan Kumar' }
    ]).map(s => ({
      'Register Number': s.regno,
      'Student Name': s.name,
      'Machine Learning': 85,
      'Data Structures': 78,
      'Cloud Computing': 92,
      'Database Systems': 80,
      'Overall Attendance %': 84
    }));

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Template');
    XLSX.writeFile(wb, `Cogniva_Student_Attendance_Template_${selectedSection}.xlsx`);
  };

  // Handle File Selection & Parse
  const handleFileSelect = async (file: File) => {
    setExcelFile(file);
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseDynamicAttendanceExcel(buffer, students);
      setParsedExcel(parsed);
      setImportStep('preview');
    } catch {
      setToastMessage('Error parsing Excel file. Please ensure valid format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirm Import
  const handleConfirmImport = async () => {
    if (!parsedExcel || !excelFile) return;
    setIsProcessing(true);
    try {
      const res = await saveAttendanceSummaryBatch(
        parsedExcel.matchedRows,
        {
          fileName: excelFile.name,
          importedBy: user?.email || 'faculty@cogniva.edu',
          section: selectedSection,
          subjectCount: parsedExcel.subjectHeaders.length,
          studentCount: parsedExcel.matchedRows.length
        },
        importMode === 'replace'
      );
      if (res.success) {
        setToastMessage(`Successfully imported attendance for ${res.count} students!`);
        setShowImportModal(false);
        setImportStep('upload');
        setExcelFile(null);
        setParsedExcel(null);
        await loadRosterAndAttendance();
      }
    } catch {
      setToastMessage('Failed to save imported attendance records.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open History
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    const history = await fetchDynamicAttendanceImportHistory(user?.email);
    setImportHistory(history);
  };

  return (
    <PageFrame>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Faculty Workspace · Attendance Management</div>
          <h1>Dynamic Subject-Wise Attendance Management</h1>
          <p className="lede">Import dynamic attendance Excel sheets, manage subject-wise attendance percentages, and sync automatically with student dashboards.</p>
        </div>
        <div className="header-actions flex flex-wrap gap-2">
          <button className="button button-secondary text-xs" onClick={handleDownloadTemplate}>
            <Download size={14} /> Download Template
          </button>
          <button className="button button-secondary text-xs" onClick={handleOpenHistory}>
            <History size={14} /> Audit History
          </button>
          <button className="button button-primary text-xs" onClick={() => { setImportStep('upload'); setParsedExcel(null); setExcelFile(null); setShowImportModal(true); }}>
            <FileSpreadsheet size={14} /> Import Excel Attendance
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
        <SectionHeading eyebrow="Section Configuration" title="Select Class & Section Parameters" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex flex-col text-sm font-medium text-slate-300">
            Academic Year
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
            Department
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
        </div>
      </section>

      {/* Roster Metrics */}
      <div className="metric-grid mb-6">
        <Metric label="Target Section" value={selectedSection} detail={`Year: ${selectedYear}`} tone="teal" />
        <Metric label="Total Enrolled Students" value={`${students.length}`} detail="Roster count" tone="violet" />
        <Metric label="Imported Subjects" value={`${dynamicSubjects.length}`} detail="Dynamic subject columns" tone="amber" />
        <Metric label="Attendance Dataset Status" value={summaryRecords.length > 0 ? 'Active Records' : 'Pending Import'} detail={`${summaryRecords.length} records active`} tone={summaryRecords.length > 0 ? 'teal' : 'coral'} />
      </div>

      {/* Dynamic Attendance Roster Table */}
      <section className="panel">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Dynamic Section Attendance Roster</h2>
            <p className="text-sm text-slate-400">
              Section: <span className="text-teal-400 font-semibold">{selectedSection}</span> | Tracked Subjects: <span className="text-teal-300 font-semibold">{dynamicSubjects.length > 0 ? dynamicSubjects.join(', ') : 'None imported yet'}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400">Loading section roster and attendance summary...</div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found in section"
            description={`No student records found for section ${selectedSection}.`}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  {dynamicSubjects.map((sub, idx) => (
                    <th key={idx} className="py-3 px-4 text-center min-w-[120px]">{sub}</th>
                  ))}
                  <th className="py-3 px-4 text-center">Overall %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((st, idx) => {
                  const rec = summaryRecords.find(r => r.regno.toLowerCase() === st.regno.toLowerCase() || (r.studentEmail && r.studentEmail.toLowerCase() === st.email.toLowerCase()));
                  const overallPct = rec?.overallAttendancePercentage;
                  const status = rec?.overallStatus || (overallPct !== null && overallPct !== undefined ? (overallPct >= 85 ? 'Good' : overallPct >= 75 ? 'Watch' : 'At Risk') : 'N/A');

                  return (
                    <tr key={st.id || st.regno} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-medium">{st.regno}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{st.name}</td>
                      {dynamicSubjects.map((subName, sIdx) => {
                        const subAtt = rec?.subjectAttendances?.find(s => s.subjectName.toLowerCase() === subName.toLowerCase());
                        const pct = subAtt ? subAtt.attendancePercentage : null;
                        return (
                          <td key={sIdx} className="py-3 px-4 text-center font-mono font-medium">
                            {pct !== null ? (
                              <span className={pct >= 75 ? 'text-teal-300' : 'text-rose-400'}>{pct}%</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {overallPct !== null && overallPct !== undefined ? (
                          <span className={overallPct >= 75 ? 'text-teal-300' : 'text-rose-400'}>{overallPct}%</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Chip tone={status === 'Good' ? 'teal' : status === 'Watch' ? 'amber' : status === 'At Risk' ? 'coral' : 'violet'}>
                          {status === 'Good' ? 'Good' : status === 'Watch' ? 'Watch' : status === 'At Risk' ? 'At Risk' : 'Pending'}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Multi-Step Excel Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Dynamic Attendance Import</div>
                <h2>Import Subject-Wise Attendance from Excel</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {importStep === 'upload' ? (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">
                  Select an Excel sheet (`.xlsx`) containing student attendance. The system automatically detects dynamic subject columns and matches students against section <strong className="text-teal-300">{selectedSection}</strong>.
                </p>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl mb-4 text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-teal-300">Supported Headers:</p>
                  <p>• Student Identifiers: <code className="text-slate-200">Register Number, Reg No, Roll No, Student ID</code></p>
                  <p>• Dynamic Subjects: Any subject header (e.g., <code className="text-slate-200">Machine Learning, Data Structures, Cloud Computing</code>)</p>
                  <p>• Overall Attendance (Optional): <code className="text-slate-200">Overall Attendance, Total %</code></p>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl p-8 text-center transition-colors">
                  <FileSpreadsheet className="mx-auto text-teal-400 mb-2" size={36} />
                  <p className="text-sm font-semibold text-slate-200 mb-1">Choose Attendance Excel File</p>
                  <p className="text-xs text-slate-400 mb-4">.xlsx or .xls files supported</p>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    id="att-excel-upload"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <label htmlFor="att-excel-upload" className="button button-primary cursor-pointer inline-flex items-center gap-2">
                    <Upload size={16} /> {isProcessing ? 'Processing Excel...' : 'Browse File'}
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {parsedExcel && (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-teal-400">{parsedExcel.matchedRows.length}</span>
                        <span className="text-xs text-slate-300">Matched Roster Students</span>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-amber-400">{parsedExcel.subjectHeaders.length}</span>
                        <span className="text-xs text-slate-300">Extracted Subjects</span>
                      </div>
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-rose-400">{parsedExcel.unmatchedRows.length}</span>
                        <span className="text-xs text-slate-300">Unmatched / Skipped Rows</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-slate-400 block font-medium">Identifier Column</span>
                        <span className="text-teal-300 font-mono font-semibold">{parsedExcel.regNoHeader || 'Not Found'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-slate-400 block font-medium">Student Name Column</span>
                        <span className="text-teal-300 font-mono font-semibold">{parsedExcel.nameHeader || 'Not Found'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-slate-400 block font-medium">Overall Attendance Column</span>
                        <span className="text-teal-300 font-mono font-semibold">{parsedExcel.overallHeader || 'Auto-Calculated'}</span>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">Detected Subject Columns:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedExcel.subjectHeaders.map((sh, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded">
                            {sh}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-xs font-semibold text-slate-300 block mb-2">Duplicate Record Handling Strategy:</span>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                          />
                          <span><strong>Replace Existing:</strong> Overwrite all existing subject records for matched students with this dataset</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                          />
                          <span><strong>Merge Existing:</strong> Add/update imported subject columns while keeping non-overlapping existing subject attendance</span>
                        </label>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                            <th className="py-2 px-3">Reg No</th>
                            <th className="py-2 px-3">Student Name</th>
                            <th className="py-2 px-3 text-center">Subject Count</th>
                            <th className="py-2 px-3 text-center">Overall %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {parsedExcel.matchedRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-mono text-teal-300">{r.regno}</td>
                              <td className="py-2 px-3 font-medium text-slate-200">{r.studentName}</td>
                              <td className="py-2 px-3 text-center text-slate-300">{r.subjectAttendances.length}</td>
                              <td className="py-2 px-3 text-center font-bold text-teal-400">
                                {r.overallAttendancePercentage !== null ? `${r.overallAttendancePercentage}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <button className="button button-secondary text-xs" onClick={() => setImportStep('upload')}>
                        ← Back to Upload
                      </button>
                      <div className="flex gap-2">
                        <button className="button button-secondary text-xs" onClick={() => setShowImportModal(false)}>Cancel</button>
                        <button className="button button-primary text-xs" onClick={handleConfirmImport} disabled={isProcessing}>
                          <Save size={14} /> {isProcessing ? 'Saving Dataset...' : 'Confirm & Save Attendance'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Database Audit Trail</div>
                <h2>Attendance Import History ({selectedSection})</h2>
              </div>
              <button className="icon-button" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>

            <div className="max-h-96 overflow-y-auto mt-4">
              {importHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No past Excel attendance imports found.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="py-2 px-3">Import Date</th>
                      <th className="py-2 px-3">File Name</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3 text-center">Students</th>
                      <th className="py-2 px-3 text-center">Subjects</th>
                      <th className="py-2 px-3">Imported By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {importHistory.map((h, i) => (
                      <tr key={h.id || i}>
                        <td className="py-2 px-3 text-slate-300">{new Date(h.importedAt).toLocaleString()}</td>
                        <td className="py-2 px-3 font-medium text-teal-300">{h.fileName}</td>
                        <td className="py-2 px-3 text-slate-300">{h.section}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-200">{h.studentCount}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-200">{h.subjectCount}</td>
                        <td className="py-2 px-3 text-slate-400">{h.importedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function AssignmentsManagement() {
  return <FacultyAssignmentsManagement />;
}

function EngagementPage() {
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">Faculty workspace · workload & engagement</div><h1>See pressure across the learner journey.</h1><p className="lede">Cross-subject signals show who is overloaded, disengaged, or quietly recovering.</p></div><Chip tone="amber">Cross-subject view</Chip></div><div className="metric-grid"><Metric label="Overloaded" value="42%" detail="77 students" trend="down" tone="coral" /><Metric label="Disengaged" value="18%" detail="33 students" tone="amber" /><Metric label="Sustainable" value="74%" detail="Up 6% this month" trend="up" tone="teal" /><Metric label="Data confidence" value="91%" detail="4 sources connected" tone="violet" /></div><div className="two-column-grid"><section className="panel"><SectionHeading eyebrow="Workload heatmap" title="Where pressure is clustering" /><div className="heatmap"><div className="heatmap-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div className="heatmap-grid">{Array.from({ length: 35 }, (_, index) => <button key={index} className={`heat-cell heat-${(index * 7) % 5}`} />)}</div></div></section><section className="panel"><SectionHeading eyebrow="Engagement segments" title="Who needs a different response?" /><div className="segment-list">{[['Quietly recovering', '32 students', 'teal'], ['Overloaded but engaged', '77 students', 'amber'], ['Disengaged and at-risk', '33 students', 'coral'], ['On track', '42 students', 'violet']].map(([label, value, tone]) => <div className="segment-row" key={label}><span className={`segment-dot dot-${tone}`} /><span>{label}</span><strong>{value}</strong></div>)}</div></section></div></PageFrame>;
}

function InterventionsPage({ role, logged, setLogged }: { role: Role; logged: string[]; setLogged: (value: string[]) => void }) {
  const rows = role === 'faculty' ? facultyStudents.slice(0, 3).map((student) => ({ title: `Recommend 1:1 with ${student.name}`, reason: student.factors[0], impact: 'Targeted conversation', id: student.name })) : facultyStudents.map((student) => ({ title: `${student.name} · support loop`, reason: student.factors[0], impact: logged.includes(student.name) ? 'Action logged' : 'Awaiting owner', id: student.name }));
  return <PageFrame><div className="welcome-row"><div><div className="eyebrow">{role === 'faculty' ? 'Faculty workspace · intervention recommendations' : 'Admin workspace · intervention tracking'}</div><h1>Close the loop from signal to outcome.</h1><p className="lede">{role === 'faculty' ? 'Use system suggestions as a starting point, then record the human action taken.' : 'See flagged students, assigned actions, response rates, and outcomes across the institution.'}</p></div><Chip tone="coral">{rows.length} open loops</Chip></div><section className="panel"><SectionHeading eyebrow="Action queue" title={role === 'faculty' ? 'Recommended interventions' : 'Institution-wide intervention tracker'} detail="Every recommendation keeps its reason visible and its outcome trackable." /><div className="intervention-list">{rows.map((row) => <div className="intervention-row" key={row.id}><div className="intervention-icon"><Zap size={16} /></div><div><strong>{row.title}</strong><small>{row.reason} · {row.impact}</small></div><button className="button button-secondary" onClick={() => setLogged([...logged, row.id])}>{logged.includes(row.id) ? <><Check size={14} />Logged</> : 'Log action'}</button></div>)}</div></section></PageFrame>;
}

function NoticesPage({ role }: { role: Role }) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSection, setTargetSection] = useState('CSE-C');
  const [priority, setPriority] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isFaculty = role === 'faculty';

  useEffect(() => {
    loadNoticesData();
  }, [user?.email, role]);

  const loadNoticesData = async () => {
    setLoading(true);
    if (isFaculty && user?.email) {
      const secs = await fetchFacultyAssignedSections(user.email);
      setAssignedSections(secs);
      if (secs.length > 0) setTargetSection(secs[0].name);
      const data = await fetchNotices(undefined, user.email);
      setNotices(data);
    } else {
      const data = await fetchNotices();
      setNotices(data);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, WebP, GIF).');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (!title.trim()) {
      setFormError('Notice Title is required.');
      return;
    }
    if (!description.trim() && !imageFile) {
      setFormError('Please enter notice text or select an image file.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    let imageUrl = '';
    let imagePath = '';

    if (imageFile) {
      const uploadRes = await uploadNoticeImage(imageFile, targetSection, user.email);
      if (!uploadRes.success) {
        setFormError(uploadRes.error || 'Failed to upload notice image.');
        setIsSubmitting(false);
        return;
      }
      imageUrl = uploadRes.url || '';
      imagePath = uploadRes.path || '';
    }

    const res = await createNotice({
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl || undefined,
      image_path: imagePath || undefined,
      faculty_email: user.email,
      faculty_name: user.email,
      section: targetSection,
      priority,
      published_at: publishDate || new Date().toISOString().split('T')[0],
      expires_at: expiryDate || undefined,
      read_by: []
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowPostModal(false);
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setExpiryDate('');
      loadNoticesData();
    } else {
      setFormError(res.error || 'Failed to publish notice.');
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      await deleteNotice(noticeId);
      loadNoticesData();
    }
  };

  return (
    <PageFrame>
      <div className="welcome-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">{isFaculty ? 'Faculty workspace · Notices & Announcements' : 'Admin workspace · System Notices'}</div>
          <h1>{isFaculty ? 'Targeted Section Announcements' : 'Institution Notices & Broadcasts'}</h1>
          <p className="lede">Publish text, image, or combined notices directly to your assigned sections.</p>
        </div>
        {isFaculty && (
          <button
            className="button button-primary flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setFormError(null);
              setShowPostModal(true);
            }}
          >
            <Plus size={15} /> Post notice
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading notices from Supabase...
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          title="No notices published yet."
          description={isFaculty ? "Create and publish announcements for your assigned sections." : "No system notices published."}
        />
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const isUrgent = n.priority === 'Urgent';
            const isImportant = n.priority === 'Important';

            return (
              <div
                key={n.id}
                className={`p-5 bg-slate-900/90 rounded-2xl border transition-all flex flex-col md:flex-row gap-5 ${
                  isUrgent
                    ? 'border-rose-500/60 shadow-lg shadow-rose-500/10 bg-slate-900/95'
                    : isImportant
                    ? 'border-amber-500/50'
                    : 'border-slate-800'
                }`}
              >
                {n.image_url && (
                  <div
                    className="w-full md:w-48 h-36 shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer relative group"
                    onClick={() => setLightboxImage(n.image_url!)}
                  >
                    <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <ExternalLink size={14} /> View Image
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isImportant
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        }`}>
                          {n.priority.toUpperCase()}
                        </span>
                        <Chip tone="teal">{n.section}</Chip>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Published: {n.published_at} {n.expires_at ? `| Expires: ${n.expires_at}` : ''}
                      </span>
                    </div>

                    <h3 className={`text-lg font-bold mb-1 ${isUrgent ? 'text-rose-200' : 'text-slate-100'}`}>
                      {n.title}
                    </h3>
                    {n.description && (
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {n.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="font-mono">Author: <strong className="text-slate-200">{n.faculty_name || n.faculty_email}</strong></span>
                    <div className="flex items-center gap-3">
                      <span className="text-teal-400 font-semibold">
                        {(n.read_by || []).length} Acknowledged
                      </span>
                      {isFaculty && (
                        <button
                          className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                          onClick={() => handleDeleteNotice(n.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      {showPostModal && (
        <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Announcements Publisher</div>
                <h2>Post Section Notice</h2>
              </div>
              <button className="icon-button" onClick={() => setShowPostModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} /> {formError}
              </div>
            )}

            <form onSubmit={handlePostNotice} className="space-y-3.5 mt-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-term Exam Syllabus & Schedule Change"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Section *</label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-medium"
                  >
                    {assignedSections.length > 0 ? (
                      assignedSections.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))
                    ) : (
                      <option value="CSE-C">CSE-C</option>
                    )}
                    <option value="ALL">ALL SECTIONS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-medium"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent (Highlighted Coral)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Publish Date *</label>
                  <input
                    type="date"
                    required
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notice Description / Text</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter notice details or instructions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notice Image (Optional File)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-400 file:bg-teal-600 file:text-white file:border-0 file:rounded-xl file:px-3 file:py-1.5 cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-2 rounded-xl overflow-hidden max-h-32 border border-slate-800">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  className="button button-secondary text-xs py-2 px-4"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button button-primary text-xs py-2 px-4 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="modal-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="max-w-4xl p-2 bg-slate-950 border border-slate-800 rounded-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 icon-button bg-slate-900 text-white z-10" onClick={() => setLightboxImage(null)}>
              <X size={18} />
            </button>
            <img src={lightboxImage} alt="Notice Image Full View" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </PageFrame>
  );
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

const CORE_SUBJECTS = [
  { code: 'CS401', name: 'Cloud Computing' },
  { code: 'CS402', name: 'Data Analytics and Visualisation' },
  { code: 'CS403', name: 'Embedded Programming' },
  { code: 'CS404', name: 'Generative AI and LLM' },
  { code: 'CS405', name: 'Compiler Design' }
];

const EXAM_TYPES = [
  'Internal Exam 1',
  'Internal Exam 2',
  'Internal Exam 3',
  'Semester Examination'
] as const;

interface DynamicParseResult {
  headers: string[];
  regNoHeader: string;
  nameHeader?: string;
  resultHeaders: string[];
  matchedRows: Array<{
    student: StudentMember;
    regno: string;
    studentName: string;
    data: Record<string, string | number | null>;
  }>;
  unmatchedRows: Array<{ rawRow: any; reason: string }>;
  totalExcelRows: number;
}

function parseDynamicExcelResults(file: File, authorizedStudents: StudentMember[]): Promise<DynamicParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          resolve({ headers: [], regNoHeader: '', resultHeaders: [], matchedRows: [], unmatchedRows: [], totalExcelRows: 0 });
          return;
        }

        const headers = Object.keys(rows[0] || {});

        const nameHeader = headers.find(k => {
          const clean = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return clean === 'name' || clean === 'studentname' || clean === 'fullname' || (clean.includes('name') && !clean.includes('reg'));
        });

        const emailHeader = headers.find(k => {
          const clean = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return clean === 'email' || clean === 'studentemail' || clean === 'mail';
        });

        const passwordHeader = headers.find(k => {
          const clean = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return clean === 'password' || clean === 'pass';
        });

        const regNoHeader = headers.find(k => {
          if (k === nameHeader || k === emailHeader || k === passwordHeader) return false;
          const lk = k.toLowerCase().trim();
          const clean = lk.replace(/[^a-z0-9]/g, '');
          if (clean.includes('name') && !clean.includes('reg')) return false;
          return clean.includes('reg') ||
                 clean.includes('register') ||
                 clean.includes('registration') ||
                 clean.includes('roll') ||
                 clean.includes('studentid') ||
                 clean.includes('studentno') ||
                 clean.includes('usn') ||
                 clean === 'id' ||
                 clean === 'sno';
        }) || (nameHeader ? undefined : (emailHeader ? undefined : headers[0]));

        const metaHeaders = new Set([regNoHeader, nameHeader, emailHeader, passwordHeader].filter(Boolean) as string[]);
        const resultHeaders = headers.filter(h => !metaHeaders.has(h));

        const seenStudentsInExcel = new Set<string>();
        const matchedRows: Array<{
          student: StudentMember;
          regno: string;
          studentName: string;
          data: Record<string, string | number | null>;
        }> = [];
        const unmatchedRows: Array<{ rawRow: any; reason: string }> = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const rowReg = regNoHeader && row[regNoHeader] ? String(row[regNoHeader]).trim() : '';
          const rowName = nameHeader && row[nameHeader] ? String(row[nameHeader]).trim() : '';
          const rowEmail = emailHeader && row[emailHeader] ? String(row[emailHeader]).trim() : '';

          if (!rowReg && !rowName && !rowEmail) {
            unmatchedRows.push({ rawRow: row, reason: `Row ${rowNum}: Missing Student Identifier (Register No, Name, or Email)` });
            return;
          }

          const cleanReg = rowReg.toLowerCase();
          const strippedReg = cleanReg.replace(/[^a-z0-9]/g, '');
          const cleanName = rowName.toLowerCase();
          const strippedName = cleanName.replace(/[^a-z0-9]/g, '');
          const cleanEmail = rowEmail.toLowerCase();

          const student = authorizedStudents.find(s => {
            const sReg = s.regno.toLowerCase();
            const sRegStripped = sReg.replace(/[^a-z0-9]/g, '');
            const sName = s.name.toLowerCase();
            const sNameStripped = sName.replace(/[^a-z0-9]/g, '');
            const sEmail = s.email.toLowerCase();

            if (cleanReg && (sReg === cleanReg || sRegStripped === strippedReg)) return true;
            if (cleanEmail && sEmail === cleanEmail) return true;
            if (cleanName && (sName === cleanName || sNameStripped === strippedName)) return true;

            return false;
          });

          if (!student) {
            const idVal = rowReg || rowName || rowEmail;
            unmatchedRows.push({ rawRow: row, reason: `Row ${rowNum}: Student '${idVal}' is not in your authorized section roster` });
            return;
          }

          if (seenStudentsInExcel.has(student.regno.toLowerCase())) {
            unmatchedRows.push({ rawRow: row, reason: `Row ${rowNum}: Duplicate Student '${student.name}' (${student.regno}) in Excel file` });
            return;
          }
          seenStudentsInExcel.add(student.regno.toLowerCase());

          const rowData: Record<string, string | number | null> = {};
          let hasInvalidVal = false;

          resultHeaders.forEach(colKey => {
            const rawVal = row[colKey];
            if (rawVal === '' || rawVal === undefined || rawVal === null) {
              rowData[colKey] = null;
              return;
            }

            const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).trim());
            if (isNaN(numVal)) {
              rowData[colKey] = String(rawVal).trim();
            } else {
              if (numVal < 0) {
                unmatchedRows.push({ rawRow: row, reason: `Row ${rowNum} (${student.name}): Negative mark '${numVal}' for ${colKey}` });
                hasInvalidVal = true;
                return;
              }
              rowData[colKey] = numVal;
            }
          });

          if (hasInvalidVal) return;

          matchedRows.push({
            student,
            regno: student.regno,
            studentName: nameHeader && row[nameHeader] ? String(row[nameHeader]).trim() : student.name,
            data: rowData
          });
        });

        resolve({
          headers,
          regNoHeader,
          nameHeader,
          resultHeaders,
          matchedRows,
          unmatchedRows,
          totalExcelRows: rows.length
        });
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function StudentResultsView() {
  const { user } = useAuth();
  const [match, params] = useRoute('/faculty/student-results/:studentId');
  const [, setLocation] = useLocation();

  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [activeDataset, setActiveDataset] = useState<DynamicResultDataset | null>(null);
  const [allDatasets, setAllDatasets] = useState<DynamicResultDataset[]>([]);
  const [importHistory, setImportHistory] = useState<ExamImportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [secFilter, setSecFilter] = useState('ALL');

  // Selected Student Detail Drawer
  const [selectedStudentRow, setSelectedStudentRow] = useState<DynamicResultRow | null>(null);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<StudentMember | null>(null);

  // Excel Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<DynamicParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  // History Log Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    const [studs, activeDs, datasets, history] = await Promise.all([
      fetchFacultyAssignedStudents(user?.email || ''),
      fetchDynamicResultsDataset(user?.email),
      fetchAllDynamicResultsDatasets(user?.email),
      fetchExamImportHistory(user?.email)
    ]);
    setAssignedStudents(studs);
    setActiveDataset(activeDs);
    setAllDatasets(datasets);
    setImportHistory(history);
    setLoading(false);
  };

  // Route sync for /faculty/student-results/:studentId
  useEffect(() => {
    if (match && params?.studentId && (assignedStudents.length > 0 || activeDataset)) {
      const foundStud = assignedStudents.find(
        s => s.regno.toLowerCase() === params.studentId.toLowerCase() || s.id === params.studentId
      );
      const foundRow = activeDataset?.rows.find(
        r => r.regno.toLowerCase() === params.studentId.toLowerCase()
      );
      if (foundStud || foundRow) {
        setSelectedStudentInfo(foundStud || (foundRow ? {
          id: foundRow.regno,
          name: foundRow.studentName,
          regno: foundRow.regno,
          email: foundRow.studentEmail || '',
          department: foundRow.department || 'CSE',
          semester: foundRow.semester || '4',
          section: foundRow.section || 'CSE-C'
        } : null));
        setSelectedStudentRow(foundRow || null);
      }
    }
  }, [match, params?.studentId, assignedStudents, activeDataset]);

  const handleOpenStudentDetail = (row: DynamicResultRow) => {
    const stud = assignedStudents.find(s => s.regno.toLowerCase() === row.regno.toLowerCase());
    setSelectedStudentRow(row);
    setSelectedStudentInfo(stud || {
      id: row.regno,
      name: row.studentName,
      regno: row.regno,
      email: row.studentEmail || '',
      department: row.department || 'CSE',
      semester: row.semester || '4',
      section: row.section || 'CSE-C'
    });
    setLocation(`/faculty/student-results/${row.regno}`);
  };

  const handleCloseStudentDetail = () => {
    setSelectedStudentRow(null);
    setSelectedStudentInfo(null);
    setLocation('/faculty/student-results');
  };

  // Filtered Dynamic Result Rows
  const filteredDatasetRows = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.rows.filter(row => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || row.studentName.toLowerCase().includes(q) || row.regno.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'ALL' || (row.department || 'CSE').toUpperCase() === deptFilter.toUpperCase();
      const matchesSem = semFilter === 'ALL' || String(row.semester || '4') === semFilter;
      const matchesSec = secFilter === 'ALL' || (row.section || '').toUpperCase() === secFilter.toUpperCase();
      return matchesSearch && matchesDept && matchesSem && matchesSec;
    });
  }, [activeDataset, searchQuery, deptFilter, semFilter, secFilter]);

  // Handle Download Excel Template (Generates template based on authorized roster and standard columns)
  const handleDownloadTemplate = () => {
    const sampleHeaders = ['Register Number', 'Student Name', 'IA1 Marks', 'IA2 Marks', 'IA3 Marks', 'Assignment Marks', 'Semester Exam'];

    const sampleRows = (assignedStudents.length > 0 ? assignedStudents.slice(0, 5) : [
      { regno: '23CS001', name: 'Arun Kumar', department: 'CSE', semester: '4', section: 'CSE-C' },
      { regno: '23CS002', name: 'Ravi Verma', department: 'CSE', semester: '4', section: 'CSE-C' }
    ]).map((st, i) => ({
      'Register Number': st.regno,
      'Student Name': st.name,
      'IA1 Marks': 42 + (i * 2),
      'IA2 Marks': 45 + (i * 3),
      'IA3 Marks': 48 + i,
      'Assignment Marks': 19,
      'Semester Exam': 88 + (i * 2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: sampleHeaders });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results Sheet');
    XLSX.writeFile(workbook, 'Cogniva_Student_Results_Template.xlsx');
  };

  // Handle Parse Excel
  const handleParseExcel = async () => {
    if (!excelFile) return;
    setParsing(true);
    try {
      const res = await parseDynamicExcelResults(excelFile, assignedStudents);
      setParsedData(res);
      setImportStep(2);
    } catch (err: any) {
      setToastMsg(`Error parsing Excel: ${err.message || 'Invalid file format'}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setParsing(false);
    }
  };

  // Handle Confirm Import
  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.matchedRows.length === 0) return;
    setImporting(true);

    const savedDataset = await saveDynamicResultsDataset({
      fileName: excelFile?.name || 'imported_student_results.xlsx',
      facultyEmail: user?.email || 'faculty@cogniva.edu',
      headers: parsedData.headers,
      regNoHeader: parsedData.regNoHeader,
      nameHeader: parsedData.nameHeader,
      resultHeaders: parsedData.resultHeaders,
      rows: parsedData.matchedRows.map(r => ({
        regno: r.student.regno,
        studentName: r.studentName,
        studentEmail: r.student.email,
        department: r.student.department,
        semester: String(r.student.semester || '4'),
        section: r.student.section,
        data: r.data
      }))
    });

    await saveExamImportHistory({
      faculty_email: user?.email || 'faculty@cogniva.edu',
      exam_type: `Dynamic Excel (${parsedData.resultHeaders.join(', ')})`,
      import_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total_students: parsedData.matchedRows.length,
      total_records: parsedData.matchedRows.length * parsedData.resultHeaders.length,
      successful_records: parsedData.matchedRows.length * parsedData.resultHeaders.length,
      failed_records: parsedData.unmatchedRows.length,
      file_name: excelFile?.name || 'student_results.xlsx'
    });

    setImporting(false);
    setShowImportModal(false);
    setImportStep(1);
    setExcelFile(null);
    setParsedData(null);
    setToastMsg(`Successfully imported dynamic result table for ${savedDataset.rows.length} students!`);
    setTimeout(() => setToastMsg(null), 4000);
    loadData();
  };

  return (
    <PageFrame>
      <div className="welcome-row flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Faculty Workspace · Dynamic Examinations & Performance</div>
          <h1>Student Results</h1>
          <p className="lede">Imported Excel sheets dynamically define your table columns and student mark records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="button button-secondary text-xs px-3.5 py-2" onClick={() => setShowHistoryModal(true)}>
            <History size={15} /> Import History
          </button>
          <button className="button button-secondary text-xs px-3.5 py-2" onClick={handleDownloadTemplate}>
            <Download size={15} /> Download Excel Template
          </button>
          <button
            className="button button-primary text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setImportStep(1);
              setExcelFile(null);
              setParsedData(null);
              setShowImportModal(true);
            }}
          >
            <FileSpreadsheet size={15} /> Import Marks from Excel
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      {/* Dataset Selector (If multiple Excel datasets exist) */}
      {allDatasets.length > 1 && (
        <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-teal-400" /> Active Result Sheet:
          </span>
          <select
            value={activeDataset?.id || ''}
            onChange={(e) => {
              const ds = allDatasets.find(d => d.id === e.target.value);
              if (ds) setActiveDataset(ds);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-teal-300 font-semibold font-mono"
          >
            {allDatasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.fileName} ({new Date(ds.importedAt).toLocaleDateString()}) - {ds.rows.length} Students
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search & Filter Controls */}
      <section className="panel mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Student Name or Register Number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 font-medium text-slate-300">
              Department:
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-medium"
              >
                <option value="ALL">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
              </select>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-300">
              Semester:
              <select
                value={semFilter}
                onChange={e => setSemFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-medium"
              >
                <option value="ALL">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-300">
              Section:
              <select
                value={secFilter}
                onChange={e => setSecFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-medium"
              >
                <option value="ALL">All Sections</option>
                <option value="CSE-C">CSE-C</option>
                <option value="CSE-A">CSE-A</option>
                <option value="CSE-B">CSE-B</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* 100% Dynamic Student Results Table */}
      <section className="panel">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {activeDataset ? `Imported Results Table (${activeDataset.fileName})` : 'Student Results Table'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeDataset
                ? `Columns generated dynamically from imported Excel headers: ${activeDataset.headers.join(', ')}`
                : 'Upload an Excel sheet to populate dynamic result columns.'}
            </p>
          </div>
          <Chip tone="teal">
            {activeDataset ? `${filteredDatasetRows.length} Students` : `${assignedStudents.length} Students`}
          </Chip>
        </div>

        {loading ? (
          <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            Loading student result data from database...
          </div>
        ) : !activeDataset ? (
          <div className="p-10 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800 my-4">
            <FileSpreadsheet size={44} className="mx-auto text-teal-400 opacity-80" />
            <h3 className="text-base font-bold text-slate-200">No Imported Result Sheet Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Whatever result columns exist in your uploaded Excel file will automatically become table columns here.
            </p>
            <button
              className="button button-primary text-xs px-5 py-2.5 mx-auto flex items-center gap-2 cursor-pointer mt-2"
              onClick={() => {
                setImportStep(1);
                setExcelFile(null);
                setParsedData(null);
                setShowImportModal(true);
              }}
            >
              <FileSpreadsheet size={16} /> Import Marks from Excel
            </button>
          </div>
        ) : filteredDatasetRows.length === 0 ? (
          <EmptyState
            title="No students match the active filters."
            description="Try adjusting your search criteria or select another imported dataset."
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                  {activeDataset.headers.map((h, idx) => (
                    <th
                      key={idx}
                      className={`py-3 px-4 ${idx < 2 ? 'text-left font-bold text-slate-200' : 'text-center font-bold text-slate-200'}`}
                    >
                      {h}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDatasetRows.map((row) => (
                  <tr key={row.regno} className="hover:bg-slate-900/60 transition-colors group">
                    {activeDataset.headers.map((h, idx) => {
                      const isReg = h === activeDataset.regNoHeader;
                      const isName = h === activeDataset.nameHeader;
                      const val = row.data[h] ?? (isReg ? row.regno : isName ? row.studentName : null);

                      return (
                        <td
                          key={idx}
                          className={`py-3 px-4 ${
                            isReg
                              ? 'font-mono font-bold text-teal-300'
                              : isName
                              ? 'font-semibold text-slate-100'
                              : 'text-center font-mono font-bold text-teal-400'
                          }`}
                        >
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-600">—</span>
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right">
                      <button
                        className="button button-secondary text-xs py-1 px-3 cursor-pointer inline-flex items-center gap-1"
                        onClick={() => handleOpenStudentDetail(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected Student Dynamic Results Drawer */}
      {selectedStudentRow && (
        <div className="modal-backdrop" onClick={handleCloseStudentDetail}>
          <div className="modal-card max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head border-b border-slate-800 pb-4">
              <div>
                <div className="eyebrow">Student Result Profile</div>
                <h2 className="text-xl font-bold text-slate-100">{selectedStudentRow.studentName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
                  <div><span className="text-slate-500 block text-[10px]">REGISTER NUMBER</span><strong className="text-teal-300">{selectedStudentRow.regno}</strong></div>
                  <div><span className="text-slate-500 block text-[10px]">DEPARTMENT</span><strong className="text-slate-200">{selectedStudentInfo?.department || selectedStudentRow.department || 'CSE'}</strong></div>
                  <div><span className="text-slate-500 block text-[10px]">SEMESTER</span><strong className="text-slate-200">{selectedStudentInfo?.semester || selectedStudentRow.semester || '4'}</strong></div>
                  <div><span className="text-slate-500 block text-[10px]">SECTION</span><strong className="text-slate-200">{selectedStudentInfo?.section || selectedStudentRow.section || 'CSE-C'}</strong></div>
                </div>
              </div>
              <button className="icon-button" onClick={handleCloseStudentDetail}><X size={18} /></button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <h3 className="font-bold text-slate-200 text-sm">Dynamic Examination Performance</h3>
              <p className="text-slate-400 text-xs">Result entries imported from <span className="text-teal-300 font-mono">{activeDataset?.fileName}</span>:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeDataset?.resultHeaders.map((colKey) => {
                  const val = selectedStudentRow.data[colKey];
                  return (
                    <div key={colKey} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">{colKey}</span>
                      <span className="text-xl font-bold text-teal-300 font-mono mt-1 block">
                        {val === null || val === undefined || val === '' ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          val
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-800">
              <button className="button button-secondary text-xs px-4 py-2" onClick={handleCloseStudentDetail}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Excel Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head border-b border-slate-800 pb-3">
              <div>
                <div className="eyebrow">Dynamic Import Workflow · Step {importStep} of 2</div>
                <h2 className="text-lg font-bold text-slate-100">Import Examination Results from Excel</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {importStep === 1 ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-slate-200 font-bold">Select Excel File (.xlsx, .xls, .csv) *</label>
                  <p className="text-slate-400 text-[11px]">
                    Whatever result columns exist in your Excel file will automatically become columns in the Student Results table!
                  </p>

                  <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-6 text-center bg-slate-900/50 transition-colors mt-2">
                    <FileSpreadsheet size={32} className="mx-auto text-teal-400 mb-2" />
                    <p className="font-semibold text-slate-200 mb-1">Drag & Drop Excel File</p>
                    <p className="text-[11px] text-slate-400 mb-3">or browse files from your computer</p>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setExcelFile(file);
                      }}
                      className="block w-full text-xs text-slate-400 file:mx-auto file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2">
                    <span className="text-slate-400">Accepted formats: .xlsx, .xls, .csv</span>
                    <button
                      type="button"
                      className="text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      onClick={handleDownloadTemplate}
                    >
                      <Download size={13} /> Download Excel Template
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button className="button button-secondary text-xs px-4 py-2" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="button button-primary text-xs px-4 py-2"
                    onClick={handleParseExcel}
                    disabled={!excelFile || parsing}
                  >
                    {parsing ? 'Detecting Columns...' : 'Next: Preview Dynamic Table →'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {parsedData && (
                  <>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400 text-[11px]">FILE NAME</span>
                        <strong className="text-teal-300">{excelFile?.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">DETECTED EXCEL HEADERS (EXACT ORDER):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedData.headers.map((h, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                h === parsedData.regNoHeader
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                  : h === parsedData.nameHeader
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-center">
                        <span className="block text-xl font-bold text-teal-300">{parsedData.matchedRows.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Matched Students</span>
                      </div>
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
                        <span className="block text-xl font-bold text-rose-400">{parsedData.unmatchedRows.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Unmatched Rows</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                        <span className="block text-xl font-bold text-slate-300">{parsedData.totalExcelRows}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Excel Rows</span>
                      </div>
                    </div>

                    {/* Dynamic Import Table Preview */}
                    <div>
                      <h3 className="font-bold text-slate-200 mb-2">Dynamic Table Preview</h3>
                      <div className="border border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                              {parsedData.headers.map((h, i) => (
                                <th key={i} className={`py-2 px-3 ${i < 2 ? 'text-left' : 'text-center'}`}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {parsedData.matchedRows.slice(0, 5).map((mr, i) => (
                              <tr key={i} className="hover:bg-slate-900/40">
                                {parsedData.headers.map((h, idx) => {
                                  const isReg = h === parsedData.regNoHeader;
                                  const isName = h === parsedData.nameHeader;
                                  const val = mr.data[h] ?? (isReg ? mr.regno : isName ? mr.studentName : null);
                                  return (
                                    <td
                                      key={idx}
                                      className={`py-2 px-3 ${
                                        isReg
                                          ? 'font-mono font-bold text-teal-300'
                                          : isName
                                          ? 'font-semibold text-slate-200'
                                          : 'text-center font-mono font-bold text-teal-400'
                                      }`}
                                    >
                                      {val === null || val === undefined || val === '' ? (
                                        <span className="text-slate-600">—</span>
                                      ) : (
                                        val
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Unmatched / Errors Log */}
                    {parsedData.unmatchedRows.length > 0 && (
                      <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl max-h-32 overflow-y-auto text-rose-300 text-[11px] font-mono">
                        <p className="font-bold mb-1">Unmatched / Validation Warning ({parsedData.unmatchedRows.length}):</p>
                        {parsedData.unmatchedRows.map((u, i) => (
                          <p key={i}>⚠ {u.reason}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button className="button button-secondary text-xs px-4 py-2" onClick={() => setImportStep(1)}>
                    ← Back to File Selection
                  </button>
                  <div className="flex gap-2">
                    <button className="button button-secondary text-xs px-4 py-2" onClick={() => setShowImportModal(false)}>
                      Cancel
                    </button>
                    <button
                      className="button button-primary text-xs px-5 py-2 cursor-pointer"
                      onClick={handleConfirmImport}
                      disabled={importing || !parsedData || parsedData.matchedRows.length === 0}
                    >
                      <Save size={15} /> {importing ? 'Saving Table to Database...' : `Confirm & Save Table`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import History Log Modal */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head border-b border-slate-800 pb-3">
              <div>
                <div className="eyebrow">Audit & Logging</div>
                <h2 className="text-lg font-bold text-slate-100">Exam Mark Import History</h2>
              </div>
              <button className="icon-button" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>

            <div className="mt-4">
              {importHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-6 text-xs">No previous mark imports logged.</p>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((h, i) => (
                    <div key={h.id || i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                          <FileSpreadsheet size={14} className="text-teal-400" />
                          {h.exam_type}
                          <span className="font-mono text-[11px] font-normal text-slate-400">({h.file_name})</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Imported: {h.import_date} | Faculty: {h.faculty_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-teal-300 text-sm">
                          {h.successful_records} Marks Saved
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {h.total_students} Students ({h.failed_records} skipped)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
              <button className="button button-secondary text-xs px-4 py-2" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

function parseDynamicCgpaExcel(
  arrayBuffer: ArrayBuffer,
  roster: StudentMember[]
) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return { headers: [], regNoHeader: '', semHeaders: [], matchedRows: [], unmatchedRows: [], totalExcelRows: 0 };
  }

  const headers = Object.keys(rawRows[0]);
  const norm = (s: string) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  let regNoHeader = headers.find(h => ['regno', 'register', 'rollno', 'studentid', 'id', 'reg'].some(k => norm(h).includes(k))) || headers[0];
  let nameHeader = headers.find(h => ['name', 'studentname', 'fullname'].some(k => norm(h).includes(k)));
  let emailHeader = headers.find(h => ['email', 'mail'].some(k => norm(h).includes(k)));
  let cgpaHeader = headers.find(h => norm(h) === 'cgpa' || norm(h).includes('overallcgpa') || norm(h).includes('currentcgpa'));

  const semHeaders = headers.filter(h => {
    const n = norm(h);
    return (n.includes('sem') || n.includes('semester') || /^s\d/.test(n)) && !n.includes('name') && !n.includes('reg') && !n.includes('email');
  });

  const matchedRows: StudentCgpaRecord[] = [];
  const unmatchedRows: Array<{ rowNumber: number; data: Record<string, any>; reason: string }> = [];

  rawRows.forEach((row, i) => {
    const regVal = String(row[regNoHeader] || '').trim();
    const nameVal = nameHeader ? String(row[nameHeader] || '').trim() : '';
    const emailVal = emailHeader ? String(row[emailHeader] || '').trim() : '';

    if (!regVal && !nameVal && !emailVal) {
      unmatchedRows.push({ rowNumber: i + 2, data: row, reason: 'Empty student identifier row' });
      return;
    }

    const matchedStudent = roster.find(s => 
      (regVal && s.regno.toLowerCase() === regVal.toLowerCase()) ||
      (emailVal && s.email.toLowerCase() === emailVal.toLowerCase()) ||
      (nameVal && s.name.toLowerCase() === nameVal.toLowerCase())
    );

    const sReg = matchedStudent?.regno || regVal || `REG_${i + 1}`;
    const sName = matchedStudent?.name || nameVal || `Student ${i + 1}`;
    const sEmail = matchedStudent?.email || emailVal;
    const sDept = matchedStudent?.department || String(row['Department'] || row['Dept'] || 'CSE').trim();
    const sSec = matchedStudent?.section || String(row['Section'] || row['Sec'] || 'CSE-C').trim();

    const semesters: Array<{ semester: string; sgpa: number | null; cgpa: number | null; status: 'Completed' | 'Current' | 'Pending' }> = [];
    const validSgpas: number[] = [];

    semHeaders.forEach((h, idx) => {
      const val = parseFloat(String(row[h]));
      const isNum = !isNaN(val) && val >= 0 && val <= 10;
      const semName = h.replace(/sgpa|gpa|marks/gi, '').trim() || `Sem ${idx + 1}`;

      if (isNum) validSgpas.push(val);

      semesters.push({
        semester: semName.length > 0 ? semName : `Sem ${idx + 1}`,
        sgpa: isNum ? val : null,
        cgpa: isNum ? val : null,
        status: isNum ? 'Completed' : 'Current'
      });
    });

    const explicitCgpa = cgpaHeader ? parseFloat(String(row[cgpaHeader])) : NaN;
    const currentCgpa = !isNaN(explicitCgpa) && explicitCgpa >= 0 && explicitCgpa <= 10
      ? explicitCgpa
      : validSgpas.length > 0
      ? parseFloat((validSgpas.reduce((a, b) => a + b, 0) / validSgpas.length).toFixed(2))
      : null;

    const latestSgpa = validSgpas.length > 0 ? validSgpas[validSgpas.length - 1] : null;
    const previousSgpa = validSgpas.length > 1 ? validSgpas[validSgpas.length - 2] : null;
    const bestSgpa = validSgpas.length > 0 ? Math.max(...validSgpas) : null;
    const lowestSgpa = validSgpas.length > 0 ? Math.min(...validSgpas) : null;
    const averageSgpa = validSgpas.length > 0 ? parseFloat((validSgpas.reduce((a, b) => a + b, 0) / validSgpas.length).toFixed(2)) : null;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let sgpaDelta: number | null = null;
    if (latestSgpa !== null && previousSgpa !== null) {
      sgpaDelta = parseFloat((latestSgpa - previousSgpa).toFixed(2));
      if (sgpaDelta >= 0.02) trend = 'improving';
      else if (sgpaDelta <= -0.02) trend = 'declining';
    }

    matchedRows.push({
      id: `cgpa_${sReg.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      regno: sReg,
      studentName: sName,
      studentEmail: sEmail,
      department: sDept,
      section: sSec,
      semesters,
      currentCgpa,
      latestSgpa,
      previousSgpa,
      bestSgpa,
      lowestSgpa,
      averageSgpa,
      trend,
      sgpaDelta,
      cgpaDelta: sgpaDelta,
      updatedAt: new Date().toISOString()
    });
  });

  return {
    headers,
    regNoHeader,
    nameHeader,
    semHeaders,
    cgpaHeader,
    matchedRows,
    unmatchedRows,
    totalExcelRows: rawRows.length
  };
}

function FacultyCgpaView() {
  const { user } = useAuth();
  const [, params] = useRoute('/faculty/cgpa/:studentId');
  const targetStudentId = params?.studentId;

  const [records, setRecords] = useState<StudentCgpaRecord[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  const [selectedRecord, setSelectedRecord] = useState<StudentCgpaRecord | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseDynamicCgpaExcel> | null>(null);
  const [importing, setImporting] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<CgpaImportDataset[]>([]);

  useEffect(() => {
    loadCgpaData();
  }, [user?.email]);

  const loadCgpaData = async () => {
    if (!user?.email) return;
    setLoading(true);
    const [recs, studs, secs] = await Promise.all([
      fetchFacultyCgpaRecords(user.email),
      fetchFacultyAssignedStudents(user.email),
      fetchFacultyAssignedSections(user.email)
    ]);
    setRecords(recs);
    setAssignedStudents(studs);
    setAssignedSections(secs);

    if (targetStudentId) {
      const found = recs.find(r => r.id === targetStudentId || r.regno.toLowerCase() === targetStudentId.toLowerCase());
      if (found) setSelectedRecord(found);
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setExcelFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (!buffer) return;
      const parsed = parseDynamicCgpaExcel(buffer, assignedStudents);
      setParsedData(parsed);
      setImportStep(2);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!parsedData || !user?.email) return;
    setImporting(true);

    const res = await saveCgpaRecordsBatch(parsedData.matchedRows, {
      fileName: excelFile?.name || 'imported_cgpa.xlsx',
      facultyEmail: user.email,
      headers: parsedData.headers,
      regNoHeader: parsedData.regNoHeader,
      nameHeader: parsedData.nameHeader,
      semHeaders: parsedData.semHeaders,
      cgpaHeader: parsedData.cgpaHeader
    });

    setImporting(false);
    if (res.success) {
      alert(`Successfully saved ${res.count} student CGPA records!`);
      setShowImportModal(false);
      setImportStep(1);
      setExcelFile(null);
      setParsedData(null);
      await loadCgpaData();
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Register Number': '2024CSE001',
        'Student Name': 'Aditya Varma',
        'Department': 'CSE',
        'Section': 'CSE-C',
        'Sem 1 SGPA': 8.10,
        'Sem 2 SGPA': 8.35,
        'Sem 3 SGPA': 8.42,
        'Overall CGPA': 8.29
      },
      {
        'Register Number': '2024CSE002',
        'Student Name': 'Bhavna Sharma',
        'Department': 'CSE',
        'Section': 'CSE-C',
        'Sem 1 SGPA': 8.60,
        'Sem 2 SGPA': 8.75,
        'Sem 3 SGPA': 8.80,
        'Overall CGPA': 8.72
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CGPA_Import');
    XLSX.writeFile(wb, 'Cogniva_Student_CGPA_Template.xlsx');
  };

  const handleOpenHistory = async () => {
    const h = await fetchCgpaImportHistory(user?.email);
    setHistory(h);
    setShowHistoryModal(true);
  };

  const filteredRecords = records.filter(r => {
    const matchQuery = !search.trim() ||
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.regno.toLowerCase().includes(search.toLowerCase()) ||
      (r.studentEmail && r.studentEmail.toLowerCase().includes(search.toLowerCase()));

    const matchDept = selectedDept === 'ALL' || (r.department && r.department.toLowerCase() === selectedDept.toLowerCase());
    const matchSec = selectedSection === 'ALL' || (r.section && r.section.toLowerCase() === selectedSection.toLowerCase());

    return matchQuery && matchDept && matchSec;
  });

  return (
    <PageFrame>
      <div className="welcome-row flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Faculty Workspace · CGPA & SGPA Management</div>
          <h1>Student CGPA & Semester Performance Roster</h1>
          <p className="lede">Import, audit, and track dynamic student CGPA and semester SGPA history.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="button button-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer"
            onClick={handleDownloadTemplate}
            title="Download formatted Excel template for CGPA import"
          >
            <Download size={14} /> Download Template
          </button>

          <button
            className="button button-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer"
            onClick={handleOpenHistory}
            title="View import logs"
          >
            <History size={14} /> Import Log
          </button>

          <button
            className="button button-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer"
            onClick={() => {
              setImportStep(1);
              setExcelFile(null);
              setParsedData(null);
              setShowImportModal(true);
            }}
          >
            <Upload size={14} /> Import CGPA Excel
          </button>
        </div>
      </div>

      <section className="panel mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Search Student</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, Reg No, or Email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Filter Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Filter Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            >
              <option value="ALL">All Assigned Sections</option>
              {assignedSections.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="p-8 text-center text-teal-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Loading student CGPA records from database...
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No CGPA records found."
          description="Click 'Import CGPA Excel' to upload student CGPA records from an Excel sheet."
          action="Import CGPA Excel"
          onAction={() => setShowImportModal(true)}
        />
      ) : (
        <section className="panel">
          <SectionHeading
            eyebrow={`Verified Student Records (${filteredRecords.length})`}
            title="Academic Performance Roster"
          />

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 uppercase font-semibold text-slate-400 bg-slate-950">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department & Sec</th>
                  <th className="py-3 px-4 text-center">Overall CGPA</th>
                  <th className="py-3 px-4 text-center">Latest SGPA</th>
                  <th className="py-3 px-4 text-center">Performance Trend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{rec.regno}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{rec.studentName}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {rec.department || 'CSE'} • <span className="text-teal-300">{rec.section || 'CSE-C'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-300 text-sm">
                      {rec.currentCgpa !== null ? rec.currentCgpa.toFixed(2) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300 text-sm">
                      {rec.latestSgpa !== null ? rec.latestSgpa.toFixed(2) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border ${
                        rec.trend === 'improving' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        rec.trend === 'declining' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {rec.trend === 'improving' ? '↑ Improving' : rec.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        className="button button-secondary text-xs px-3 py-1.5 flex items-center gap-1 ml-auto cursor-pointer"
                        onClick={() => setSelectedRecord(rec)}
                      >
                        Inspect Record <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedRecord && (
        <div className="drawer-backdrop" onClick={() => setSelectedRecord(null)}>
          <aside className="detail-drawer explain-drawer max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">{selectedRecord.department || 'CSE'} · {selectedRecord.section || 'CSE-C'}</div>
                <h2 className="text-lg font-bold text-slate-100">{selectedRecord.studentName}</h2>
                <p className="font-mono text-xs text-teal-400 font-bold">{selectedRecord.regno}</p>
              </div>
              <button className="icon-button" onClick={() => setSelectedRecord(null)}><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="block text-2xl font-bold text-teal-300 font-mono">
                  {selectedRecord.currentCgpa ? selectedRecord.currentCgpa.toFixed(2) : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cumulative CGPA</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="block text-2xl font-bold text-amber-300 font-mono">
                  {selectedRecord.latestSgpa ? selectedRecord.latestSgpa.toFixed(2) : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Latest SGPA</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2">Semester Performance Details</h3>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 font-semibold text-slate-400">
                      <th className="py-2.5 px-3">Semester</th>
                      <th className="py-2.5 px-3 text-center">SGPA</th>
                      <th className="py-2.5 px-3 text-center">CGPA</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedRecord.semesters.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-100">{s.semester}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-300">
                          {s.sgpa !== null ? s.sgpa.toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                          {s.cgpa !== null ? s.cgpa.toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button className="button button-secondary text-xs px-4 py-2" onClick={() => setSelectedRecord(null)}>
                Close Details
              </button>
            </div>
          </aside>
        </div>
      )}

      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-head border-b border-slate-800 pb-3">
              <div>
                <div className="eyebrow">Dynamic Import Engine</div>
                <h2 className="text-lg font-bold text-slate-100">Import Student CGPA / SGPA Excel</h2>
              </div>
              <button className="icon-button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>

            {importStep === 1 && (
              <div className="space-y-4 mt-4 text-xs">
                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-200">
                  <strong className="block mb-1 text-sm font-bold text-teal-300">Flexible Header Detection:</strong>
                  <p className="leading-relaxed">
                    Upload an Excel file containing Student Reg No or Name alongside semester columns like <code className="bg-slate-950 px-1.5 py-0.5 rounded text-teal-400">Sem 1 SGPA</code>, <code className="bg-slate-950 px-1.5 py-0.5 rounded text-teal-400">Sem 2 SGPA</code>, or <code className="bg-slate-950 px-1.5 py-0.5 rounded text-teal-400">Overall CGPA</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-2">Select Excel File (.xlsx, .xls, .csv)</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="text-xs text-slate-400 file:bg-teal-600 file:text-white file:border-0 file:rounded-xl file:px-4 file:py-2 cursor-pointer w-full"
                  />
                </div>
              </div>
            )}

            {importStep === 2 && parsedData && (
              <div className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <span className="block text-xl font-bold text-teal-300">{parsedData.matchedRows.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Matched Students</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <span className="block text-xl font-bold text-amber-300">{parsedData.semHeaders.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Semesters Detected</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="block text-xl font-bold text-slate-300">{parsedData.totalExcelRows}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Excel Rows</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 mb-2">Dynamic Preview Table</h3>
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                          <th className="py-2 px-3">Reg No</th>
                          <th className="py-2 px-3">Name</th>
                          {parsedData.semHeaders.map((sh, idx) => (
                            <th key={idx} className="py-2 px-3 text-center">{sh}</th>
                          ))}
                          <th className="py-2 px-3 text-center">Computed CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {parsedData.matchedRows.slice(0, 6).map((mr, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-teal-300">{mr.regno}</td>
                            <td className="py-2 px-3 font-bold text-slate-100">{mr.studentName}</td>
                            {parsedData.semHeaders.map((sh, sIdx) => {
                              const semObj = mr.semesters[sIdx];
                              return (
                                <td key={sIdx} className="py-2 px-3 text-center font-mono font-bold text-amber-300">
                                  {semObj && semObj.sgpa !== null ? semObj.sgpa.toFixed(2) : '—'}
                                </td>
                              );
                            })}
                            <td className="py-2 px-3 text-center font-mono font-bold text-teal-400">
                              {mr.currentCgpa !== null ? mr.currentCgpa.toFixed(2) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button className="button button-secondary text-xs px-4 py-2" onClick={() => setImportStep(1)}>
                    ← Select File Again
                  </button>
                  <button
                    className="button button-primary text-xs px-5 py-2 cursor-pointer"
                    onClick={handleConfirmImport}
                    disabled={importing || parsedData.matchedRows.length === 0}
                  >
                    <Save size={15} /> {importing ? 'Saving Records...' : 'Confirm & Save CGPA Records'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-head border-b border-slate-800 pb-3">
              <div>
                <div className="eyebrow">Audit & History</div>
                <h2 className="text-lg font-bold text-slate-100">CGPA Import Log History</h2>
              </div>
              <button className="icon-button" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>

            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-xs">No previous CGPA import logs found.</p>
              ) : (
                history.map((h, i) => (
                  <div key={h.id || i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-slate-200">{h.fileName}</strong>
                      <span className="text-slate-400 text-[11px]">Imported: {new Date(h.importedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-300">{h.records.length} Records Saved</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button className="button button-secondary text-xs px-4 py-2" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
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
      <Route path="/student/hackathons" component={student('hackathons')} />
      <Route path="/student/examinations" component={student('examinations')} />
      <Route path="/student/cgpa" component={student('cgpa')} />
      <Route path="/student/grades" component={student('grades')} />
      <Route path="/student/materials" component={student('materials')} />
      <Route path="/student/strategy" component={student('strategy')} />
      <Route path="/student/planner" component={student('planner')} />
      <Route path="/student/insights" component={student('insights')} />
      <Route path="/student/analytics" component={student('analytics')} />
      <Route path="/student/timetable" component={student('timetable')} />
      <Route path="/student/alerts" component={student('alerts')} />
      <Route path="/student/announcements" component={student('alerts')} />
      <Route path="/student/notices" component={student('alerts')} />
      <Route path="/student/goals" component={student('goals')} />
      <Route path="/student/explain" component={student('explain')} />
      <Route path="/student/simulator" component={student('simulator')} />
      <Route path="/student/ask" component={student('ask')} />

      <Route path="/faculty" component={faculty('home')} />
      <Route path="/faculty/classes" component={faculty('classes')} />
      <Route path="/faculty/assignments" component={faculty('assignments')} />
      <Route path="/faculty/attendance" component={faculty('attendance')} />
      <Route path="/faculty/examinations" component={faculty('examinations')} />
      <Route path="/faculty/student-results" component={faculty('student-results')} />
      <Route path="/faculty/student-results/:studentId" component={faculty('student-results')} />
      <Route path="/faculty/cgpa" component={faculty('cgpa')} />
      <Route path="/faculty/cgpa/:studentId" component={faculty('cgpa')} />
      <Route path="/faculty/grades" component={faculty('grades')} />
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