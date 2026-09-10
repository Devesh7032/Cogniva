import React, { useEffect, useState } from 'react';
import {
  Building2, CalendarDays, CheckCircle2, ChevronRight, Database, GraduationCap,
  Layers, LogOut, Plus, ShieldCheck, SlidersHorizontal, Sparkles, UserCheck, UserCog,
  UsersRound, BookOpen, Search, Filter, X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchAcademicYears, fetchDepartments, fetchSections, createDepartment, createSection,
  AcademicYear, Department, Section
} from '@/lib/academic-api';

export function AcademicStructureView() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSecModal, setShowSecModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadStructure();
  }, []);

  const loadStructure = async () => {
    setLoading(true);
    const [yData, dData, sData] = await Promise.all([
      fetchAcademicYears(),
      fetchDepartments(),
      fetchSections(),
    ]);
    setYears(yData);
    setDepartments(dData);
    setSections(sData);

    if (yData.length > 0) setSelectedYearId(yData[1]?.id || yData[0].id);
    if (dData.length > 0) setSelectedDeptId(dData[0].id);
    setLoading(false);
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

  const activeYearObj = years.find((y) => y.id === selectedYearId) || years[0];
  const activeDeptObj = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const filteredSections = sections.filter(
    (s) => s.academic_year_id === selectedYearId && s.department_id === selectedDeptId
  );

  return (
    <div className="page-frame animate-fade">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Admin Workspace · Academic Structure</div>
          <h1>Academic Structure Management</h1>
          <p className="lede">Configure academic years, departments/branches, and class sections dynamically from Supabase.</p>
        </div>
        <div className="flex gap-3">
          <button className="button button-secondary" onClick={() => setShowDeptModal(true)}>
            <Plus size={15} /> Add Department
          </button>
          <button className="button button-primary" onClick={() => setShowSecModal(true)}>
            <Plus size={15} /> Add Section
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-teal-400">Loading Academic Structure from Supabase...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="panel col-span-1">
            <div className="section-heading mb-4">
              <div>
                <div className="eyebrow">Step 1</div>
                <h2>Academic Years</h2>
              </div>
            </div>
            <div className="space-y-2">
              {years.map((year) => (
                <button
                  key={year.id}
                  onClick={() => setSelectedYearId(year.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${
                    selectedYearId === year.id
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 font-semibold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{year.name}</span>
                  <ChevronRight size={16} className={selectedYearId === year.id ? 'text-teal-400' : 'text-slate-600'} />
                </button>
              ))}
            </div>
          </div>

          <div className="panel col-span-1 md:col-span-3">
            <div className="section-heading mb-4">
              <div>
                <div className="eyebrow">Step 2 & 3</div>
                <h2>{activeYearObj?.name || 'Academic Year'} · Departments & Sections</h2>
                <p>Select a department to view and manage its assigned sections.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDeptId === dept.id
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dept.code} ({dept.name})
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Assigned Sections in {activeDeptObj?.code} ({activeYearObj?.name})
              </h3>
              {filteredSections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredSections.map((sec) => (
                    <div key={sec.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-100 text-lg">{sec.name}</span>
                        <span className="chip chip-teal text-xs">Active</span>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Structure: {activeYearObj?.name} → {activeDeptObj?.code}</p>
                        <p className="text-teal-400/90 font-mono">Capacity: {sec.capacity || 60} students</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  No sections created for {activeDeptObj?.code} in {activeYearObj?.name} yet. Click "Add Section" above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="drawer-backdrop" onClick={() => setShowDeptModal(false)}>
          <div className="modal-card p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-100">Add New Department</h2>
              <button className="icon-button" onClick={() => setShowDeptModal(false)}><X size={18} /></button>
            </div>
            {actionError && <p className="text-rose-400 text-xs mb-3">{actionError}</p>}
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Department Name</label>
                <input
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Department Code</label>
                <input
                  required
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. IT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 uppercase"
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
          <div className="modal-card p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-100">Add Section to {activeDeptObj?.code}</h2>
              <button className="icon-button" onClick={() => setShowSecModal(false)}><X size={18} /></button>
            </div>
            {actionError && <p className="text-rose-400 text-xs mb-3">{actionError}</p>}
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Section Name</label>
                <input
                  required
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  placeholder={`e.g. ${activeDeptObj?.code}-E`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 uppercase"
                />
              </div>
              <button type="submit" className="button button-primary full-width">Create Section</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function FacultyAccessView() {
  const facultyAssignments = [
    { id: 'f1', name: 'Dr. Priya Iyer', email: 'priya.iyer@cogniva.edu', dept: 'CSE', sections: ['CSE-A', 'CSE-C'] },
    { id: 'f2', name: 'Prof. Rajesh Kumar', email: 'rajesh.k@cogniva.edu', dept: 'CSE', sections: ['CSE-B', 'CSE-D'] },
    { id: 'f3', name: 'Dr. Anita Sharma', email: 'anita.s@cogniva.edu', dept: 'ECE', sections: ['ECE-A', 'ECE-B'] },
  ];

  return (
    <div className="page-frame animate-fade">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Admin Workspace · Access Control</div>
          <h1>Faculty Access Management</h1>
          <p className="lede">Assign specific class sections to faculty members to control their access boundaries via RLS.</p>
        </div>
        <button className="button button-primary">
          <UserCheck size={15} /> Assign Section Access
        </button>
      </div>

      <div className="panel">
        <div className="section-heading mb-4">
          <div>
            <div className="eyebrow">Section Permissions</div>
            <h2>Assigned Faculty Boundaries</h2>
            <p>Faculty members can only access and enter attendance/marks for their explicitly assigned sections.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Faculty Member</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Assigned Sections</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {facultyAssignments.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-100">{fac.name}</div>
                    <div className="text-xs text-slate-500">{fac.email}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="chip chip-amber">{fac.dept}</span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {fac.sections.map((sec) => (
                        <span key={sec} className="chip chip-teal text-xs">
                          {sec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="button button-secondary text-xs py-1 px-3">
                      Manage Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StudentManagementView() {
  return (
    <div className="page-frame animate-fade">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Admin Workspace · Student Roster</div>
          <h1>Student Management</h1>
          <p className="lede">Manage student profiles and assign them to Year → Department → Section.</p>
        </div>
        <div className="flex gap-3">
          <button className="button button-secondary">
            <Filter size={15} /> Filter Roster
          </button>
          <button className="button button-primary">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading mb-4">
          <div>
            <div className="eyebrow">Directory</div>
            <h2>Student Hierarchy Assignments</h2>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: '1', name: 'Ananya Mehta', roll: '21CSE042', year: 'Second Year', dept: 'CSE', section: 'CSE-A' },
            { id: '2', name: 'Aditya Menon', roll: '21CSE089', year: 'Second Year', dept: 'CSE', section: 'CSE-B' },
            { id: '3', name: 'Nandini Rao', roll: '20ECE014', year: 'Third Year', dept: 'ECE', section: 'ECE-A' },
          ].map((student) => (
            <div key={student.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 text-sm">
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <strong className="text-slate-100 block">{student.name}</strong>
                  <span className="text-xs text-slate-500 font-mono">Roll: {student.roll}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip chip-violet">{student.year}</span>
                <span className="chip chip-amber">{student.dept}</span>
                <span className="chip chip-teal">{student.section}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FacultyManagementView() {
  return (
    <div className="page-frame animate-fade">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Admin Workspace · Faculty Directory</div>
          <h1>Faculty Management</h1>
          <p className="lede">Manage institution faculty members and permission levels.</p>
        </div>
        <button className="button button-primary">
          <Plus size={15} /> Add Faculty Member
        </button>
      </div>

      <div className="panel">
        <div className="section-heading mb-4">
          <div>
            <div className="eyebrow">Faculty Roster</div>
            <h2>Active Faculty Members</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Dr. Priya Iyer', title: 'Associate Professor', dept: 'CSE', email: 'priya.iyer@cogniva.edu' },
            { name: 'Prof. Rajesh Kumar', title: 'Assistant Professor', dept: 'CSE', email: 'rajesh.k@cogniva.edu' },
            { name: 'Dr. Anita Sharma', title: 'Professor & Head', dept: 'ECE', email: 'anita.s@cogniva.edu' },
          ].map((fac) => (
            <div key={fac.email} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <strong className="text-slate-100 block">{fac.name}</strong>
                <span className="text-xs text-slate-400">{fac.title} · {fac.dept}</span>
                <span className="text-xs text-slate-500 block mt-0.5">{fac.email}</span>
              </div>
              <span className="chip chip-teal">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
