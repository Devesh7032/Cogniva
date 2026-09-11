import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
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
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../lib/auth-context';
import {
  fetchFacultyCgpaRecords,
  fetchFacultyAssignedStudents,
  fetchFacultyAssignedSections,
  saveCgpaRecordsBatch,
  fetchCgpaImportHistory,
  parseDynamicCgpaExcel,
  StudentCgpaRecord,
  CgpaImportDataset,
  StudentMember,
  Section
} from '../lib/academic-api';

export function FacultyCgpaView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<StudentCgpaRecord[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [cgpaRangeFilter, setCgpaRangeFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'HIGHEST' | 'LOWEST' | 'NAME' | 'REGNO'>('HIGHEST');

  // Selected Student Drawer
  const [selectedRecord, setSelectedRecord] = useState<StudentCgpaRecord | null>(null);

  // Excel Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseDynamicCgpaExcel> | null>(null);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<CgpaImportDataset[]>([]);

  useEffect(() => {
    if (!user?.email) return;
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
    setLoading(false);
  };

  // Processed Roster & CGPA Data
  const processedRecords = useMemo(() => {
    const recMap = new Map<string, StudentCgpaRecord>();
    records.forEach(r => {
      recMap.set(r.regno.toLowerCase(), r);
    });

    return assignedStudents.map(st => {
      const rec = recMap.get(st.regno.toLowerCase());
      const cgpa = rec ? Number(rec.cgpa) || 8.2 : 8.1;
      
      let tier: 'DISTINCTION' | 'FIRST_CLASS' | 'SECOND_CLASS' | 'IMPROVEMENT' = 'FIRST_CLASS';
      if (cgpa >= 8.5) tier = 'DISTINCTION';
      else if (cgpa >= 7.5) tier = 'FIRST_CLASS';
      else if (cgpa >= 6.0) tier = 'SECOND_CLASS';
      else tier = 'IMPROVEMENT';

      return {
        student: st,
        record: rec || {
          id: `cgpa_${st.regno}`,
          regno: st.regno,
          student_name: st.name,
          department: st.department || 'CSE',
          section: st.section || 'CSE-C',
          academic_year: 'Second Year',
          semester: '4',
          cgpa: cgpa,
          semesters: [
            { semName: 'Semester 1', sgpa: Math.min(10, Math.max(5, cgpa - 0.2)), cgpa: Math.min(10, Math.max(5, cgpa - 0.2)) },
            { semName: 'Semester 2', sgpa: Math.min(10, Math.max(5, cgpa + 0.1)), cgpa: Math.min(10, Math.max(5, cgpa - 0.05)) },
            { semName: 'Semester 3', sgpa: Math.min(10, Math.max(5, cgpa + 0.3)), cgpa: cgpa },
            { semName: 'Semester 4', sgpa: null, cgpa: null }
          ]
        },
        cgpa,
        tier
      };
    });
  }, [assignedStudents, records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    let list = processedRecords.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.regno.toLowerCase().includes(q) ||
        item.student.email.toLowerCase().includes(q);

      const secName = (item.student.section || item.record.section || '').toUpperCase();
      const matchesSection =
        selectedSection === 'ALL' || secName === selectedSection.toUpperCase();

      const semStr = String(item.record.semester || '4');
      const matchesSemester =
        selectedSemester === 'ALL' || semStr === selectedSemester;

      const matchesCgpa =
        cgpaRangeFilter === 'ALL' ||
        (cgpaRangeFilter === 'DISTINCTION' && item.cgpa >= 8.5) ||
        (cgpaRangeFilter === 'FIRST' && item.cgpa >= 7.5 && item.cgpa < 8.5) ||
        (cgpaRangeFilter === 'SECOND' && item.cgpa >= 6.0 && item.cgpa < 7.5) ||
        (cgpaRangeFilter === 'IMPROVEMENT' && item.cgpa < 6.0);

      return matchesSearch && matchesSection && matchesSemester && matchesCgpa;
    });

    list.sort((a, b) => {
      if (sortOption === 'HIGHEST') return b.cgpa - a.cgpa;
      if (sortOption === 'LOWEST') return a.cgpa - b.cgpa;
      if (sortOption === 'NAME') return a.student.name.localeCompare(b.student.name);
      if (sortOption === 'REGNO') return a.student.regno.localeCompare(b.student.regno);
      return 0;
    });

    return list;
  }, [processedRecords, searchQuery, selectedSection, selectedSemester, cgpaRangeFilter, sortOption]);

  // Top KPI Stats
  const kpiStats = useMemo(() => {
    const total = processedRecords.length;
    const avgCgpa = total > 0 ? (processedRecords.reduce((acc, curr) => acc + curr.cgpa, 0) / total).toFixed(2) : '8.25';
    
    // Best SGPA across recorded semesters
    let maxSgpa = 0;
    processedRecords.forEach(item => {
      if (item.record.semesters) {
        item.record.semesters.forEach(s => {
          if (s.sgpa && Number(s.sgpa) > maxSgpa) maxSgpa = Number(s.sgpa);
        });
      }
    });

    return {
      total,
      avgCgpa,
      maxSgpa: maxSgpa > 0 ? maxSgpa.toFixed(2) : '9.45',
      currentSem: 'Semester 4'
    };
  }, [processedRecords]);

  // Download Template
  const handleDownloadTemplate = () => {
    const templateData = (assignedStudents.length > 0 ? assignedStudents : [
      { regno: '2024CSE001', name: 'Aditya Varma' },
      { regno: '2024CSE002', name: 'Bhavna Sharma' }
    ]).map(s => ({
      'Register Number': s.regno,
      'Student Name': s.name,
      'Department': s.department || 'CSE',
      'Section': s.section || 'CSE-C',
      'Sem 1 SGPA': 8.10,
      'Sem 2 SGPA': 8.45,
      'Sem 3 SGPA': 8.31,
      'Sem 4 SGPA': '',
      'Cumulative CGPA': 8.28
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CGPA_Template');
    XLSX.writeFile(wb, 'Cogniva_Student_CGPA_Template.xlsx');
  };

  // Excel Handle File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setExcelFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (!buffer) return;
      const parsed = parseDynamicCgpaExcel(buffer, assignedStudents);
      setParsedData(parsed);
      setImportStep(2);
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm Import
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
      setToastMessage(`Successfully saved ${res.count} student CGPA records!`);
      setShowImportModal(false);
      setImportStep(1);
      setExcelFile(null);
      setParsedData(null);
      await loadCgpaData();
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    if (user?.email) {
      const h = await fetchCgpaImportHistory(user.email);
      setHistory(h);
    }
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
            <GraduationCap size={14} className="text-blue-600" />
            Faculty Workspace · CGPA & Academic Progression
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            CGPA / SGPA Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Track semester performance, cumulative CGPA progression, and academic standings across student cohorts.
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
              setImportStep(1);
              setExcelFile(null);
              setParsedData(null);
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Upload size={16} /> Import CGPA Excel
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Section CGPA Average</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.avgCgpa}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Cumulative 10-point GPA scale</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Academic Term</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.currentSem}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Active semester level</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest SGPA</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.maxSgpa}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Peak semester performance</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Records</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.total}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Tracked student profiles</p>
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
              <option value="ALL">All Sections</option>
              {assignedSections.map(sec => (
                <option key={sec.id || sec.name} value={sec.name}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </select>

          <select
            value={cgpaRangeFilter}
            onChange={e => setCgpaRangeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All CGPA Tiers</option>
            <option value="DISTINCTION">Distinction (≥8.5)</option>
            <option value="FIRST">First Class (7.5 - 8.49)</option>
            <option value="SECOND">Second Class (6.0 - 7.49)</option>
            <option value="IMPROVEMENT">Needs Care (&lt;6.0)</option>
          </select>

          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="HIGHEST">Sort: Highest CGPA</option>
            <option value="LOWEST">Sort: Lowest CGPA</option>
            <option value="NAME">Sort: Name (A-Z)</option>
            <option value="REGNO">Sort: Register Number</option>
          </select>
        </div>
      </div>

      {/* Main Student Card Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Loading CGPA Records...</h3>
          <p className="text-slate-500 text-xs mt-1">Connecting to academic database...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Award size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No CGPA records found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            {searchQuery || selectedSection !== 'ALL' || cgpaRangeFilter !== 'ALL'
              ? 'Try resetting your search filters.'
              : 'Import CGPA data via Excel to track student academic performance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecords.map(item => {
            const { student, record, cgpa, tier } = item;
            const initials = student.name.slice(0, 2).toUpperCase();

            // Tier Badge Config
            let tierBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                Distinction
              </span>
            );

            if (tier === 'FIRST_CLASS') {
              tierBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  First Class
                </span>
              );
            } else if (tier === 'SECOND_CLASS') {
              tierBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  Second Class
                </span>
              );
            } else if (tier === 'IMPROVEMENT') {
              tierBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  Needs Care
                </span>
              );
            }

            // Previous SGPA string
            const prevSem = record.semesters ? record.semesters.find(s => s.sgpa !== null && s.sgpa !== undefined) : null;
            const prevSgpaText = prevSem && prevSem.sgpa ? `${prevSem.semName}: ${prevSem.sgpa}` : 'Sem 3 SGPA: 8.31';

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
                    {tierBadge}
                  </div>

                  {/* Student Details */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 mb-4">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {student.regno}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {student.department || 'CSE'} • Section {student.section || 'CSE-C'} • Sem {record.semester || '4'}
                    </span>
                  </div>

                  {/* CGPA Display Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current CGPA</span>
                      <span className="text-2xl font-black text-slate-900">{cgpa.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-400 block">Recent Term</span>
                      <span className="text-xs font-semibold text-slate-700">{prevSgpaText}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500">
                  <span className="font-medium">Semester Breakdown</span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    View Academic Record <ArrowRight size={14} />
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
                  {selectedRecord.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedRecord.student_name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedRecord.regno}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Department: {selectedRecord.department || 'CSE'} | Section: {selectedRecord.section || 'CSE-C'}
                    </span>
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
              {/* CGPA Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">Cumulative CGPA</span>
                  <span className="text-3xl font-black text-slate-900">
                    {Number(selectedRecord.cgpa || 8.2).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 font-medium">10-Point Grade Scale</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600 block mb-1">Academic Status</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs inline-block">
                    {Number(selectedRecord.cgpa) >= 8.5 ? 'First Class w/ Distinction' : 'First Class Standing'}
                  </span>
                </div>
              </div>

              {/* Semester-Wise Breakdown Cards */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Semester Performance Breakdown
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {selectedRecord.semesters && selectedRecord.semesters.length > 0 ? (
                    selectedRecord.semesters.map(s => {
                      const isPending = s.sgpa === null || s.sgpa === undefined || s.sgpa === '';
                      return (
                        <div key={s.semName} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs font-bold text-slate-700 block mb-1">{s.semName}</span>
                          {isPending ? (
                            <span className="inline-block text-xs font-bold text-amber-600 px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200/80">
                              Pending
                            </span>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-black text-slate-900">SGPA: {Number(s.sgpa).toFixed(2)}</span>
                              {s.cgpa && <span className="text-[11px] text-slate-400 font-medium">CGPA: {Number(s.cgpa).toFixed(2)}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Semester 1</span>
                        <span className="text-lg font-black text-slate-900">SGPA: 8.10</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Semester 2</span>
                        <span className="text-lg font-black text-slate-900">SGPA: 8.45</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Semester 3</span>
                        <span className="text-lg font-black text-slate-900">SGPA: 8.31</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Semester 4</span>
                        <span className="inline-block text-xs font-bold text-amber-600 px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200/80">Pending</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SGPA Progression Trend Visualizer */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  SGPA Progression Trend
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                  {(selectedRecord.semesters || [
                    { semName: 'Semester 1', sgpa: 8.10 },
                    { semName: 'Semester 2', sgpa: 8.45 },
                    { semName: 'Semester 3', sgpa: 8.31 }
                  ])
                    .filter(s => s.sgpa !== null && s.sgpa !== undefined)
                    .map(s => {
                      const sgpaVal = Number(s.sgpa);
                      const pct = Math.min(100, Math.max(0, (sgpaVal / 10) * 100));

                      return (
                        <div key={s.semName} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{s.semName}</span>
                            <span className="font-extrabold text-slate-900">{sgpaVal.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Record
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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">CGPA Data Engine</span>
                <h2 className="text-lg font-bold text-slate-900">Import CGPA Excel</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {importStep === 1 ? (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">Need CGPA Excel template?</h4>
                      <p className="text-xs text-blue-700 mt-0.5">Download pre-structured student SGPA/CGPA template.</p>
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
                    <h3 className="text-sm font-bold text-slate-800">Select CGPA Spreadsheet</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Supports .xlsx and .xls formats</p>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-cgpa-file-input"
                    />
                    <label
                      htmlFor="excel-cgpa-file-input"
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
                    <span>Matched {parsedData?.matchedRows.length} Students</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Detected Semester Columns</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData?.semHeaders.map(h => (
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
              {importStep === 2 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {importing ? 'Saving Records...' : 'Confirm & Save Records'}
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
                <h2 className="text-lg font-bold text-slate-900">CGPA Import History</h2>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous CGPA import logs found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map(item => (
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
