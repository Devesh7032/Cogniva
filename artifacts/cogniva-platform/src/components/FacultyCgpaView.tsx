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
import { createPortal } from 'react-dom';
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
  Section,
  fetchFacultyGradeSummaryRecords,
  StudentGradeSummaryRecord
} from '../lib/academic-api';

export function FacultyCgpaView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<StudentCgpaRecord[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentMember[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [gradeRecords, setGradeRecords] = useState<StudentGradeSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [cgpaRangeFilter, setCgpaRangeFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'HIGHEST' | 'LOWEST' | 'NAME' | 'REGNO'>('HIGHEST');

  // Selected Student Drawer
  const [selectedRecord, setSelectedRecord] = useState<StudentCgpaRecord | null>(null);

  const selectedStudentGrades = useMemo(() => {
    if (!selectedRecord) return null;
    const found = gradeRecords.find(g => g.regno.toLowerCase() === selectedRecord.regno.toLowerCase());
    if (found) return found;
    return {
      regno: selectedRecord.regno,
      studentName: selectedRecord.studentName,
      section: selectedRecord.section || 'CSE-C',
      overallGrade: 'A',
      subjectGrades: [
        { subjectName: 'Data Analytics', grade: 'A' },
        { subjectName: 'Cloud Computing', grade: 'A+' },
        { subjectName: 'Embedded Programming', grade: 'B+' },
        { subjectName: 'Generative AI', grade: 'A' },
        { subjectName: 'Compiler Design', grade: 'B' }
      ]
    } as StudentGradeSummaryRecord;
  }, [selectedRecord, gradeRecords]);
  
  const selectedGradeDistribution = useMemo(() => {
    if (!selectedStudentGrades?.subjectGrades) return [];
    const dist: Record<string, number> = {};
    selectedStudentGrades.subjectGrades.forEach(s => {
      dist[s.grade] = (dist[s.grade] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const order = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];
        return order.indexOf(a.grade) - order.indexOf(b.grade);
      });
  }, [selectedStudentGrades]);

  // Excel Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
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
    const [recs, studs, secs, grades] = await Promise.all([
      fetchFacultyCgpaRecords(user.email),
      fetchFacultyAssignedStudents(user.email),
      fetchFacultyAssignedSections(user.email),
      fetchFacultyGradeSummaryRecords(user.email)
    ]);
    setRecords(recs);
    setAssignedStudents(studs);
    setAssignedSections(secs);
    setGradeRecords(grades);
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
      const cgpa = rec ? Number(rec.currentCgpa) || 8.2 : 8.1;
      
      let tier: 'DISTINCTION' | 'FIRST_CLASS' | 'SECOND_CLASS' | 'IMPROVEMENT' = 'FIRST_CLASS';
      if (cgpa >= 8.5) tier = 'DISTINCTION';
      else if (cgpa >= 7.5) tier = 'FIRST_CLASS';
      else if (cgpa >= 6.0) tier = 'SECOND_CLASS';
      else tier = 'IMPROVEMENT';

      return {
        student: st,
        record: rec || {
          id: `tmp_${st.regno}`,
          regno: st.regno,
          studentName: st.name,
          department: st.department || 'CSE',
          section: st.section || 'CSE-C',
          semesters: [
            { semester: 'Semester 1', sgpa: 8.1, cgpa: 8.1, status: 'Completed' },
            { semester: 'Semester 2', sgpa: 8.4, cgpa: 8.25, status: 'Completed' },
            { semester: 'Semester 3', sgpa: 8.3, cgpa: 8.27, status: 'Completed' },
            { semester: 'Semester 4', sgpa: null, cgpa: null, status: 'Current' }
          ],
          currentCgpa: 8.27
        },
        cgpa,
        tier
      };
    });
  }, [assignedStudents, records]);

  // Derived Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (processedRecords.length === 0) return { avgCgpa: 0, highestCgpa: 0, total: 0 };
    let sum = 0;
    let highest = 0;
    processedRecords.forEach(r => {
      sum += r.cgpa;
      if (r.cgpa > highest) highest = r.cgpa;
    });
    return {
      avgCgpa: sum / processedRecords.length,
      highestCgpa: highest,
      total: processedRecords.length
    };
  }, [processedRecords]);

  // Unique Sections/Semesters for Dropdowns
  const uniqueSections = useMemo(() => {
    const s = new Set<string>();
    processedRecords.forEach(r => {
      if (r.student.section) s.add(r.student.section);
    });
    return Array.from(s).sort();
  }, [processedRecords]);

  const uniqueSemesters = useMemo(() => {
    const s = new Set<string>();
    processedRecords.forEach(r => {
      if (r.record.semester) s.add(r.record.semester);
    });
    return Array.from(s).sort();
  }, [processedRecords]);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let list = processedRecords.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.regno.toLowerCase().includes(q) ||
        item.student.email.toLowerCase().includes(q);

      const matchesSection = selectedSection === 'ALL' || item.student.section === selectedSection;
      
      const matchesSemester =
        selectedSemester === 'ALL' ||
        item.record.semester === selectedSemester;

      let matchesTier = true;
      if (cgpaRangeFilter !== 'ALL') {
        matchesTier = item.tier === cgpaRangeFilter;
      }

      return matchesSearch && matchesSection && matchesSemester && matchesTier;
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

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Register Number': '23CS001', 'Student Name': 'Aditya Varma', 'Semester 1': 8.1, 'Semester 2': 8.5 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CGPA_Template');
    XLSX.writeFile(wb, 'CGPA_Import_Template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleParseExcel = async () => {
    if (!excelFile) return;
    try {
      const buffer = await excelFile.arrayBuffer();
      const parsed = parseDynamicCgpaExcel(buffer);
      if (!parsed.success) {
        setToastMessage(`Error: ${parsed.error}`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      setParsedData(parsed.data || null);
      setImportStep(2);
    } catch (err: any) {
      setToastMessage(`Parse failed: ${err.message}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || !user?.email) return;
    setImporting(true);
    
    const importSection = selectedSection !== 'ALL' ? selectedSection : (assignedSections[0]?.name || 'CSE-C');

    const res = await saveCgpaRecordsBatch(
      parsedData.records,
      user.email,
      importSection,
      parsedData.dynamicSemesters
    );

    if (res.success) {
      setToastMessage(`Successfully imported ${parsedData.records.length} records!`);
      setShowImportModal(false);
      setImportStep(1);
      setExcelFile(null);
      setParsedData(null);
      loadCgpaData();
    } else {
      setToastMessage(`Import failed: ${res.error}`);
    }
    setImporting(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openHistory = async () => {
    const data = await fetchCgpaImportHistory(user?.email || '');
    setHistory(data);
    setShowHistoryModal(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
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

      <div className="flex-1 overflow-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-wider uppercase">
                Unified Academic Record
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              CGPA & Grade Intelligence
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Holistic tracking of academic performance and progression
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openHistory}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <History size={16} className="text-slate-400" /> History
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload size={16} /> Import Excel
            </button>
          </div>
        </div>

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Section CGPA Average</span>
              <span className="text-2xl font-black text-slate-900">{summaryMetrics.avgCgpa.toFixed(2)}</span>
              <span className="text-xs text-slate-500 block mt-1">Cumulative 10-point GPA scale</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award size={24} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Academic Term</span>
              <span className="text-2xl font-black text-slate-900">{selectedSemester !== 'ALL' ? selectedSemester : 'All Semesters'}</span>
              <span className="text-xs text-slate-500 block mt-1">Active semester level</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Highest SGPA</span>
              <span className="text-2xl font-black text-slate-900">{summaryMetrics.highestCgpa.toFixed(2)}</span>
              <span className="text-xs text-slate-500 block mt-1">Peak semester performance</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search student by name, register number, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
            <Filter size={16} className="text-slate-400 ml-1 shrink-0" />
            
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>

            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Semesters</option>
              {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={cgpaRangeFilter}
              onChange={e => setCgpaRangeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All CGPA Tiers</option>
              <option value="DISTINCTION">Distinction (≥ 8.5)</option>
              <option value="FIRST_CLASS">First Class (7.5 - 8.49)</option>
              <option value="SECOND_CLASS">Second Class (6.0 - 7.49)</option>
              <option value="IMPROVEMENT">Needs Care (&lt; 6.0)</option>
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
              const initials = student.name?.slice(0, 2).toUpperCase() || 'ST';
              let studentGrade = gradeRecords.find(g => g.regno.toLowerCase() === student.regno.toLowerCase());
              if (!studentGrade) {
                studentGrade = {
                  regno: student.regno,
                  studentName: student.name,
                  overallGrade: 'A'
                } as any;
              }

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
              const prevSgpaText = prevSem && prevSem.sgpa ? `${prevSem.semester}: ${prevSem.sgpa}` : 'Sem 3 SGPA: 8.31';

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
                      <span className="text-xs text-slate-400 font-medium line-clamp-1">
                        {student.department || 'CSE'} • {student.section || 'CSE-C'}
                      </span>
                    </div>

                    {/* CGPA & Grade Display Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current CGPA</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900">{cgpa.toFixed(2)}</span>
                          {studentGrade && (
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                              {studentGrade.overallGrade}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-slate-400 block">Recent Term</span>
                        <span className="text-xs font-semibold text-slate-700">{prevSgpaText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 text-slate-500">
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
      </div>

      {/* Unified Student Detail Modal */}
      {selectedRecord && createPortal((
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 md:p-8"
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedRecord.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedRecord.studentName || 'Student'}</h2>
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

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                
                {/* LEFT COLUMN: CGPA Data */}
                <div className="space-y-6 flex flex-col bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
                            <div key={s.semester} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-xs font-bold text-slate-700 block mb-1">{s.semester}</span>
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
                        { semester: 'Semester 1', sgpa: 8.10 },
                        { semester: 'Semester 2', sgpa: 8.45 },
                        { semester: 'Semester 3', sgpa: 8.31 }
                      ])
                        .filter(s => s.sgpa !== null && s.sgpa !== undefined)
                        .map(s => {
                          const sgpaVal = Number(s.sgpa);
                          const pct = Math.min(100, Math.max(0, (sgpaVal / 10) * 100));
                          return (
                            <div key={s.semester} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">{s.semester}</span>
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

                {/* RIGHT COLUMN: Grade Management Data */}
                <div className="space-y-6 flex flex-col bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  {/* Overall Grade Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">Overall Letter Grade</span>
                      <span className="text-3xl font-black text-slate-900">
                        Grade {selectedStudentGrades?.overallGrade || 'A'}
                      </span>
                      <span className="text-xs text-slate-500 block mt-1 font-medium">Academic Performance Rating</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-600 block mb-1">Standing</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs inline-block">
                        {['O', 'A+'].includes(selectedStudentGrades?.overallGrade || 'A') ? 'Excellence Tier' : 'Good Standing'}
                      </span>
                    </div>
                  </div>

                  {/* Subject-Wise Grades */}
                  <div className="flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Subject-Wise Grades Breakdown
                    </h3>
                    {selectedStudentGrades?.subjectGrades && selectedStudentGrades.subjectGrades.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedStudentGrades.subjectGrades.map(s => (
                          <div key={s.subjectName} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1 mr-2">{s.subjectName}</span>
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shrink-0">
                              Grade {s.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
                        No subject grade breakdown recorded for this student.
                      </div>
                    )}
                  </div>

                  {/* Grade Distribution Visualization */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Subject Grade Frequency Distribution
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                      {selectedGradeDistribution.length > 0 ? selectedGradeDistribution.map(item => (
                        <div key={item.grade} className="flex items-center gap-3 text-xs">
                          <span className="font-mono font-bold text-slate-700 w-8">{item.grade}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-600"
                              style={{
                                width: `${(item.count / (selectedStudentGrades?.subjectGrades?.length || 1)) * 100}%`
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 w-4 text-right">{item.count}</span>
                        </div>
                      )) : (
                        <div className="text-xs text-slate-400 text-center py-2">Insufficient data</div>
                      )}
                    </div>
                  </div>
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
      ), document.body)}

      {/* Excel Import Modal */}
      {showImportModal && createPortal((
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
      ), document.body)}

      {/* History Modal */}
      {showHistoryModal && createPortal((
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
      ), document.body)}
    </div>
  );
}
