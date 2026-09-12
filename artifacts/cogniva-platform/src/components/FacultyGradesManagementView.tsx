import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Upload,
  History,
  FileSpreadsheet,
  Download,
  Users,
  Award,
  TrendingUp,
  X,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookmarkCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../lib/auth-context';
import {
  fetchFacultyAssignedSections,
  fetchStudentsBySection,
  fetchFacultyGradeSummaryRecords,
  saveGradeSummaryBatch,
  fetchDynamicGradeImportHistory,
  parseDynamicGradeExcel,
  StudentMember,
  Section,
  StudentGradeSummaryRecord,
  DynamicGradeImportDataset
} from '../lib/academic-api';

export function FacultyGradesManagementView() {
  const { user } = useAuth();
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('CSE-C');

  const [students, setStudents] = useState<StudentMember[]>([]);
  const [summaryRecords, setSummaryRecords] = useState<StudentGradeSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'HIGHEST' | 'LOWEST' | 'NAME' | 'REGNO'>('HIGHEST');

  // Selected Student Drawer
  const [selectedRecord, setSelectedRecord] = useState<StudentGradeSummaryRecord | null>(null);

  // Excel Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ReturnType<typeof parseDynamicGradeExcel> | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistory, setImportHistory] = useState<DynamicGradeImportDataset[]>([]);

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

  // Derive unique dynamic subjects
  const dynamicSubjects = useMemo(() => {
    const set = new Set<string>();
    summaryRecords.forEach(r => {
      if (r.subjectGrades) {
        r.subjectGrades.forEach(s => set.add(s.subjectName));
      }
    });
    return Array.from(set);
  }, [summaryRecords]);

  // Combined Roster & Grades
  const processedRecords = useMemo(() => {
    const recMap = new Map<string, StudentGradeSummaryRecord>();
    summaryRecords.forEach(r => {
      recMap.set(r.regno.toLowerCase(), r);
    });

    return students.map(st => {
      const rec = recMap.get(st.regno.toLowerCase());
      const overallGrade = rec?.overallGrade || 'A';

      const fullRecord: StudentGradeSummaryRecord = rec || {
        id: `grd-${st.id}`,
        regno: st.regno,
        studentName: st.name,
        studentEmail: st.email,
        department: st.department,
        section: st.section || selectedSection,
        overallGrade: overallGrade,
        subjectGrades: [
          { subjectName: 'Data Analytics', grade: 'A' },
          { subjectName: 'Cloud Computing', grade: 'A+' },
          { subjectName: 'Embedded Programming', grade: 'B+' },
          { subjectName: 'Generative AI', grade: 'A' },
          { subjectName: 'Compiler Design', grade: 'B' }
        ],
        updatedAt: new Date().toISOString()
      };

      return {
        student: st,
        record: fullRecord,
        overallGrade
      };
    });
  }, [students, summaryRecords, selectedSection]);

  // Grade Rank Weights for sorting
  const gradeRank = (g: string) => {
    const u = (g || '').toUpperCase();
    if (u === 'O') return 7;
    if (u === 'A+') return 6;
    if (u === 'A') return 5;
    if (u === 'B+') return 4;
    if (u === 'B') return 3;
    if (u === 'C') return 2;
    if (u === 'F') return 1;
    return 0;
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let list = processedRecords.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.regno.toLowerCase().includes(q) ||
        item.student.email.toLowerCase().includes(q);

      const matchesGrade =
        gradeFilter === 'ALL' ||
        (item.overallGrade || 'A').toUpperCase() === gradeFilter.toUpperCase();

      return matchesSearch && matchesGrade;
    });

    list.sort((a, b) => {
      if (sortOption === 'HIGHEST') return gradeRank(b.overallGrade || 'A') - gradeRank(a.overallGrade || 'A');
      if (sortOption === 'LOWEST') return gradeRank(a.overallGrade || 'A') - gradeRank(b.overallGrade || 'A');
      if (sortOption === 'NAME') return a.student.name.localeCompare(b.student.name);
      if (sortOption === 'REGNO') return a.student.regno.localeCompare(b.student.regno);
      return 0;
    });

    return list;
  }, [processedRecords, searchQuery, gradeFilter, sortOption]);

  // Top KPI Stats
  const kpiStats = useMemo(() => {
    const total = processedRecords.length;
    const trackedSubjectsCount = dynamicSubjects.length > 0 ? dynamicSubjects.length : 5;

    // Needing Attention count (C or F grade)
    const needingAttentionCount = processedRecords.filter(
      r => (r.overallGrade || 'A').toUpperCase() === 'C' || (r.overallGrade || 'A').toUpperCase() === 'F'
    ).length;

    // Top grade
    const counts: Record<string, number> = {};
    processedRecords.forEach(r => {
      const g = (r.overallGrade || 'A').toUpperCase();
      counts[g] = (counts[g] || 0) + 1;
    });
    let topGrade = 'A';
    let maxC = 0;
    Object.entries(counts).forEach(([g, c]) => {
      if (c > maxC) {
        maxC = c;
        topGrade = g;
      }
    });

    return {
      total,
      trackedSubjectsCount,
      topGrade,
      needingAttentionCount
    };
  }, [processedRecords, dynamicSubjects]);

  // Grade Distribution stats for selected student
  const selectedGradeDistribution = useMemo(() => {
    if (!selectedRecord || !selectedRecord.subjectGrades) return [];
    const dist: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0 };
    selectedRecord.subjectGrades.forEach(sg => {
      const g = sg.grade.toUpperCase();
      if (dist[g] !== undefined) dist[g]++;
      else dist[g] = 1;
    });
    return Object.entries(dist).map(([grade, count]) => ({ grade, count }));
  }, [selectedRecord]);

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = (students.length > 0 ? students : [
      { regno: '2024CSE001', name: 'Aditya Varma' },
      { regno: '2024CSE002', name: 'Bhavna Sharma' }
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

  // Handle File Select
  const handleFileSelect = async (file: File) => {
    setExcelFile(file);
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseDynamicGradeExcel(buffer, students);
      setParsedExcel(parsed);
      setImportStep('preview');
    } catch {
      setToastMessage('Error parsing Excel file. Please check format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Import
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
        setToastMessage(`Successfully saved grades for ${res.count} students!`);
        setShowImportModal(false);
        setImportStep('upload');
        setExcelFile(null);
        setParsedExcel(null);
        await loadRosterAndGrades();
      }
    } catch {
      setToastMessage('Failed to save grade records.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    const h = await fetchDynamicGradeImportHistory(user?.email);
    setImportHistory(h);
  };

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
            <BookmarkCheck size={14} className="text-blue-600" />
            Faculty Workspace · Grade Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Grade Management
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Review subject-wise letter grades, overall academic standings, and grade distributions across assigned sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleOpenHistory}
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
            <Upload size={16} /> Import Grade Excel
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
          <p className="text-xs text-slate-500 mt-1 font-medium">Dynamic course modules</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dominant Grade Tier</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.topGrade} Grade
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Most frequent student grade</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Needing Attention</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-2">
            {loading ? '...' : kpiStats.needingAttentionCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Students with C or F grade</p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

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
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Grades</option>
            <option value="O">O Grade</option>
            <option value="A+">A+ Grade</option>
            <option value="A">A Grade</option>
            <option value="B+">B+ Grade</option>
            <option value="B">B Grade</option>
            <option value="C">C Grade</option>
            <option value="F">F Grade / Arrear</option>
          </select>

          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="HIGHEST">Sort: Highest Grade</option>
            <option value="LOWEST">Sort: Lowest Grade</option>
            <option value="NAME">Sort: Name (A-Z)</option>
            <option value="REGNO">Sort: Register Number</option>
          </select>
        </div>
      </div>

      {/* Main Student Card Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <BookmarkCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Loading Student Grades...</h3>
          <p className="text-slate-500 text-xs mt-1">Connecting to section database...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Award size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No student grade records found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            {searchQuery || gradeFilter !== 'ALL'
              ? 'Try resetting your search filters.'
              : 'Import student grades via Excel to view subject standings.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecords.map(item => {
            const { student, record, overallGrade } = item;
            const initials = student.name.slice(0, 2).toUpperCase();

            // Grade Badge Color Config
            let gradeBadge = (
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                Grade {overallGrade}
              </span>
            );

            if (overallGrade === 'O' || overallGrade === 'A+') {
              gradeBadge = (
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  Grade {overallGrade}
                </span>
              );
            } else if (overallGrade === 'C' || overallGrade === 'F') {
              gradeBadge = (
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  Grade {overallGrade}
                </span>
              );
            }

            const subjectCount = record.subjectGrades ? record.subjectGrades.length : 5;

            return (
              <div
                key={student.id || student.regno}
                onClick={() => setSelectedRecord(record)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {initials}
                    </div>
                    {gradeBadge}
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

                  {/* Grade Metric Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Grade</span>
                      <span className="text-2xl font-black text-slate-900">{overallGrade}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-400 block">Course Modules</span>
                      <span className="text-xs font-semibold text-slate-700">{subjectCount} Subjects Tracked</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500">
                  <span className="font-medium">Subject Grades</span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    View Grades <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Detail Drawer */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-lg h-full flex flex-col overflow-hidden animate-slide-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedRecord.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedRecord.studentName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedRecord.regno}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Section {selectedSection}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Overall Grade Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">Overall Letter Grade</span>
                  <span className="text-3xl font-black text-slate-900">
                    Grade {selectedRecord.overallGrade}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 font-medium">Academic Performance Rating</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600 block mb-1">Standing</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs inline-block">
                    {['O', 'A+'].includes(selectedRecord.overallGrade || 'A') ? 'Excellence Tier' : ['A', 'B+'].includes(selectedRecord.overallGrade || 'A') ? 'Good Standing' : 'Needs Support'}
                  </span>
                </div>
              </div>

              {/* Subject-Wise Grades */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Subject-Wise Grades Breakdown
                </h3>

                {selectedRecord.subjectGrades && selectedRecord.subjectGrades.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedRecord.subjectGrades.map(s => (
                      <div key={s.subjectName} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{s.subjectName}</span>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          Grade {s.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No subject grade breakdown recorded.</p>
                )}
              </div>

              {/* Grade Distribution Visualization */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Subject Grade Frequency Distribution
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                  {selectedGradeDistribution.map(item => (
                    <div key={item.grade} className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-slate-700 w-8">{item.grade}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${selectedRecord.subjectGrades ? (item.count / selectedRecord.subjectGrades.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-4 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Grade Data Engine</span>
                <h2 className="text-lg font-bold text-slate-900">Import Grade Excel</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {importStep === 'upload' ? (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">Need Grade Excel template?</h4>
                      <p className="text-xs text-blue-700 mt-0.5">Download pre-filled student template for Section {selectedSection}.</p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50/50 transition-all">
                    <FileSpreadsheet size={36} className="mx-auto text-blue-600 mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Select Grade Spreadsheet</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Supports .xlsx and .xls grade files</p>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="excel-grade-file-input"
                    />
                    <label
                      htmlFor="excel-grade-file-input"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm inline-block"
                    >
                      Browse Excel File
                    </label>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>File: {excelFile?.name}</span>
                    <span>Matched {parsedExcel?.matchedRows.length} Students</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Detected Dynamic Course Headers</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedExcel?.subjectHeaders.map(h => (
                        <span key={h} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
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
                  {isProcessing ? 'Saving to Database...' : 'Confirm & Save Grades'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Audit Logs</span>
                <h2 className="text-lg font-bold text-slate-900">Grade Import History</h2>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {importHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous grade import logs found for Section {selectedSection}.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {importHistory.map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block font-bold">{item.fileName}</strong>
                        <span className="text-slate-400 text-[11px]">{new Date(item.importedAt).toLocaleString()} • {item.importedBy}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold font-mono">
                        {item.studentCount} Records
                      </span>
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
      )}
    </div>
  );
}
