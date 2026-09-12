import { createPortal } from 'react-dom';
import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Upload,
  History,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../lib/auth-context';
import {
  fetchFacultyAssignedSections,
  fetchStudentsBySection,
  fetchFacultyAttendanceSummaryRecords,
  saveAttendanceSummaryBatch,
  fetchDynamicAttendanceImportHistory,
  parseDynamicAttendanceExcel,
  StudentMember,
  Section,
  StudentAttendanceSummaryRecord,
  DynamicAttendanceImportDataset
} from '../lib/academic-api';

export function FacultyAttendanceManagementView() {
  const { user } = useAuth();
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('CSE-C');

  const [students, setStudents] = useState<StudentMember[]>([]);
  const [summaryRecords, setSummaryRecords] = useState<StudentAttendanceSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'LOWEST' | 'HIGHEST' | 'NAME' | 'REGNO'>('LOWEST');

  // Selected Student Drawer
  const [selectedStudentRecord, setSelectedStudentRecord] = useState<StudentAttendanceSummaryRecord | null>(null);

  // Excel Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ReturnType<typeof parseDynamicAttendanceExcel> | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);

  // History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistory, setImportHistory] = useState<DynamicAttendanceImportDataset[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    fetchFacultyAssignedSections(user.email).then(secs => {
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

  // Dynamic Subject list derived from imports
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

  // Combined Roster & Attendance Data
  const processedStudentRecords = useMemo(() => {
    // Combine students roster with summaryRecords
    const recordMap = new Map<string, StudentAttendanceSummaryRecord>();
    summaryRecords.forEach(r => {
      recordMap.set(r.regno.toLowerCase(), r);
    });

    return students.map(st => {
      const rec = recordMap.get(st.regno.toLowerCase());
      const overallPct = rec ? Math.round(rec.overallAttendancePercentage) : 85;
      
      let status: 'HEALTHY' | 'WATCH' | 'RISK' = 'HEALTHY';
      if (overallPct < 75) status = 'RISK';
      else if (overallPct < 85) status = 'WATCH';

      return {
        student: st,
        record: rec || {
          regno: st.regno,
          studentName: st.name,
          section: st.section || selectedSection,
          overallAttendancePercentage: overallPct,
          subjectAttendances: [
            { subjectName: 'Data Analytics', percentage: Math.max(60, overallPct - 3) },
            { subjectName: 'Cloud Computing', percentage: Math.min(98, overallPct + 4) },
            { subjectName: 'Embedded Programming', percentage: Math.max(65, overallPct - 2) },
            { subjectName: 'Generative AI', percentage: Math.min(95, overallPct + 2) }
          ]
        },
        overallPct,
        status
      };
    });
  }, [students, summaryRecords, selectedSection]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    let list = processedStudentRecords.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.regno.toLowerCase().includes(q) ||
        item.student.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'HEALTHY' && item.status === 'HEALTHY') ||
        (statusFilter === 'WATCH' && item.status === 'WATCH') ||
        (statusFilter === 'RISK' && item.status === 'RISK');

      const matchesSubject =
        subjectFilter === 'ALL' ||
        (item.record.subjectAttendances &&
          item.record.subjectAttendances.some(s => s.subjectName === subjectFilter));

      return matchesSearch && matchesStatus && matchesSubject;
    });

    list.sort((a, b) => {
      if (sortOption === 'LOWEST') return a.overallPct - b.overallPct;
      if (sortOption === 'HIGHEST') return b.overallPct - a.overallPct;
      if (sortOption === 'NAME') return a.student.name.localeCompare(b.student.name);
      if (sortOption === 'REGNO') return a.student.regno.localeCompare(b.student.regno);
      return 0;
    });

    return list;
  }, [processedStudentRecords, searchQuery, statusFilter, subjectFilter, sortOption]);

  // Top KPI Stats
  const kpiStats = useMemo(() => {
    const total = processedStudentRecords.length;
    const atRiskCount = processedStudentRecords.filter(s => s.status === 'RISK').length;
    const trackedSubjectsCount = dynamicSubjects.length > 0 ? dynamicSubjects.length : 4;

    const avgAttendance =
      total > 0
        ? Math.round(processedStudentRecords.reduce((acc, curr) => acc + curr.overallPct, 0) / total)
        : 85;

    return {
      total,
      trackedSubjectsCount,
      avgAttendance,
      atRiskCount
    };
  }, [processedStudentRecords, dynamicSubjects]);

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = (students.length > 0 ? students : [
      { regno: '2024CSE001', name: 'Aditya Varma' },
      { regno: '2024CSE002', name: 'Bhavna Sharma' },
      { regno: '2024CSE003', name: 'Chetan Kumar' }
    ]).map(s => ({
      'Register Number': s.regno,
      'Student Name': s.name,
      'Data Analytics': 82,
      'Cloud Computing': 88,
      'Embedded Programming': 79,
      'Generative AI': 91,
      'Compiler Design': 85,
      'Overall Attendance %': 85
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

  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true);
    const h = await fetchDynamicAttendanceImportHistory(user?.email);
    setImportHistory(h);
  };

  // Selected Student Subject Breakdown stats
  const studentDetailStats = useMemo(() => {
    if (!selectedStudentRecord || !selectedStudentRecord.subjectAttendances) {
      return { subjects: [], highest: null, lowest: null };
    }
    const list = [...selectedStudentRecord.subjectAttendances];
    if (list.length === 0) return { subjects: [], highest: null, lowest: null };

    list.sort((a, b) => b.percentage - a.percentage);
    return {
      subjects: list,
      highest: list[0],
      lowest: list[list.length - 1]
    };
  }, [selectedStudentRecord]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <CalendarCheck size={14} className="text-blue-600" />
            Faculty Workspace · Attendance Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Attendance Management
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Monitor subject-wise attendance and identify students who need academic care across assigned section cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleOpenHistoryModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <History size={15} /> Import History
          </button>

          <button
            onClick={() => {
              setImportStep('upload');
              setExcelFile(null);
              setParsedExcel(null);
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Upload size={16} /> Import Attendance Excel
          </button>
        </div>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.total}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Tracked in Section {selectedSection}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracked Subjects</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.trackedSubjectsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Dynamic subject headers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Attendance</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : `${kpiStats.avgAttendance}%`}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Section average attendance</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Students At Risk</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-2">
            {loading ? '...' : kpiStats.atRiskCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Below 75% attendance cutoff</p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student by name, register number, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {assignedSections.length > 0 ? (
                assignedSections.map(sec => (
                  <option key={sec.id || sec.name} value={sec.name}>
                    Section {sec.name}
                  </option>
                ))
              ) : (
                <option value="CSE-C">Section CSE-C</option>
              )}
            </select>
          </div>

          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            {dynamicSubjects.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy (≥85%)</option>
            <option value="WATCH">Watch (75-84%)</option>
            <option value="RISK">At Risk (&lt;75%)</option>
          </select>

          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="LOWEST">Sort: Lowest Attendance</option>
            <option value="HIGHEST">Sort: Highest Attendance</option>
            <option value="NAME">Sort: Name (A-Z)</option>
            <option value="REGNO">Sort: Register Number</option>
          </select>
        </div>
      </div>

      {/* Main Student Card Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CalendarCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Loading Student Attendance...</h3>
          <p className="text-slate-500 text-xs mt-1">Connecting to Supabase section database...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No student attendance records found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL' || subjectFilter !== 'ALL'
              ? 'Try resetting your search filters.'
              : 'Import attendance data via Excel to track student attendance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map(item => {
            const { student, record, overallPct, status } = item;
            const initials = student.name.slice(0, 2).toUpperCase();

            // Status Badge Config
            let statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
              </span>
            );
            let barColor = 'bg-emerald-500';

            if (status === 'WATCH') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Watch
                </span>
              );
              barColor = 'bg-amber-500';
            } else if (status === 'RISK') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> At Risk
                </span>
              );
              barColor = 'bg-rose-500';
            }

            return (
              <div
                key={student.id || student.regno}
                onClick={() => setSelectedStudentRecord(record)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {initials}
                    </div>
                    {statusBadge}
                  </div>

                  {/* Student Info */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 mb-4">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {student.regno}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {student.department || 'CSE'} • Section {selectedSection} • Sem {student.semester || '4'}
                    </span>
                  </div>

                  {/* Metric Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-500">Overall Attendance</span>
                      <span className="font-extrabold text-slate-900 text-sm">{overallPct}%</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500">
                  <span className="font-medium">Subject Breakdown</span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    View Details <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Detail Drawer */}
      {selectedStudentRecord && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedStudentRecord(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] max-h-[800px] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedStudentRecord.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedStudentRecord.studentName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedStudentRecord.regno}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Section {selectedSection}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentRecord(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Overall Attendance Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Academic Summary</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedStudentRecord.overallAttendancePercentage >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedStudentRecord.overallAttendancePercentage >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedStudentRecord.overallAttendancePercentage >= 85
                      ? 'Healthy Standing'
                      : selectedStudentRecord.overallAttendancePercentage >= 75
                      ? 'Needs Attention (Watch)'
                      : 'At Risk (<75%)'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">
                    {Math.round(selectedStudentRecord.overallAttendancePercentage)}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Cumulative Attendance Rate</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedStudentRecord.overallAttendancePercentage >= 85
                        ? 'bg-emerald-500'
                        : selectedStudentRecord.overallAttendancePercentage >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, selectedStudentRecord.overallAttendancePercentage))}%` }}
                  />
                </div>
              </div>

              {/* Highest & Lowest Attendance Highlights */}
              {studentDetailStats.highest && studentDetailStats.lowest && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                      Highest Attendance
                    </span>
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      {studentDetailStats.highest.subjectName}
                    </strong>
                    <span className="text-sm font-black text-emerald-700">
                      {Math.round(studentDetailStats.highest.percentage)}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                      Lowest Attendance
                    </span>
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      {studentDetailStats.lowest.subjectName}
                    </strong>
                    <span className="text-sm font-black text-rose-700">
                      {Math.round(studentDetailStats.lowest.percentage)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Subject Comparison Horizontal Visualizer */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Subject-Wise Attendance Breakdown
                </h3>

                {studentDetailStats.subjects.length === 0 ? (
                  <p className="text-xs text-slate-500">No subject attendance details recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {studentDetailStats.subjects.map(s => {
                      const pct = Math.round(s.percentage);
                      let subBarColor = 'bg-emerald-500';
                      if (pct < 75) subBarColor = 'bg-rose-500';
                      else if (pct < 85) subBarColor = 'bg-amber-500';

                      return (
                        <div key={s.subjectName} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{s.subjectName}</span>
                            <span className="font-extrabold text-slate-900">{pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full rounded-full ${subBarColor}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedStudentRecord(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Excel Import Modal */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Attendance Data Engine</span>
                <h2 className="text-lg font-bold text-slate-900">Import Attendance Excel</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {importStep === 'upload' ? (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">Need the standard Excel format?</h4>
                      <p className="text-xs text-blue-700 mt-0.5">Download pre-filled student template for Section {selectedSection}.</p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50/50 transition-all">
                    <FileSpreadsheet size={36} className="mx-auto text-blue-600 mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Choose Excel File</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Supports .xlsx and .xls attendance spreadsheets</p>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="excel-attendance-file-input"
                    />
                    <label
                      htmlFor="excel-attendance-file-input"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all inline-block"
                    >
                      Browse Excel File
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview step */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>File: {excelFile?.name}</span>
                      <span>Matched {parsedExcel?.matchedRows.length} Students</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Detected Dynamic Subject Headers</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedExcel?.subjectHeaders.map(h => (
                          <span key={h} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-slate-700">Import Mode</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setImportMode('replace')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            importMode === 'replace' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Replace Existing
                        </button>
                        <button
                          onClick={() => setImportMode('merge')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            importMode === 'merge' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Merge Update
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl">
                Cancel
              </button>
              {importStep === 'preview' && (
                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {isProcessing ? 'Saving to Database...' : 'Confirm & Save Attendance'}
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Import History Modal */}
      {showHistoryModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Audit Logs</span>
                <h2 className="text-lg font-bold text-slate-900">Attendance Import History</h2>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {importHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous attendance import logs found for Section {selectedSection}.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {importHistory.map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block font-bold">{item.fileName}</strong>
                        <span className="text-slate-400 text-[11px]">{new Date(item.importedAt).toLocaleString()} • {item.importedBy}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold font-mono">
                          {item.studentCount} Students
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl">
                Close History
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

