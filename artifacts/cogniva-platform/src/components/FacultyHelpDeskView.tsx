import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  StudentQuery,
  QueryStatus,
  QueryPriority,
  QueryMessage,
  fetchStudentQueries,
  fetchQueryMessages,
  addQueryMessage,
  updateQueryStatus,
  calculateResolutionTime,
  QUERY_CATEGORIES,
} from '../lib/help-desk-api';
import { fetchFacultyMembers, fetchFacultyAssignedSections, Section } from '../lib/academic-api';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Send,
  X,
  Radio,
  ChevronRight,
  User,
  MessageSquare,
  ShieldCheck,
  Building,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

export function FacultyHelpDeskView() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [facultyName, setFacultyName] = useState('Faculty');

  // Selected query for drawer
  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null);
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [sending, setSending] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadFacultyData();
  }, [user?.email]);

  const loadFacultyData = async () => {
    setLoading(true);
    const userEmail = user?.email || 'faculty@cogniva.edu';

    const facList = await fetchFacultyMembers();
    const meFac = facList.find((f) => f.email.toLowerCase() === userEmail.toLowerCase());
    setFacultyName(meFac?.name || userEmail.split('@')[0]);

    const secs = await fetchFacultyAssignedSections(userEmail);
    setAssignedSections(secs);

    const qs = await fetchStudentQueries({
      userEmail,
      role: 'faculty',
    });

    setQueries(qs);
    setLoading(false);
  };

  const handleSelectQuery = async (query: StudentQuery) => {
    setSelectedQuery(query);
    setActionComment('');
    const msgs = await fetchQueryMessages(query.id);
    setMessages(msgs);
  };

  const handleStatusChange = async (newStatus: QueryStatus) => {
    if (!selectedQuery) return;
    setSending(true);

    const res = await updateQueryStatus({
      queryId: selectedQuery.id,
      status: newStatus,
      updatedByName: facultyName,
      updatedByRole: 'faculty',
      resolutionComment: actionComment.trim() || undefined,
    });

    setSending(false);

    if (res.success && res.data) {
      setSelectedQuery(res.data);
      setActionComment('');
      // Reload queries list and messages
      const updatedMsgs = await fetchQueryMessages(selectedQuery.id);
      setMessages(updatedMsgs);
      loadFacultyData();
    }
  };

  const handleToggleClassWide = async () => {
    if (!selectedQuery) return;
    setSending(true);

    const newClassWide = !selectedQuery.is_class_wide;
    const res = await updateQueryStatus({
      queryId: selectedQuery.id,
      status: selectedQuery.status,
      updatedByName: facultyName,
      updatedByRole: 'faculty',
      resolutionComment: newClassWide
        ? 'Flagged as Verified Class-Wide Issue for section'
        : 'Removed Class-Wide Issue flag',
      isClassWide: newClassWide,
    });

    setSending(false);

    if (res.success && res.data) {
      setSelectedQuery(res.data);
      const updatedMsgs = await fetchQueryMessages(selectedQuery.id);
      setMessages(updatedMsgs);
      loadFacultyData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedQuery) return;

    setSending(true);
    await addQueryMessage({
      queryId: selectedQuery.id,
      senderId: user?.email || 'faculty',
      senderName: facultyName,
      senderRole: 'faculty',
      message: newMessageText.trim(),
    });

    setNewMessageText('');
    setSending(false);

    const msgs = await fetchQueryMessages(selectedQuery.id);
    setMessages(msgs);
  };

  const getStatusBadge = (status: QueryStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Open</span>;
      case 'ACKNOWLEDGED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Acknowledged</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
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

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesSection = sectionFilter === 'ALL' || q.section === sectionFilter;
    const matchesPriority = priorityFilter === 'ALL' || q.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesSection && matchesPriority;
  });

  const openCount = queries.filter((q) => q.status === 'OPEN').length;
  const urgentCount = queries.filter((q) => q.priority === 'URGENT' && q.status !== 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Faculty Workspace · Student Queries
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Help Desk Queue
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Review, acknowledge, respond to, and resolve issues reported by students in your assigned sections.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-center min-w-[120px]">
            <span className="text-2xl font-black block">{openCount}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Open Queries</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 text-center min-w-[120px]">
            <span className="text-2xl font-black block">{urgentCount}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Urgent Issues</span>
          </div>
        </div>
      </div>

      {/* Main Queries Table / Card Grid */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, reg no, query ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
            </select>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sections</option>
              {assignedSections.map((sec) => (
                <option key={sec.id} value={sec.name}>
                  {sec.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="IMPORTANT">Important</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Queries List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading student queries queue...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No student queries require attention</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              All student issues in your section are clear or resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => handleSelectQuery(q)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  q.is_class_wide
                    ? 'bg-blue-50/50 border-blue-300 hover:border-blue-500'
                    : q.priority === 'URGENT'
                    ? 'bg-rose-50/30 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-white">
                      {q.section}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {q.category_label}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{q.display_id}</span>
                    {q.is_class_wide && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Class-Wide
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Student: {q.student_name} ({q.register_number})
                    </span>
                    <span>·</span>
                    <span>Location: {q.location}</span>
                    <span>·</span>
                    <span>
                      Submitted: {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                  {getPriorityBadge(q.priority)}
                  {getStatusBadge(q.status)}
                  <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FACULTY ACTION DRAWER */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase">{selectedQuery.category_label}</span>
                  <span className="text-xs font-mono text-slate-400">{selectedQuery.display_id}</span>
                </div>
                <h2 className="text-lg font-extrabold">{selectedQuery.title}</h2>
                <div className="flex items-center gap-2 pt-1">
                  {getStatusBadge(selectedQuery.status)}
                  {getPriorityBadge(selectedQuery.priority)}
                </div>
              </div>
              <button onClick={() => setSelectedQuery(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student Metadata */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">{selectedQuery.student_name} ({selectedQuery.register_number})</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{selectedQuery.section}</span>
                </div>
                <div className="text-slate-600">
                  Location: <strong className="text-slate-800">{selectedQuery.location}</strong> · Dept: <strong>{selectedQuery.department}</strong>
                </div>
                <div className="text-slate-500">
                  Submitted: {new Date(selectedQuery.created_at).toLocaleString()}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Faculty Actions</h4>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusChange('ACKNOWLEDGED')}
                    disabled={sending || selectedQuery.status === 'ACKNOWLEDGED'}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Acknowledge Issue
                  </button>

                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={sending || selectedQuery.status === 'IN_PROGRESS'}
                    className="px-3.5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    Start Working
                  </button>

                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={sending || selectedQuery.status === 'RESOLVED'}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={handleToggleClassWide}
                    disabled={sending}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selectedQuery.is_class_wide
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {selectedQuery.is_class_wide ? '✓ Class-Wide Issue' : '+ Flag Class-Wide'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Optional resolution or progress note..."
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Student Description</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200 whitespace-pre-wrap">
                  {selectedQuery.description}
                </p>
              </div>

              {/* Messages Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Conversation History</h4>
                {messages.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{m.sender_name} ({m.sender_role})</span>
                      <span className="text-slate-400 font-normal">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-800 text-sm">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Input */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a message to student..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessageText.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow disabled:opacity-50"
                >
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
