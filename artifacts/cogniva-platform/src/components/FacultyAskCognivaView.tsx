import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Database,
  BrainCircuit,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  RefreshCw,
  User,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Info,
  X,
  FileSpreadsheet,
  UsersRound,
  TrendingDown,
  Award
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  processFacultyAcademicQuery,
  FacultyQueryResult
} from '../lib/faculty-query-engine';
import {
  generateAcademicPdfReport,
  PdfReportData
} from '../lib/pdf-report-generator';
import {
  fetchFacultyAssignedSections,
  fetchFacultyMembers,
  Section,
  FacultyMember
} from '../lib/academic-api';

interface ChatMessage {
  id: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: string;
  dataBadge?: string;
  result?: FacultyQueryResult;
  pdfReportData?: PdfReportData;
  suggestedFollowUps?: string[];
  isSecurityWarning?: boolean;
}

export function FacultyAskCognivaView() {
  const { user } = useAuth();
  const [facultyInfo, setFacultyInfo] = useState<{ name: string; dept: string; sections: string[] }>({
    name: 'Faculty Member',
    dept: 'Computer Science & Engineering',
    sections: ['CSE-C']
  });
  const [loadingContext, setLoadingContext] = useState(true);

  // AI & Database Engine Status
  const [aiStatus, setAiStatus] = useState<{ live: boolean; label: string; mode: 'ai' | 'db' }>({
    live: false,
    label: 'Checking engine status...',
    mode: 'db'
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // PDF Preview Modal State
  const [activePdfPreview, setActivePdfPreview] = useState<{
    data: PdfReportData;
    filename: string;
    dataUrl: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadFacultyContext();
    checkAiHealth();
  }, [user?.email]);

  const checkAiHealth = async () => {
    try {
      const res = await fetch('/api/ai/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'ping',
          context: { email: user?.email || '', pingOnly: true }
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.mode === 'gemini') {
        setAiStatus({
          live: true,
          label: 'Faculty Gemini AI Connected',
          mode: 'ai'
        });
      } else {
        setAiStatus({
          live: true,
          label: 'Database Engine Active',
          mode: 'db'
        });
      }
    } catch {
      setAiStatus({
        live: true,
        label: 'Database Engine Active',
        mode: 'db'
      });
    }
  };

  const loadFacultyContext = async () => {
    setLoadingContext(true);
    try {
      const email = user?.email || 'anjali.menon@example.edu';
      const [facList, secList] = await Promise.all([
        fetchFacultyMembers(),
        fetchFacultyAssignedSections(email)
      ]);
      const current = facList.find(f => f.email.toLowerCase() === email.toLowerCase()) || facList[0];
      const secNames = secList.length > 0 ? secList.map(s => s.name) : ['CSE-C'];

      const info = {
        name: current?.name || 'Prof. Anjali Menon',
        dept: current?.department || 'Computer Science & Engineering',
        sections: secNames
      };
      setFacultyInfo(info);

      const welcomeMsg: ChatMessage = {
        id: 'welcome-01',
        from: 'ai',
        text: `Welcome **${info.name}**! I am **Ask Cogniva Faculty**, your academic intelligence copilot.\n\nI am authorized for your assigned sections (**${info.sections.join(', ')}**) in **${info.dept}**.\n\nYou can query student rosters, low attendance alerts, grade rankings, at-risk students, or generate instant branded PDF reports!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: `Authorized Scope: ${info.sections.join(', ')} • ${info.dept}`,
        suggestedFollowUps: [
          'How many classes do I have?',
          'Show student list for CSE-C',
          'Students with attendance below 75%',
          'Top performing students in CSE-C',
          'Generate attendance PDF report'
        ]
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error('Failed to load faculty context for Ask Cogniva:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleAsk = async (customPrompt?: string) => {
    const promptToSubmit = (customPrompt || inputPrompt).trim();
    if (!promptToSubmit || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: promptToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsProcessing(true);

    try {
      const email = user?.email || 'anjali.menon@example.edu';
      const result: FacultyQueryResult = await processFacultyAcademicQuery(email, promptToSubmit);

      let pdfData: PdfReportData | undefined = result.pdfReportData;
      if (!pdfData && result.tableData && result.tableData.rows.length > 0) {
        pdfData = {
          title: result.metricLabel || 'Academic Query Report',
          subtitle: promptToSubmit,
          department: facultyInfo.dept,
          section: facultyInfo.sections[0] || 'CSE-C',
          facultyName: facultyInfo.name,
          facultyEmail: email,
          columns: result.tableData.columns,
          rows: result.tableData.rows,
          summaryText: result.answer
        };
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: result.securityScopeWarning
          ? 'Scope Restricted'
          : `Grounded in Cogniva Database • Scope: ${facultyInfo.sections.join(', ')}`,
        result,
        pdfReportData: pdfData,
        suggestedFollowUps: result.suggestedFollowUps,
        isSecurityWarning: Boolean(result.securityScopeWarning)
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error processing query:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        from: 'ai',
        text: 'I encountered an issue querying the academic database. Please verify your assigned class permissions and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: 'Database Fallback Active',
        suggestedFollowUps: [
          'Show student list for CSE-C',
          'Students with attendance below 75%'
        ]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = (pdfData: PdfReportData) => {
    const { blob, filename } = generateAcademicPdfReport(pdfData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreviewPdf = (pdfData: PdfReportData) => {
    const { dataUrl, filename } = generateAcademicPdfReport(pdfData);
    setActivePdfPreview({
      data: pdfData,
      filename,
      dataUrl
    });
  };

  const quickChips = [
    { label: 'My Classes', prompt: 'How many classes do I have?', icon: GraduationCap },
    { label: 'Student Roster', prompt: 'Show student list for CSE-C', icon: UsersRound },
    { label: 'Low Attendance (<75%)', prompt: 'Students with attendance below 75%', icon: TrendingDown },
    { label: 'Top Performers', prompt: 'Top performing students in CSE-C', icon: Award },
    { label: 'At-Risk Students', prompt: 'At-risk students needing intervention', icon: AlertTriangle },
    { label: 'Generate PDF Report', prompt: 'Generate attendance PDF report', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            <span>Faculty Intelligence Copilot</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Ask Cogniva Faculty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Instant natural language query engine grounded in official Cogniva student rosters, attendance records, exam results, and automated PDF reporting.
          </p>
        </div>

        {/* Engine Health Badge */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              aiStatus.mode === 'ai'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {aiStatus.mode === 'ai' ? (
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            ) : (
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{aiStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[580px] max-h-[750px]">
        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {messages.map(msg => {
            const isUser = msg.from === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4 text-indigo-300" />}
                </div>

                {/* Content Bubble */}
                <div className={`space-y-3 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                        : msg.isSecurityWarning
                        ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Markdown-style simple formatted text */}
                    <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap">
                      {msg.text.split('\n').map((paragraph, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                          {paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? (
                              <strong key={cIdx} className="font-semibold text-slate-900">
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Security Scope Warning Box */}
                    {msg.result?.securityScopeWarning && (
                      <div className="mt-3 p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Security Scope Enforced:</span>{' '}
                          {msg.result.securityScopeWarning}
                        </div>
                      </div>
                    )}

                    {/* Metric Card (Count Result) */}
                    {msg.result?.metricValue !== undefined && (
                      <div className="mt-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-indigo-600 font-semibold">
                            {msg.result.metricLabel || 'Query Metric'}
                          </div>
                          <div className="text-2xl font-bold text-slate-900 font-serif mt-0.5">
                            {msg.result.metricValue}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                    )}

                    {/* Result Data Table */}
                    {msg.result?.tableData && msg.result.tableData.rows.length > 0 && (
                      <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700 font-mono uppercase">
                            Query Results ({msg.result.tableData.rows.length} Records)
                          </span>
                          {msg.pdfReportData && (
                            <button
                              onClick={() => handleDownloadPdf(msg.pdfReportData!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-semibold hover:bg-indigo-700 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Export PDF</span>
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto max-h-60">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase">
                              <tr>
                                {msg.result.tableData.columns.map(col => (
                                  <th key={col.key} className="px-3 py-2 font-medium">
                                    {col.header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {msg.result.tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                                  {msg.result!.tableData!.columns.map(col => (
                                    <td key={col.key} className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                                      {col.key.toLowerCase().includes('status') ? (
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            String(row[col.key]).toLowerCase().includes('risk') ||
                                            String(row[col.key]).toLowerCase().includes('low') ||
                                            String(row[col.key]).toLowerCase().includes('shortage')
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          {row[col.key]}
                                        </span>
                                      ) : (
                                        row[col.key] ?? '-'
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* PDF Report Generation Card */}
                    {msg.pdfReportData && (
                      <div className="mt-3 p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {msg.pdfReportData.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {msg.pdfReportData.rows.length} rows • Section {msg.pdfReportData.section} • Branded PDF
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handlePreviewPdf(msg.pdfReportData!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(msg.pdfReportData!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer metadata badge */}
                  {msg.dataBadge && (
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{msg.dataBadge}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Suggested Follow-ups */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                        Suggested Follow-ups
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleAsk(chip)}
                            disabled={isProcessing}
                            className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 px-3 py-1 rounded-full transition shadow-2xs flex items-center gap-1"
                          >
                            <span>{chip}</span>
                            <ChevronRight className="w-3 h-3 text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                <BrainCircuit className="w-4 h-4 text-indigo-300 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm text-xs text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span>Querying official Supabase database & analyzing academic rosters...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold shrink-0">
            Quick Queries:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {quickChips.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleAsk(chip.prompt)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 hover:text-indigo-700 hover:border-indigo-300 transition whitespace-nowrap"
                >
                  <Icon className="w-3 h-3 text-indigo-600" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                placeholder="Ask about student lists, low attendance (<75%), top students, grade distribution..."
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Submit</span>
            </button>
          </form>
        </div>
      </div>

      {/* PDF Report Preview Overlay Modal */}
      {activePdfPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-600 font-bold">
                  PDF Report Preview
                </div>
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  {activePdfPreview.data.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePdfPreview(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Preview */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Department:</span>{' '}
                  {activePdfPreview.data.department}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Section:</span>{' '}
                  {activePdfPreview.data.section}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Generated By:</span>{' '}
                  {activePdfPreview.data.facultyName} ({activePdfPreview.data.facultyEmail})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Generated At:</span>{' '}
                  {activePdfPreview.data.generatedAt || new Date().toLocaleString()}
                </div>
              </div>

              {/* Table Data Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-mono text-[10px] uppercase text-slate-700">
                    <tr>
                      {activePdfPreview.data.columns.map(col => (
                        <th key={col.key} className="px-3 py-2 border-b border-slate-200">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePdfPreview.data.rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {activePdfPreview.data.columns.map(c => (
                          <td key={c.key} className="px-3 py-2 text-slate-800 whitespace-nowrap">
                            {r[c.key] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setActivePdfPreview(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadPdf(activePdfPreview.data);
                  setActivePdfPreview(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span>Download {activePdfPreview.filename}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
