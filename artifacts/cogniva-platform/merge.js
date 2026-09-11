const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'FacultyCgpaView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
  } from '../lib/academic-api';,
  , fetchFacultyGradeSummaryRecords, StudentGradeSummaryRecord } from '../lib/academic-api';
);

// 2. Add state
content = content.replace(
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);,
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);\n  const [gradeRecords, setGradeRecords] = useState<StudentGradeSummaryRecord[]>([]);
);

// 3. Update loadCgpaData
content = content.replace(
  const [recs, studs, secs] = await Promise.all([
      fetchFacultyCgpaRecords(user.email),
      fetchFacultyAssignedStudents(user.email),
      fetchFacultyAssignedSections(user.email)
    ]);
    setRecords(recs);
    setAssignedStudents(studs);
    setAssignedSections(secs);,
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
);

// 4. Add memo for grades
content = content.replace(
  // Excel Import Modal,
  const selectedStudentGrades = useMemo(() => {
    if (!selectedRecord) return null;
    return gradeRecords.find(g => g.regno.toLowerCase() === selectedRecord.regno.toLowerCase()) || null;
  }, [selectedRecord, gradeRecords]);

  const selectedGradeDistribution = useMemo(() => {
    if (!selectedStudentGrades?.subjectGrades) return [];
    const dist = {};
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
);

// 5. Replace Drawer UI wrapper
content = content.replace(
  className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in",
  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
);

content = content.replace(
  className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-lg h-full flex flex-col overflow-hidden animate-slide-left",
  className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
);

// 6. Split Content into two columns
content = content.replace(
  <div className="p-6 overflow-y-auto flex-1 space-y-6">,
  <div className="p-6 overflow-y-auto flex-1 bg-slate-50"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"><div className="space-y-6 flex flex-col bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
);

// 7. Inject Grades UI at the end of Content block before footer
// Finding the footer wrapper
content = content.replace(
              {/* Footer */},
              </div>
              {/* Right Column (Grades) */}
              <div className="space-y-6 flex flex-col bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">Overall Letter Grade</span>
                    <span className="text-3xl font-black text-slate-900">
                      Grade {selectedStudentGrades?.overallGrade || 'A'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1 font-medium">Academic Performance Rating</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 block mb-1">Standing</span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs inline-block">
                      {['O', 'A+'].includes(selectedStudentGrades?.overallGrade || 'A') ? 'Excellence Tier' : 'Good Standing'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Subject-Wise Grades Breakdown</h3>
                  {selectedStudentGrades?.subjectGrades && selectedStudentGrades.subjectGrades.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {selectedStudentGrades.subjectGrades.map((s, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 mr-2">{s.subjectName}</span>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg whitespace-nowrap">Grade {s.grade}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-500">No subject grades recorded.</p>}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Subject Grade Distribution</h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                    {selectedGradeDistribution.map(item => (
                      <div key={item.grade} className="flex items-center gap-3 text-xs">
                        <span className="font-mono font-bold text-slate-700 w-8">{item.grade}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: \\%\ }} />
                        </div>
                        <span className="font-bold text-slate-900 w-4 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div></div>
            {/* Footer */}
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated FacultyCgpaView.tsx');

// Also update App.tsx to hide the separate Grades route from the sidebar, since they are combined.
const appPath = path.join('src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
  { href: '/faculty/cgpa', label: 'CGPA / SGPA', icon: Award, roles: ['faculty'] },,
  { href: '/faculty/cgpa', label: 'Unified Academic Record', icon: Award, roles: ['faculty'] },
);
appContent = appContent.replace(
  { href: '/faculty/grades', label: 'Grade Management', icon: Award, roles: ['faculty'] },\n,
  `
);

fs.writeFileSync(appPath, appContent);
console.log('Successfully updated App.tsx Sidebar');

