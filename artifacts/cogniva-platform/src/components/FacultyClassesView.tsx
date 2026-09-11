import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  Layers,
  Calendar,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  School,
  ChevronRight,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  fetchFacultySubjectAssignments,
  fetchStudentMembers,
  fetchFacultyAssignedSections,
  facultyAddSubject,
  FacultySubjectAssignment,
  StudentMember,
  Section
} from '../lib/academic-api';

export function FacultyClassesView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<FacultySubjectAssignment | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('ALL');

  // Add Subject Modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSection, setNewSubjectSection] = useState('');
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
    const [assList, studList, secList] = await Promise.all([
      fetchFacultySubjectAssignments(user?.email || ''),
      fetchStudentMembers(),
      fetchFacultyAssignedSections(user?.email || '')
    ]);
    setAssignments(assList);
    setStudents(studList);
    setAssignedSections(secList);
    if (secList.length > 0 && !newSubjectSection) {
      setNewSubjectSection(secList[0].name);
    }
    setLoading(false);
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !newSubjectName.trim()) return;

    setSubmitting(true);
    setModalError(null);

    const res = await facultyAddSubject(user.email, newSubjectName.trim(), newSubjectSection || undefined);
    setSubmitting(false);

    if (res.success) {
      setShowAddSubjectModal(false);
      setNewSubjectName('');
      await loadFacultyClasses();
    } else {
      setModalError(res.error || 'Failed to add subject.');
    }
  };

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(ass => {
      const matchesSearch =
        searchQuery === '' ||
        ass.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ass.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ass.section_name || ass.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ass.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const secName = (ass.section_name || ass.section || '').toUpperCase();
      const matchesSection =
        selectedSectionFilter === 'ALL' || secName === selectedSectionFilter.toUpperCase();

      const sem = String(ass.semester || '4');
      const matchesSemester =
        selectedSemesterFilter === 'ALL' || sem === selectedSemesterFilter;

      return matchesSearch && matchesSection && matchesSemester;
    });
  }, [assignments, searchQuery, selectedSectionFilter, selectedSemesterFilter]);

  // Dynamic KPI Stats
  const kpiStats = useMemo(() => {
    const totalAssigned = assignments.length;
    const uniqueSections = Array.from(
      new Set(assignments.map(a => (a.section_name || a.section || 'CSE-C').toUpperCase()))
    );

    // Enrolled students in assigned sections
    const enrolledStudents = students.filter(st => {
      const stSec = (st.section || '').toUpperCase();
      return uniqueSections.some(sec => stSec === sec || stSec.endsWith(sec));
    });

    const semesters = Array.from(new Set(assignments.map(a => String(a.semester || '4')))).sort();
    const semLabel = semesters.length === 0 ? 'Sem 4' : semesters.length === 1 ? `Sem ${semesters[0]}` : `Sem ${semesters.join(', ')}`;

    return {
      totalAssigned,
      totalStudents: enrolledStudents.length,
      activeSectionsCount: uniqueSections.length,
      semLabel
    };
  }, [assignments, students]);

  // Unique sections for dropdown filter
  const availableSections = useMemo(() => {
    const list = Array.from(
      new Set(assignments.map(a => (a.section_name || a.section || '').toUpperCase()))
    ).filter(Boolean);
    return list.length > 0 ? list : ['CSE-C'];
  }, [assignments]);

  // Selected Class Enrolled Roster
  const selectedClassRoster = useMemo(() => {
    if (!selectedClass) return [];
    const secName = (selectedClass.section_name || selectedClass.section || 'CSE-C').toUpperCase();
    return students.filter(st => {
      const stSec = (st.section || '').toUpperCase();
      const matchesSec = stSec === secName || stSec.endsWith(secName);
      if (!matchesSec) return false;
      if (!rosterSearch) return true;
      const q = rosterSearch.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        st.regno.toLowerCase().includes(q)
      );
    });
  }, [selectedClass, students, rosterSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <BookOpen size={14} className="text-blue-600" />
            Faculty Workspace · My Classes & Subjects
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Assigned Subject Classes
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Manage assigned subjects, inspect enrolled student rosters, and monitor section academic performance.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setNewSubjectName('');
            setShowAddSubjectModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm shadow-blue-500/20 hover:shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Top Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Subjects</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookMarked size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.totalAssigned}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Active subject courses</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled Students</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.totalStudents}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Across assigned sections</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sections</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.activeSectionsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Class section cohorts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Term</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : kpiStats.semLabel}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Current semester tier</p>
        </div>
      </div>

      {/* Search & Control Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name, code, section, or department..."
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
              value={selectedSectionFilter}
              onChange={e => setSelectedSectionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedSemesterFilter}
            onChange={e => setSelectedSemesterFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>
      </div>

      {/* Main Subjects Display */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <BookOpen size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Loading Subject Assignments...</h3>
          <p className="text-slate-500 text-xs mt-1">Connecting to Supabase academic backend...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookMarked size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No subject assignments found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            {searchQuery || selectedSectionFilter !== 'ALL' || selectedSemesterFilter !== 'ALL'
              ? 'Try resetting your search filters to view assigned subjects.'
              : 'Click "Add Subject" above or contact your administrator to assign courses to your account.'}
          </p>
          {(searchQuery || selectedSectionFilter !== 'ALL' || selectedSemesterFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSectionFilter('ALL');
                setSelectedSemesterFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map(ass => {
            const secName = (ass.section_name || ass.section || 'CSE-C').toUpperCase();
            const enrolledCount = students.filter(st => {
              const stSec = (st.section || '').toUpperCase();
              return stSec === secName || stSec.endsWith(secName);
            }).length;

            return (
              <div
                key={ass.id}
                onClick={() => {
                  setSelectedClass(ass);
                  setRosterSearch('');
                }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-blue-700 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80">
                      {ass.subject_code}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <Users size={13} className="text-slate-500" />
                      {enrolledCount} Students
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                    {ass.subject_name}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {ass.department || 'CSE'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Section {secName}</span>
                    <span>•</span>
                    <span>{ass.academic_year || 'Second Year'}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 text-slate-500">
                  <span className="font-medium text-slate-600">
                    Semester {ass.semester || '4'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    View Roster <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Student Roster Drawer / Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClass(null)}>
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                    {selectedClass.subject_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Section {(selectedClass.section_name || selectedClass.section || 'CSE-C').toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedClass.subject_name}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Department: {selectedClass.department || 'CSE'} | Year: {selectedClass.academic_year || 'Second Year'} | Semester: {selectedClass.semester || '4'}
                </p>
              </div>

              <button
                onClick={() => setSelectedClass(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Roster Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Filter student by name, registration number, or email..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Enrolled Students ({selectedClassRoster.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Section {(selectedClass.section_name || selectedClass.section || 'CSE-C').toUpperCase()} Roster
                </span>
              </div>

              {selectedClassRoster.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <Users size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No students found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rosterSearch ? 'No student matches your filter.' : 'No students registered for this section yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedClassRoster.map((st, idx) => (
                    <div key={st.id || idx} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-slate-900 font-bold block text-sm">{st.name}</strong>
                          <span className="text-slate-500 text-xs">{st.email}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-lg inline-block">
                          {st.regno}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          {st.department || 'CSE'} • {st.section || 'CSE-C'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddSubjectModal(false)}>
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Subject Assignment</span>
                <h2 className="text-lg font-bold text-slate-900">Add New Subject</h2>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Subject Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Advanced Operating Systems"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Target Section</label>
                <select
                  value={newSubjectSection}
                  onChange={e => setNewSubjectSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {assignedSections.length > 0 ? (
                    assignedSections.map(s => (
                      <option key={s.id || s.name} value={s.name}>
                        Section {s.name}
                      </option>
                    ))
                  ) : (
                    <option value="CSE-C">Section CSE-C</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newSubjectName.trim()}
                  className={`px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-sm ${
                    submitting || !newSubjectName.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {submitting ? 'Adding Subject...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
