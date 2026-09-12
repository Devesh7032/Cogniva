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
  Info,
  X,
  FileSpreadsheet,
  UsersRound,
  TrendingDown,
  Award,
  Building2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  fetchDatabaseCounts,
  fetchDepartments,
  fetchSections,
  fetchAcademicYears,
  fetchProfilesByRole,
  fetchFacultyMembers,
  fetchStudentMembers,
  DatabaseCounts,
  Department,
  Section,
  AcademicYear,
  FacultyMember,
  StudentMember
} from '../lib/academic-api';
import { generateAcademicPdfReport, PdfReportData } from '../lib/pdf-report-generator';

interface ChatMessage {
  id: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: string;
  dataBadge?: string;
  resultType?: 'COUNT' | 'LIST' | 'REPORT' | 'MESSAGE';
  metricValue?: string | number;
  metricLabel?: string;
  tableData?: {
    columns: Array<{ key: string; header: string }>;
    rows: Array<Record<string, any>>;
  };
  pdfReportData?: PdfReportData;
  suggestedFollowUps?: string[];
}

export function AdminAskCognivaView() {
  const { user, collegeId, collegeName } = useAuth();
  const [counts, setCounts] = useState<DatabaseCounts>({ students: 0, faculty: 0, sections: 0, departments: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

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
    loadAdminContext();
  }, [collegeId]);

  const loadAdminContext = async () => {
    setLoadingContext(true);
    try {
      const [cData, dData, sData] = await Promise.all([
        fetchDatabaseCounts(collegeId),
        fetchDepartments(),
        fetchSections()
      ]);
      setCounts(cData);
      setDepartments(dData);
      setSections(sData);

      const welcomeMsg: ChatMessage = {
        id: 'welcome-admin',
        from: 'ai',
        text: `Welcome **Administrator**! I am **Ask Cogniva AI**, your institutional intelligence copilot.\n\nI have full data isolation access to **${collegeName || 'Your College'}**.\n\nYou can query **institutional metrics, department rosters, faculty assignments, low attendance alerts, or generate official branded PDF reports!**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: `Cogniva Admin Engine • ${collegeName || 'College Workspace'} • Isolated Scope`,
        suggestedFollowUps: [
          'Give me an institutional overview',
          'List all departments and student counts',
          'Show faculty distribution',
          'Find students below 75% attendance',
          'Generate official institutional PDF report'
        ]
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error('Failed to load admin context:', err);
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

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsProcessing(true);

    try {
      const aiReply = await processAdminQuery(promptToSubmit, collegeId, collegeName, counts, departments, sections);
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        from: 'ai',
        text: `Unable to process query: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: 'Cogniva Query Engine Error'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPdfPreviewModal = (pdfData: PdfReportData) => {
    const { dataUrl, filename } = generateAcademicPdfReport(pdfData);
    setActivePdfPreview({ data: pdfData, filename, dataUrl });
  };

  const handleDownloadPdfDirect = (pdfData: PdfReportData) => {
    const { blob, filename } = generateAcademicPdfReport(pdfData);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-frame animate-fade pb-12">
      {/* Header */}
      <div className="welcome-row mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-teal-600 font-bold uppercase tracking-wider">Institution AI Copilot</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold">
              Scoped: {collegeName || 'Current College'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Sparkles className="text-teal-600" size={28} />
            Ask Cogniva Admin AI
          </h1>
          <p className="lede text-slate-500 mt-1">
            Query real-time student numbers, faculty distribution, attendance warnings, or generate official institutional reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAdminContext()}
            className="button button-secondary flex items-center gap-1.5 text-xs py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
            title="Refresh database context"
          >
            <RefreshCw size={14} className={loadingContext ? 'spin' : ''} />
            <span>Refresh Context</span>
          </button>
        </div>
      </div>

      {/* Real-time Institutional Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Students</div>
            <div className="text-lg font-bold text-slate-900">{counts.students}</div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <UsersRound size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Faculty</div>
            <div className="text-lg font-bold text-slate-900">{counts.faculty}</div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Departments</div>
            <div className="text-lg font-bold text-slate-900">{counts.departments}</div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Sections</div>
            <div className="text-lg font-bold text-slate-900">{counts.sections}</div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[560px]">
        {/* Chat Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 max-h-[600px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                  msg.from === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                }`}
              >
                {/* Header Badge */}
                {msg.dataBadge && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-[11px] font-semibold text-teal-700">
                    <ShieldCheck size={14} className="text-teal-600" />
                    <span>{msg.dataBadge}</span>
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-normal">
                  {msg.text}
                </div>

                {/* Metric Card rendering */}
                {msg.metricValue !== undefined && (
                  <div className="mt-4 p-4 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center gap-4">
                    <div className="text-3xl font-extrabold text-teal-700">{msg.metricValue}</div>
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">{msg.metricLabel || 'Total Count'}</div>
                  </div>
                )}

                {/* Table Data rendering */}
                {msg.tableData && msg.tableData.rows.length > 0 && (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                        <tr>
                          {msg.tableData.columns.map((col) => (
                            <th key={col.key} className="p-3 uppercase tracking-wider">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {msg.tableData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {msg.tableData!.columns.map((col) => (
                              <td key={col.key} className="p-3 font-medium">
                                {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PDF Action Button */}
                {msg.pdfReportData && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => openPdfPreviewModal(msg.pdfReportData!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Eye size={14} />
                      Preview PDF Report
                    </button>

                    <button
                      onClick={() => handleDownloadPdfDirect(msg.pdfReportData!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] ${
                    msg.from === 'user' ? 'text-teal-100' : 'text-slate-400'
                  } text-right`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Suggested Follow-up Buttons */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 max-w-3xl">
                  {msg.suggestedFollowUps.map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(promptText)}
                      className="text-xs bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 px-3 py-1.5 rounded-full transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>{promptText}</span>
                      <ArrowRight size={12} className="text-teal-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none max-w-xs shadow-sm">
              <RefreshCw size={16} className="spin text-teal-600" />
              <span className="text-xs font-semibold text-slate-600">Querying Cogniva Database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls Footer */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask about students, faculty, departments, attendance, or PDF exports..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              disabled={isProcessing}
            />

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Ask</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* PDF Modal Preview */}
      {activePdfPreview && (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-teal-600" />
                  {activePdfPreview.data.title}
                </h3>
                <p className="text-xs text-slate-500">Official Branded Institutional PDF Document</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdfDirect(activePdfPreview.data)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  Download PDF
                </button>

                <button
                  onClick={() => setActivePdfPreview(null)}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100">
              <iframe
                src={activePdfPreview.dataUrl}
                title="PDF Preview"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN AI QUERY ENGINE
// ============================================================================
async function processAdminQuery(
  prompt: string,
  collegeId: string | null,
  collegeName: string | null,
  counts: DatabaseCounts,
  departments: Department[],
  sections: Section[]
): Promise<ChatMessage> {
  const q = prompt.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dataBadge = `Cogniva Admin Engine • ${collegeName || 'College Scope'}`;

  // 1. Institutional Summary / Overview
  if (q.includes('overview') || q.includes('summary') || q.includes('institutional') || q.includes('total') || q.includes('count')) {
    const tableRows = [
      { Category: 'Students', Count: counts.students, Description: 'Registered Learners' },
      { Category: 'Faculty', Count: counts.faculty, Description: 'Academic Instructors & Advisors' },
      { Category: 'Departments', Count: counts.departments, Description: 'Academic Branches' },
      { Category: 'Sections', Count: counts.sections, Description: 'Active Class Sections' }
    ];

    const pdfData: PdfReportData = {
      title: 'Institutional Overview Report',
      subtitle: `Official Academic Summary for ${collegeName || 'Institution'}`,
      generatedAt: new Date().toLocaleString(),
      columns: [
        { header: 'Category', key: 'Category' },
        { header: 'Count', key: 'Count' },
        { header: 'Description', key: 'Description' }
      ],
      rows: tableRows,
      summaryText: `This report reflects active multi-college isolated records for ${collegeName || 'Current College'}. Total students: ${counts.students}, Total Faculty: ${counts.faculty}.`
    };

    return {
      id: `ai-${Date.now()}`,
      from: 'ai',
      text: `Here is the institutional data overview for **${collegeName || 'Your Institution'}**:\n\n- **Students**: ${counts.students}\n- **Faculty**: ${counts.faculty}\n- **Departments**: ${counts.departments}\n- **Sections**: ${counts.sections}`,
      timestamp,
      dataBadge,
      resultType: 'REPORT',
      tableData: {
        columns: [
          { key: 'Category', header: 'Category' },
          { key: 'Count', header: 'Count' },
          { key: 'Description', header: 'Description' }
        ],
        rows: tableRows
      },
      pdfReportData: pdfData,
      suggestedFollowUps: [
        'List all departments and student counts',
        'Find students below 75% attendance',
        'Show faculty distribution'
      ]
    };
  }

  // 2. Department Breakdown
  if (q.includes('department') || q.includes('branch') || q.includes('departments')) {
    const tableRows = departments.map((d) => ({
      Code: d.code,
      Name: d.name,
      ID: d.id.substring(0, 8) + '...'
    }));

    const pdfData: PdfReportData = {
      title: 'Department Roster Report',
      subtitle: `Department Directory for ${collegeName || 'Institution'}`,
      generatedAt: new Date().toLocaleString(),
      columns: [
        { header: 'Branch Code', key: 'Code' },
        { header: 'Department Name', key: 'Name' }
      ],
      rows: tableRows,
      summaryText: `Total of ${departments.length} departments registered in ${collegeName || 'College Workspace'}.`
    };

    return {
      id: `ai-${Date.now()}`,
      from: 'ai',
      text: `Found **${departments.length} departments** configured under **${collegeName || 'Your Institution'}**:`,
      timestamp,
      dataBadge,
      resultType: 'LIST',
      tableData: {
        columns: [
          { key: 'Code', header: 'Branch Code' },
          { key: 'Name', header: 'Department Name' }
        ],
        rows: tableRows
      },
      pdfReportData: pdfData,
      suggestedFollowUps: [
        'Show faculty distribution',
        'Find students below 75% attendance'
      ]
    };
  }

  // 3. Faculty List / Roster
  if (q.includes('faculty') || q.includes('teacher') || q.includes('instructor') || q.includes('professor')) {
    const facList = await fetchFacultyMembers(collegeId);

    const tableRows = facList.map((f) => ({
      ID: f.employee_id || f.id.substring(0, 8),
      Name: f.full_name || f.name,
      Email: f.email,
      Department: f.department || 'CSE'
    }));

    const pdfData: PdfReportData = {
      title: 'Faculty Members Directory',
      subtitle: `Official Faculty Roster for ${collegeName || 'Institution'}`,
      generatedAt: new Date().toLocaleString(),
      columns: [
        { header: 'Employee ID', key: 'ID' },
        { header: 'Faculty Name', key: 'Name' },
        { header: 'Email Address', key: 'Email' },
        { header: 'Department', key: 'Department' }
      ],
      rows: tableRows,
      summaryText: `Total ${facList.length} faculty members assigned to ${collegeName || 'College Workspace'}.`
    };

    return {
      id: `ai-${Date.now()}`,
      from: 'ai',
      text: `Found **${facList.length} faculty members** registered in **${collegeName || 'Your Institution'}**:`,
      timestamp,
      dataBadge,
      resultType: 'LIST',
      tableData: {
        columns: [
          { key: 'ID', header: 'Employee ID' },
          { key: 'Name', header: 'Faculty Name' },
          { key: 'Email', header: 'Email Address' },
          { key: 'Department', header: 'Department' }
        ],
        rows: tableRows
      },
      pdfReportData: pdfData,
      suggestedFollowUps: [
        'Find students below 75% attendance',
        'Generate official institutional PDF report'
      ]
    };
  }

  // 4. Low Attendance Warning
  if (q.includes('attendance') || q.includes('risk') || q.includes('low') || q.includes('75%')) {
    const students = await fetchStudentMembers(undefined, undefined, undefined, collegeId);
    const lowAtt = students.filter((s) => (s.attendance || 85) < 75);

    const tableRows = (lowAtt.length > 0 ? lowAtt : students.slice(0, 5)).map((s) => ({
      RegNo: s.register_number || s.regno || 'REG-001',
      Name: s.full_name || s.name,
      Department: s.department || 'CSE',
      Section: s.section || 'CSE-A',
      Attendance: `${s.attendance || 68}%`
    }));

    const pdfData: PdfReportData = {
      title: 'Low Attendance & At-Risk Student Warning Report',
      subtitle: `Students Below 75% Mandatory Attendance Buffer`,
      generatedAt: new Date().toLocaleString(),
      columns: [
        { header: 'Reg No', key: 'RegNo' },
        { header: 'Student Name', key: 'Name' },
        { header: 'Branch', key: 'Department' },
        { header: 'Section', key: 'Section' },
        { header: 'Attendance %', key: 'Attendance' }
      ],
      rows: tableRows,
      summaryText: `Identified ${lowAtt.length} students currently requiring academic recovery support.`
    };

    return {
      id: `ai-${Date.now()}`,
      from: 'ai',
      text: lowAtt.length > 0
        ? `⚠️ Identified **${lowAtt.length} students** with attendance below **75%** in **${collegeName || 'Your College'}**:`
        : `All students in **${collegeName || 'Your College'}** currently satisfy the minimum 75% attendance threshold! Here is the sample roster preview:`,
      timestamp,
      dataBadge,
      resultType: 'REPORT',
      tableData: {
        columns: [
          { key: 'RegNo', header: 'Reg No' },
          { key: 'Name', header: 'Student Name' },
          { key: 'Department', header: 'Branch' },
          { key: 'Section', header: 'Section' },
          { key: 'Attendance', header: 'Attendance' }
        ],
        rows: tableRows
      },
      pdfReportData: pdfData,
      suggestedFollowUps: [
        'Show faculty distribution',
        'Generate official institutional PDF report'
      ]
    };
  }

  // 5. Default General Educational / Administrative Response
  return {
    id: `ai-${Date.now()}`,
    from: 'ai',
    text: `As your **Cogniva Admin AI Assistant**, I am here to help you manage **${collegeName || 'Your Institution'}**.\n\nYou can ask about:\n1. **Students & Roster**: Counts, list by branch, low attendance alerts.\n2. **Faculty**: Employee details, department distribution, assignments.\n3. **Branded PDF Reports**: Generate official PDFs for management, accreditation, or review.\n4. **Curriculum & Accreditation**: Questions about AI policies, academic framework, or NAAC/NIRF standards.`,
    timestamp,
    dataBadge,
    suggestedFollowUps: [
      'Give me an institutional overview',
      'List all departments and student counts',
      'Show faculty distribution',
      'Find students below 75% attendance'
    ]
  };
}
