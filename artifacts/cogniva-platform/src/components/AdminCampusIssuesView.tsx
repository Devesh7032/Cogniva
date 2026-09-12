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
import { fetchDepartments, fetchSections, fetchFacultyMembers, Department, Section } from '../lib/academic-api';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Send,
  X,
  Radio,
  ChevronRight,
  ShieldCheck,
  Building,
  Users,
  Copy,
  Layers,
  BarChart2
} from 'lucide-react';

export function AdminCampusIssuesView() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected query
  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null);
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [sending, setSending] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const [qs, depts, secs] = await Promise.all([
      fetchStudentQueries({ role: 'admin' }),
      fetchDepartments(),
      fetchSections(),
    ]);

    setQueries(qs);
    setDepartments(depts);
    setSections(secs);
    setLoading(false);
  };

  const handleSelectQuery = async (query: StudentQuery) => {
    setSelectedQuery(query);
    setActionComment('');
    setAssigneeName(query.assigned_to_name || '');
    const msgs = await fetchQueryMessages(query.id);
    setMessages(msgs);
  };

  const handleStatusChange = async (newStatus: QueryStatus) => {
    if (!selectedQuery) return;
    setSending(true);

    const res = await updateQueryStatus({
      queryId: selectedQuery.id,
      status: newStatus,
      updatedByName: 'Admin',
      updatedByRole: 'admin',
      resolutionComment: actionComment.trim() || undefined,
    });

    setSending(false);

    if (res.success && res.data) {
      setSelectedQuery(res.data);
      setActionComment('');
      const updatedMsgs = await fetchQueryMessages(selectedQuery.id);
      setMessages(updatedMsgs);
      loadAdminData();
    }
  };

  const handleToggleClassWide = async () => {
    if (!selectedQuery) return;
    setSending(true);

    const newClassWide = !selectedQuery.is_class_wide;
    const res = await updateQueryStatus({
      queryId: selectedQuery.id,
      status: selectedQuery.status,
      updatedByName: 'Admin',
      updatedByRole: 'admin',
      resolutionComment: newClassWide ? 'Flagged as Verified Campus Class-Wide Issue' : 'Removed class-wide flag',
      isClassWide: newClassWide,
    });

    setSending(false);

    if (res.success && res.data) {
      setSelectedQuery(res.data);
      const updatedMsgs = await fetchQueryMessages(selectedQuery.id);
      setMessages(updatedMsgs);
      loadAdminData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedQuery) return;

    setSending(true);
    await addQueryMessage({
      queryId: selectedQuery.id,
      senderId: 'admin',
      senderName: 'Campus Admin',
      senderRole: 'admin',
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

  // Duplicate detection logic
  const detectDuplicates = () => {
    const map = new Map<string, StudentQuery[]>();
    queries.filter(q => q.status !== 'RESOLVED' && q.status !== 'CLOSED').forEach(q => {
      const key = `${q.section}_${q.category}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });

    const duplicates: { key: string; section: string; category: string; list: StudentQuery[] }[] = [];
    map.forEach((list, key) => {
      if (list.length >= 2) {
        const [sec, cat] = key.split('_');
        duplicates.push({ key, section: sec, category: cat, list });
      }
    });
    return duplicates;
  };

  const duplicateGroups = detectDuplicates();

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || q.department === deptFilter;
    const matchesCat = categoryFilter === 'ALL' || q.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || q.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesCat && matchesPriority;
  });

  const totalOpen = queries.filter((q) => q.status === 'OPEN' || q.status === 'ACKNOWLEDGED').length;
  const totalUrgent = queries.filter((q) => q.priority === 'URGENT' && q.status !== 'RESOLVED').length;
  const totalWifiInfra = queries.filter((q) => (q.category === 'wifi' || q.category === 'infrastructure' || q.category === 'classroom') && q.status !== 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Admin Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide uppercase">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Admin Intelligence Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Issues & Help Desk
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Institution-wide issue monitoring, section workload routing, and duplicate report resolution.
          </p>
        </div>

        {/* Analytics Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
            <span className="text-xl font-black text-amber-900 block">{totalOpen}</span>
            <span className="text-[10px] font-bold text-amber-700 uppercase">Open</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
            <span className="text-xl font-black text-rose-900 block">{totalUrgent}</span>
            <span className="text-[10px] font-bold text-rose-700 uppercase">Urgent</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
            <span className="text-xl font-black text-blue-900 block">{totalWifiInfra}</span>
            <span className="text-[10px] font-bold text-blue-700 uppercase">Infra/Wi-Fi</span>
          </div>
        </div>
      </div>

      {/* Duplicate / Class-Wide Issue Detector Banner */}
      {duplicateGroups.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-6 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Possible Duplicate Reports Detected</h3>
                <p className="text-xs text-amber-100">
                  Multiple students from the same section have reported similar issues.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
              {duplicateGroups.length} Cluster(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {duplicateGroups.map((group) => (
              <div key={group.key} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-white">{group.section}</span>
                  <span className="uppercase text-amber-100">{group.category}</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  {group.list.length} reports submitted for {group.list[0].title}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleSelectQuery(group.list[0])}
                    className="px-3 py-1 bg-white text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    View Cluster
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Global search by student, section, issue text..."
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
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Depts</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code}
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

        {/* Global Queries List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading institution campus issues...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No active campus issues</h3>
            <p className="text-xs text-slate-500">All queries resolved across departments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => handleSelectQuery(q)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                      {q.section}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">{q.category_label}</span>
                    <span className="text-xs font-mono text-slate-400">{q.display_id}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>
                      Student: <strong className="text-slate-800">{q.student_name}</strong> ({q.register_number})
                    </span>
                    <span>·</span>
                    <span>Location: {q.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getPriorityBadge(q.priority)}
                  {getStatusBadge(q.status)}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADMIN QUERY MANAGEMENT DRAWER */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase">{selectedQuery.category_label} · {selectedQuery.display_id}</span>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Admin Control Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Admin Controls</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusChange('ACKNOWLEDGED')}
                    disabled={sending}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={sending}
                    className="px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded-lg"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={sending}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={handleToggleClassWide}
                    disabled={sending}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg"
                  >
                    {selectedQuery.is_class_wide ? '✓ Class-Wide' : '+ Set Class-Wide'}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Student Description</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {selectedQuery.description}
                </p>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Timeline & Messages</h4>
                {messages.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{m.sender_name} ({m.sender_role})</span>
                      <span className="text-slate-400">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-800 text-sm">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Post admin update..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessageText.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
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
