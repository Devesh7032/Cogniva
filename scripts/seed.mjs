import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required to run seed script.');
  process.exit(1);
}

console.log('=====================================================');
console.log(' COGNIVA COMPLETE BACKEND SEEDING & PROVISIONING');
console.log('=====================================================');

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeed() {
  console.log('1. Provisioning Academic Structure...');
  await adminClient.from('academic_years').upsert([
    { name: 'First Year', code: '1YR', order_index: 1 },
    { name: 'Second Year', code: '2YR', order_index: 2 },
    { name: 'Third Year', code: '3YR', order_index: 3 },
    { name: 'Fourth Year', code: '4YR', order_index: 4 }
  ], { onConflict: 'name' });

  await adminClient.from('departments').upsert([
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Electronics & Communication', code: 'ECE' },
    { name: 'AI & Data Science', code: 'AI&DS' },
    { name: 'Mechanical Engineering', code: 'ME' }
  ], { onConflict: 'code' });

  const secList = ['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D', 'CSE-E'];
  for (const sName of secList) {
    await adminClient.from('sections').upsert([{ name: sName, capacity: 60 }], { onConflict: 'name' });
  }

  console.log('2. Provisioning Accounts & Auth Users...');
  const facultyEmail = 'anjali.menon@example.edu';
  const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
  const existingMap = new Map((existingUsers || []).map(u => [u.email.toLowerCase(), u]));

  // Faculty User
  let facUser = existingMap.get(facultyEmail.toLowerCase());
  if (!facUser) {
    const { data: created } = await adminClient.auth.admin.createUser({
      email: facultyEmail,
      password: 'faculty123password',
      email_confirm: true,
      user_metadata: { role: 'faculty', full_name: 'Prof. Anjali Menon' }
    });
    facUser = created?.user;
  }
  if (facUser) {
    await adminClient.from('profiles').upsert([{ id: facUser.id, user_id: facUser.id, email: facultyEmail, full_name: 'Prof. Anjali Menon', role: 'faculty' }], { onConflict: 'email' });
    await adminClient.from('faculty').upsert([{ id: 'fac_anjali', employee_id: 'EMP1001', name: 'Prof. Anjali Menon', email: facultyEmail, department: 'CSE', section: 'CSE-C', subject: 'Cloud Computing' }], { onConflict: 'email' });
  }

  // Student 001
  const studentEmail = 'student001@cogniva.edu';
  let studUser = existingMap.get(studentEmail.toLowerCase());
  if (!studUser) {
    const { data: created } = await adminClient.auth.admin.createUser({
      email: studentEmail,
      password: '10052004',
      email_confirm: true,
      user_metadata: { role: 'student', full_name: 'Aditya Varma', regno: '2024CSE001', section: 'CSE-C' }
    });
    studUser = created?.user;
  }
  if (studUser) {
    await adminClient.from('profiles').upsert([{ id: studUser.id, user_id: studUser.id, email: studentEmail, full_name: 'Aditya Varma', role: 'student', regno: '2024CSE001', section: 'CSE-C', department: 'CSE' }], { onConflict: 'email' });
    await adminClient.from('students').upsert([{ id: 'stud_csec_001', auth_user_id: studUser.id, regno: '2024CSE001', name: 'Aditya Varma', email: studentEmail, department: 'CSE', year: 'Second Year', semester: '4', section: 'CSE-C', dob: '2004-05-10' }], { onConflict: 'email' });
  }

  console.log('3. Provisioning Subjects & Timetable for CSE-C...');
  const demoSubjects = [
    { id: 'subj_cs401', subject_code: 'CS401', subject_name: 'Cloud Computing', department: 'CSE', academic_year: 'Second Year', section: 'CSE-C', semester: '4', credits: 4 },
    { id: 'subj_cs402', subject_code: 'CS402', subject_name: 'Data Analytics & Visualisation', department: 'CSE', academic_year: 'Second Year', section: 'CSE-C', semester: '4', credits: 4 },
    { id: 'subj_cs403', subject_code: 'CS403', subject_name: 'Database Management Systems', department: 'CSE', academic_year: 'Second Year', section: 'CSE-C', semester: '4', credits: 3 },
    { id: 'subj_ma301', subject_code: 'MA301', subject_name: 'Probability & Statistics', department: 'CSE', academic_year: 'Second Year', section: 'CSE-C', semester: '4', credits: 3 }
  ];
  await adminClient.from('subjects').upsert(demoSubjects, { onConflict: 'id' });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const demoTt = [];
  days.forEach((day, dIdx) => {
    demoTt.push({
      id: `tt_${day}_p1`,
      day,
      period: 1,
      start_time: '09:00',
      end_time: '09:50',
      subject: dIdx % 2 === 0 ? 'Cloud Computing' : 'Data Analytics & Visualisation',
      subject_code: dIdx % 2 === 0 ? 'CS401' : 'CS402',
      faculty: 'Prof. Anjali Menon',
      faculty_email: facultyEmail,
      room: 'Room 302',
      section: 'CSE-C',
      department: 'CSE',
      academic_year: 'Second Year',
      semester: '4'
    });
    demoTt.push({
      id: `tt_${day}_p2`,
      day,
      period: 2,
      start_time: '10:00',
      end_time: '10:50',
      subject: dIdx % 2 === 0 ? 'Database Management Systems' : 'Probability & Statistics',
      subject_code: dIdx % 2 === 0 ? 'CS403' : 'MA301',
      faculty: 'Faculty B',
      faculty_email: 'faculty.b@cogniva.edu',
      room: 'Room 304',
      section: 'CSE-C',
      department: 'CSE',
      academic_year: 'Second Year',
      semester: '4'
    });
  });
  await adminClient.from('timetable_entries').upsert(demoTt, { onConflict: 'id' });

  console.log('4. Provisioning Notices & Announcements for CSE-C & ALL...');
  const demoNotices = [
    {
      id: 'notice_demo_01',
      title: 'IA-2 Examination Timetable Released',
      content: 'The second internal assessment schedule for Second Year CSE (all sections) has been published. Please review your subject slots.',
      author_name: 'Prof. Anjali Menon',
      faculty_email: facultyEmail,
      department: 'CSE',
      section: 'CSE-C',
      priority: 'Urgent',
      published_at: new Date().toISOString()
    },
    {
      id: 'notice_demo_02',
      title: 'Cloud Computing Project Submission Deadline Extended',
      content: 'The final submission date for the Cloud Microservices assignment has been extended to Friday 5 PM.',
      author_name: 'Prof. Anjali Menon',
      faculty_email: facultyEmail,
      department: 'CSE',
      section: 'ALL',
      priority: 'Important',
      published_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  await adminClient.from('notices').upsert(demoNotices, { onConflict: 'id' });

  console.log('5. Provisioning Course Assignments & Study Materials...');
  await adminClient.from('assignments').upsert([
    {
      id: 'asgn_demo_01',
      subject_code: 'CS401',
      subject_name: 'Cloud Computing',
      department: 'CSE',
      section: 'CSE-C',
      faculty_email: facultyEmail,
      title: 'Dockerizing Microservices & Supabase Setup',
      description: 'Containerize a Node.js microservice and link with Supabase auth.',
      assigned_date: '2026-09-01',
      due_date: '2026-09-18',
      max_marks: 10,
      priority: 'High'
    }
  ], { onConflict: 'id' });

  await adminClient.from('study_materials').upsert([
    {
      id: 'mat_demo_01',
      title: 'Cloud Architecture & Distributed Systems Notes',
      subject: 'Cloud Computing',
      description: 'Comprehensive lecture slides covering AWS EC2, S3, Docker, and Supabase database architecture.',
      year: 'Second Year',
      department: 'CSE',
      section: 'CSE-C',
      file_name: 'Cloud_Computing_Lecture_Notes_2026.pdf',
      file_url: 'https://gtoacfhmilqrtjjiyzci.supabase.co/storage/v1/object/public/study-materials/Cloud_Computing_Lecture_Notes_2026.pdf',
      faculty_email: facultyEmail,
      upload_date: new Date().toISOString()
    }
  ], { onConflict: 'id' });

  console.log('6. Provisioning Student Attendance & CGPA Summaries...');
  await adminClient.from('student_attendance_summary').upsert([
    {
      id: 'att_sum_2024CSE001',
      regno: '2024CSE001',
      student_name: 'Aditya Varma',
      student_email: studentEmail,
      department: 'CSE',
      section: 'CSE-C',
      overall_attendance: 88,
      subjects: [
        { subjectName: 'Cloud Computing', attendancePercentage: 90, status: 'Good' },
        { subjectName: 'Data Analytics & Visualisation', attendancePercentage: 86, status: 'Good' },
        { subjectName: 'Database Management Systems', attendancePercentage: 88, status: 'Good' }
      ]
    }
  ], { onConflict: 'regno' });

  await adminClient.from('student_cgpa_records').upsert([
    {
      id: 'cgpa_2024CSE001',
      regno: '2024CSE001',
      student_name: 'Aditya Varma',
      student_email: studentEmail,
      department: 'CSE',
      section: 'CSE-C',
      semester: '4',
      faculty_email: facultyEmail,
      current_cgpa: 8.29,
      latest_sgpa: 8.42,
      previous_sgpa: 8.35,
      best_sgpa: 8.42,
      lowest_sgpa: 8.10,
      average_sgpa: 8.29,
      trend: 'improving',
      sgpa_delta: 0.07,
      cgpa_delta: 0.07,
      semesters: [
        { semester: 'Sem 1', sgpa: 8.10, cgpa: 8.10, status: 'Completed' },
        { semester: 'Sem 2', sgpa: 8.35, cgpa: 8.22, status: 'Completed' },
        { semester: 'Sem 3', sgpa: 8.42, cgpa: 8.29, status: 'Completed' },
        { semester: 'Sem 4', sgpa: null, cgpa: null, status: 'Current' }
      ]
    }
  ], { onConflict: 'regno' });

  console.log('\n=====================================================');
  console.log(' BACKEND SEEDING COMPLETE — ALL DEMO DATA PERSISTED!');
  console.log('=====================================================');
}

runSeed().catch(console.error);
