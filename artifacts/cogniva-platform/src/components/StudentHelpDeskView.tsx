import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  StudentQuery,
  QueryCategory,
  QueryPriority,
  QueryStatus,
  QueryMessage,
  QUERY_CATEGORIES,
  createStudentQuery,
  fetchStudentQueries,
  fetchQueryMessages,
  addQueryMessage,
  fetchCampusSignals,
  calculateResolutionTime,
} from '../lib/help-desk-api';
import { fetchStudentMembers, fetchSubjects, Subject } from '../lib/academic-api';
import {
  Wifi,
  School,
  Laptop,
  BookOpen,
  ClipboardList,
  Calendar,
  CheckSquare,
  FileCheck,
  UserCheck,
  Building,
  Library,
  Cpu,
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Send,
  X,
  FileText,
  Paperclip,
  Radio,
  ChevronRight,
  ShieldCheck,
  User,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

export function StudentHelpDeskView() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [campusSignals, setCampusSignals] = useState<StudentQuery[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<{
    name: string;
    regno: string;
    department: string;
    year: string;
    semester: string;
    section: string;
  }>({
    name: 'Student',
    regno: '2024CSE001',
    department: 'CSE',
    year: 'Second Year',
    semester: '4',
    section: 'CSE-C',
  });

  // Modal and Drawer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null);
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<QueryCategory>('wifi');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('CSE-C Classroom');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formPriority, setFormPriority] = useState<QueryPriority>('NORMAL');
  const [formAttachment, setFormAttachment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    const userEmail = user?.email || 'student@cogniva.edu';
    
    // Load Student Profile
    const studs = await fetchStudentMembers();
    const me = studs.find((s) => s.email.toLowerCase() === userEmail.toLowerCase());
    const sec = me?.section || 'CSE-C';

    if (me) {
      setStudentProfile({
        name: me.name,
        regno: me.regno,
        department: me.department || 'CSE',
        year: me.year || 'Second Year',
        semester: me.semester || '4',
        section: sec,
      });
      setFormLocation(`${sec} Classroom`);
    } else {
      setStudentProfile({
        name: userEmail.split('@')[0],
        regno: '2024CSE001',
        department: 'CSE',
        year: 'Second Year',
        semester: '4',
        section: 'CSE-C',
      });
    }

    // Fetch queries, campus signals, and subjects
    const [qs, signals, subjs] = await Promise.all([
      fetchStudentQueries({ userEmail, role: 'student' }),
      fetchCampusSignals(sec),
      fetchSubjects(sec),
    ]);

    setQueries(qs);
    setCampusSignals(signals);
    setSubjects(subjs);
    setLoading(false);
  };

  const handleOpenComposer = (cat?: QueryCategory) => {
    if (cat) {
      setFormCategory(cat);
      const catObj = QUERY_CATEGORIES.find((c) => c.id === cat);
      setFormTitle(`${catObj?.label || 'Campus'} issue in ${studentProfile.section}`);
    } else {
      setFormCategory('wifi');
      setFormTitle('');
    }
    setFormSubCategory('');
    setFormDescription('');
    setFormPriority('NORMAL');
    setFormAttachment(null);
    setSubmitError(null);
    setIsComposerOpen(true);
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      setSubmitError('Please enter both an issue title and detailed description.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const selSubj = subjects.find((s) => s.id === formSubjectId);

    const res = await createStudentQuery({
      userEmail: user?.email || 'student@cogniva.edu',
      category: formCategory,
      subCategory: formSubCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      location: formLocation.trim() || `${studentProfile.section} Classroom`,
      subjectId: formSubjectId,
      subjectName: selSubj?.subject_name,
      priority: formPriority,
      attachmentUrl: formAttachment || undefined,
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setIsComposerOpen(false);
      loadData();
    } else {
      setSubmitError(res.error || 'Failed to submit query. Please try again.');
    }
  };

  const handleViewDetails = async (query: StudentQuery) => {
    setSelectedQuery(query);
    const msgs = await fetchQueryMessages(query.id);
    setMessages(msgs);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedQuery) return;

    setSendingMessage(true);
    await addQueryMessage({
      queryId: selectedQuery.id,
      senderId: studentProfile.regno,
      senderName: studentProfile.name,
      senderRole: 'student',
      message: newMessageText.trim(),
    });

    setNewMessageText('');
    setSendingMessage(false);

    // Refresh messages
    const msgs = await fetchQueryMessages(selectedQuery.id);
    setMessages(msgs);
  };

  const getCategoryIcon = (cat: QueryCategory) => {
    switch (cat) {
      case 'wifi': return <Wifi className="w-5 h-5 text-blue-600" />;
      case 'classroom': return <School className="w-5 h-5 text-indigo-600" />;
      case 'lab': return <Laptop className="w-5 h-5 text-cyan-600" />;
      case 'materials': return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'assignment': return <ClipboardList className="w-5 h-5 text-amber-600" />;
      case 'timetable': return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'attendance': return <CheckSquare className="w-5 h-5 text-teal-600" />;
      case 'exam': return <FileCheck className="w-5 h-5 text-rose-600" />;
      case 'faculty': return <UserCheck className="w-5 h-5 text-sky-600" />;
      case 'infrastructure': return <Building className="w-5 h-5 text-slate-700" />;
      case 'library': return <Library className="w-5 h-5 text-amber-700" />;
      case 'technical': return <Cpu className="w-5 h-5 text-violet-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: QueryStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Open</span>;
      case 'ACKNOWLEDGED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />Acknowledged</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200"><Clock className="w-3.5 h-3.5 text-cyan-600 animate-spin" />In Progress</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Resolved</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Closed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: QueryPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">URGENT</span>;
      case 'IMPORTANT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">IMPORTANT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">NORMAL</span>;
    }
  };

  // Stats
  const openCount = queries.filter((q) => q.status === 'OPEN' || q.status === 'ACKNOWLEDGED').length;
  const inProgressCount = queries.filter((q) => q.status === 'IN_PROGRESS').length;
  const resolvedCount = queries.filter((q) => q.status === 'RESOLVED' || q.status === 'CLOSED').length;
  const totalCount = queries.length;

  // Filtered queries
  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.location && q.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || q.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* 1. PAGE HEADER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Campus Query Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Help Desk
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Report an academic or campus issue and track its resolution in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenComposer()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md transition-all duration-150 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Query
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('my-queries-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            View My Queries ({totalCount})
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Queries</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{openCount}</span>
            <span className="text-xs font-medium text-slate-500">awaiting action</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <div className="p-2 bg-cyan-50 rounded-xl">
              <Clock className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{inProgressCount}</span>
            <span className="text-xs font-medium text-slate-500">being addressed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolved</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{resolvedCount}</span>
            <span className="text-xs font-medium text-slate-500">completed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Queries</span>
            <div className="p-2 bg-slate-100 rounded-xl">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs font-medium text-slate-500">submitted</span>
          </div>
        </div>
      </div>

      {/* 3. CAMPUS SIGNALS (VERIFIED CLASS-WIDE ISSUES) */}
      {campusSignals.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 backdrop-blur rounded-xl border border-blue-400/30">
              <Radio className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Campus Signals · Class-Wide Notice
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {studentProfile.section}
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Verified issues currently affecting multiple students in your section.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {campusSignals.map((signal) => (
              <div
                key={signal.id}
                onClick={() => handleViewDetails(signal)}
                className="bg-white/10 hover:bg-white/15 backdrop-blur border border-white/15 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                      {signal.category_label}
                    </span>
                    {getStatusBadge(signal.status)}
                  </div>
                  <h4 className="text-sm font-semibold text-white">{signal.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-1">{signal.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-300 shrink-0 self-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. QUICK ISSUE CATEGORIES GRID */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">What do you need help with?</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Select a category to pre-fill your query form.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {QUERY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleOpenComposer(cat.id)}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group bg-slate-50/60 hover:shadow-md"
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 group-hover:border-blue-300 group-hover:scale-105 transition-transform mb-3">
                {getCategoryIcon(cat.id)}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                {cat.label}
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                {cat.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. MY OPEN QUERIES & QUERY HISTORY */}
      <div id="my-queries-section" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Help Desk Queries</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Track active requests and historical resolutions.
            </p>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] truncate"
            >
              <option value="ALL">All Categories</option>
              {QUERY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* QUERY CARDS GRID */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading your queries from Supabase...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">You're all clear!</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'No queries match your current search or filter criteria.'
                : 'No help desk requests submitted yet. If you encounter any issue, report it anytime!'}
            </p>
            <button
              onClick={() => handleOpenComposer()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                        {getCategoryIcon(query.category)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          {query.category_label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {query.display_id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getPriorityBadge(query.priority)}
                      {getStatusBadge(query.status)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {query.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {query.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {query.location || query.section}
                    </span>
                    <span>
                      {new Date(query.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewDetails(query)}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 text-xs hover:underline"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. CREATE QUERY COMPOSER MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <Radio className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Help Desk Query</h3>
                  <p className="text-xs text-blue-200">Report an issue directly to your section faculty & campus admin.</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuery} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* STUDENT AUTOMATIC IDENTITY BANNER */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {studentProfile.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{studentProfile.name}</span>
                    <span className="text-slate-500 font-mono">{studentProfile.regno} · {studentProfile.department} ({studentProfile.section})</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right text-[11px] text-blue-800 font-medium">
                  <div>Auto-attached Student Context</div>
                  <div className="text-slate-500">{studentProfile.year} · Sem {studentProfile.semester}</div>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  {submitError}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as QueryCategory)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {QUERY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sub-category (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wi-Fi Router, Projector, Portal"
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location / Room *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE-C Classroom, Lab 2"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Related Subject (Optional)
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- None / General Campus --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name} ({s.subject_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Title / Short Summary *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wi-Fi is not connecting properly in our CSE-C classroom"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened, error messages, who is affected..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['NORMAL', 'IMPORTANT', 'URGENT'] as QueryPriority[]).map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setFormPriority(prio)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        formPriority === prio
                          ? prio === 'URGENT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                            : prio === 'IMPORTANT'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                            : 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Query
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. QUERY DETAIL DRAWER / MODAL */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                    {selectedQuery.category_label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{selectedQuery.display_id}</span>
                </div>
                <h2 className="text-lg font-extrabold text-white">{selectedQuery.title}</h2>
                <div className="flex items-center gap-2 pt-1">
                  {getStatusBadge(selectedQuery.status)}
                  {getPriorityBadge(selectedQuery.priority)}
                </div>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Student</span>
                  <span className="font-bold text-slate-800">{selectedQuery.student_name}</span>
                  <span className="text-slate-500 block font-mono">{selectedQuery.register_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Section & Location</span>
                  <span className="font-bold text-slate-800">{selectedQuery.section}</span>
                  <span className="text-slate-500 block">{selectedQuery.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Submitted</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedQuery.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Resolution Time</span>
                  <span className="font-bold text-blue-700">
                    {calculateResolutionTime(selectedQuery.created_at, selectedQuery.resolved_at)}
                  </span>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Description</h4>
                <p className="text-sm text-slate-800 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedQuery.description}
                </p>
              </div>

              {/* Status Stepper */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution Status</h4>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    1. Submitted
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <div className={`flex items-center gap-2 font-bold ${selectedQuery.status !== 'OPEN' ? 'text-blue-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedQuery.status !== 'OPEN' ? 'text-blue-600' : 'text-slate-300'}`} />
                    2. Acknowledged
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <div className={`flex items-center gap-2 font-bold ${selectedQuery.status === 'RESOLVED' || selectedQuery.status === 'CLOSED' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedQuery.status === 'RESOLVED' || selectedQuery.status === 'CLOSED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    3. Resolved
                  </div>
                </div>
              </div>

              {/* Timeline & Messages */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Updates & Communication History
                </h4>

                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No message updates logged yet.
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          msg.sender_role === 'faculty' || msg.sender_role === 'admin'
                            ? 'bg-blue-50/80 border-blue-200 text-slate-900 ml-4'
                            : 'bg-slate-50 border-slate-200 text-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {msg.sender_role === 'faculty' || msg.sender_role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-600 text-white font-bold uppercase">
                                {msg.sender_role} Response
                              </span>
                            ) : (
                              <span className="text-slate-700">{msg.sender_name}</span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Message Reply Form */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a follow-up message..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessageText.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
