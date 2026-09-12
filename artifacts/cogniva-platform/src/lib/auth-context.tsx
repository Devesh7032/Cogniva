import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { fetchFacultyMembers, fetchStudentMembers, normalizeDobToPassword, setActiveSessionCollegeId, getCurrentCollegeId, COLLEGE_A_ID, COLLEGE_B_ID, GUEST_COLLEGE_ID, GUEST_COLLEGE_NAME, resetGuestDataStore } from './academic-api';

export { COLLEGE_A_ID, COLLEGE_B_ID, GUEST_COLLEGE_ID };
export const COLLEGE_A_NAME = 'Cogniva Engineering College (College A)';
export const COLLEGE_B_NAME = 'Test College 1';

const ADMIN_EMAILS_COLLEGE_A = ['cdc@gmail.com', 'hod@gmail.com'];
const ADMIN_EMAILS_COLLEGE_B = ['cdc1@gmail.com', 'hod1@gmail.com', 'admin1@gmail.com'];
const ADMIN_EMAILS = [...ADMIN_EMAILS_COLLEGE_A, ...ADMIN_EMAILS_COLLEGE_B];

export type UserRole = 'admin' | 'faculty' | 'student' | null;

interface LoginResult {
  success: boolean;
  role?: UserRole;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  collegeId: string;
  collegeName: string;
  loading: boolean;
  isGuestMode: boolean;
  guestRole: 'admin' | 'faculty' | 'student' | null;
  login: (email: string, pass: string) => Promise<LoginResult>;
  enterGuestMode: (guestRole: 'admin' | 'faculty' | 'student') => void;
  exitGuestMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [collegeId, setCollegeId] = useState<string>(() => getCurrentCollegeId());
  const [collegeName, setCollegeName] = useState<string>(() => getCurrentCollegeId() === GUEST_COLLEGE_ID ? GUEST_COLLEGE_NAME : getCurrentCollegeId() === COLLEGE_B_ID ? COLLEGE_B_NAME : COLLEGE_A_NAME);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [guestRole, setGuestRole] = useState<'admin' | 'faculty' | 'student' | null>(null);

  useEffect(() => {
    setActiveSessionCollegeId(collegeId);
  }, [collegeId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndSetUser(session.user);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndSetUser(session.user);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const resolveCollege = (email: string, profileCollegeId?: string, userMetadataCollegeId?: string) => {
    let targetId = COLLEGE_A_ID;
    if (profileCollegeId) {
      targetId = profileCollegeId;
    } else if (userMetadataCollegeId) {
      targetId = userMetadataCollegeId;
    } else if (ADMIN_EMAILS_COLLEGE_B.includes(email) || email.includes('admin1') || email.includes('cdc1') || email.includes('hod1')) {
      targetId = COLLEGE_B_ID;
    } else {
      targetId = COLLEGE_A_ID;
    }

    const cName = targetId === COLLEGE_B_ID ? COLLEGE_B_NAME : COLLEGE_A_NAME;
    setCollegeId(targetId);
    setCollegeName(cName);
    setActiveSessionCollegeId(targetId);
    return targetId;
  };

  const fetchRoleAndSetUser = async (u: User): Promise<UserRole> => {
    const email = u.email?.toLowerCase() || '';

    // 1. First check profiles table in Supabase
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, college_id')
        .eq('user_id', u.id)
        .maybeSingle();

      if (!error && profile?.role) {
        const assignedRole = String(profile.role).toLowerCase() as UserRole;
        setRole(assignedRole);
        resolveCollege(email, profile.college_id, u.user_metadata?.college_id);
        setLoading(false);
        return assignedRole;
      }
    } catch {
      // Ignore
    }

    // 2. Check user metadata
    if (u.user_metadata?.role) {
      const assignedRole = String(u.user_metadata.role).toLowerCase() as UserRole;
      setRole(assignedRole);
      resolveCollege(email, undefined, u.user_metadata?.college_id);
      setLoading(false);
      return assignedRole;
    }

    // 3. Fallback check for admin accounts
    if (ADMIN_EMAILS_COLLEGE_A.includes(email) || ADMIN_EMAILS_COLLEGE_B.includes(email) || email.includes('admin') || email.includes('cdc') || email.includes('hod')) {
      setRole('admin');
      resolveCollege(email);
      setLoading(false);
      return 'admin';
    }

    // 4. Check student accounts
    try {
      const allStudents = await fetchStudentMembers();
      if (allStudents.some(s => s.email?.toLowerCase() === email || s.regno?.toLowerCase() === email)) {
        setRole('student');
        setLoading(false);
        return 'student';
      }
    } catch {
      // ignore
    }

    // 5. Check faculty accounts
    try {
      const allFaculty = await fetchFacultyMembers();
      if (allFaculty.some(f => f.email?.toLowerCase() === email || f.id?.toLowerCase() === email)) {
        setRole('faculty');
        setLoading(false);
        return 'faculty';
      }
    } catch {
      // ignore
    }

    // 6. Heuristics fallback
    if (email.includes('student') || email.includes('stud')) {
      setRole('student');
      setLoading(false);
      return 'student';
    }

    setRole('faculty');
    setLoading(false);
    return 'faculty';
  };

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Invalid email format. Please enter a valid email address (e.g. faculty@example.edu).'
      };
    }

    if (!cleanPass) {
      return {
        success: false,
        error: 'Please enter your password / Date of Birth.'
      };
    }

    const normEnteredPass = normalizeDobToPassword(cleanPass);

    // 2. Check for Admin Account
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.includes('admin') || cleanEmail.includes('cdc') || cleanEmail.includes('hod');
    if (isAdmin) {
      const adminCollegeId = (ADMIN_EMAILS_COLLEGE_B.includes(cleanEmail) || cleanEmail.includes('admin1') || cleanEmail.includes('cdc1') || cleanEmail.includes('hod1'))
        ? COLLEGE_B_ID
        : COLLEGE_A_ID;

      resolveCollege(cleanEmail, adminCollegeId, adminCollegeId);
      setActiveSessionCollegeId(adminCollegeId);

      try {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });

        if (error) {
          await fetch('/api/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, dob: cleanPass, role: 'admin', name: 'Admin User', college_id: adminCollegeId })
          }).catch(() => undefined);

          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });
          data = retry.data;
          error = retry.error;
        }

        if (!error && data?.session && data?.user) {
          setSession(data.session);
          setUser(data.user);
          setRole('admin');
          resolveCollege(cleanEmail, data.user.user_metadata?.college_id || adminCollegeId, data.user.user_metadata?.college_id || adminCollegeId);
          setActiveSessionCollegeId(adminCollegeId);
          return { success: true, role: 'admin' };
        }
      } catch (err) {
        console.error('Admin authentication exception:', err);
      }
      setRole('admin');
      return { success: true, role: 'admin' };
    }

    // 3. Search for Faculty Account in imported faculty data
    const allFaculty = await fetchFacultyMembers().catch(() => []);
    const facultyRecord = allFaculty.find(
      (f) => f.email?.toLowerCase() === cleanEmail || f.id?.toLowerCase() === cleanEmail
    );

    if (facultyRecord) {
      if (!facultyRecord.dob || !String(facultyRecord.dob).trim()) {
        return {
          success: false,
          error: 'Date of birth is not configured for this account. Please contact the administrator.'
        };
      }

      const normStoredDob = normalizeDobToPassword(facultyRecord.dob);

      if (normStoredDob !== normEnteredPass && cleanPass !== normStoredDob && cleanPass !== facultyRecord.dob) {
        return {
          success: false,
          error: 'Invalid password or date of birth.'
        };
      }

      const facultyCollegeId = (facultyRecord as any).college_id || COLLEGE_A_ID;
      resolveCollege(cleanEmail, facultyCollegeId, facultyCollegeId);
      setActiveSessionCollegeId(facultyCollegeId);

      try {
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            dob: normStoredDob,
            role: 'faculty',
            name: facultyRecord.name,
            employee_id: facultyRecord.employee_id,
            department: facultyRecord.department,
            college_id: facultyCollegeId
          })
        }).catch(() => undefined);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: normStoredDob
        });

        if (!error && data?.session && data?.user) {
          setSession(data.session);
          setUser(data.user);
          setRole('faculty');
          return { success: true, role: 'faculty' };
        }
      } catch (err) {
        console.warn('[Faculty Supabase Auth Sync Exception]:', err);
      }

      setRole('faculty');
      return { success: true, role: 'faculty' };
    }

    // 4. Search for Student Account in imported student data
    const allStudents = await fetchStudentMembers().catch(() => []);
    const studentRecord = allStudents.find(
      (s) => s.email?.toLowerCase() === cleanEmail || s.regno?.toLowerCase() === cleanEmail
    );

    if (studentRecord) {
      if (!studentRecord.dob || !String(studentRecord.dob).trim()) {
        return {
          success: false,
          error: 'Date of birth is not configured for this account. Please contact the administrator.'
        };
      }

      const normStoredDob = normalizeDobToPassword(studentRecord.dob);

      if (normStoredDob !== normEnteredPass && cleanPass !== normStoredDob && cleanPass !== studentRecord.dob) {
        return {
          success: false,
          error: 'Invalid password or date of birth.'
        };
      }

      const studentCollegeId = (studentRecord as any).college_id || COLLEGE_A_ID;
      resolveCollege(cleanEmail, studentCollegeId, studentCollegeId);
      setActiveSessionCollegeId(studentCollegeId);

      try {
        const studentEmail = studentRecord.email?.toLowerCase() || cleanEmail;
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: studentEmail,
            dob: normStoredDob,
            role: 'student',
            name: studentRecord.name,
            regno: studentRecord.regno,
            section: studentRecord.section,
            college_id: studentCollegeId
          })
        }).catch(() => undefined);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: studentEmail,
          password: normStoredDob
        });

        if (!error && data?.session && data?.user) {
          setSession(data.session);
          setUser(data.user);
          setRole('student');
          return { success: true, role: 'student' };
        }
      } catch (err) {
        console.warn('[Student Supabase Auth Sync Exception]:', err);
      }

      setRole('student');
      return { success: true, role: 'student' };
    }

    // 5. Account not found in faculty or student imported data
    return {
      success: false,
      error: 'Account not found.'
    };
  };

  const enterGuestMode = (gRole: 'admin' | 'faculty' | 'student') => {
    resetGuestDataStore();
    setIsGuestMode(true);
    setGuestRole(gRole);
    setRole(gRole);
    setCollegeId(GUEST_COLLEGE_ID);
    setCollegeName(GUEST_COLLEGE_NAME);
    setActiveSessionCollegeId(GUEST_COLLEGE_ID);

    const syntheticUser = {
      id: `guest-${gRole}-user`,
      email: `guest-${gRole}@cogniva.demo`,
      user_metadata: {
        role: gRole,
        full_name: `Guest ${gRole.toUpperCase()}`,
        isGuest: true
      }
    } as any;

    setUser(syntheticUser);
    setSession({
      access_token: 'guest-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'guest-refresh-token',
      user: syntheticUser
    } as any);
    setLoading(false);
  };

  const exitGuestMode = () => {
    resetGuestDataStore();
    setIsGuestMode(false);
    setGuestRole(null);
    setRole(null);
    setUser(null);
    setSession(null);
    setCollegeId(COLLEGE_A_ID);
    setCollegeName(COLLEGE_A_NAME);
    setActiveSessionCollegeId(COLLEGE_A_ID);
    setLoading(false);
  };

  const logout = async () => {
    resetGuestDataStore();
    setIsGuestMode(false);
    setGuestRole(null);
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setRole(null);
    setCollegeId(COLLEGE_A_ID);
    setCollegeName(COLLEGE_A_NAME);
    setActiveSessionCollegeId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        collegeId,
        collegeName,
        loading,
        isGuestMode,
        guestRole,
        login,
        enterGuestMode,
        exitGuestMode,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
