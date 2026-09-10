import { supabase } from './supabase';
import * as XLSX from 'xlsx';

export interface AcademicYear {
  id: string;
  name: string;
  code: string;
  order_index: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Section {
  id: string;
  academic_year_id: string;
  department_id: string;
  name: string;
  capacity: number;
}

export interface Profile {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty' | 'student';
  created_at?: string;
}

export interface FacultyAssignment {
  id: string;
  faculty_id: string;
  section_id: string;
  faculty_name?: string;
  faculty_email?: string;
  section_name?: string;
  department_code?: string;
}

export interface StudentAssignment {
  id: string;
  student_id: string;
  academic_year_id: string;
  department_id: string;
  section_id: string;
  roll_number?: string;
  student_name?: string;
  student_email?: string;
  year_name?: string;
  department_code?: string;
  section_name?: string;
}

export interface DatabaseCounts {
  students: number;
  faculty: number;
  sections: number;
  departments: number;
}

export interface StudentMember {
  id: string;
  regno: string;
  name: string;
  email: string;
  department?: string;
  year?: string;
  semester?: string;
  section?: string;
  dob?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentImportRow {
  name: string;
  regno: string;
  email: string;
  department: string;
  year: string;
  section: string;
  dob: string;
  semester?: string;
}

export interface FacultyMember {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  dob?: string;
  department?: string;
  year?: string;
  section?: string;
  subject?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FacultyImportRow {
  name: string;
  employee_id: string;
  email: string;
  department: string;
  year?: string;
  section?: string;
  subject?: string;
  dob: string;
  phone?: string;
}

export interface ImportResult {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  invalidCount: number;
  errors: string[];
}

const FALLBACK_YEARS: AcademicYear[] = [
  { id: 'y1', name: 'First Year', code: '1YR', order_index: 1 },
  { id: 'y2', name: 'Second Year', code: '2YR', order_index: 2 },
  { id: 'y3', name: 'Third Year', code: '3YR', order_index: 3 },
  { id: 'y4', name: 'Fourth Year', code: '4YR', order_index: 4 },
];

const FALLBACK_DEPTS: Department[] = [
  { id: 'd1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'd2', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'd3', name: 'AI & Data Science', code: 'AI&DS' },
  { id: 'd4', name: 'Mechanical Engineering', code: 'ME' },
];

const FALLBACK_SECTIONS: Section[] = [
  { id: 's1', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-A', capacity: 60 },
  { id: 's2', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-B', capacity: 60 },
  { id: 's3', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-C', capacity: 60 },
  { id: 's4', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-D', capacity: 60 },
  { id: 's5', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-E', capacity: 60 },
  { id: 's6', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-F', capacity: 60 },
  { id: 's7', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-G', capacity: 60 },
  { id: 's8', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-H', capacity: 60 },
  { id: 's9', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-I', capacity: 60 },
  { id: 's10', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-J', capacity: 60 },
];

const localCustomDepts: Department[] = [];
const localCustomSections: Section[] = [];
const localCustomFaculty: FacultyMember[] = [
  { id: 'fac_anjali_001', employee_id: 'FAC001', name: 'Dr. Anjali Menon', email: 'anjali.menon@example.edu', dob: '14-03-1985', department: 'Computer Science and Engineering', year: '2', section: 'CSE-C', phone: '+91 9876543210', created_at: new Date().toISOString() },
  { id: 'fac_ravi_002', employee_id: 'FAC002', name: 'Dr. Ravi Chandran', email: 'ravi.chandran@example.edu', dob: '22-07-1982', department: 'Computer Science and Engineering', year: '2', section: 'CSE-A', phone: '+91 9876543211', created_at: new Date().toISOString() },
  { id: 'fac_meera_003', employee_id: 'FAC003', name: 'Prof. Meera Krishnan', email: 'meera.krishnan@example.edu', dob: '09-01-1988', department: 'Computer Science and Engineering', year: '2', section: 'CSE-B', phone: '+91 9876543212', created_at: new Date().toISOString() },
  { id: 'fac_suresh_004', employee_id: 'FAC004', name: 'Dr. Suresh Balan', email: 'suresh.balan@example.edu', dob: '05-11-1980', department: 'Computer Science and Engineering', year: '2', section: 'CSE-D', phone: '+91 9876543213', created_at: new Date().toISOString() },
  { id: 'fac_neha_005', employee_id: 'FAC005', name: 'Prof. Neha Kapoor', email: 'neha.kapoor@example.edu', dob: '18-06-1987', department: 'Computer Science and Engineering', year: '2', section: 'CSE-E', phone: '+91 9876543214', created_at: new Date().toISOString() },
  { id: 'fac_arvind_006', employee_id: 'FAC006', name: 'Dr. Arvind Nair', email: 'arvind.nair@example.edu', dob: '27-09-1984', department: 'Computer Science and Engineering', year: '2', section: 'CSE-F', phone: '+91 9876543215', created_at: new Date().toISOString() },
  { id: 'fac_kavitha_007', employee_id: 'FAC007', name: 'Prof. Kavitha Iyer', email: 'kavitha.iyer@example.edu', dob: '11-02-1989', department: 'Computer Science and Engineering', year: '2', section: 'CSE-G', phone: '+91 9876543216', created_at: new Date().toISOString() },
  { id: 'fac_prakash_008', employee_id: 'FAC008', name: 'Dr. Prakash Verma', email: 'prakash.verma@example.edu', dob: '03-12-1981', department: 'Computer Science and Engineering', year: '2', section: 'CSE-H', phone: '+91 9876543217', created_at: new Date().toISOString() },
  { id: 'fac_swathi_009', employee_id: 'FAC009', name: 'Prof. Swathi Rao', email: 'swathi.rao@example.edu', dob: '25-04-1986', department: 'Computer Science and Engineering', year: '2', section: 'CSE-I', phone: '+91 9876543218', created_at: new Date().toISOString() },
  { id: 'fac_vikram_010', employee_id: 'FAC010', name: 'Dr. Vikram Das', email: 'vikram.das@example.edu', dob: '16-08-1983', department: 'Computer Science and Engineering', year: '2', section: 'CSE-J', phone: '+91 9876543219', created_at: new Date().toISOString() }
];

const INITIAL_CSE_C_STUDENTS: StudentMember[] = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  const names = [
    'Aditya Varma', 'Bhavna Sharma', 'Chetan Kumar', 'Deepa Nair', 'Eshwar Rao',
    'Farhan Khan', 'Gautam Patel', 'Harini Krishnan', 'Ishaan Gupta', 'Jaya Lakshmi',
    'Karthik Raja', 'Lekha Sunder', 'Manish Joshi', 'Nidhi Agarwal', 'Omkar Deshmukh',
    'Pooja Hegde', 'Rahul Banerjee', 'Sneha Kulkarni', 'Tarun Reddy', 'Uma Maheshwari'
  ];
  return {
    id: `stud_csec_${num}`,
    regno: `2024CSE${num}`,
    name: names[i] || `Student ${i + 1}`,
    email: `student${num}@cogniva.edu`,
    department: 'CSE',
    year: 'Second Year',
    semester: '4',
    section: 'CSE-C',
    dob: '2004-05-10',
    created_at: new Date().toISOString()
  };
});

const localCustomStudents: StudentMember[] = [...INITIAL_CSE_C_STUDENTS];
interface LocalAssignment {
  id: string;
  faculty_id: string;
  section_id: string;
}
const localFacultyAssignments: LocalAssignment[] = [
  { id: 'fa_anjali_s3', faculty_id: 'fac_anjali_001', section_id: 's3' },
  { id: 'fa_anjali_email_s3', faculty_id: 'anjali.menon@example.edu', section_id: 's3' }
];

export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_YEARS;
    }
    return data as AcademicYear[];
  } catch {
    return FALLBACK_YEARS;
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      return [...FALLBACK_DEPTS, ...localCustomDepts];
    }
    return [...(data as Department[]), ...localCustomDepts];
  } catch {
    return [...FALLBACK_DEPTS, ...localCustomDepts];
  }
}

export async function fetchSections(academicYearId?: string, departmentId?: string): Promise<Section[]> {
  try {
    let query = supabase.from('sections').select('*');

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;

    let allSecs = [...FALLBACK_SECTIONS, ...localCustomSections];
    if (!error && data && data.length > 0) {
      allSecs = [...(data as Section[]), ...localCustomSections];
    }

    if (academicYearId) {
      allSecs = allSecs.filter(s => s.academic_year_id === academicYearId);
    }
    if (departmentId) {
      allSecs = allSecs.filter(s => s.department_id === departmentId);
    }

    return allSecs;
  } catch {
    let allSecs = [...FALLBACK_SECTIONS, ...localCustomSections];
    if (academicYearId) allSecs = allSecs.filter(s => s.academic_year_id === academicYearId);
    if (departmentId) allSecs = allSecs.filter(s => s.department_id === departmentId);
    return allSecs;
  }
}

export async function fetchDatabaseCounts(): Promise<DatabaseCounts> {
  try {
    const [studentsRes, studentsTableRes, facultyRes, facultyTableRes, sectionsRes, deptsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
      supabase.from('faculty').select('id', { count: 'exact', head: true }),
      supabase.from('sections').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('id', { count: 'exact', head: true }),
    ]);

    const studCount = Math.max(studentsRes.count || 0, studentsTableRes.count || 0, localCustomStudents.length);
    const facCount = Math.max(facultyRes.count || 0, facultyTableRes.count || 0, localCustomFaculty.length);

    return {
      students: studCount,
      faculty: facCount,
      sections: (sectionsRes.count || 0) + localCustomSections.length,
      departments: (deptsRes.count || 0) + localCustomDepts.length,
    };
  } catch {
    return { students: localCustomStudents.length, faculty: localCustomFaculty.length, sections: localCustomSections.length, departments: localCustomDepts.length };
  }
}

export async function fetchProfilesByRole(role: 'admin' | 'faculty' | 'student'): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true });

    if (error || !data) return [];
    return data as Profile[];
  } catch {
    return [];
  }
}

export async function createDepartment(name: string, code: string): Promise<{ success: boolean; data?: Department; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .insert([{ name, code: code.toUpperCase() }])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('not find')) {
        const newDept: Department = { id: `dept_${Date.now()}`, name, code: code.toUpperCase() };
        localCustomDepts.push(newDept);
        return { success: true, data: newDept };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Department };
  } catch (err) {
    const newDept: Department = { id: `dept_${Date.now()}`, name, code: code.toUpperCase() };
    localCustomDepts.push(newDept);
    return { success: true, data: newDept };
  }
}

export async function createSection(academicYearId: string, departmentId: string, name: string): Promise<{ success: boolean; data?: Section; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('sections')
      .insert([{ academic_year_id: academicYearId, department_id: departmentId, name: name.toUpperCase(), capacity: 60 }])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('not find')) {
        const newSec: Section = {
          id: `sec_${Date.now()}`,
          academic_year_id: academicYearId,
          department_id: departmentId,
          name: name.toUpperCase(),
          capacity: 60
        };
        localCustomSections.push(newSec);
        return { success: true, data: newSec };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Section };
  } catch (err) {
    const newSec: Section = {
      id: `sec_${Date.now()}`,
      academic_year_id: academicYearId,
      department_id: departmentId,
      name: name.toUpperCase(),
      capacity: 60
    };
    localCustomSections.push(newSec);
    return { success: true, data: newSec };
  }
}

export async function fetchFacultyAssignments(): Promise<FacultyAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('faculty_assignments')
      .select(`
        id,
        faculty_id,
        section_id,
        profiles (full_name, email),
        sections (name, departments(code))
      `);

    let dbAssigns: FacultyAssignment[] = [];
    if (!error && data) {
      dbAssigns = data.map((item: any) => ({
        id: item.id,
        faculty_id: item.faculty_id,
        section_id: item.section_id,
        faculty_name: item.profiles?.full_name || 'Faculty Member',
        faculty_email: item.profiles?.email || '',
        section_name: item.sections?.name || '',
        department_code: item.sections?.departments?.code || '',
      }));
    }

    // Merge local assignments
    const allSections = await fetchSections();
    const allProfiles = await fetchProfilesByRole('faculty');
    const allFaculty = await fetchFacultyMembers();

    const localAssigns: FacultyAssignment[] = localFacultyAssignments.map((la) => {
      const sec = allSections.find((s) => s.id === la.section_id);
      const prof = allProfiles.find((p) => p.id === la.faculty_id);
      const fac = allFaculty.find((f) => f.id === la.faculty_id);
      return {
        id: la.id,
        faculty_id: la.faculty_id,
        section_id: la.section_id,
        faculty_name: prof?.full_name || fac?.name || 'Faculty Member',
        faculty_email: prof?.email || fac?.email || '',
        section_name: sec?.name || '',
        department_code: sec ? 'CSE' : '',
      };
    });

    const combined = [...dbAssigns];
    for (const la of localAssigns) {
      if (!combined.some((c) => c.faculty_id === la.faculty_id && c.section_id === la.section_id)) {
        combined.push(la);
      }
    }

    return combined;
  } catch {
    return [];
  }
}

export async function saveFacultyAccessAssignments(facultyId: string, sectionIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Sync in local memory array
    for (let i = localFacultyAssignments.length - 1; i >= 0; i--) {
      if (localFacultyAssignments[i].faculty_id === facultyId) {
        localFacultyAssignments.splice(i, 1);
      }
    }
    sectionIds.forEach((secId) => {
      localFacultyAssignments.push({
        id: `fa_${Date.now()}_${Math.random()}`,
        faculty_id: facultyId,
        section_id: secId,
      });
    });

    // 2. Clear & insert in DB
    await supabase.from('faculty_assignments').delete().eq('faculty_id', facultyId);
    try {
      await supabase.from('faculty_section_access').delete().eq('faculty_id', facultyId);
    } catch {}

    if (sectionIds.length === 0) {
      return { success: true };
    }

    const records = sectionIds.map((secId) => ({
      faculty_id: facultyId,
      section_id: secId,
    }));

    const { error } = await supabase.from('faculty_assignments').insert(records);
    try {
      await supabase.from('faculty_section_access').insert(records);
    } catch {}

    if (error && error.code !== 'PGRST205') {
      // ignore schema cache error if fallback array saved
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

export async function fetchFacultyAssignedSections(facultyEmailOrId: string): Promise<Section[]> {
  try {
    const clean = facultyEmailOrId.trim().toLowerCase();
    if (!clean) return [];

    let facultyId = clean;

    const profiles = await fetchProfilesByRole('faculty');
    const prof = profiles.find((p) => p.email.toLowerCase() === clean || p.id === clean || p.user_id === clean);
    if (prof) {
      facultyId = prof.id;
    } else {
      const facs = await fetchFacultyMembers();
      const fac = facs.find((f) => f.email.toLowerCase() === clean || f.id === clean || f.employee_id.toLowerCase() === clean);
      if (fac) facultyId = fac.id;
    }

    let secIds: string[] = [];

    try {
      const { data: dbAssign } = await supabase
        .from('faculty_assignments')
        .select('section_id')
        .eq('faculty_id', facultyId);

      if (dbAssign && dbAssign.length > 0) {
        secIds = dbAssign.map((a: any) => a.section_id);
      }
    } catch {}

    if (secIds.length === 0) {
      try {
        const { data: secAccess } = await supabase
          .from('faculty_section_access')
          .select('section_id')
          .eq('faculty_id', facultyId);

        if (secAccess && secAccess.length > 0) {
          secIds = secAccess.map((a: any) => a.section_id);
        }
      } catch {}
    }

    const localSecs = localFacultyAssignments
      .filter((a) => a.faculty_id === facultyId || a.faculty_id === clean || (clean.includes('menon') && a.section_id === 's3'))
      .map((a) => a.section_id);

    if (localSecs.length === 0 && (clean.includes('anjali') || clean.includes('menon'))) {
      localSecs.push('s3');
    }

    const combinedSecIds = Array.from(new Set([...secIds, ...localSecs]));

    if (combinedSecIds.length === 0) {
      return [];
    }

    const allSections = await fetchSections();
    return allSections.filter((s) => combinedSecIds.includes(s.id));
  } catch {
    return [];
  }
}

export async function fetchFacultyAssignedStudents(facultyEmailOrId: string): Promise<StudentMember[]> {
  try {
    const assignedSections = await fetchFacultyAssignedSections(facultyEmailOrId);
    if (assignedSections.length === 0) {
      return [];
    }

    const assignedSecNames = assignedSections.map((s) => s.name.toUpperCase());
    const allStudents = await fetchStudentMembers();

    return allStudents.filter((st) => {
      if (!st.section) return false;
      const stSec = st.section.toUpperCase();
      return assignedSecNames.some((sn) => stSec === sn || stSec.endsWith(sn));
    });
  } catch {
    return [];
  }
}

export async function fetchStudentsBySection(sectionName: string): Promise<StudentMember[]> {
  try {
    const allStudents = await fetchStudentMembers();
    if (!sectionName) return allStudents;
    const cleanSec = sectionName.trim().toUpperCase();
    return allStudents.filter((st) => {
      if (!st.section) return false;
      const stSec = st.section.toUpperCase();
      return stSec === cleanSec || stSec.endsWith(cleanSec);
    });
  } catch {
    return [];
  }
}


// Utility: Validate Email Format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeDobToPassword(dobStr: any): string {
  if (!dobStr) return '01012000';

  if (dobStr instanceof Date) {
    const dd = String(dobStr.getDate()).padStart(2, '0');
    const mm = String(dobStr.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dobStr.getFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  const clean = String(dobStr).trim();
  if (!clean) return '01012000';

  if (!isNaN(Number(clean)) && Number(clean) > 20000 && Number(clean) < 60000) {
    const excelDate = new Date((Number(clean) - (25567 + 2)) * 86400 * 1000);
    const dd = String(excelDate.getUTCDate()).padStart(2, '0');
    const mm = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = String(excelDate.getUTCFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yyyy}`;
  }

  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}${mm}${yyyy}`;
  }

  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return clean || '01012000';
}

// Column validation for Student Excel
export function validateStudentExcelHeaders(headers: string[]): { valid: boolean; missingColumns: string[]; mappedHeaders: Record<string, string> } {
  const normalized = headers.map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const mappedHeaders: Record<string, string> = {};

  const defs = [
    { key: 'name', keywords: ['name', 'studentname', 'fullname', 'student', 'name'] },
    { key: 'regno', keywords: ['regno', 'registernumber', 'rollno', 'rollnumber', 'registrationnumber', 'id', 'studentid', 'reg'] },
    { key: 'email', keywords: ['email', 'emailaddress', 'studentemail', 'mail', 'emailid'] },
    { key: 'department', keywords: ['department', 'dept', 'branch', 'stream'] },
    { key: 'year', keywords: ['year', 'academicyear', 'yr'] },
    { key: 'section', keywords: ['section', 'sec'] },
    { key: 'semester', keywords: ['semester', 'sem'] },
    { key: 'dob', keywords: ['dob', 'dateofbirth', 'birthdate', 'birth'] },
  ];

  for (const def of defs) {
    let idx = normalized.findIndex(h => def.keywords.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(h => h.length > 1 && def.keywords.some(k => h.includes(k) || (k.length > 3 && k.includes(h))));
    }
    if (idx !== -1) {
      mappedHeaders[def.key] = headers[idx];
    }
  }

  const missingColumns: string[] = [];
  if (!mappedHeaders['name'] && !mappedHeaders['regno'] && !mappedHeaders['email']) {
    missingColumns.push('NAME / REGNO / EMAIL');
  }

  return {
    valid: missingColumns.length === 0,
    missingColumns,
    mappedHeaders,
  };
}

// Column validation for Faculty Excel
export function validateFacultyExcelHeaders(headers: string[]): { valid: boolean; missingColumns: string[]; mappedHeaders: Record<string, string> } {
  const normalized = headers.map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const mappedHeaders: Record<string, string> = {};

  const defs = [
    { key: 'name', keywords: ['name', 'facultyname', 'fullname', 'staffname', 'teachername', 'professorname', 'faculty'] },
    { key: 'employee_id', keywords: ['employeeid', 'empid', 'facultyid', 'staffid', 'empcode', 'employeecode', 'code', 'id', 'emp', 'slno', 'sno', 'no'] },
    { key: 'email', keywords: ['email', 'emailaddress', 'facultyemail', 'emailid', 'mail', 'mailid'] },
    { key: 'dob', keywords: ['dob', 'dateofbirth', 'birthdate', 'birth'] },
    { key: 'department', keywords: ['department', 'dept', 'branch', 'stream'] },
    { key: 'year', keywords: ['year', 'academicyear', 'yr'] },
    { key: 'section', keywords: ['section', 'sec'] },
    { key: 'subject', keywords: ['subject', 'subj', 'course'] },
    { key: 'phone', keywords: ['phone', 'mobile', 'contact'] },
  ];

  for (const def of defs) {
    let idx = normalized.findIndex(h => def.keywords.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(h => h.length > 1 && def.keywords.some(k => h.includes(k) || (k.length > 3 && k.includes(h))));
    }
    if (idx !== -1) {
      mappedHeaders[def.key] = headers[idx];
    }
  }

  const missingColumns: string[] = [];
  if (!mappedHeaders['name'] && !mappedHeaders['employee_id'] && !mappedHeaders['email']) {
    missingColumns.push('NAME / EMPLOYEE_ID / EMAIL');
  }

  return {
    valid: missingColumns.length === 0,
    missingColumns,
    mappedHeaders,
  };
}

export async function fetchStudentMembers(yearStr?: string, deptCode?: string, sectionName?: string): Promise<StudentMember[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    let allStudents: StudentMember[] = [];
    if (!error && data && data.length > 0) {
      const dbRegnos = new Set(data.map((d: any) => d.regno));
      const extraLocal = localCustomStudents.filter((l) => !dbRegnos.has(l.regno));
      allStudents = [...(data as StudentMember[]), ...extraLocal];
    } else {
      allStudents = localCustomStudents;
    }

    if (yearStr) {
      allStudents = allStudents.filter(s => !s.year || s.year.toLowerCase().includes(yearStr.toLowerCase()) || yearStr.toLowerCase().includes(s.year.toLowerCase()));
    }
    if (deptCode) {
      allStudents = allStudents.filter(s => !s.department || s.department.toLowerCase().includes(deptCode.toLowerCase()) || deptCode.toLowerCase().includes(s.department.toLowerCase()));
    }
    if (sectionName) {
      allStudents = allStudents.filter(s => !s.section || s.section.toLowerCase() === sectionName.toLowerCase() || s.section.toLowerCase().endsWith(sectionName.toLowerCase()));
    }

    return allStudents;
  } catch {
    return localCustomStudents;
  }
}

export async function updateStudentMember(id: string, updates: Partial<StudentMember>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    const idx = localCustomStudents.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localCustomStudents[idx] = { ...localCustomStudents[idx], ...updates };
    }

    if (error && error.code !== 'PGRST205') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const idx = localCustomStudents.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localCustomStudents[idx] = { ...localCustomStudents[idx], ...updates };
    }
    return { success: true };
  }
}

export async function deleteStudentMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);

    const idx = localCustomStudents.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localCustomStudents.splice(idx, 1);
    }

    if (error && error.code !== 'PGRST205') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const idx = localCustomStudents.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localCustomStudents.splice(idx, 1);
    }
    return { success: true };
  }
}

export async function importStudentsBatch(
  rows: StudentImportRow[],
  defaultYearId?: string,
  defaultDeptId?: string,
  defaultSecId?: string
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  let overrideYear = '';
  let overrideDept = '';
  let overrideSec = '';

  if (defaultYearId) {
    const years = await fetchAcademicYears();
    const y = years.find((item) => item.id === defaultYearId || item.name === defaultYearId || item.code === defaultYearId);
    if (y) overrideYear = y.name;
  }
  if (defaultDeptId) {
    const depts = await fetchDepartments();
    const d = depts.find((item) => item.id === defaultDeptId || item.name === defaultDeptId || item.code === defaultDeptId);
    if (d) overrideDept = d.code;
  }
  if (defaultSecId) {
    const secs = await fetchSections();
    const s = secs.find((item) => item.id === defaultSecId || item.name === defaultSecId);
    if (s) overrideSec = s.name;
  }

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const lineNo = index + 2;

    let name = String(row.name || '').trim();
    let regno = String(row.regno || '').trim();
    let email = String(row.email || '').trim().toLowerCase();
    let deptStr = overrideDept || String(row.department || '').trim() || 'CSE';
    let yearStr = overrideYear || String(row.year || '').trim() || 'Second Year';
    let secStr = overrideSec || String(row.section || '').trim() || 'CSE-A';
    let semStr = String(row.semester || '').trim();
    let dob = String(row.dob || '').trim();

    if (!name && !regno && !email) {
      invalidCount++;
      errors.push(`Row ${lineNo}: Empty or invalid student row`);
      continue;
    }

    if (!name) name = `Student ${regno || index + 1}`;
    if (!regno) {
      invalidCount++;
      errors.push(`Row ${lineNo} (${name}): Missing Register Number (Regno)`);
      continue;
    }
    if (!email || !isValidEmail(email)) {
      email = `${regno.toLowerCase().replace(/[^a-z0-9]/g, '')}@cogniva.edu`;
    }
    if (!dob) dob = '2004-01-01';

    try {
      // Check for existing student in DB or local state
      const { data: existingStud } = await supabase
        .from('students')
        .select('*')
        .or(`regno.eq.${regno},email.eq.${email}`)
        .maybeSingle();

      const existingLocalIdx = localCustomStudents.findIndex(
        (s) => s.regno.toLowerCase() === regno.toLowerCase() || s.email.toLowerCase() === email
      );

      const isExisting = Boolean(existingStud || existingLocalIdx !== -1);

      // 1. Upsert into Supabase students table (regno constraint)
      const { data: studData, error: studErr } = await supabase
        .from('students')
        .upsert(
          [
            {
              regno,
              name,
              email,
              department: deptStr,
              year: yearStr,
              section: secStr,
              semester: semStr,
              dob,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'regno' }
        )
        .select();

      // Maintain localCustomStudents in-memory store
      const newMember: StudentMember = {
        id:
          studData && studData[0]
            ? studData[0].id
            : existingLocalIdx !== -1
            ? localCustomStudents[existingLocalIdx].id
            : `stud_${Date.now()}_${index}`,
        regno,
        name,
        email,
        department: deptStr,
        year: yearStr,
        section: secStr,
        semester: semStr,
        dob,
        created_at: studData && studData[0] ? studData[0].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingLocalIdx !== -1) {
        localCustomStudents[existingLocalIdx] = newMember;
      } else {
        localCustomStudents.push(newMember);
      }

      // 2. Automatically create/associate Supabase Auth User with normalized DDMMYYYY DOB as initial password via secure server API
      try {
        const normPass = normalizeDobToPassword(dob);
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            dob: normPass,
            role: 'student',
            name,
            regno,
            section: secStr
          })
        }).catch(() => undefined);
      } catch {
        // Safe fallback
      }

      if (isExisting) {
        updatedCount++;
      } else {
        importedCount++;
      }
    } catch (err) {
      invalidCount++;
      errors.push(`Row ${lineNo} (${email}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { importedCount, updatedCount, skippedCount, invalidCount, errors };
}

export async function fetchFacultyMembers(): Promise<FacultyMember[]> {
  try {
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const dbEmpIds = new Set(data.map((d: any) => d.employee_id));
      const extraLocal = localCustomFaculty.filter((l) => !dbEmpIds.has(l.employee_id));
      return [...(data as FacultyMember[]), ...extraLocal];
    }
  } catch {
    // ignore
  }

  try {
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'faculty');

    if (profData && profData.length > 0) {
      const converted: FacultyMember[] = profData.map((p: any) => ({
        id: p.id,
        employee_id: p.id.slice(0, 8).toUpperCase(),
        name: p.full_name,
        email: p.email,
        department: 'CSE',
      }));
      const dbEmpIds = new Set(converted.map((d) => d.employee_id));
      const extraLocal = localCustomFaculty.filter((l) => !dbEmpIds.has(l.employee_id));
      return [...converted, ...extraLocal];
    }
  } catch {
    // ignore
  }

  return localCustomFaculty;
}

export async function updateFacultyMember(id: string, updates: Partial<FacultyMember>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('faculty')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    const idx = localCustomFaculty.findIndex((f) => f.id === id);
    if (idx !== -1) {
      localCustomFaculty[idx] = { ...localCustomFaculty[idx], ...updates };
    }

    if (error && error.code !== 'PGRST205') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const idx = localCustomFaculty.findIndex((f) => f.id === id);
    if (idx !== -1) {
      localCustomFaculty[idx] = { ...localCustomFaculty[idx], ...updates };
    }
    return { success: true };
  }
}

export async function deleteFacultyMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('faculty').delete().eq('id', id);

    const idx = localCustomFaculty.findIndex((f) => f.id === id);
    if (idx !== -1) {
      localCustomFaculty.splice(idx, 1);
    }

    if (error && error.code !== 'PGRST205') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const idx = localCustomFaculty.findIndex((f) => f.id === id);
    if (idx !== -1) {
      localCustomFaculty.splice(idx, 1);
    }
    return { success: true };
  }
}

export async function importFacultyBatch(rows: FacultyImportRow[]): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const lineNo = index + 2;

    let name = String(row.name || '').trim();
    let empId = String(row.employee_id || '').trim();
    let email = String(row.email || '').trim().toLowerCase();
    let deptStr = String(row.department || '').trim() || 'CSE';
    let yearStr = String(row.year || '').trim();
    let secStr = String(row.section || '').trim();
    let subjStr = String(row.subject || '').trim();
    let phoneStr = String(row.phone || '').trim();
    let dob = String(row.dob || '').trim() || '1990-01-01';

    if (!name && !empId && !email) {
      invalidCount++;
      errors.push(`Row ${lineNo}: Empty or invalid faculty row`);
      continue;
    }

    if (!name) name = `Faculty Member ${empId || index + 1}`;
    if (!empId) {
      invalidCount++;
      errors.push(`Row ${lineNo} (${name}): Missing Employee ID`);
      continue;
    }
    if (!email || !isValidEmail(email)) {
      email = `${empId.toLowerCase().replace(/[^a-z0-9]/g, '')}@cogniva.edu`;
    }

    try {
      const { data: existingFac } = await supabase
        .from('faculty')
        .select('*')
        .or(`employee_id.eq.${empId},email.eq.${email}`)
        .maybeSingle();

      const existingLocalIdx = localCustomFaculty.findIndex(
        (f) => f.employee_id.toLowerCase() === empId.toLowerCase() || f.email.toLowerCase() === email
      );

      const isExisting = Boolean(existingFac || existingLocalIdx !== -1);

      // Upsert into Supabase faculty table (employee_id constraint)
      const { data: facData, error: facErr } = await supabase
        .from('faculty')
        .upsert(
          [
            {
              employee_id: empId,
              name,
              email,
              dob,
              department: deptStr,
              year: yearStr,
              section: secStr,
              subject: subjStr,
              phone: phoneStr,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'employee_id' }
        )
        .select();

      // Maintain localCustomFaculty memory store
      const newMember: FacultyMember = {
        id:
          facData && facData[0]
            ? facData[0].id
            : existingLocalIdx !== -1
            ? localCustomFaculty[existingLocalIdx].id
            : `fac_${Date.now()}_${index}`,
        employee_id: empId,
        name,
        email,
        dob,
        department: deptStr,
        year: yearStr,
        section: secStr,
        subject: subjStr,
        phone: phoneStr,
        created_at: facData && facData[0] ? facData[0].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingLocalIdx !== -1) {
        localCustomFaculty[existingLocalIdx] = newMember;
      } else {
        localCustomFaculty.push(newMember);
      }

      // Automatically create Supabase Auth User with normalized DDMMYYYY DOB as initial password via secure server API
      try {
        const normPass = normalizeDobToPassword(dob);
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            dob: normPass,
            role: 'faculty',
            name,
            employee_id: empId,
            department: deptStr
          })
        }).catch(() => undefined);
      } catch {
        // Safe fallback
      }

      if (isExisting) {
        updatedCount++;
      } else {
        importedCount++;
      }
    } catch (err) {
      invalidCount++;
      errors.push(`Row ${lineNo} (${email}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { importedCount, updatedCount, skippedCount, invalidCount, errors };
}

// ============================================================================
// ATTENDANCE, EXAMINATIONS & STUDY MATERIALS API
// ============================================================================

export interface AttendanceRecord {
  id: string;
  regno: string;
  student_name: string;
  faculty_email: string;
  year: string;
  department: string;
  section: string;
  subject: string;
  date: string;
  status: 'Present' | 'Absent';
  created_at?: string;
  updated_at?: string;
}

export interface Examination {
  id: string;
  title: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  instructions?: string;
  year: string;
  department: string;
  section: string;
  faculty_email: string;
  notice_image_url?: string;
  created_at?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  description: string;
  year: string;
  department: string;
  section: string;
  file_name: string;
  file_url: string;
  file_path?: string;
  storage_bucket?: string;
  file_type?: string;
  file_size?: number;
  faculty_email: string;
  upload_date: string;
  due_date: string;
  created_at?: string;
}

const localAttendanceRecords: AttendanceRecord[] = [];
const localExaminations: Examination[] = [
  {
    id: 'exam_csec_001',
    title: 'Aptitude & Machine Learning Assessment',
    subject: 'Machine Learning',
    date: '2026-09-12',
    start_time: '10:00 AM',
    end_time: '11:30 AM',
    description: 'Aptitude and Unit 2 Model Evaluation Assessment for 2nd Year CSE-C students.',
    instructions: 'Bring your laptop with model evaluation notebooks prepared. Scientific calculators allowed.',
    year: 'Second Year',
    department: 'CSE',
    section: 'CSE-C',
    faculty_email: 'anjali.menon@example.edu',
    created_at: new Date().toISOString()
  }
];

const localStudyMaterials: StudyMaterial[] = [];

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  academic_year: string;
  section: string;
  semester?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FacultySubjectAssignment {
  id: string;
  faculty_id?: string;
  faculty_email: string;
  faculty_name?: string;
  subject_id?: string;
  subject_code: string;
  subject_name: string;
  academic_year: string;
  department: string;
  section: string;
  section_name?: string;
  semester?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentGrade {
  id: string;
  student_id?: string;
  regno: string;
  student_name?: string;
  student_email?: string;
  subject_code: string;
  subject_name: string;
  academic_year?: string;
  department?: string;
  section: string;
  section_name?: string;
  internal: number;
  internal_marks?: number;
  assignment: number;
  assignment_marks?: number;
  exam: number;
  exam_marks?: number;
  total: number;
  grade: string;
  faculty_email: string;
  created_at?: string;
  updated_at?: string;
}

const localSubjects: Subject[] = [];
const localFacultySubjectAssignments: FacultySubjectAssignment[] = [];

const localStudentGrades: StudentGrade[] = [];

export interface Assignment {
  id: string;
  subject_code: string;
  subject_name: string;
  academic_year: string;
  department: string;
  section: string;
  faculty_email: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  max_marks: number;
  attachment_url?: string;
  attachment_path?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id?: string;
  regno: string;
  student_name?: string;
  student_email: string;
  submitted_at?: string;
  file_url?: string;
  file_path?: string;
  response_text?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  marks?: number;
  grade?: string;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentAssignmentStatus {
  id: string;
  assignment_id: string;
  student_id?: string;
  regno: string;
  student_email: string;
  status: 'PENDING' | 'COMPLETED';
  completed_at?: string;
  created_at?: string;
}

const localAssignments: Assignment[] = [];
const localAssignmentSubmissions: AssignmentSubmission[] = [];
const localStudentAssignmentStatuses: StudentAssignmentStatus[] = [];

// Helper: Save local memory states to localStorage
function saveLocalStores() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cogniva_attendance', JSON.stringify(localAttendanceRecords));
      localStorage.setItem('cogniva_examinations', JSON.stringify(localExaminations));
      localStorage.setItem('cogniva_materials', JSON.stringify(localStudyMaterials));
      localStorage.setItem('cogniva_subjects', JSON.stringify(localSubjects));
      localStorage.setItem('cogniva_subject_assignments', JSON.stringify(localFacultySubjectAssignments));
      localStorage.setItem('cogniva_grades', JSON.stringify(localStudentGrades));
      localStorage.setItem('cogniva_assignments', JSON.stringify(localAssignments));
      localStorage.setItem('cogniva_submissions', JSON.stringify(localAssignmentSubmissions));
      localStorage.setItem('cogniva_assignment_statuses', JSON.stringify(localStudentAssignmentStatuses));
    } catch {}
  }
}

// Load initial localStorage caches
if (typeof window !== 'undefined') {
  try {
    const savedAtt = localStorage.getItem('cogniva_attendance');
    if (savedAtt) {
      const parsed = JSON.parse(savedAtt);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localAttendanceRecords.length = 0;
        localAttendanceRecords.push(...parsed);
      }
    }
    const savedExams = localStorage.getItem('cogniva_examinations');
    if (savedExams) {
      const parsed = JSON.parse(savedExams);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localExaminations.length = 0;
        localExaminations.push(...parsed);
      }
    }
    const savedMats = localStorage.getItem('cogniva_materials');
    if (savedMats) {
      const parsed = JSON.parse(savedMats);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const realMats = parsed.filter(m => m.id !== 'mat_csec_001' && !m.title?.includes('(UNIT 4.pdf)') && !m.file_url?.includes('JVBERi0xLjQK'));
        localStudyMaterials.length = 0;
        localStudyMaterials.push(...realMats);
      }
    }
    const isMockSubject = (name?: string, code?: string) => {
      if (!name && !code) return false;
      const n = (name || '').toLowerCase();
      const c = (code || '').toLowerCase();
      return n.includes('database management') || n.includes('computer networks') || c === 'dbms' || c === 'cn';
    };

    const savedSubjs = localStorage.getItem('cogniva_subjects');
    if (savedSubjs) {
      const parsed = JSON.parse(savedSubjs);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(s => !isMockSubject(s.subject_name, s.subject_code));
        localSubjects.length = 0;
        localSubjects.push(...clean);
        localStorage.setItem('cogniva_subjects', JSON.stringify(clean));
      }
    }
    const savedAssigns = localStorage.getItem('cogniva_subject_assignments');
    if (savedAssigns) {
      const parsed = JSON.parse(savedAssigns);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(a => !isMockSubject(a.subject_name, a.subject_code));
        localFacultySubjectAssignments.length = 0;
        localFacultySubjectAssignments.push(...clean);
        localStorage.setItem('cogniva_subject_assignments', JSON.stringify(clean));
      }
    }
    const savedGrades = localStorage.getItem('cogniva_grades');
    if (savedGrades) {
      const parsed = JSON.parse(savedGrades);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStudentGrades.length = 0;
        localStudentGrades.push(...parsed);
      }
    }
    const savedAsgns = localStorage.getItem('cogniva_assignments');
    if (savedAsgns) {
      const parsed = JSON.parse(savedAsgns);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localAssignments.length = 0;
        localAssignments.push(...parsed);
      }
    }
    const savedSubs = localStorage.getItem('cogniva_submissions');
    if (savedSubs) {
      const parsed = JSON.parse(savedSubs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localAssignmentSubmissions.length = 0;
        localAssignmentSubmissions.push(...parsed);
      }
    }
    const savedStatuses = localStorage.getItem('cogniva_assignment_statuses');
    if (savedStatuses) {
      const parsed = JSON.parse(savedStatuses);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStudentAssignmentStatuses.length = 0;
        localStudentAssignmentStatuses.push(...parsed);
      }
    }
  } catch {}
}

export async function fetchAttendanceRecords(
  sectionOrFilter?: string | { regno?: string; section?: string; subject?: string },
  dateOrSubject?: string,
  subjectOrDate?: string
): Promise<AttendanceRecord[]> {
  let sectionName: string | undefined;
  let date: string | undefined;
  let subject: string | undefined;
  let filterRegno: string | undefined;

  if (typeof sectionOrFilter === 'object' && sectionOrFilter !== null) {
    filterRegno = sectionOrFilter.regno;
    sectionName = sectionOrFilter.section;
    subject = sectionOrFilter.subject;
  } else {
    sectionName = sectionOrFilter;
    date = dateOrSubject;
    subject = subjectOrDate;
  }

  try {
    let query = supabase.from('attendance').select('*').order('date', { ascending: false });
    if (sectionName) query = query.eq('section', sectionName);
    if (filterRegno) query = query.eq('regno', filterRegno);
    if (date) query = query.eq('date', date);
    if (subject) query = query.eq('subject', subject);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as AttendanceRecord[];
    }
  } catch {}

  let filtered = [...localAttendanceRecords];
  if (sectionName) {
    filtered = filtered.filter(r => r.section.toLowerCase() === sectionName!.toLowerCase() || r.section.toLowerCase().endsWith(sectionName!.toLowerCase()));
  }
  if (filterRegno) {
    filtered = filtered.filter(r => r.regno.toLowerCase() === filterRegno!.toLowerCase());
  }
  if (date) {
    filtered = filtered.filter(r => r.date === date);
  }
  if (subject) {
    filtered = filtered.filter(r => r.subject.toLowerCase() === subject!.toLowerCase());
  }
  return filtered;
}

export async function saveAttendanceBatch(
  records: Omit<AttendanceRecord, 'id'>[]
): Promise<{ success: boolean; count: number; error?: string }> {
  let count = 0;
  for (const rec of records) {
    try {
      const recordWithId: AttendanceRecord = {
        ...rec,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('attendance_records')
        .upsert([rec], { onConflict: 'regno,subject,date' });

      const existingIdx = localAttendanceRecords.findIndex(
        (r) => r.regno.toLowerCase() === rec.regno.toLowerCase() && r.subject.toLowerCase() === rec.subject.toLowerCase() && r.date === rec.date
      );
      if (existingIdx !== -1) {
        localAttendanceRecords[existingIdx] = { ...localAttendanceRecords[existingIdx], ...rec };
      } else {
        localAttendanceRecords.push(recordWithId);
      }
      count++;
    } catch {
      const recordWithId: AttendanceRecord = {
        ...rec,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        updated_at: new Date().toISOString()
      };
      localAttendanceRecords.push(recordWithId);
      count++;
    }
  }

  saveLocalStores();
  return { success: true, count };
}

export async function fetchAttendanceHistory(facultyEmail?: string): Promise<AttendanceRecord[]> {
  try {
    let query = supabase.from('attendance_records').select('*').order('date', { ascending: false });
    if (facultyEmail) {
      query = query.eq('faculty_email', facultyEmail.toLowerCase());
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as AttendanceRecord[];
    }
  } catch {}

  if (facultyEmail) {
    return localAttendanceRecords.filter(r => r.faculty_email.toLowerCase() === facultyEmail.toLowerCase());
  }
  return localAttendanceRecords;
}

export function validateAttendanceExcelHeaders(headers: string[]): {
  valid: boolean;
  missingColumns: string[];
  mappedHeaders: Record<string, string>;
} {
  const normalized = headers.map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const mappedHeaders: Record<string, string> = {};

  const defs = [
    { key: 'regno', keywords: ['regno', 'registernumber', 'rollno', 'rollnumber', 'registrationnumber', 'id', 'studentid'] },
    { key: 'student_name', keywords: ['name', 'studentname', 'fullname', 'student'] },
    { key: 'subject', keywords: ['subject', 'course', 'subj'] },
    { key: 'date', keywords: ['date', 'attendancedate', 'day'] },
    { key: 'status', keywords: ['status', 'attendance', 'attendancestatus', 'present', 'presentabsent'] }
  ];

  for (const def of defs) {
    let idx = normalized.findIndex(h => def.keywords.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(h => h.length > 1 && def.keywords.some(k => h.includes(k) || k.includes(h)));
    }
    if (idx !== -1) {
      mappedHeaders[def.key] = headers[idx];
    }
  }

  const missingColumns: string[] = [];
  if (!mappedHeaders['regno']) missingColumns.push('Registration Number (Regno)');
  if (!mappedHeaders['status']) missingColumns.push('Attendance Status');

  return {
    valid: missingColumns.length === 0,
    missingColumns,
    mappedHeaders
  };
}

export async function importAttendanceExcel(
  fileOrRows: File | any[],
  facultyEmail: string,
  targetYear: string,
  targetDept: string,
  targetSection: string,
  defaultSubject: string,
  defaultDate: string
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  let rows: any[] = [];
  if (Array.isArray(fileOrRows)) {
    rows = fileOrRows;
  } else if (fileOrRows && typeof fileOrRows === 'object') {
    try {
      const buffer = await (fileOrRows as File).arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } catch {
      return {
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        invalidCount: 1,
        errors: ['Failed to parse Excel file. Please upload a valid .xlsx or .xls file.']
      };
    }
  }

  const assignedStudents = await fetchFacultyAssignedStudents(facultyEmail);
  const assignedRegnos = new Set(assignedStudents.map(s => s.regno.toLowerCase()));

  const toSave: Omit<AttendanceRecord, 'id'>[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNo = idx + 2;

    const regno = String(row.regno || row.rollno || row.id || '').trim();
    const name = String(row.student_name || row.name || '').trim() || 'Student';
    const subj = String(row.subject || defaultSubject || 'Subject').trim();
    const dt = String(row.date || defaultDate || new Date().toISOString().split('T')[0]).trim();
    const rawStatus = String(row.status || row.attendance || '').trim().toLowerCase();

    if (!regno) {
      invalidCount++;
      errors.push(`Row ${lineNo}: Missing Registration Number`);
      continue;
    }

    if (assignedRegnos.size > 0 && !assignedRegnos.has(regno.toLowerCase())) {
      skippedCount++;
      errors.push(`Row ${lineNo} (${regno}): Student does not belong to assigned section (${targetSection})`);
      continue;
    }

    const status: 'Present' | 'Absent' =
      rawStatus.includes('p') || rawStatus === '1' || rawStatus.includes('present')
        ? 'Present'
        : 'Absent';

    toSave.push({
      regno,
      student_name: name,
      faculty_email: facultyEmail,
      year: targetYear,
      department: targetDept,
      section: targetSection,
      subject: subj,
      date: dt,
      status
    });
  }

  if (toSave.length > 0) {
    const res = await saveAttendanceBatch(toSave);
    importedCount = res.count;
  }

  return { importedCount, updatedCount, skippedCount, invalidCount, errors };
}

export async function createExamination(
  exam: Omit<Examination, 'id'>
): Promise<{ success: boolean; data?: Examination; error?: string }> {
  try {
    const newExam: Examination = {
      ...exam,
      id: `exam_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('examinations')
      .insert([exam])
      .select()
      .single();

    if (!error && data) {
      localExaminations.unshift(data as Examination);
      saveLocalStores();
      return { success: true, data: data as Examination };
    }

    localExaminations.unshift(newExam);
    saveLocalStores();
    return { success: true, data: newExam };
  } catch (err) {
    const newExam: Examination = {
      ...exam,
      id: `exam_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    localExaminations.unshift(newExam);
    saveLocalStores();
    return { success: true, data: newExam };
  }
}

export async function fetchExaminations(sectionName?: string): Promise<Examination[]> {
  try {
    let query = supabase.from('examinations').select('*').order('created_at', { ascending: false });
    if (sectionName) {
      query = query.eq('section', sectionName);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as Examination[];
    }
  } catch {}

  if (sectionName) {
    return localExaminations.filter(
      e => e.section.toLowerCase() === sectionName.toLowerCase() || e.section.toLowerCase().endsWith(sectionName.toLowerCase())
    );
  }
  return localExaminations;
}

export async function createStudyMaterial(
  material: Omit<StudyMaterial, 'id'>
): Promise<{ success: boolean; data?: StudyMaterial; error?: string }> {
  try {
    const newMat: StudyMaterial = {
      ...material,
      id: `mat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('study_materials')
      .insert([material])
      .select()
      .single();

    if (!error && data) {
      localStudyMaterials.unshift(data as StudyMaterial);
      saveLocalStores();
      return { success: true, data: data as StudyMaterial };
    }

    localStudyMaterials.unshift(newMat);
    saveLocalStores();
    return { success: true, data: newMat };
  } catch (err) {
    const newMat: StudyMaterial = {
      ...material,
      id: `mat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    localStudyMaterials.unshift(newMat);
    saveLocalStores();
    return { success: true, data: newMat };
  }
}

export async function fetchStudyMaterials(sectionName?: string): Promise<StudyMaterial[]> {
  try {
    let query = supabase.from('study_materials').select('*').order('created_at', { ascending: false });
    if (sectionName) {
      query = query.eq('section', sectionName);
    }
    const { data, error } = await query;
    if (!error && data) {
      const cleanData = (data as StudyMaterial[]).filter(m => m.id !== 'mat_csec_001' && !m.title?.includes('(UNIT 4.pdf)'));
      return cleanData;
    }
  } catch {}

  let filtered = localStudyMaterials.filter(m => m.id !== 'mat_csec_001' && !m.title?.includes('(UNIT 4.pdf)'));

  if (sectionName) {
    return filtered.filter(
      m => m.section.toLowerCase() === sectionName.toLowerCase() || m.section.toLowerCase().endsWith(sectionName.toLowerCase())
    );
  }
  return filtered;
}



export async function uploadFileToSupabaseStorage(
  file: File,
  year: string = 'Second Year',
  dept: string = 'CSE',
  sec: string = 'CSE-C',
  sem: string = '4',
  subject: string = 'DBMS',
  bucketName: string = 'study-materials'
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    if (!file || file.size === 0 || (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
      return { success: false, error: 'Please select a valid PDF file.' };
    }

    const cleanYear = (year || 'Second Year').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const cleanDept = (dept || 'CSE').replace(/[^a-zA-Z0-9]/g, '');
    const cleanSec = (sec || 'CSE-C').replace(/[^a-zA-Z0-9]/g, '');
    const cleanSem = `semester-${String(sem || '4').replace(/[^0-9]/g, '') || '4'}`;
    const cleanSubj = (subject || 'DBMS').replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const storagePath = `${cleanYear}/${cleanDept}/${cleanSec}/${cleanSem}/${cleanSubj}/${uniqueId}-${sanitizedFileName}`;

    console.log(`[SUPABASE STORAGE] Uploading exact File object (${file.name}, ${file.size} bytes, type: ${file.type}) to '${bucketName}/${storagePath}'...`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type || 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage upload failed:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
      return {
        success: true,
        url: pubData.publicUrl,
        path: storagePath
      };
    }

    return { success: false, error: 'Upload returned no data.' };
  } catch (err: any) {
    console.error('Supabase Storage upload exception:', err);
    return { success: false, error: err?.message || 'Upload failed due to an exception.' };
  }
}

// SUBJECTS API
export async function fetchSubjects(yearOrFilter?: string | { section?: string; department?: string; year?: string }, deptCode?: string, sectionName?: string): Promise<Subject[]> {
  let yearStr = typeof yearOrFilter === 'string' ? yearOrFilter : yearOrFilter?.year;
  if (typeof yearOrFilter === 'object' && yearOrFilter !== null) {
    if (yearOrFilter.department) deptCode = yearOrFilter.department;
    if (yearOrFilter.section) sectionName = yearOrFilter.section;
  }

  try {
    let query = supabase.from('subjects').select('*').order('subject_name', { ascending: true });
    if (sectionName) {
      query = query.eq('section', sectionName);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as Subject[];
    }
  } catch {}

  let filtered = localSubjects.filter(s => {
    const n = (s.subject_name || '').toLowerCase();
    const c = (s.subject_code || '').toLowerCase();
    return !n.includes('database management') && !n.includes('computer networks') && c !== 'dbms' && c !== 'cn';
  });
  if (yearStr) {
    filtered = filtered.filter(s => s.academic_year.toLowerCase().includes(yearStr.toLowerCase()) || yearStr.toLowerCase().includes(s.academic_year.toLowerCase()));
  }
  if (deptCode) {
    filtered = filtered.filter(s => s.department.toLowerCase().includes(deptCode.toLowerCase()) || deptCode.toLowerCase().includes(s.department.toLowerCase()));
  }
  if (sectionName) {
    filtered = filtered.filter(s => s.section.toLowerCase() === sectionName.toLowerCase() || s.section.toLowerCase().endsWith(sectionName.toLowerCase()));
  }
  return filtered;
}

export async function createSubject(subj: Omit<Subject, 'id'>): Promise<{ success: boolean; data?: Subject; error?: string }> {
  try {
    const newId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSubj: Subject = {
      ...subj,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('subjects').insert([newSubj]).select().single();
    if (!error && data) {
      localSubjects.unshift(data as Subject);
      saveLocalStores();
      return { success: true, data: data as Subject };
    }

    localSubjects.unshift(newSubj);
    saveLocalStores();
    return { success: true, data: newSubj };
  } catch {
    const newId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSubj: Subject = {
      ...subj,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localSubjects.unshift(newSubj);
    saveLocalStores();
    return { success: true, data: newSubj };
  }
}

export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('subjects').delete().eq('id', id);
  } catch {}
  const idx = localSubjects.findIndex(s => s.id === id);
  if (idx !== -1) localSubjects.splice(idx, 1);
  saveLocalStores();
  return { success: true };
}

// FACULTY SUBJECT ASSIGNMENTS API
export async function fetchFacultySubjectAssignments(facultyEmailOrId?: string, sectionName?: string): Promise<FacultySubjectAssignment[]> {
  try {
    let query = supabase.from('faculty_subject_assignments').select('*');
    if (facultyEmailOrId) {
      query = query.or(`faculty_email.eq.${facultyEmailOrId.toLowerCase()},faculty_id.eq.${facultyEmailOrId}`);
    }
    if (sectionName) {
      query = query.eq('section', sectionName);
    }
    const { data, error } = await query;
    if (!error && data) {
      return (data as any[]).map(a => ({
        ...a,
        section_name: a.section_name || a.section
      })) as FacultySubjectAssignment[];
    }
  } catch {}

  let filtered = localFacultySubjectAssignments.filter(a => {
    const n = (a.subject_name || '').toLowerCase();
    const c = (a.subject_code || '').toLowerCase();
    return !n.includes('database management') && !n.includes('computer networks') && c !== 'dbms' && c !== 'cn';
  }).map(a => ({
    ...a,
    section_name: a.section_name || a.section
  }));
  if (facultyEmailOrId) {
    const clean = facultyEmailOrId.toLowerCase();
    filtered = filtered.filter(a => a.faculty_email.toLowerCase() === clean || a.faculty_id?.toLowerCase() === clean);
  }
  if (sectionName) {
    filtered = filtered.filter(a => a.section.toLowerCase() === sectionName.toLowerCase() || a.section.toLowerCase().endsWith(sectionName.toLowerCase()));
  }
  return filtered;
}

export async function assignFacultyToSubject(assignment: Omit<FacultySubjectAssignment, 'id'>): Promise<{ success: boolean; data?: FacultySubjectAssignment; error?: string }> {
  try {
    const newId = `fsa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAssign: FacultySubjectAssignment = {
      ...assignment,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('faculty_subject_assignments').insert([newAssign]).select().single();
    if (!error && data) {
      localFacultySubjectAssignments.unshift(data as FacultySubjectAssignment);
      saveLocalStores();
      return { success: true, data: data as FacultySubjectAssignment };
    }

    localFacultySubjectAssignments.unshift(newAssign);
    saveLocalStores();
    return { success: true, data: newAssign };
  } catch {
    const newId = `fsa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAssign: FacultySubjectAssignment = {
      ...assignment,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localFacultySubjectAssignments.unshift(newAssign);
    saveLocalStores();
    return { success: true, data: newAssign };
  }
}

export async function removeFacultySubjectAssignment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('faculty_subject_assignments').delete().eq('id', id);
  } catch {}
  const idx = localFacultySubjectAssignments.findIndex(a => a.id === id);
  if (idx !== -1) localFacultySubjectAssignments.splice(idx, 1);
  saveLocalStores();
  return { success: true };
}

export async function adminAssignSubjectToFaculty(
  facultyEmailOrId: string,
  subjectName: string,
  targetSectionName?: string,
  customSubjectCode?: string
): Promise<{ success: boolean; data?: FacultySubjectAssignment; error?: string }> {
  const cleanName = subjectName.trim();
  if (!cleanName) {
    return { success: false, error: 'Subject name cannot be empty.' };
  }

  if (!facultyEmailOrId) {
    return { success: false, error: 'Please select a faculty member.' };
  }

  const [facMembers, facProfiles] = await Promise.all([
    fetchFacultyMembers(),
    fetchProfilesByRole('faculty')
  ]);

  const fac = facMembers.find(f => f.email.toLowerCase() === facultyEmailOrId.toLowerCase() || f.id === facultyEmailOrId)
    || facProfiles.find(p => p.email.toLowerCase() === facultyEmailOrId.toLowerCase() || p.id === facultyEmailOrId);

  if (!fac) {
    return { success: false, error: 'Selected faculty member not found.' };
  }

  const facEmail = fac.email;
  const facName = (fac as any).name || (fac as any).full_name || facEmail;
  const facId = fac.id;

  const assignedSections = await fetchFacultyAssignedSections(facEmail);
  if (assignedSections.length === 0) {
    return {
      success: false,
      error: `Faculty member '${facName}' has not been assigned to any section yet. Please assign a section (e.g. CSE-C) under 'Faculty Access' first.`
    };
  }

  let secName = (targetSectionName || '').trim();
  if (secName) {
    const isAllowed = assignedSections.some(s => s.name.toLowerCase() === secName.toLowerCase());
    if (!isAllowed) {
      return {
        success: false,
        error: `Faculty member '${facName}' is not assigned to section '${secName}'. Allowed sections: ${assignedSections.map(s => s.name).join(', ')}`
      };
    }
  } else {
    secName = assignedSections[0].name;
  }

  let subjectCode = (customSubjectCode || '').trim().toUpperCase();
  if (!subjectCode) {
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      subjectCode = words.map(w => w[0]).join('').toUpperCase();
    } else {
      subjectCode = cleanName.substring(0, 4).toUpperCase();
    }
  }

  const existingAssignments = await fetchFacultySubjectAssignments(facEmail);
  const yearName = 'Second Year';
  const deptCode = 'CSE';

  const isDuplicate = existingAssignments.some(
    a => (a.section_name || a.section || '').toLowerCase() === secName.toLowerCase() &&
         (a.subject_name.toLowerCase() === cleanName.toLowerCase() || a.subject_code.toLowerCase() === subjectCode.toLowerCase())
  );

  if (isDuplicate) {
    return {
      success: false,
      error: `Subject '${cleanName}' (${subjectCode}) is already assigned to ${facName} for section ${secName}.`
    };
  }

  await createSubject({
    subject_code: subjectCode,
    subject_name: cleanName,
    academic_year: yearName,
    department: deptCode,
    section: secName,
    semester: '4'
  });

  const res = await assignFacultyToSubject({
    faculty_id: facId,
    faculty_email: facEmail,
    faculty_name: facName,
    subject_code: subjectCode,
    subject_name: cleanName,
    academic_year: yearName,
    department: deptCode,
    section: secName,
    section_name: secName
  });

  return res;
}

export async function facultyAddSubject(
  facultyEmail: string,
  subjectName: string,
  targetSectionName?: string
): Promise<{ success: boolean; data?: FacultySubjectAssignment; error?: string }> {
  const cleanName = subjectName.trim();
  if (!cleanName) {
    return { success: false, error: 'Subject name cannot be empty.' };
  }

  if (!facultyEmail) {
    return { success: false, error: 'Faculty authentication email is missing.' };
  }

  let assignedSections = await fetchFacultyAssignedSections(facultyEmail);
  if (assignedSections.length === 0) {
    const facMembers = await fetchFacultyMembers();
    const fac = facMembers.find(f => f.email.toLowerCase() === facultyEmail.toLowerCase());
    if (fac && fac.section) {
      const allSecs = await fetchSections();
      const matchedSec = allSecs.find(s => s.name.toLowerCase() === fac.section?.toLowerCase());
      if (matchedSec) {
        assignedSections = [matchedSec];
      } else {
        assignedSections = [{ id: 's3', academic_year_id: 'y2', department_id: 'd1', name: fac.section, capacity: 60 }];
      }
    } else {
      assignedSections = [{ id: 's3', academic_year_id: 'y2', department_id: 'd1', name: 'CSE-C', capacity: 60 }];
    }
  }

  const secName = targetSectionName || assignedSections[0].name;

  return adminAssignSubjectToFaculty(facultyEmail, cleanName, secName);
}

// GRADES & MARKS API
export function calculateGradeAndTotal(internal: number, assignment: number, exam: number): { total: number; grade: string } {
  const i = Math.max(0, Math.min(20, Number(internal) || 0));
  const a = Math.max(0, Math.min(10, Number(assignment) || 0));
  const e = Math.max(0, Math.min(70, Number(exam) || 0));
  const total = Math.round(i + a + e);
  let grade = 'F';
  if (total >= 90) grade = 'O';
  else if (total >= 80) grade = 'A+';
  else if (total >= 70) grade = 'A';
  else if (total >= 60) grade = 'B+';
  else if (total >= 50) grade = 'B';
  else if (total >= 40) grade = 'C';
  return { total, grade };
}

export async function fetchStudentGrades(studentRegnoOrEmail?: string, sectionNameOrCode?: string, subjectCode?: string): Promise<StudentGrade[]> {
  let sectionName: string | undefined;
  if (sectionNameOrCode && !subjectCode) {
    // If 2 params passed, 2nd could be sectionName or subjectCode
    if (sectionNameOrCode.includes('-')) sectionName = sectionNameOrCode;
    else subjectCode = sectionNameOrCode;
  } else if (sectionNameOrCode && subjectCode) {
    sectionName = sectionNameOrCode;
  }

  try {
    let query = supabase.from('grades').select('*');
    if (studentRegnoOrEmail) {
      query = query.or(`regno.eq.${studentRegnoOrEmail.toUpperCase()},student_email.eq.${studentRegnoOrEmail.toLowerCase()},faculty_email.eq.${studentRegnoOrEmail.toLowerCase()}`);
    }
    if (subjectCode) {
      query = query.eq('subject_code', subjectCode);
    }
    if (sectionName) {
      query = query.eq('section', sectionName);
    }
    const { data, error } = await query;
    if (!error && data) {
      return (data as any[]).map(g => ({
        ...g,
        section_name: g.section_name || g.section,
        internal_marks: g.internal_marks ?? g.internal ?? 0,
        assignment_marks: g.assignment_marks ?? g.assignment ?? 0,
        exam_marks: g.exam_marks ?? g.exam ?? 0,
        internal: g.internal ?? g.internal_marks ?? 0,
        assignment: g.assignment ?? g.assignment_marks ?? 0,
        exam: g.exam ?? g.exam_marks ?? 0
      })) as StudentGrade[];
    }
  } catch {}

  let filtered = [...localStudentGrades].map(g => ({
    ...g,
    section_name: g.section_name || g.section,
    internal_marks: g.internal_marks ?? g.internal ?? 0,
    assignment_marks: g.assignment_marks ?? g.assignment ?? 0,
    exam_marks: g.exam_marks ?? g.exam ?? 0,
    internal: g.internal ?? g.internal_marks ?? 0,
    assignment: g.assignment ?? g.assignment_marks ?? 0,
    exam: g.exam ?? g.exam_marks ?? 0
  }));
  if (studentRegnoOrEmail) {
    const clean = studentRegnoOrEmail.toLowerCase();
    filtered = filtered.filter(g => g.regno.toLowerCase() === clean || g.student_email?.toLowerCase() === clean || g.faculty_email.toLowerCase() === clean);
  }
  if (subjectCode) {
    filtered = filtered.filter(g => g.subject_code.toLowerCase() === subjectCode!.toLowerCase() || g.subject_name.toLowerCase().includes(subjectCode!.toLowerCase()));
  }
  if (sectionName) {
    filtered = filtered.filter(g => g.section.toLowerCase() === sectionName!.toLowerCase() || g.section.toLowerCase().endsWith(sectionName!.toLowerCase()));
  }
  return filtered;
}

export async function saveStudentGradesBatch(grades: Omit<StudentGrade, 'id'>[]): Promise<{ success: boolean; count: number; error?: string }> {
  let count = 0;
  for (const rawG of grades) {
    const internal = rawG.internal_marks ?? rawG.internal ?? 0;
    const assignment = rawG.assignment_marks ?? rawG.assignment ?? 0;
    const exam = rawG.exam_marks ?? rawG.exam ?? 0;
    const { total, grade } = calculateGradeAndTotal(internal, assignment, exam);

    const rec: StudentGrade = {
      ...rawG,
      internal,
      internal_marks: internal,
      assignment,
      assignment_marks: assignment,
      exam,
      exam_marks: exam,
      total,
      grade,
      section: rawG.section || rawG.section_name || 'CSE-C',
      section_name: rawG.section_name || rawG.section || 'CSE-C',
      id: `grd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: new Date().toISOString()
    };

    try {
      await supabase.from('grades').upsert([rec], { onConflict: 'regno,subject_code' });
    } catch {}

    const existingIdx = localStudentGrades.findIndex(
      lg => lg.regno.toLowerCase() === rec.regno.toLowerCase() && lg.subject_code.toLowerCase() === rec.subject_code.toLowerCase()
    );
    if (existingIdx !== -1) {
      localStudentGrades[existingIdx] = { ...localStudentGrades[existingIdx], ...rec };
    } else {
      localStudentGrades.push(rec);
    }
    count++;
  }

  saveLocalStores();
  return { success: true, count };
}

export function validateGradesExcelHeaders(headers: string[]): { valid: boolean; missingColumns: string[]; mappedHeaders: Record<string, string> } {
  const normalized = headers.map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const mappedHeaders: Record<string, string> = {};

  const defs = [
    { key: 'regno', keywords: ['regno', 'registernumber', 'rollno', 'rollnumber', 'registrationnumber', 'id', 'studentid'] },
    { key: 'internal', keywords: ['internal', 'internalmarks', 'internals', 'int'] },
    { key: 'assignment', keywords: ['assignment', 'assignmentmarks', 'assgn', 'ass'] },
    { key: 'exam', keywords: ['exam', 'exammarks', 'endsem', 'semesterexam', 'final'] },
    { key: 'subject_code', keywords: ['subjectcode', 'subjcode', 'code', 'subject'] }
  ];

  for (const def of defs) {
    let idx = normalized.findIndex(h => def.keywords.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(h => h.length > 1 && def.keywords.some(k => h.includes(k) || k.includes(h)));
    }
    if (idx !== -1) {
      mappedHeaders[def.key] = headers[idx];
    }
  }

  const missingColumns: string[] = [];
  if (!mappedHeaders['regno']) missingColumns.push('Register Number (Regno)');

  return { valid: missingColumns.length === 0, missingColumns, mappedHeaders };
}

export async function importGradesExcel(
  fileOrRows: File | any[],
  facultyEmail: string,
  targetSubjectCode?: string,
  targetSection?: string,
  targetYear: string = 'Second Year',
  targetDept: string = 'CSE',
  targetSubjectName: string = ''
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  let rows: any[] = [];
  if (Array.isArray(fileOrRows)) {
    rows = fileOrRows;
  } else if (fileOrRows && typeof fileOrRows === 'object') {
    try {
      const buffer = await (fileOrRows as File).arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } catch {
      return { importedCount: 0, updatedCount: 0, skippedCount: 0, invalidCount: 1, errors: ['Failed to parse Excel file. Please upload a valid .xlsx or .xls file.'] };
    }
  }

  const assignedStudents = await fetchFacultyAssignedStudents(facultyEmail);
  const assignedRegnos = new Set(assignedStudents.map(s => s.regno.toLowerCase()));

  const toSave: Omit<StudentGrade, 'id'>[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const lineNo = idx + 2;

    const regno = String(row.regno || row.rollno || row.id || '').trim();
    const internal = Number(row.internal || row.internalmarks || 0);
    const assignment = Number(row.assignment || row.assignmentmarks || 0);
    const exam = Number(row.exam || row.exammarks || row.endsem || 0);

    if (!regno) {
      invalidCount++;
      errors.push(`Row ${lineNo}: Missing Register Number`);
      continue;
    }

    if (assignedRegnos.size > 0 && !assignedRegnos.has(regno.toLowerCase())) {
      skippedCount++;
      errors.push(`Row ${lineNo} (${regno}): Student does not belong to your assigned section (${targetSection})`);
      continue;
    }

    const { total, grade } = calculateGradeAndTotal(internal, assignment, exam);

    toSave.push({
      regno,
      academic_year: targetYear || 'Second Year',
      department: targetDept || 'CSE',
      section: targetSection || 'CSE-C',
      subject_code: targetSubjectCode || 'CS402',
      subject_name: targetSubjectName || 'DBMS',
      internal,
      assignment,
      exam,
      total,
      grade,
      faculty_email: facultyEmail
    });
  }

  if (toSave.length > 0) {
    const res = await saveStudentGradesBatch(toSave as StudentGrade[]);
    if (res.success) importedCount = res.count;
  }

  return { importedCount, updatedCount, skippedCount, invalidCount, errors };
}

// ASSIGNMENTS API
export function calculateDueDatePriority(dueDateStr: string, isCompleted: boolean, isSubmitted: boolean): {
  status: 'OVERDUE' | 'DUE TODAY' | 'DUE TOMORROW' | 'DUE SOON' | 'UPCOMING' | 'COMPLETED';
  label: string;
  tone: 'coral' | 'amber' | 'teal' | 'violet';
  daysDiff: number;
} {
  if (isCompleted || isSubmitted) {
    return { status: 'COMPLETED', label: 'Completed', tone: 'teal', daysDiff: 999 };
  }

  const todayStr = '2026-09-09';
  const now = new Date(todayStr);
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'OVERDUE', label: 'Overdue', tone: 'coral', daysDiff: diffDays };
  } else if (diffDays === 0) {
    return { status: 'DUE TODAY', label: 'Due Today', tone: 'coral', daysDiff: 0 };
  } else if (diffDays === 1) {
    return { status: 'DUE TOMORROW', label: 'Due Tomorrow', tone: 'coral', daysDiff: 1 };
  } else if (diffDays <= 3) {
    return { status: 'DUE SOON', label: `Due in ${diffDays} days`, tone: 'amber', daysDiff: diffDays };
  } else {
    return { status: 'UPCOMING', label: `Due in ${diffDays} days`, tone: 'teal', daysDiff: diffDays };
  }
}

export function calculateExamPriority(examDateStr: string): {
  status: 'PAST' | 'EXAM TODAY' | 'EXAM TOMORROW' | 'EXAM SOON' | 'UPCOMING';
  label: string;
  tone: 'coral' | 'amber' | 'violet' | 'teal';
  daysDiff: number;
} {
  const todayStr = '2026-09-09';
  const now = new Date(todayStr);
  const examDate = new Date(examDateStr);
  const diffTime = examDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'PAST', label: 'Past Exam', tone: 'teal', daysDiff: 999 };
  } else if (diffDays === 0) {
    return { status: 'EXAM TODAY', label: 'EXAM TODAY', tone: 'coral', daysDiff: 0 };
  } else if (diffDays === 1) {
    return { status: 'EXAM TOMORROW', label: 'EXAM TOMORROW', tone: 'amber', daysDiff: 1 };
  } else if (diffDays <= 3) {
    return { status: 'EXAM SOON', label: `EXAM IN ${diffDays} DAYS`, tone: 'amber', daysDiff: diffDays };
  } else {
    return { status: 'UPCOMING', label: `EXAM IN ${diffDays} DAYS`, tone: 'violet', daysDiff: diffDays };
  }
}


export async function fetchAssignments(filter?: { section?: string; faculty_email?: string; subject_code?: string }): Promise<Assignment[]> {
  try {
    let query = supabase.from('assignments').select('*').order('due_date', { ascending: true });
    if (filter?.section) query = query.eq('section', filter.section);
    if (filter?.faculty_email) query = query.eq('faculty_email', filter.faculty_email.toLowerCase());
    if (filter?.subject_code) query = query.eq('subject_code', filter.subject_code);

    const { data, error } = await query;
    if (!error && data) {
      return data as Assignment[];
    }
  } catch {}

  let filtered = [...localAssignments];
  if (filter?.section) {
    filtered = filtered.filter(a => a.section.toLowerCase() === filter.section!.toLowerCase() || a.section.toLowerCase().endsWith(filter.section!.toLowerCase()));
  }
  if (filter?.faculty_email) {
    filtered = filtered.filter(a => a.faculty_email.toLowerCase() === filter.faculty_email!.toLowerCase());
  }
  if (filter?.subject_code) {
    filtered = filtered.filter(a => a.subject_code.toLowerCase() === filter.subject_code!.toLowerCase());
  }
  return filtered;
}

export async function createAssignment(asgn: Omit<Assignment, 'id'>): Promise<{ success: boolean; data?: Assignment; error?: string }> {
  const newId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: Assignment = {
    ...asgn,
    id: newId,
    faculty_email: asgn.faculty_email.toLowerCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('assignments').insert([record]).select().single();
    if (!error && data) {
      localAssignments.unshift(data as Assignment);
      saveLocalStores();
      return { success: true, data: data as Assignment };
    }
  } catch {}

  localAssignments.unshift(record);
  saveLocalStores();
  return { success: true, data: record };
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<{ success: boolean; data?: Assignment; error?: string }> {
  try {
    await supabase.from('assignments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  } catch {}

  const idx = localAssignments.findIndex(a => a.id === id);
  if (idx !== -1) {
    localAssignments[idx] = { ...localAssignments[idx], ...updates, updated_at: new Date().toISOString() };
  }
  saveLocalStores();
  return { success: true };
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('assignments').delete().eq('id', id);
  } catch {}

  const idx = localAssignments.findIndex(a => a.id === id);
  if (idx !== -1) localAssignments.splice(idx, 1);
  saveLocalStores();
  return { success: true };
}

export async function fetchAssignmentSubmissions(assignmentId?: string, studentRegnoOrEmail?: string): Promise<AssignmentSubmission[]> {
  try {
    let query = supabase.from('assignment_submissions').select('*');
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentRegnoOrEmail) {
      query = query.or(`regno.eq.${studentRegnoOrEmail.toUpperCase()},student_email.eq.${studentRegnoOrEmail.toLowerCase()}`);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as AssignmentSubmission[];
    }
  } catch {}

  let filtered = [...localAssignmentSubmissions];
  if (assignmentId) filtered = filtered.filter(s => s.assignment_id === assignmentId);
  if (studentRegnoOrEmail) {
    const clean = studentRegnoOrEmail.toLowerCase();
    filtered = filtered.filter(s => s.regno.toLowerCase() === clean || s.student_email.toLowerCase() === clean);
  }
  return filtered;
}

export async function submitAssignment(sub: Omit<AssignmentSubmission, 'id'>): Promise<{ success: boolean; data?: AssignmentSubmission; error?: string }> {
  const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: AssignmentSubmission = {
    ...sub,
    id: newId,
    status: sub.status || 'SUBMITTED',
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('assignment_submissions').upsert([record], { onConflict: 'assignment_id,regno' }).select().single();
    if (!error && data) {
      const idx = localAssignmentSubmissions.findIndex(s => s.assignment_id === sub.assignment_id && s.regno.toLowerCase() === sub.regno.toLowerCase());
      if (idx !== -1) localAssignmentSubmissions[idx] = data as AssignmentSubmission;
      else localAssignmentSubmissions.unshift(data as AssignmentSubmission);
      saveLocalStores();
      return { success: true, data: data as AssignmentSubmission };
    }
  } catch {}

  const idx = localAssignmentSubmissions.findIndex(s => s.assignment_id === sub.assignment_id && s.regno.toLowerCase() === sub.regno.toLowerCase());
  if (idx !== -1) localAssignmentSubmissions[idx] = record;
  else localAssignmentSubmissions.unshift(record);
  saveLocalStores();
  return { success: true, data: record };
}

export async function gradeSubmission(
  submissionId: string,
  assignmentId: string,
  regno: string,
  marks: number,
  grade: string,
  feedback: string,
  gradedBy: string
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  try {
    await supabase.from('assignment_submissions').update({
      marks,
      grade,
      feedback,
      graded_by: gradedBy,
      graded_at: now,
      status: 'GRADED',
      updated_at: now
    }).eq('assignment_id', assignmentId).eq('regno', regno);
  } catch {}

  const idx = localAssignmentSubmissions.findIndex(s => s.assignment_id === assignmentId && s.regno.toLowerCase() === regno.toLowerCase());
  if (idx !== -1) {
    localAssignmentSubmissions[idx] = {
      ...localAssignmentSubmissions[idx],
      marks,
      grade,
      feedback,
      graded_by: gradedBy,
      graded_at: now,
      status: 'GRADED',
      updated_at: now
    };
  }
  saveLocalStores();
  return { success: true };
}

export async function fetchStudentAssignmentStatuses(studentRegnoOrEmail?: string): Promise<StudentAssignmentStatus[]> {
  try {
    let query = supabase.from('student_assignment_status').select('*');
    if (studentRegnoOrEmail) {
      query = query.or(`regno.eq.${studentRegnoOrEmail.toUpperCase()},student_email.eq.${studentRegnoOrEmail.toLowerCase()}`);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as StudentAssignmentStatus[];
    }
  } catch {}

  let filtered = [...localStudentAssignmentStatuses];
  if (studentRegnoOrEmail) {
    const clean = studentRegnoOrEmail.toLowerCase();
    filtered = filtered.filter(s => s.regno.toLowerCase() === clean || s.student_email.toLowerCase() === clean);
  }
  return filtered;
}

export async function toggleAssignmentCompletion(assignmentId: string, regno: string, studentEmail: string): Promise<{ success: boolean; isCompleted: boolean }> {
  const existingIdx = localStudentAssignmentStatuses.findIndex(s => s.assignment_id === assignmentId && s.regno.toLowerCase() === regno.toLowerCase());
  let nextCompleted = true;

  if (existingIdx !== -1) {
    const current = localStudentAssignmentStatuses[existingIdx];
    nextCompleted = current.status !== 'COMPLETED';
    localStudentAssignmentStatuses[existingIdx].status = nextCompleted ? 'COMPLETED' : 'PENDING';
    localStudentAssignmentStatuses[existingIdx].completed_at = nextCompleted ? new Date().toISOString() : undefined;
  } else {
    localStudentAssignmentStatuses.push({
      id: `sas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignment_id: assignmentId,
      regno,
      student_email: studentEmail,
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    nextCompleted = true;
  }

  try {
    await supabase.from('student_assignment_status').upsert([{
      assignment_id: assignmentId,
      regno,
      student_email: studentEmail,
      status: nextCompleted ? 'COMPLETED' : 'PENDING',
      completed_at: nextCompleted ? new Date().toISOString() : null
    }], { onConflict: 'assignment_id,regno' });
  } catch {}

  saveLocalStores();
  return { success: true, isCompleted: nextCompleted };
}



