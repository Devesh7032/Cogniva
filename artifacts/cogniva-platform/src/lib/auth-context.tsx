import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { fetchFacultyMembers, fetchStudentMembers } from './academic-api';

type UserRole = 'admin' | 'faculty' | 'student' | null;

export function normalizeDobToPassword(dobInput: any): string {
  if (!dobInput) return '';

  if (dobInput instanceof Date) {
    const dd = String(dobInput.getDate()).padStart(2, '0');
    const mm = String(dobInput.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dobInput.getFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  const clean = String(dobInput).trim();
  if (!clean) return '';

  // Case 1: Excel serial date number (e.g. 36655 -> 09/05/2000)
  if (!isNaN(Number(clean)) && Number(clean) > 20000 && Number(clean) < 60000) {
    const excelDate = new Date((Number(clean) - (25567 + 2)) * 86400 * 1000);
    const dd = String(excelDate.getUTCDate()).padStart(2, '0');
    const mm = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = String(excelDate.getUTCFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  // Case 2: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (e.g. 2000-05-09 -> 09052000)
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yyyy}`;
  }

  // Case 3: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (e.g. 09/05/2000 -> 09052000 or 14-03-1985 -> 14031985)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}${mm}${yyyy}`;
  }

  // Case 4: Digits only (e.g. 14031985 or 09052000)
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return clean;
}

interface LoginResult {
  success: boolean;
  role?: UserRole;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['cdc@gmail.com', 'hod@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchRoleAndSetUser = async (u: User): Promise<UserRole> => {
    const email = u.email?.toLowerCase() || '';

    // 1. First check profiles table in Supabase
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', u.id)
        .maybeSingle();

      if (!error && profile?.role) {
        const assignedRole = String(profile.role).toLowerCase() as UserRole;
        setRole(assignedRole);
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
      setLoading(false);
      return assignedRole;
    }

    // 3. Fallback check for admin accounts
    if (ADMIN_EMAILS.includes(email) || email.includes('admin') || email.includes('cdc') || email.includes('hod')) {
      setRole('admin');
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
      try {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });

        if (error) {
          await fetch('/api/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, dob: cleanPass, role: 'admin', name: 'Admin User' })
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
            department: facultyRecord.department
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
            section: studentRecord.section
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, login, logout }}>
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
