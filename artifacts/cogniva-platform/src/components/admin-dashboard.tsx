import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, CalendarDays, CheckCircle2, ChevronRight, Database, GraduationCap,
  Layers, LogOut, Plus, ShieldCheck, SlidersHorizontal, UserCheck, UserCog,
  UsersRound, BookOpen, Search, Filter, X, Upload, FileSpreadsheet, ArrowRight,
  AlertTriangle, RefreshCw, Check, Edit, Edit2, Trash2, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/auth-context';
import { getUserFriendlyError } from '@/lib/error-handler';
import {
  fetchAcademicYears, fetchDepartments, fetchSections, createDepartment, createSection,
  fetchDatabaseCounts, fetchProfilesByRole, fetchFacultyAssignments, saveFacultyAccessAssignments,
  fetchFacultyMembers, updateFacultyMember, deleteFacultyMember,
  fetchStudentMembers, updateStudentMember, deleteStudentMember,
  importStudentsBatch, importFacultyBatch, validateStudentExcelHeaders, validateFacultyExcelHeaders,
  fetchSubjects, createSubject, deleteSubject, fetchFacultySubjectAssignments, assignFacultyToSubject, removeFacultySubjectAssignment, adminAssignSubjectToFaculty,
  AcademicYear, Department, Section, Profile, FacultyAssignment, DatabaseCounts, ImportResult,
  StudentImportRow, FacultyImportRow, FacultyMember, StudentMember, Subject, FacultySubjectAssignment
} from '@/lib/academic-api';

// ============================================================================
// ADMIN HOME VIEW: ACADEMIC YEARS CARDS + QUICK ACTIONS + REAL COUNTS
// ============================================================================
export function AdminHomeView({ onNavigate }: { onNavigate: (path: string, params?: { yearId?: string; deptId?: string; secId?: string }) => void }) {
  const { collegeId, collegeName } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [counts, setCounts] = useState<DatabaseCounts>({ students: 0, faculty: 0, sections: 0, departments: 0 });
  const [loading, setLoading] = useState(true);

  const [showStudentImport, setShowStudentImport] = useState(false);
  const [showFacultyImport, setShowFacultyImport] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [collegeId]);

  const loadDashboardData = async () => {
    setLoading(true);
    const [yearsData, countsData] = await Promise.all([
      fetchAcademicYears(),
      fetchDatabaseCounts(collegeId)
    ]);
    setYears(yearsData);
    setCounts(countsData);
    setLoading(false);
  };

  return (
    <div className="page-frame animate-fade">
      {/* Header */}
      <div className="welcome-row">
        <div>
          <div className="eyebrow">COGNIVA Administration</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Academic Structure & User Management</h1>
          <p className="lede text-slate-500 mt-1">Configure academic years, branches, sections, students and faculty access.</p>
        </div>
      </div>

      {/* Quick Action Buttons & Real Database Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-slate-500 mb-1">Students</div>
            <div className="text-3xl font-black text-slate-900 font-mono">{loading ? '...' : counts.students}</div>
            <div className="text-xs text-slate-500 mt-1">Real database count</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-500/30 flex items-center justify-center text-teal-700">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-slate-500 mb-1">Faculty</div>
            <div className="text-3xl font-black text-slate-900 font-mono">{loading ? '...' : counts.faculty}</div>
            <div className="text-xs text-slate-500 mt-1">Real database count</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-700">
            <UsersRound size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-slate-500 mb-1">Sections</div>
            <div className="text-3xl font-black text-slate-900 font-mono">{loading ? '...' : counts.sections}</div>
            <div className="text-xs text-slate-500 mt-1">Real database count</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-slate-500 mb-1">Departments</div>
            <div className="text-3xl font-black text-slate-900 font-mono">{loading ? '...' : counts.departments}</div>
            <div className="text-xs text-slate-500 mt-1">Real database count</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-8 flex flex-wrap gap-3 items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">Quick Administrative Actions:</div>
        <div className="flex flex-wrap gap-3">
          <button className="button button-secondary text-xs flex items-center gap-2 py-2 px-4" onClick={() => setShowStudentImport(true)}>
            <FileSpreadsheet size={15} /> Import Students
          </button>
          <button className="button button-secondary text-xs flex items-center gap-2 py-2 px-4" onClick={() => setShowFacultyImport(true)}>
            <FileSpreadsheet size={15} /> Import Faculty
          </button>
          <button className="button button-primary text-xs flex items-center gap-2 py-2 px-4" onClick={() => onNavigate('/admin/faculty-access')}>
            <UserCog size={15} /> Manage Faculty Access
          </button>
        </div>
      </div>

      {/* Academic Structure Section Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Academic Structure</h2>
        <p className="text-xs text-slate-500">Select an academic year to drill down into departments and class sections.</p>
      </div>

      {/* 4 Academic Year Primary Navigation Cards */}
      {loading ? (
        <div className="p-8 text-center text-teal-700 bg-slate-50 rounded-2xl border border-slate-200">
          Loading Academic Structure from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {years.map((year) => (
            <div
              key={year.id}
              onClick={() => onNavigate('/admin/structure', { yearId: year.id })}
              className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/40 hover:bg-slate-50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-500/30 flex items-center justify-center text-teal-700 font-bold text-sm mb-4">
                  {year.code}
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {year.name.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{year.code} Cohort</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-700">
                <span>View Branches →</span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals for Student and Faculty Import */}
      {showStudentImport && (
        <StudentImportModal onClose={() => { setShowStudentImport(false); loadDashboardData(); }} />
      )}
      {showFacultyImport && (
        <FacultyImportModal onClose={() => { setShowFacultyImport(false); loadDashboardData(); }} />
      )}
    </div>
  );
}

// ============================================================================
// ACADEMIC STRUCTURE VIEW: YEAR -> DEPARTMENTS -> SECTIONS DRILLDOWN
// ============================================================================
export function AcademicStructureView({ defaultYearId }: { defaultYearId?: string }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionStudents, setSectionStudents] = useState<StudentMember[]>([]);

  const [selectedYearId, setSelectedYearId] = useState<string>(defaultYearId || '');
  const { collegeId } = useAuth();
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSecModal, setShowSecModal] = useState(false);
  const [showStudentImport, setShowStudentImport] = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadStructure();
  }, [collegeId]);

  const loadStructure = async () => {
    setLoading(true);
    const [yData, dData, sData] = await Promise.all([
      fetchAcademicYears(),
      fetchDepartments(collegeId),
      fetchSections(undefined, undefined, collegeId),
    ]);
    setYears(yData);
    setDepartments(dData);
    setSections(sData);

    if (yData.length > 0) {
      setSelectedYearId(defaultYearId && yData.some(y => y.id === defaultYearId) ? defaultYearId : yData[0].id);
    }
    if (dData.length > 0) {
      setSelectedDeptId(dData[0].id);
    }
    setLoading(false);
  };

  const activeYear = years.find((y) => y.id === selectedYearId) || years[0];
  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const filteredSections = sections.filter(
    (s) => s.academic_year_id === selectedYearId && s.department_id === selectedDeptId
  );

  const activeSection = sections.find((s) => s.id === selectedSectionId) || (filteredSections.length > 0 ? filteredSections[0] : null);

  const [sectionSubjects, setSectionSubjects] = useState<Subject[]>([]);
  const [sectionAssignments, setSectionAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [allFaculty, setAllFaculty] = useState<FacultyMember[]>([]);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignSubjModal, setShowAssignSubjModal] = useState(false);

  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjSem, setSubjSem] = useState('Semester 4');

  const [selectedFacEmail, setSelectedFacEmail] = useState('');
  const [selectedSubjCode, setSelectedSubjCode] = useState('');

  useEffect(() => {
    if (activeSection) {
      loadSectionData();
    } else {
      setSectionStudents([]);
      setSectionSubjects([]);
      setSectionAssignments([]);
    }
  }, [selectedYearId, selectedDeptId, activeSection?.id, collegeId]);

  const loadSectionStudents = async () => {
    if (!activeYear || !activeDept || !activeSection) return;
    const studs = await fetchStudentMembers(activeYear.name, activeDept.code, activeSection.name, collegeId);
    setSectionStudents(studs);
  };

  const loadSectionData = async () => {
    if (!activeYear || !activeDept || !activeSection) return;
    const [studs, subjs, assigns, facs] = await Promise.all([
      fetchStudentMembers(activeYear.name, activeDept.code, activeSection.name, collegeId),
      fetchSubjects(activeYear.name, activeDept.code, activeSection.name, collegeId),
      fetchFacultySubjectAssignments(undefined, activeSection.name, collegeId),
      fetchFacultyMembers(collegeId)
    ]);
    setSectionStudents(studs);
    setSectionSubjects(subjs);
    setSectionAssignments(assigns);
    setAllFaculty(facs);
    if (facs.length > 0) setSelectedFacEmail(facs[0].email);
    if (subjs.length > 0) setSelectedSubjCode(subjs[0].subject_code);
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!newDeptName || !newDeptCode) return;
    const res = await createDepartment(newDeptName, newDeptCode);
    if (res.success && res.data) {
      setDepartments((current) => [...current, res.data!]);
      setSelectedDeptId(res.data.id);
      setShowDeptModal(false);
      setNewDeptName('');
      setNewDeptCode('');
    } else {
      setActionError(res.error || 'Failed to create department');
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!newSecName || !selectedYearId || !selectedDeptId) return;
    const res = await createSection(selectedYearId, selectedDeptId, newSecName);
    if (res.success && res.data) {
      setSections((current) => [...current, res.data!]);
      setShowSecModal(false);
      setNewSecName('');
    } else {
      setActionError(res.error || 'Failed to create section');
    }
  };

  const handleCreateSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjCode || !subjName || !activeSection || !activeYear || !activeDept) return;
    const res = await createSubject({
      subject_code: subjCode.trim().toUpperCase(),
      subject_name: subjName.trim(),
      academic_year: activeYear.name,
      department: activeDept.code,
      section: activeSection.name,
      semester: subjSem
    });
    if (res.success) {
      setShowSubjectModal(false);
      setSubjCode('');
      setSubjName('');
      await loadSectionData();
    }
  };

  const handleAssignFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacEmail || !selectedSubjCode || !activeSection || !activeYear || !activeDept) return;
    const targetFac = allFaculty.find(f => f.email.toLowerCase() === selectedFacEmail.toLowerCase());
    const targetSubj = sectionSubjects.find(s => s.subject_code === selectedSubjCode);

    const res = await assignFacultyToSubject({
      faculty_id: targetFac?.id || selectedFacEmail,
      faculty_email: selectedFacEmail,
      faculty_name: targetFac?.name || 'Faculty Member',
      subject_code: selectedSubjCode,
      subject_name: targetSubj?.subject_name || selectedSubjCode,
      academic_year: activeYear.name,
      department: activeDept.code,
      section: activeSection.name
    });

    if (res.success) {
      setShowAssignSubjModal(false);
      await loadSectionData();
    }
  };

  const handleDeleteSubjectClick = async (id: string) => {
    await deleteSubject(id);
    await loadSectionData();
  };

  const handleRemoveAssignmentClick = async (id: string) => {
    await removeFacultySubjectAssignment(id);
    await loadSectionData();
  };

  return (
    <div className="page-frame animate-fade">
      {/* Header */}
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Academic Structure Drilldown</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Academic Hierarchy Management</h1>
          <p className="lede text-slate-500 mt-1">Select Year → Select Branch (CSE) → Select Section.</p>
        </div>
        <div className="flex gap-3">
          <button className="button button-secondary text-xs py-2 px-3" onClick={() => setShowDeptModal(true)}>
            <Plus size={15} /> Add Branch / Department
          </button>
          <button className="button button-primary text-xs py-2 px-3" onClick={() => setShowSecModal(true)}>
            <Plus size={15} /> Add Section
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-teal-700 bg-slate-50 rounded-2xl border border-slate-200">
          Loading Academic Hierarchy from Supabase...
        </div>
      ) : (
        <div className="space-y-6">
          {/* STEP 1: ACADEMIC YEAR SELECTION TABS */}
          <div className="panel p-5">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">1. Select Academic Year</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {years.map((year) => (
                <button
                  key={year.id}
                  onClick={() => { setSelectedYearId(year.id); setSelectedSectionId(null); }}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedYearId === year.id
                      ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold shadow-lg shadow-teal-950/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-sm uppercase font-extrabold">{year.name}</div>
                    <div className="text-xs text-slate-500">{year.code}</div>
                  </div>
                  <ChevronRight size={16} className={selectedYearId === year.id ? 'text-teal-700' : 'text-slate-600'} />
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: DEPARTMENT / BRANCH SELECTION */}
          <div className="panel p-5">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
              2. Select Branch / Department ({activeYear?.name})
            </div>
            <div className="flex flex-wrap gap-3">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => { setSelectedDeptId(dept.id); setSelectedSectionId(null); }}
                  className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                    selectedDeptId === dept.id
                      ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/50'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Building2 size={16} />
                  <span>{dept.code} ({dept.name})</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: SECTIONS GRID & SECTION DETAILS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sections List */}
            <div className="panel p-5 md:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  3. Sections under {activeDept?.code} ({activeYear?.code})
                </div>
                <button className="text-xs text-teal-700 hover:underline flex items-center gap-1" onClick={() => setShowSecModal(true)}>
                  <Plus size={12} /> Add
                </button>
              </div>

              {filteredSections.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filteredSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        activeSection?.id === sec.id
                          ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-sm">{sec.name}</span>
                      <span className="chip chip-teal text-xs py-0.5 px-2">Select →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-white border border-slate-200 rounded-xl text-xs">
                  No sections created for {activeDept?.code} in {activeYear?.name} yet.
                </div>
              )}
            </div>

            {/* Section Details Card */}
            <div className="panel p-6 md:col-span-2 space-y-6">
              {activeSection ? (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                    <div>
                      <div className="eyebrow text-teal-700">{activeYear?.name} → {activeDept?.code}</div>
                      <h2 className="text-2xl font-black text-slate-900">{activeSection.name}</h2>
                    </div>
                    <span className="chip chip-teal text-sm py-1 px-3">Active Section</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Students</div>
                      <div className="text-2xl font-bold text-slate-800 font-mono">{sectionStudents.length}</div>
                      <p className="text-xs text-slate-500 mt-1">Enrolled in {activeSection.name}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Subjects / Courses</div>
                      <div className="text-2xl font-bold text-teal-700 font-mono">{sectionSubjects.length}</div>
                      <p className="text-xs text-slate-500 mt-1">Created for {activeSection.name}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Faculty Assigned</div>
                      <div className="text-2xl font-bold text-violet-700 font-mono">{sectionAssignments.length}</div>
                      <p className="text-xs text-slate-500 mt-1">Subject assignments</p>
                    </div>
                  </div>

                  {/* SUBJECTS MANAGEMENT FOR THIS SECTION */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen size={16} className="text-teal-700" /> Subjects / Courses ({activeSection.name})
                      </h3>
                      <button
                        className="button button-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                        onClick={() => setShowSubjectModal(true)}
                      >
                        <Plus size={13} /> Add Subject
                      </button>
                    </div>

                    {sectionSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sectionSubjects.map((sub) => (
                          <div key={sub.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{sub.subject_name}</div>
                              <div className="text-slate-500 font-mono">{sub.subject_code} • {sub.semester || 'Sem 4'}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteSubjectClick(sub.id)}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-400 hover:bg-slate-100 transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500 bg-white border border-slate-200 rounded-xl text-xs">
                        No subjects created for {activeSection.name} yet. Click "+ Add Subject" to create one.
                      </div>
                    )}
                  </div>

                  {/* FACULTY SUBJECT ASSIGNMENTS FOR THIS SECTION */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <UserCheck size={16} className="text-violet-700" /> Faculty Subject Assignments ({activeSection.name})
                      </h3>
                      <button
                        className="button button-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                        onClick={() => setShowAssignSubjModal(true)}
                        disabled={sectionSubjects.length === 0}
                      >
                        <Plus size={13} /> Assign Faculty to Subject
                      </button>
                    </div>

                    {sectionAssignments.length > 0 ? (
                      <div className="space-y-2">
                        {sectionAssignments.map((asg) => (
                          <div key={asg.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <strong className="text-slate-900">{asg.faculty_name || asg.faculty_email}</strong>
                              <span className="text-slate-500 ml-2 font-mono">({asg.faculty_email})</span>
                              <div className="text-teal-700 font-semibold mt-0.5">Assigned Subject: {asg.subject_name} ({asg.subject_code})</div>
                            </div>
                            <button
                              onClick={() => handleRemoveAssignmentClick(asg.id)}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-400 hover:bg-slate-100 transition-colors"
                              title="Remove Assignment"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500 bg-white border border-slate-200 rounded-xl text-xs">
                        No faculty assigned to subjects in {activeSection.name} yet.
                      </div>
                    )}
                  </div>

                  {/* ENROLLED STUDENTS LIST */}
                  {sectionStudents.length > 0 ? (
                    <div className="mb-6 space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Enrolled Students ({activeSection.name}):</div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white border border-slate-200 rounded-xl">
                        {sectionStudents.map((s) => (
                          <div key={s.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <strong className="text-slate-900">{s.name}</strong>
                              <span className="text-slate-500 font-mono ml-2">({s.regno})</span>
                            </div>
                            <span className="text-slate-500 font-mono">{s.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="button button-primary text-xs py-2.5 px-4 flex items-center gap-2"
                      onClick={() => setShowStudentImport(true)}
                    >
                      <FileSpreadsheet size={15} /> Import Student Excel for {activeSection.name}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 my-auto">
                  Select a section from the left column to manage subjects, students, and faculty.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && activeSection && (
        <div className="drawer-backdrop" onClick={() => setShowSubjectModal(false)}>
          <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Subject to {activeSection.name}</h2>
              <button className="icon-button" onClick={() => setShowSubjectModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubjectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Subject Name</label>
                <input
                  required
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Subject Code</label>
                <input
                  required
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  placeholder="e.g. DBMS or CS301"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Semester</label>
                <input
                  required
                  value={subjSem}
                  onChange={(e) => setSubjSem(e.target.value)}
                  placeholder="e.g. Semester 4"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <button type="submit" className="button button-primary full-width py-2.5">Save Subject to Supabase</button>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FACULTY TO SUBJECT MODAL */}
      {showAssignSubjModal && activeSection && (
        <div className="drawer-backdrop" onClick={() => setShowAssignSubjModal(false)}>
          <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Assign Faculty to Subject ({activeSection.name})</h2>
              <button className="icon-button" onClick={() => setShowAssignSubjModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAssignFacultySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Select Faculty Member</label>
                <select
                  value={selectedFacEmail}
                  onChange={(e) => setSelectedFacEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  {allFaculty.map((f) => (
                    <option key={f.id} value={f.email}>{f.name} ({f.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Select Subject / Course</label>
                <select
                  value={selectedSubjCode}
                  onChange={(e) => setSelectedSubjCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                >
                  {sectionSubjects.map((s) => (
                    <option key={s.id} value={s.subject_code}>{s.subject_name} ({s.subject_code})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="button button-primary full-width py-2.5">Confirm Subject Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="drawer-backdrop" onClick={() => setShowDeptModal(false)}>
          <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add New Branch / Department</h2>
              <button className="icon-button" onClick={() => setShowDeptModal(false)}><X size={18} /></button>
            </div>
            {actionError && <p className="text-rose-400 text-xs mb-3">{actionError}</p>}
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Department Name</label>
                <input
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Department Code</label>
                <input
                  required
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. IT"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 uppercase"
                />
              </div>
              <button type="submit" className="button button-primary full-width">Create Department</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showSecModal && (
        <div className="drawer-backdrop" onClick={() => setShowSecModal(false)}>
          <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Section to {activeDept?.code}</h2>
              <button className="icon-button" onClick={() => setShowSecModal(false)}><X size={18} /></button>
            </div>
            {actionError && <p className="text-rose-400 text-xs mb-3">{actionError}</p>}
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Section Name</label>
                <input
                  required
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  placeholder={`e.g. ${activeDept?.code}-K`}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 uppercase"
                />
              </div>
              <button type="submit" className="button button-primary full-width">Create Section</button>
            </form>
          </div>
        </div>
      )}

      {showStudentImport && (
        <StudentImportModal
          defaultYearId={selectedYearId}
          defaultDeptId={selectedDeptId}
          defaultSecId={activeSection?.id}
          onClose={() => { setShowStudentImport(false); loadStructure(); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// FACULTY ACCESS MANAGEMENT VIEW: SELECT FACULTY -> YEAR -> DEPT -> SECTIONS
// ============================================================================
export function FacultyAccessView() {
  const { collegeId } = useAuth();
  const [facultyMembers, setFacultyMembers] = useState<Profile[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [allSubjectAssignments, setAllSubjectAssignments] = useState<FacultySubjectAssignment[]>([]);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [facSearchTerm, setFacSearchTerm] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [collegeId]);

  const loadData = async () => {
    setLoading(true);
    const [facs, yrs, depts, secs, asgs, subAsgs] = await Promise.all([
      fetchFacultyMembers(collegeId),
      fetchAcademicYears(),
      fetchDepartments(collegeId),
      fetchSections(undefined, undefined, collegeId),
      fetchFacultyAssignments(collegeId),
      fetchFacultySubjectAssignments(undefined, undefined, collegeId),
    ]);

    setFacultyMembers(facs as any[]);
    setYears(yrs);
    setDepartments(depts);
    setSections(secs);
    setAssignments(asgs);
    setAllSubjectAssignments(subAsgs);

    if (facs.length > 0 && !selectedFacultyId) {
      setSelectedFacultyId(facs[0].id);
    }
    if (yrs.length > 0 && !selectedYearId) {
      setSelectedYearId(yrs[0].id);
    }
    if (depts.length > 0 && !selectedDeptId) {
      setSelectedDeptId(depts[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedFacultyId) return;
    const facAsgs = assignments.filter((a) => a.faculty_id === selectedFacultyId);
    setSelectedSectionIds(facAsgs.map((a) => a.section_id));
  }, [selectedFacultyId, assignments]);

  const toggleSectionCheckbox = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSaveAccess = async () => {
    if (!selectedFacultyId) return;
    setSaving(true);
    const res = await saveFacultyAccessAssignments(
      selectedFacultyId,
      selectedSectionIds
    );
    setSaving(false);
    if (res.success) {
      setToastMessage('Faculty section access saved successfully.');
      setTimeout(() => setToastMessage(null), 3500);
      await loadData();
    }
  };

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjFormFacultyId, setSubjFormFacultyId] = useState('');
  const [subjFormSectionName, setSubjFormSectionName] = useState('');
  const [subjFormSubjectName, setSubjFormSubjectName] = useState('');
  const [subjFormError, setSubjFormError] = useState('');
  const [subjFormSaving, setSubjFormSaving] = useState(false);

  // Allowed section choices for selected faculty
  const currentFacObj = facultyMembers.find(f => f.id === subjFormFacultyId || f.email === subjFormFacultyId);
  const allowedFacultyAssignments = assignments.filter(a => a.faculty_id === subjFormFacultyId || a.faculty_email === currentFacObj?.email);

  useEffect(() => {
    if (allowedFacultyAssignments.length > 0) {
      setSubjFormSectionName(allowedFacultyAssignments[0].section_name || '');
    } else {
      setSubjFormSectionName('');
    }
  }, [subjFormFacultyId, assignments.length]);

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjFormError('');
    if (!subjFormFacultyId) {
      setSubjFormError('Please select a faculty member.');
      return;
    }
    if (!subjFormSubjectName.trim()) {
      setSubjFormError('Subject name cannot be empty.');
      return;
    }

    setSubjFormSaving(true);
    const res = await adminAssignSubjectToFaculty(subjFormFacultyId, subjFormSubjectName.trim(), subjFormSectionName);
    setSubjFormSaving(false);

    if (res.success) {
      setToastMessage('Subject assigned successfully.');
      setTimeout(() => setToastMessage(null), 3500);
      setShowAddSubjectModal(false);
      setSubjFormSubjectName('');
      await loadData();
    } else {
      setSubjFormError(res.error || 'Failed to assign subject.');
    }
  };

  const handleRemoveSubjectAssignment = async (id: string) => {
    await removeFacultySubjectAssignment(id);
    await loadData();
  };

  const filteredSections = sections.filter(
    (s) => s.academic_year_id === selectedYearId && s.department_id === selectedDeptId
  );

  return (
    <div className="page-frame animate-fade space-y-6">
      <div className="welcome-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Access & Course Administration</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Faculty Access & Subject Management</h1>
          <p className="lede text-slate-500 mt-1">Assign class section boundaries and subjects to faculty members.</p>
        </div>
        <button
          className="button button-primary text-xs py-2 px-4 flex items-center gap-2"
          onClick={() => {
            setSubjFormError('');
            setShowAddSubjectModal(true);
          }}
        >
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 mb-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-700 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-teal-700 bg-slate-50 rounded-2xl border border-slate-200">
          Loading Faculty Access & Subject Data from Supabase...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ASSIGNMENT FORM */}
            <div className="panel p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Assign Section Access</h2>

              <div className="space-y-5">
                {/* Search & Select Faculty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                    <span>Search & Select Faculty Member</span>
                    {facSearchTerm && (
                      <button type="button" className="text-teal-700 hover:underline font-normal text-[11px]" onClick={() => setFacSearchTerm('')}>
                        Clear Search
                      </button>
                    )}
                  </label>

                  <div className="relative mb-2">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by Name, Email, or Employee ID..."
                      value={facSearchTerm}
                      onChange={(e) => setFacSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-teal-500"
                    />
                  </div>

                  {facultyMembers.length > 0 ? (
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-teal-500 font-medium"
                    >
                      {facultyMembers
                        .filter((f) => {
                          if (!facSearchTerm.trim()) return true;
                          const q = facSearchTerm.toLowerCase();
                          return (
                            f.full_name.toLowerCase().includes(q) ||
                            f.email.toLowerCase().includes(q) ||
                            f.id.toLowerCase().includes(q)
                          );
                        })
                        .map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.full_name} ({fac.email})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                      No faculty profiles imported yet. Click "Import Faculty" on the dashboard.
                    </p>
                  )}
                </div>

                {/* Select Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Academic Year
                  </label>
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-teal-500"
                  >
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-teal-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes for Sections */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Sections
                  </label>
                  {filteredSections.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                      {filteredSections.map((sec) => {
                        const isChecked = selectedSectionIds.includes(sec.id);
                        return (
                          <label
                            key={sec.id}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSectionCheckbox(sec.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm">{sec.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 p-3 bg-white border border-slate-200 rounded-xl">
                      No sections found for this year and department.
                    </p>
                  )}
                </div>

                {/* Save Action */}
                <button
                  onClick={handleSaveAccess}
                  disabled={saving || !selectedFacultyId}
                  className="button button-primary full-width text-sm py-3 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  {saving ? 'Saving Assignments...' : 'Save Access'}
                </button>
              </div>
            </div>

            {/* CURRENT ASSIGNMENTS SUMMARY PANEL */}
            <div className="panel p-6 lg:col-span-1">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Access List</h2>
              {facultyMembers.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {facultyMembers.map((fac) => {
                    const facSecs = assignments.filter((a) => a.faculty_id === fac.id);
                    return (
                      <div key={fac.id} className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="font-bold text-slate-900 text-sm">{fac.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{fac.email}</div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {facSecs.length > 0 ? (
                            facSecs.map((a) => (
                              <span key={a.id} className="chip chip-teal text-xs">
                                {a.section_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">No faculty assigned yet.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 p-4 text-center">
                  No faculty members registered.
                </div>
              )}
            </div>
          </div>

          {/* SUBJECT MANAGEMENT PANEL */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">SUBJECT MANAGEMENT</h2>
                <p className="text-xs text-slate-500 mt-0.5">Assign subjects to faculty members for their section boundary.</p>
              </div>
              <button
                className="button button-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  setSubjFormError('');
                  setShowAddSubjectModal(true);
                }}
              >
                <Plus size={14} /> Add Subject
              </button>
            </div>

            {allSubjectAssignments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allSubjectAssignments.map((subAsg) => (
                  <div key={subAsg.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-teal-700 px-2 py-0.5 bg-teal-50 border border-teal-500/30 rounded text-[11px]">
                          {subAsg.subject_code}
                        </span>
                        <span className="text-slate-500 font-medium">({subAsg.section_name || subAsg.section})</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{subAsg.subject_name}</h4>
                      <div className="text-slate-700 font-semibold mt-1">Faculty: {subAsg.faculty_name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{subAsg.faculty_email}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveSubjectAssignment(subAsg.id)}
                      className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-400 hover:bg-slate-100 transition-colors"
                      title="Delete Subject Assignment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs">
                No subjects assigned yet. Click "+ Add Subject" to create and assign a subject to a faculty member.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div className="drawer-backdrop" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Subject / Assign Subject</h2>
              <button className="icon-button" onClick={() => setShowAddSubjectModal(false)}><X size={18} /></button>
            </div>

            {subjFormError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {subjFormError}
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Faculty:</label>
                <select
                  required
                  value={subjFormFacultyId}
                  onChange={(e) => setSubjFormFacultyId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="">[ Select Faculty ▼ ]</option>
                  {facultyMembers.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.full_name} ({fac.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Section:</label>
                {allowedFacultyAssignments.length > 0 ? (
                  <select
                    required
                    value={subjFormSectionName}
                    onChange={(e) => setSubjFormSectionName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    {allowedFacultyAssignments.map((a) => (
                      <option key={a.id} value={a.section_name}>
                        {a.section_name} ({a.department_code || 'CSE'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                    No assigned section for this faculty member yet. Assign a section under Faculty Access first.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Subject Name:</label>
                <input
                  required
                  value={subjFormSubjectName}
                  onChange={(e) => setSubjFormSubjectName(e.target.value)}
                  placeholder="Enter subject name (e.g. Database Management Systems)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  className="button button-secondary py-2 px-4 text-xs"
                  onClick={() => setShowAddSubjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjFormSaving}
                  className="button button-primary py-2 px-4 text-xs"
                >
                  {subjFormSaving ? 'Assigning...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STUDENT MANAGEMENT VIEW
// ============================================================================
export function StudentManagementView() {
  const { collegeId } = useAuth();
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentMember | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [collegeId]);

  const loadData = async () => {
    setLoading(true);
    const [yData, dData, sData, list] = await Promise.all([
      fetchAcademicYears(),
      fetchDepartments(),
      fetchSections(),
      fetchStudentMembers(undefined, undefined, undefined, collegeId)
    ]);
    setYears(yData);
    setDepartments(dData);
    setSections(sData);
    setStudents(list);
    
    if (yData.length > 0) setSelectedYearId(yData[0].id);
    if (dData.length > 0) setSelectedDeptId(dData[0].id);
    setLoading(false);
  };

  const activeYear = years.find((y) => y.id === selectedYearId) || years[0];
  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const filteredSections = sections.filter(
    (s) => s.academic_year_id === selectedYearId && s.department_id === selectedDeptId
  );

  const activeSection = sections.find(s => s.id === selectedSectionId);

  const sectionStudents = students.filter(s => {
    if (!activeSection) return false;
    return s.section === activeSection.name;
  });

  const filteredStudents = sectionStudents.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.regno && s.regno.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.year && s.year.toLowerCase().includes(q)) ||
      (s.section && s.section.toLowerCase().includes(q)) ||
      (s.semester && s.semester.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setActionLoading(true);
    try {
      await deleteStudentMember(deletingStudent.id);
      setStudents(students.filter(s => s.id !== deletingStudent.id));
      setDeletingStudent(null);
    } catch (err) {
      alert(getUserFriendlyError(err, 'DATABASE', 'Unable to delete student record. Please try again.'));
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading student directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Student Roster</span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">TOTAL STUDENTS: {students.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-500 mt-1">Select Year, Department, and Section to view records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="button button-primary flex items-center gap-2 text-xs py-2"><Upload size={14} /><span>Import Data</span></button><button onClick={loadData} className="button button-secondary flex items-center gap-2 text-xs py-2">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* STEP 1: ACADEMIC YEAR SELECTION */}
      <div className="panel p-5">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">1. Select Academic Year</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {years.map((year) => (
            <button
              key={year.id}
              onClick={() => { setSelectedYearId(year.id); setSelectedSectionId(''); }}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedYearId === year.id
                  ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold shadow-lg shadow-teal-950/40'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-sm uppercase font-extrabold">{year.name}</div>
                <div className="text-xs text-slate-500">{year.code}</div>
              </div>
              <ChevronRight size={16} className={selectedYearId === year.id ? 'text-teal-700' : 'text-slate-600'} />
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2: DEPARTMENT / BRANCH SELECTION */}
      <div className="panel p-5">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
          2. Select Branch / Department ({activeYear?.name})
        </div>
        <div className="flex flex-wrap gap-3">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => { setSelectedDeptId(dept.id); setSelectedSectionId(''); }}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                selectedDeptId === dept.id
                  ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 size={16} />
              <span>{dept.code} ({dept.name})</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: SECTION SELECTION */}
      <div className="panel p-5">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
          3. Select Section ({activeDept?.code})
        </div>
        {filteredSections.length === 0 ? (
          <div className="p-4 bg-slate-50 text-slate-500 text-sm rounded-xl border border-slate-200 text-center">
            No sections defined for this department. Add sections in Academic Structure first.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                  selectedSectionId === sec.id
                    ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/50'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{sec.name}</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{students.filter(s => s.section === sec.name).length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STEP 4: DATA TABLE */}
      {selectedSectionId && (
        <div className="panel p-6 animate-fade-in">
          {sectionStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Students in {activeSection?.name}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">There are currently no students mapped to this section. You can insert data manually, via Excel, or PDF upload.</p>
              <button onClick={() => setShowImportModal(true)} className="button button-primary inline-flex items-center gap-2">
                <Upload size={16} />
                <span>Import Data</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{activeSection?.name} Roster</h3>
                <button onClick={() => setShowImportModal(true)} className="button button-primary flex items-center gap-2 text-xs py-2">
                  <Upload size={14} />
                  <span>Import Data</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Reg No, Name, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-teal-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Reg No</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-teal-700">{s.regno}</td>
                        <td className="p-4 font-semibold text-slate-900">{s.name}</td>
                        <td className="p-4 font-mono text-slate-500">{s.email}</td>
                        <td className="p-4 space-x-2">
                          <button onClick={() => setEditingStudent(s)} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-teal-700 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeletingStudent(s)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">No students match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {showImportModal && (
        <StudentImportModal onClose={() => { setShowImportModal(false); loadData(); }} sectionName={activeSection?.name} />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={async (updates) => {
            try {
              await updateStudentMember(editingStudent.id, updates);
              setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...updates } : s));
              setEditingStudent(null);
            } catch(e) { alert(getUserFriendlyError(e, 'DATABASE', 'Unable to update student information. Please try again.')); }
          }}
        />
      )}

      {deletingStudent && (
        <div className="drawer-backdrop" onClick={() => !actionLoading && setDeletingStudent(null)}>
          <div className="modal-card max-w-sm p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h3>
            <p className="text-xs text-slate-500 mb-6">Are you sure you want to remove <strong className="text-slate-900">{deletingStudent.name}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button className="button button-secondary flex-1" onClick={() => setDeletingStudent(null)} disabled={actionLoading}>Cancel</button>
              <button className="button button-primary flex-1 bg-rose-600 hover:bg-rose-700" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: StudentMember;
  onClose: () => void;
  onSave: (updates: Partial<StudentMember>) => Promise<void>;
}) {
  const [name, setName] = useState(student.name || '');
  const [regno, setRegno] = useState(student.regno || '');
  const [email, setEmail] = useState(student.email || '');
  const [department, setDepartment] = useState(student.department || 'CSE');
  const [year, setYear] = useState(student.year || '');
  const [section, setSection] = useState(student.section || '');
  const [semester, setSemester] = useState(student.semester || '');
  const [dob, setDob] = useState(student.dob || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name,
      regno,
      email,
      department,
      year,
      section,
      semester,
      dob,
    });
    setSaving(false);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Edit Student Profile</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Registration No (Regno)</label>
            <input type="text" value={regno} onChange={(e) => setRegno(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500 font-mono" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500 font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Year</label>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. Second Year" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Section</label>
              <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. CSE-A" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Semester</label>
              <input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Sem 3" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Date of Birth (DOB)</label>
            <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-teal-500" />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" className="button button-secondary flex-1 text-xs py-2.5" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="button button-primary flex-1 text-xs py-2.5">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// FACULTY MANAGEMENT VIEW
// ============================================================================
export function FacultyManagementView() {
  const { collegeId } = useAuth();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<FacultyMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [collegeId]);

  const loadData = async () => {
    setLoading(true);
    const [facs, yrs, depts] = await Promise.all([
      fetchFacultyMembers(collegeId),
      fetchAcademicYears(),
      fetchDepartments()
    ]);
    setFaculty(facs);
    setYears(yrs);
    setDepartments(depts);

    if (yrs.length > 0) setSelectedYearId(yrs[0].id);
    if (depts.length > 0) setSelectedDeptId(depts[0].id);
    setLoading(false);
  };

  const activeYear = years.find((y) => y.id === selectedYearId) || years[0];
  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const deptFaculty = faculty.filter(f => {
    if (!activeDept) return false;
    return f.department === activeDept.name || f.department === activeDept.code;
  });

  const filteredFaculty = deptFaculty.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.employee_id && f.employee_id.toLowerCase().includes(q)) ||
      (f.subject && f.subject.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deletingFaculty) return;
    setActionLoading(true);
    try {
      await deleteFacultyMember(deletingFaculty.id);
      setFaculty(faculty.filter(f => f.id !== deletingFaculty.id));
      setDeletingFaculty(null);
    } catch (err) {
      alert(getUserFriendlyError(err, 'DATABASE', 'Unable to delete faculty record. Please try again.'));
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading faculty directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Faculty Directory</span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">TOTAL FACULTY: {faculty.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Faculty Management</h1>
          <p className="text-sm text-slate-500 mt-1">Select Year and Department to view records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="button button-primary flex items-center gap-2 text-xs py-2"><Upload size={14} /><span>Import Data</span></button><button onClick={loadData} className="button button-secondary flex items-center gap-2 text-xs py-2">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* STEP 1: ACADEMIC YEAR SELECTION */}
      <div className="panel p-5">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">1. Select Academic Year</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {years.map((year) => (
            <button
              key={year.id}
              onClick={() => setSelectedYearId(year.id)}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedYearId === year.id
                  ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold shadow-lg shadow-teal-950/40'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-sm uppercase font-extrabold">{year.name}</div>
                <div className="text-xs text-slate-500">{year.code}</div>
              </div>
              <ChevronRight size={16} className={selectedYearId === year.id ? 'text-teal-700' : 'text-slate-600'} />
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2: DEPARTMENT / BRANCH SELECTION */}
      <div className="panel p-5">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
          2. Select Branch / Department ({activeYear?.name})
        </div>
        <div className="flex flex-wrap gap-3">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                selectedDeptId === dept.id
                  ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 size={16} />
              <span>{dept.code} ({dept.name})</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: DATA TABLE */}
      {selectedDeptId && (
        <div className="panel p-6 animate-fade-in">
          {deptFaculty.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Faculty in {activeDept?.code}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">There are currently no faculty members assigned to this department. You can insert data manually, via Excel, or PDF upload.</p>
              <button onClick={() => setShowImportModal(true)} className="button button-primary inline-flex items-center gap-2">
                <Upload size={16} />
                <span>Import Data</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{activeDept?.name} Faculty Roster</h3>
                <button onClick={() => setShowImportModal(true)} className="button button-primary flex items-center gap-2 text-xs py-2">
                  <Upload size={14} />
                  <span>Import Data</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Email, Subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-teal-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredFaculty.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-teal-700">{f.employee_id}</td>
                        <td className="p-4 font-semibold text-slate-900">{f.name}</td>
                        <td className="p-4 font-mono text-slate-500">{f.email}</td>
                        <td className="p-4">
                          <span className="chip chip-teal text-[11px]">{f.subject || '-'}</span>
                        </td>
                        <td className="p-4 space-x-2">
                          <button onClick={() => setEditingFaculty(f)} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-teal-700 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeletingFaculty(f)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredFaculty.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">No faculty match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {showImportModal && (
        <FacultyImportModal onClose={() => { setShowImportModal(false); loadData(); }} />
      )}

      {editingFaculty && (
        <EditFacultyModal
          faculty={editingFaculty}
          onClose={() => setEditingFaculty(null)}
          onSave={async (updates) => {
            try {
              await updateFacultyMember(editingFaculty.id, updates);
              setFaculty(faculty.map(f => f.id === editingFaculty.id ? { ...f, ...updates } : f));
              setEditingFaculty(null);
            } catch(e) { alert(getUserFriendlyError(e, 'DATABASE', 'Unable to update faculty information. Please try again.')); }
          }}
        />
      )}

      {deletingFaculty && (
        <div className="drawer-backdrop" onClick={() => !actionLoading && setDeletingFaculty(null)}>
          <div className="modal-card max-w-sm p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Faculty?</h3>
            <p className="text-xs text-slate-500 mb-6">Are you sure you want to remove <strong className="text-slate-900">{deletingFaculty.name}</strong>?</p>
            <div className="flex gap-3">
              <button className="button button-secondary flex-1" onClick={() => setDeletingFaculty(null)} disabled={actionLoading}>Cancel</button>
              <button className="button button-primary flex-1 bg-rose-600 hover:bg-rose-700" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function EditFacultyModal({
  faculty,
  onClose,
  onSave,
}: {
  faculty: FacultyMember;
  onClose: () => void;
  onSave: (updates: Partial<FacultyMember>) => Promise<void>;
}) {
  const [name, setName] = useState(faculty.name || '');
  const [empId, setEmpId] = useState(faculty.employee_id || '');
  const [email, setEmail] = useState(faculty.email || '');
  const [department, setDepartment] = useState(faculty.department || 'CSE');
  const [year, setYear] = useState(faculty.year || '');
  const [section, setSection] = useState(faculty.section || '');
  const [subject, setSubject] = useState(faculty.subject || '');
  const [dob, setDob] = useState(faculty.dob || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name,
      employee_id: empId,
      email,
      department,
      year,
      section,
      subject,
      dob,
    });
    setSaving(false);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Edit Faculty Profile</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Employee ID</label>
            <input type="text" value={empId} onChange={(e) => setEmpId(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500 font-mono" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500 font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Year</label>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 3" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Section</label>
              <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. C" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. DBMS" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Date of Birth (DOB)</label>
            <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-violet-500" />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" className="button button-secondary flex-1 text-xs py-2.5" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="button button-primary flex-1 text-xs py-2.5">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// STUDENT EXCEL IMPORT MODAL WITH NATIVE FILE PICKER FIX
// ============================================================================
function StudentImportModal({
  defaultYearId,
  defaultDeptId,
  defaultSecId,
  sectionName,
  onClose
}: {
  defaultYearId?: string;
  defaultDeptId?: string;
  defaultSecId?: string;
  sectionName?: string;
  onClose: () => void;
}) {
  const { collegeId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<'excel' | 'text' | 'pdf'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setResult(null);
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls|csv)$/i)) {
        setFileError('Invalid file type. Please select .xlsx or .csv');
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleDropzoneClick = () => { fileInputRef.current?.click(); };

  const processImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setFileError('Excel file is empty or corrupted.');
        setImporting(false);
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!rawRows || rawRows.length < 2) {
        setFileError('Excel file contains no student data rows.');
        setImporting(false);
        return;
      }

      const headers: string[] = (rawRows[0] || []).map((h: any) => String(h || '').trim());
      const headerValidation = validateStudentExcelHeaders(headers);

      if (!headerValidation.valid) {
        setFileError(`Missing required columns: ${headerValidation.missingColumns.join(', ')}`);
        setImporting(false);
        return;
      }

      const parsedDataRows: any[] = XLSX.utils.sheet_to_json(sheet);
      const m = headerValidation.mappedHeaders;

      const formattedRows: StudentImportRow[] = parsedDataRows.map((r) => ({
        name: String(r[m.name] || r.Name || r.name || '').trim(),
        regno: String(r[m.regno] || r.Regno || r.regno || '').trim(),
        email: String(r[m.email] || r.Email || r.email || '').trim().toLowerCase(),
        department: String(r[m.department] || r.Department || r.department || 'CSE').trim(),
        year: String(r[m.year] || r.Year || r.year || 'First Year').trim(),
        section: String(r[m.section] || r.Section || r.section || 'CSE-A').trim(),
        dob: String(r[m.dob] || r.DOB || r.dob || '').trim(),
        semester: String(r.Semester || r.semester || '').trim(),
      }));

      const res = await importStudentsBatch(formattedRows, defaultYearId, defaultDeptId, defaultSecId, collegeId);
      setResult(res);
    } catch (err: any) { setFileError(err.message || 'Failed to process file'); }
    setImporting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Data Ingestion Engine</span>
            <h2 className="text-lg font-bold text-slate-900">Import Students {sectionName ? `for ${sectionName}` : ''}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 bg-white">
          <button onClick={() => setActiveTab('excel')} className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${activeTab === 'excel' ? 'border-b-2 border-teal-500 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>Excel / CSV</button>
          <button onClick={() => setActiveTab('text')} className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${activeTab === 'text' ? 'border-b-2 border-teal-500 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>Raw Text</button>
          <button onClick={() => setActiveTab('pdf')} className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${activeTab === 'pdf' ? 'border-b-2 border-teal-500 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>PDF Document</button>
        </div>

        <div className="p-6 bg-white min-h-[300px]">
          {activeTab === 'excel' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <FileSpreadsheet size={28} />
              </div>
              <h3 className="font-bold text-slate-900">Upload Excel Spreadsheet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Select an .xlsx or .csv file. Columns should include Name, Email, Reg No, Department, Year, Section.</p>
              
              <div onClick={handleDropzoneClick} className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer group flex flex-col items-center">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                <Upload size={24} className="text-slate-400 group-hover:text-teal-500 mb-3" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700">
                  {file ? file.name : 'Click to browse or drag file here'}
                </span>
              </div>
              
              {fileError && <div className="text-rose-500 text-xs font-bold p-3 bg-rose-50 rounded-xl border border-rose-100">{fileError}</div>}
              
              <div className="flex gap-3 mt-6">
                <button className="button button-secondary flex-1 text-xs py-2.5" onClick={onClose}>Cancel</button>
                <button onClick={processImport} disabled={!file || importing} className={`button button-primary flex-1 text-xs py-2.5 ${!file || importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'text' && (
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="font-bold text-slate-900">Paste Raw Data</h3>
              <p className="text-xs text-slate-500">Paste tabular data from Excel, Word, or plain text. Our AI will automatically parse names, emails, and identifiers.</p>
              <textarea 
                className="w-full flex-1 min-h-[160px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 focus:border-teal-500 focus:bg-white transition-colors"
                placeholder="Name, Email, ID...&#10;John Doe, john@example.edu, 24CSE001..."
              ></textarea>
              <button className="button button-primary w-full py-3" onClick={() => setIsProcessing(true)}>
                {isProcessing ? 'Processing AI...' : 'Parse Data with AI'}
              </button>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="text-center space-y-4 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Layers size={28} />
              </div>
              <h3 className="font-bold text-slate-900">Upload PDF Document</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Upload an official student list PDF. The Vision AI engine will extract names and IDs automatically.</p>
              
              <div className="mt-4 p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group flex flex-col items-center w-full">
                <Upload size={24} className="text-slate-400 group-hover:text-blue-500 mb-3" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Select PDF File</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body);
}


function FacultyImportModal({ onClose }: { onClose: () => void }) {
  const { collegeId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setResult(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFileError('Please upload an Excel file (.xlsx, .xls, or .csv).');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImport = async () => {
    if (!file || importing) return;
    setImporting(true);
    setResult(null);
    setFileError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setFileError('Excel file is empty or corrupted.');
        setImporting(false);
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!rawRows || rawRows.length < 2) {
        setFileError('Excel file contains no faculty data rows.');
        setImporting(false);
        return;
      }

      const headers: string[] = (rawRows[0] || []).map((h: any) => String(h || '').trim());
      const headerValidation = validateFacultyExcelHeaders(headers);

      if (!headerValidation.valid) {
        setFileError(`Missing required columns: ${headerValidation.missingColumns.join(', ')}`);
        setImporting(false);
        return;
      }

      const parsedDataRows: any[] = XLSX.utils.sheet_to_json(sheet);
      const m = headerValidation.mappedHeaders;

      const formattedRows: FacultyImportRow[] = parsedDataRows.map((r) => {
        const findVal = (key: string, fallbacks: string[]) => {
          if (m[key] && r[m[key]] !== undefined) return String(r[m[key]]).trim();
          for (const fb of fallbacks) {
            if (r[fb] !== undefined) return String(r[fb]).trim();
          }
          for (const k of Object.keys(r)) {
            const normKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (fallbacks.some(fb => fb.toLowerCase().replace(/[^a-z0-9]/g, '') === normKey)) {
              return String(r[k]).trim();
            }
          }
          return '';
        };

        return {
          name: findVal('name', ['Name', 'name', 'Faculty Name', 'Full Name', 'Staff Name']),
          employee_id: findVal('employee_id', ['Employee ID', 'EmployeeID', 'employee_id', 'Emp ID', 'EmpID', 'ID', 'id', 'Code', 'Faculty ID']),
          email: findVal('email', ['Email', 'email', 'Email Address', 'EmailID', 'Mail']),
          department: findVal('department', ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'CSE',
          year: findVal('year', ['Year', 'year']),
          section: findVal('section', ['Section', 'section']),
          subject: findVal('subject', ['Subject', 'subject']),
          phone: findVal('phone', ['Phone', 'phone', 'Mobile', 'Contact']),
          dob: findVal('dob', ['DOB', 'dob', 'Date of Birth', 'DateOfBirth']),
        };
      });

      const res = await importFacultyBatch(formattedRows, collegeId);
      setResult(res);
    } catch (err) {
      setFileError(`Failed to process Excel file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-card p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Faculty Excel</h2>
            <p className="text-xs text-slate-500 font-normal">Upload .xlsx or .csv containing faculty details.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* NATIVE FILE PICKER CLICKABLE DROPZONE */}
          <div
            onClick={handleDropzoneClick}
            className="p-6 border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-2xl text-center bg-white cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-700 group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <div className="text-sm font-bold text-slate-800">Choose File</div>
                <div className="text-xs text-slate-500">No file chosen</div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 w-full">
                  <strong className="text-slate-700 block mb-0.5">Required Columns:</strong>
                  Name, Employee ID, Email, Department, DOB
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-between p-3 bg-slate-50 border border-violet-500/40 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 text-left overflow-hidden">
                  <FileSpreadsheet size={24} className="text-violet-700 shrink-0" />
                  <div className="truncate">
                    <div className="text-sm font-bold text-violet-300 truncate">✓ {file.name}</div>
                    <div className="text-xs text-slate-500 font-mono">File size: {(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="button button-secondary text-xs py-1 px-3 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Validation Error Banner */}
          {fileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} /> {fileError}
            </div>
          )}

          {/* Import Summary Results */}
          {result && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                <span>Import Summary</span>
                <span className="text-emerald-400 font-mono">{result.importedCount} faculty members imported successfully.</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center py-1">
                <div className="p-2 rounded-lg bg-teal-50 border border-teal-500/20">
                  <div className="text-base font-black text-teal-700 font-mono">{result.importedCount}</div>
                  <div className="text-[10px] text-teal-700/90">Imported / Upserted</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-base font-black text-amber-300 font-mono">{result.skippedCount}</div>
                  <div className="text-[10px] text-amber-400/90">Skipped</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="text-base font-black text-rose-300 font-mono">{result.invalidCount}</div>
                  <div className="text-[10px] text-rose-400/90">Invalid Rows</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="font-semibold text-rose-400 mb-1">Validation Errors:</div>
                  <div className="text-rose-300 max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {result.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button className="button button-secondary flex-1 text-xs py-2.5" onClick={onClose}>Close</button>
            <button
              onClick={processImport}
              disabled={!file || importing}
              className={`button button-primary flex-1 text-xs py-2.5 ${!file || importing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {importing ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
