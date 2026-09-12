import { supabase } from './supabase';
import { fetchStudentMembers, fetchFacultyMembers, COLLEGE_A_ID, COLLEGE_B_ID } from './academic-api';

export type QueryCategory =
  | 'wifi'
  | 'classroom'
  | 'lab'
  | 'materials'
  | 'assignment'
  | 'timetable'
  | 'attendance'
  | 'exam'
  | 'faculty'
  | 'infrastructure'
  | 'library'
  | 'technical'
  | 'other';

export interface CategoryOption {
  id: QueryCategory;
  label: string;
  iconName: string;
  description: string;
}

export const QUERY_CATEGORIES: CategoryOption[] = [
  { id: 'wifi', label: 'Wi-Fi / Internet', iconName: 'Wifi', description: 'Network connectivity, signal quality, captive portal errors' },
  { id: 'classroom', label: 'Classroom', iconName: 'School', description: 'Projector, seating, AC/fans, board, room availability' },
  { id: 'lab', label: 'Lab / Computer', iconName: 'Laptop', description: 'Lab software, hardware issues, power outlets, dev environment' },
  { id: 'materials', label: 'Study Materials', iconName: 'BookOpen', description: 'Missing lecture notes, slides, reference links, syllabus updates' },
  { id: 'assignment', label: 'Assignment', iconName: 'ClipboardList', description: 'Submission portal, deadline clarifications, rubric questions' },
  { id: 'timetable', label: 'Timetable', iconName: 'Calendar', description: 'Room collision, class timing discrepancies, faculty substitution' },
  { id: 'attendance', label: 'Attendance', iconName: 'CheckSquare', description: 'Discrepancy in recorded percentage, absent mark correction' },
  { id: 'exam', label: 'Examination', iconName: 'FileCheck', description: 'Hall ticket, seat allocation, exam timetable, marks evaluation' },
  { id: 'faculty', label: 'Faculty / Class', iconName: 'UserCheck', description: 'Class schedule changes, syllabus coverage speed, mentor query' },
  { id: 'infrastructure', label: 'Infrastructure', iconName: 'Building', description: 'Water dispenser, washroom maintenance, lighting, campus facilities' },
  { id: 'library', label: 'Library', iconName: 'Library', description: 'Book reservation, digital journal access, quiet study zones' },
  { id: 'technical', label: 'Technical Issue', iconName: 'Cpu', description: 'Cogniva platform bugs, login errors, password resets' },
  { id: 'other', label: 'Other', iconName: 'HelpCircle', description: 'General academic guidance or unlisted campus concerns' },
];

export type QueryPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type QueryStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export interface StudentQuery {
  id: string;
  college_id?: string;
  display_id: string;
  student_id: string;
  student_name: string;
  register_number: string;
  department: string;
  year?: string;
  semester?: string;
  section: string;
  category: QueryCategory;
  category_label: string;
  sub_category?: string;
  title: string;
  description: string;
  location?: string;
  subject_id?: string;
  subject_name?: string;
  priority: QueryPriority;
  status: QueryStatus;
  is_class_wide: boolean;
  affected_section?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_faculty_id?: string;
  assigned_faculty_name?: string;
  assigned_admin_id?: string;
  resolved_by?: string;
  resolved_at?: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryMessage {
  id: string;
  query_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'faculty' | 'admin';
  message: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  college_id?: string;
  recipient_id: string;
  recipient_role: 'student' | 'faculty' | 'admin';
  query_id: string;
  type: 'NEW_QUERY' | 'QUERY_ACKNOWLEDGED' | 'QUERY_RESPONSE' | 'QUERY_STATUS_CHANGE' | 'QUERY_RESOLVED';
  title: string;
  message: string;
  student_name?: string;
  register_number?: string;
  department?: string;
  section?: string;
  category?: string;
  priority?: string;
  read: boolean;
  created_at: string;
}

// PERSISTENT LOCAL STORAGE STORE (fallback & local synchronization)
const STORAGE_KEY_QUERIES = 'cogniva_student_queries_db_v1';
const STORAGE_KEY_MESSAGES = 'cogniva_query_messages_db_v1';
const STORAGE_KEY_NOTIFS = 'cogniva_app_notifications_db_v1';

let localQueries: StudentQuery[] = [];
let localMessages: QueryMessage[] = [];
let localNotifications: AppNotification[] = [];

function loadLocalStore() {
  if (typeof window === 'undefined') return;
  try {
    const q = localStorage.getItem(STORAGE_KEY_QUERIES);
    if (q) localQueries = JSON.parse(q);
    const m = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (m) localMessages = JSON.parse(m);
    const n = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (n) localNotifications = JSON.parse(n);
  } catch (e) {
    console.warn('[HelpDeskStore] Local storage read notice:', e);
  }
}

function saveLocalStore() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUERIES, JSON.stringify(localQueries));
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(localMessages));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(localNotifications));
  } catch (e) {
    console.warn('[HelpDeskStore] Local storage write notice:', e);
  }
}

loadLocalStore();

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateDisplayId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `QRY-2026-${num}`;
}

export async function createStudentQuery(params: {
  userEmail: string;
  category: QueryCategory;
  subCategory?: string;
  title: string;
  description: string;
  location?: string;
  subjectId?: string;
  subjectName?: string;
  priority?: QueryPriority;
  attachmentUrl?: string;
  collegeId?: string;
}): Promise<{ success: boolean; data?: StudentQuery; error?: string }> {
  try {
    loadLocalStore();

    if (typeof window !== 'undefined') {
      try {
        const sRes = await fetch('/api/help-desk/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && sJson.data) {
            localQueries.unshift(sJson.data);
            saveLocalStore();
            return { success: true, data: sJson.data };
          }
        }
      } catch (e) {
        console.warn('[createStudentQuery] Server sync notice:', e);
      }
    }

    let authUserId = '';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUserId = user.id;
    } catch (e) {}

    const targetCollegeId = params.collegeId || COLLEGE_A_ID;
    const students = await fetchStudentMembers(undefined, undefined, undefined, targetCollegeId);
    const student = students.find((s) => s.email.toLowerCase() === params.userEmail.toLowerCase());

    const studentName = student?.name || params.userEmail.split('@')[0];
    const registerNumber = student?.regno || '2024CSE001';
    const department = student?.department || 'CSE';
    const year = student?.year || 'Second Year';
    const semester = student?.semester || '4';
    const section = student?.section || 'CSE-C';

    const catObj = QUERY_CATEGORIES.find((c) => c.id === params.category);
    const categoryLabel = catObj ? catObj.label : 'Campus Issue';

    const newId = generateUUID();
    const displayId = generateDisplayId();
    const nowIso = new Date().toISOString();

    const facultyList = await fetchFacultyMembers(targetCollegeId);
    const sectionFaculty = facultyList.find((f) => f.section?.toUpperCase().includes(section.toUpperCase()));

    const newQuery: StudentQuery = {
      id: newId,
      college_id: targetCollegeId,
      display_id: displayId,
      student_id: authUserId || (student?.id && student.id.includes('-') ? student.id : generateUUID()),
      student_name: studentName,
      register_number: registerNumber,
      department,
      year,
      semester,
      section,
      category: params.category,
      category_label: categoryLabel,
      sub_category: params.subCategory || '',
      title: params.title,
      description: params.description,
      location: params.location || `${section} Classroom`,
      subject_id: params.subjectId || undefined,
      subject_name: params.subjectName || undefined,
      priority: params.priority || 'NORMAL',
      status: 'OPEN',
      is_class_wide: false,
      affected_section: section,
      assigned_to: sectionFaculty?.email || undefined,
      assigned_to_name: sectionFaculty?.name || 'Department Admin / Unassigned',
      assigned_faculty_id: sectionFaculty?.id || sectionFaculty?.email || undefined,
      assigned_faculty_name: sectionFaculty?.name || 'Department Admin / Unassigned',
      assigned_admin_id: 'admin_all',
      attachment_url: params.attachmentUrl || undefined,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: dbData, error: dbErr } = await supabase
      .from('student_queries')
      .insert([newQuery])
      .select()
      .single();

    const createdQuery = !dbErr && dbData ? (dbData as StudentQuery) : newQuery;

    const initialMsg: QueryMessage = {
      id: generateUUID(),
      query_id: createdQuery.id,
      sender_id: createdQuery.student_id,
      sender_name: createdQuery.student_name,
      sender_role: 'student',
      message: `Query created: "${createdQuery.title}"`,
      created_at: nowIso,
    };

    try {
      await supabase.from('student_query_messages').insert([initialMsg]);
    } catch (e) {}

    localMessages.unshift(initialMsg);

    const notifRecords: AppNotification[] = [
      {
        id: generateUUID(),
        college_id: targetCollegeId,
        recipient_id: sectionFaculty?.email || 'faculty_all',
        recipient_role: 'faculty',
        query_id: createdQuery.id,
        type: 'NEW_QUERY',
        title: `NEW STUDENT QUERY · ${categoryLabel}`,
        message: `"${createdQuery.title}" reported by ${createdQuery.student_name} (${createdQuery.section})`,
        student_name: createdQuery.student_name,
        register_number: createdQuery.register_number,
        department: createdQuery.department,
        section: createdQuery.section,
        category: createdQuery.category_label,
        priority: createdQuery.priority,
        read: false,
        created_at: nowIso,
      },
      {
        id: generateUUID(),
        college_id: targetCollegeId,
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        query_id: createdQuery.id,
        type: 'NEW_QUERY',
        title: `NEW CAMPUS ISSUE · ${categoryLabel}`,
        message: `[${createdQuery.priority}] "${createdQuery.title}" in ${createdQuery.location} (${createdQuery.section})`,
        student_name: createdQuery.student_name,
        register_number: createdQuery.register_number,
        department: createdQuery.department,
        section: createdQuery.section,
        category: createdQuery.category_label,
        priority: createdQuery.priority,
        read: false,
        created_at: nowIso,
      },
    ];

    try {
      await supabase.from('notifications').insert(notifRecords);
    } catch (e) {}

    localNotifications.unshift(...notifRecords);
    localQueries.unshift(createdQuery);
    saveLocalStore();

    return { success: true, data: createdQuery };
  } catch (err) {
    console.error('[createStudentQuery] Error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchStudentQueries(params?: {
  userEmail?: string;
  role?: 'student' | 'faculty' | 'admin';
  section?: string;
  status?: string;
  category?: string;
  collegeId?: string;
}): Promise<StudentQuery[]> {
  loadLocalStore();

  let serverQueries: StudentQuery[] = [];
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/help-desk/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          serverQueries = json.data;
        }
      }
    } catch (e) {}
  }

  let dbQueries: StudentQuery[] = [];
  try {
    let dbQuery = supabase.from('student_queries').select('*').order('created_at', { ascending: false });
    if (params?.collegeId) {
      dbQuery = dbQuery.eq('college_id', params.collegeId);
    }
    const { data, error } = await dbQuery;

    if (!error && data) {
      dbQueries = data as StudentQuery[];
    }
  } catch (e) {}

  const queryMap = new Map<string, StudentQuery>();
  dbQueries.forEach((q) => queryMap.set(q.id, q));
  serverQueries.forEach((q) => queryMap.set(q.id, q));
  if (params?.collegeId !== COLLEGE_B_ID) {
    localQueries.forEach((q) => {
      if (!queryMap.has(q.id)) {
        queryMap.set(q.id, q);
      } else {
        const dbQ = queryMap.get(q.id)!;
        if (new Date(q.updated_at).getTime() > new Date(dbQ.updated_at).getTime()) {
          queryMap.set(q.id, q);
        }
      }
    });
  }

  let result = Array.from(queryMap.values());

  if (params?.role === 'student' && params?.userEmail) {
    const students = await fetchStudentMembers();
    const me = students.find((s) => s.email.toLowerCase() === params.userEmail!.toLowerCase());
    const myRegno = me?.regno || '';
    const myEmail = me?.email || params.userEmail;

    result = result.filter(
      (q) =>
        q.student_name.toLowerCase().includes(myEmail.split('@')[0].toLowerCase()) ||
        q.register_number.toLowerCase() === myRegno.toLowerCase() ||
        (me && q.student_id === me.id) ||
        (me && q.section === me.section && q.is_class_wide)
    );
  } else if (params?.role === 'faculty' && params?.userEmail) {
    const facultyList = await fetchFacultyMembers();
    const meFac = facultyList.find((f) => f.email.toLowerCase() === params.userEmail!.toLowerCase());
    const mySection = meFac?.section || params.section || 'CSE-C';

    result = result.filter(
      (q) =>
        q.section.toUpperCase() === mySection.toUpperCase() ||
        (q.affected_section && q.affected_section.toUpperCase() === mySection.toUpperCase()) ||
        q.assigned_to === meFac?.id ||
        q.assigned_to === meFac?.email ||
        q.assigned_faculty_id === meFac?.id ||
        q.assigned_faculty_name === meFac?.name ||
        q.is_class_wide
    );
  }

  if (params?.status && params.status !== 'ALL') {
    result = result.filter((q) => q.status === params.status);
  }

  if (params?.category && params.category !== 'ALL') {
    result = result.filter((q) => q.category === params.category);
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchQueryMessages(queryId: string): Promise<QueryMessage[]> {
  loadLocalStore();

  let serverMsgs: QueryMessage[] = [];
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/help-desk/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          serverMsgs = json.data;
        }
      }
    } catch (e) {}
  }

  let dbMsgs: QueryMessage[] = [];
  try {
    const { data, error } = await supabase
      .from('student_query_messages')
      .select('*')
      .eq('query_id', queryId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      dbMsgs = data as QueryMessage[];
    }
  } catch (e) {}

  const msgMap = new Map<string, QueryMessage>();
  dbMsgs.forEach((m) => msgMap.set(m.id, m));
  serverMsgs.forEach((m) => msgMap.set(m.id, m));
  localMessages.filter((m) => m.query_id === queryId).forEach((m) => msgMap.set(m.id, m));

  return Array.from(msgMap.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function addQueryMessage(params: {
  queryId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'faculty' | 'admin';
  message: string;
}): Promise<{ success: boolean; data?: QueryMessage }> {
  loadLocalStore();

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/help-desk/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          localMessages.push(json.data);
          saveLocalStore();
          return { success: true, data: json.data };
        }
      }
    } catch (e) {}
  }

  const nowIso = new Date().toISOString();
  const newMsg: QueryMessage = {
    id: generateUUID(),
    query_id: params.queryId,
    sender_id: params.senderId,
    sender_name: params.senderName,
    sender_role: params.senderRole,
    message: params.message,
    created_at: nowIso,
  };

  try {
    await supabase.from('student_query_messages').insert([newMsg]);
  } catch (e) {}

  localMessages.push(newMsg);

  const targetQuery = localQueries.find((q) => q.id === params.queryId);
  if (targetQuery) {
    targetQuery.updated_at = nowIso;
  }

  saveLocalStore();
  return { success: true, data: newMsg };
}

export async function updateQueryStatus(params: {
  queryId: string;
  status: QueryStatus;
  updatedByName: string;
  updatedByRole: 'faculty' | 'admin';
  resolutionComment?: string;
  isClassWide?: boolean;
}): Promise<{ success: boolean; data?: StudentQuery; error?: string }> {
  loadLocalStore();

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/help-desk/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const updated = json.data as StudentQuery;
          const idx = localQueries.findIndex((q) => q.id === params.queryId);
          if (idx !== -1) localQueries[idx] = updated;
          else localQueries.unshift(updated);
          saveLocalStore();
          return { success: true, data: updated };
        }
      }
    } catch (e) {}
  }

  const nowIso = new Date().toISOString();
  let targetQuery = localQueries.find((q) => q.id === params.queryId);

  if (!targetQuery) {
    const { data } = await supabase.from('student_queries').select('*').eq('id', params.queryId).single();
    if (data) targetQuery = data as StudentQuery;
  }

  if (!targetQuery) {
    return { success: false, error: 'Query not found' };
  }

  targetQuery.status = params.status;
  targetQuery.updated_at = nowIso;

  if (params.status === 'RESOLVED' || params.status === 'CLOSED') {
    targetQuery.resolved_by = params.updatedByName;
    targetQuery.resolved_at = nowIso;
  }

  if (params.isClassWide !== undefined) {
    targetQuery.is_class_wide = params.isClassWide;
  }

  if (params.updatedByRole) {
    targetQuery.assigned_to_name = params.updatedByName;
  }

  try {
    await supabase
      .from('student_queries')
      .update({
        status: params.status,
        updated_at: nowIso,
        resolved_by: targetQuery.resolved_by,
        resolved_at: targetQuery.resolved_at,
        is_class_wide: targetQuery.is_class_wide,
        assigned_to_name: targetQuery.assigned_to_name,
      })
      .eq('id', params.queryId);
  } catch (e) {}

  const statusMsgText = params.resolutionComment
    ? `Status updated to ${params.status} by ${params.updatedByName}: "${params.resolutionComment}"`
    : `Status updated to ${params.status} by ${params.updatedByName}`;

  await addQueryMessage({
    queryId: params.queryId,
    senderId: params.updatedByName,
    senderName: params.updatedByName,
    senderRole: params.updatedByRole,
    message: statusMsgText,
  });

  const notif: AppNotification = {
    id: generateUUID(),
    recipient_id: targetQuery.student_name,
    recipient_role: 'student',
    query_id: targetQuery.id,
    type: params.status === 'RESOLVED' ? 'QUERY_RESOLVED' : params.status === 'ACKNOWLEDGED' ? 'QUERY_ACKNOWLEDGED' : 'QUERY_STATUS_CHANGE',
    title: params.status === 'RESOLVED' ? 'QUERY RESOLVED' : `QUERY ${params.status}`,
    message: `Your query "${targetQuery.title}" (${targetQuery.display_id}) status is now ${params.status}.`,
    student_name: targetQuery.student_name,
    register_number: targetQuery.register_number,
    department: targetQuery.department,
    section: targetQuery.section,
    category: targetQuery.category_label,
    priority: targetQuery.priority,
    read: false,
    created_at: nowIso,
  };

  try {
    await supabase.from('notifications').insert([notif]);
  } catch (e) {}

  localNotifications.unshift(notif);
  saveLocalStore();

  return { success: true, data: targetQuery };
}

export async function fetchCampusSignals(sectionName: string): Promise<StudentQuery[]> {
  const allQueries = await fetchStudentQueries();
  return allQueries.filter(
    (q) =>
      q.is_class_wide &&
      (q.section.toUpperCase() === sectionName.toUpperCase() || q.affected_section?.toUpperCase() === sectionName.toUpperCase()) &&
      q.status !== 'CLOSED'
  );
}

export async function fetchNotifications(userEmail?: string, role?: 'student' | 'faculty' | 'admin', collegeId?: string): Promise<AppNotification[]> {
  loadLocalStore();

  let serverNotifs: AppNotification[] = [];
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/help-desk/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, role, collegeId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          serverNotifs = json.data;
        }
      }
    } catch (e) {}
  }

  let dbNotifs: AppNotification[] = [];
  try {
    let notifQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (collegeId) {
      notifQuery = notifQuery.eq('college_id', collegeId);
    }
    const { data, error } = await notifQuery;

    if (!error && data) {
      dbNotifs = data as AppNotification[];
    }
  } catch (e) {}

  const notifMap = new Map<string, AppNotification>();
  dbNotifs.forEach((n) => notifMap.set(n.id, n));
  serverNotifs.forEach((n) => notifMap.set(n.id, n));
  if (collegeId !== COLLEGE_B_ID) {
    localNotifications.forEach((n) => {
      if (!notifMap.has(n.id)) notifMap.set(n.id, n);
    });
  }

  let result = Array.from(notifMap.values());

  if (role === 'student' && userEmail) {
    const studentPrefix = userEmail.split('@')[0].toLowerCase();
    result = result.filter(
      (n) =>
        n.recipient_role === 'student' &&
        (n.recipient_id.toLowerCase().includes(studentPrefix) || n.student_name?.toLowerCase().includes(studentPrefix))
    );
  } else if (role === 'faculty') {
    result = result.filter((n) => n.recipient_role === 'faculty');
  } else if (role === 'admin') {
    result = result.filter((n) => n.recipient_role === 'admin');
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  loadLocalStore();
  const target = localNotifications.find((n) => n.id === notificationId);
  if (target) {
    target.read = true;
  }
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  } catch (e) {}
  saveLocalStore();
}

export function calculateResolutionTime(createdAt: string, resolvedAt?: string): string {
  if (!resolvedAt) return 'Pending';
  const start = new Date(createdAt).getTime();
  const end = new Date(resolvedAt).getTime();
  const diffMs = Math.max(0, end - start);

  const mins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const days = Math.floor(hrs / 24);
  const remainingHrs = hrs % 24;

  if (days > 0) {
    return `${days}d ${remainingHrs}h`;
  }
  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  }
  return `${Math.max(1, mins)}m`;
}

