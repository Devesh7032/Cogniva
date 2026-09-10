import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type UserRole = 'admin' | 'faculty' | 'student' | null;

export function normalizeDobToPassword(dobStr: string): string {
  if (!dobStr) return '01012000';
  const clean = String(dobStr).trim();

  // Case 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (e.g. 2000-05-09 -> 09052000)
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yyyy}`;
  }

  // Case 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (e.g. 09/05/2000 -> 09052000)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}${mm}${yyyy}`;
  }

  // Case 3: Excel serial date number (e.g. 36655 -> 09/05/2000)
  if (!isNaN(Number(clean)) && Number(clean) > 20000 && Number(clean) < 60000) {
    const excelDate = new Date((Number(clean) - (25567 + 2)) * 86400 * 1000);
    const dd = String(excelDate.getUTCDate()).padStart(2, '0');
    const mm = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = String(excelDate.getUTCFullYear());
    return `${dd}${mm}${yyyy}`;
  }

  // Case 4: Digits only (e.g. 09052000)
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return clean || '01012000';
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
      // Ignore table query error if profiles table is not created yet
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

    // 4. Check student_members table
    try {
      const { data: stud } = await supabase
        .from('student_members')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (stud) {
        setRole('student');
        setLoading(false);
        return 'student';
      }
    } catch {
      // ignore
    }

    // 5. Check faculty_members table
    try {
      const { data: fac } = await supabase
        .from('faculty_members')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (fac) {
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

    const normPass = normalizeDobToPassword(cleanPass);

    try {
      // First attempt with exact entered password
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      // If initial attempt failed, retry with normalized DOB password (e.g. 09052000)
      if (error && cleanPass !== normPass) {
        const retryRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: normPass,
        });
        if (!retryRes.error) {
          data = retryRes.data;
          error = null;
        }
      }

      if (error) {
        console.error('[Supabase Auth Error]:', error);
        const errMsg = error.message || '';
        const errStatus = (error as { status?: number }).status;

        if (errMsg.includes('Invalid API key') || errStatus === 401) {
          return {
            success: false,
            error: 'Supabase API key is invalid or expired. Please check your Supabase project settings -> API -> anon key.'
          };
        }

        if (errMsg.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Email is not confirmed in Supabase Auth. Please confirm email in Supabase settings.'
          };
        }

        if (errMsg.includes('Invalid login credentials')) {
          // Development-safe diagnostic error (Requirement 10)
          return {
            success: false,
            error: `Invalid password or Date of Birth for '${cleanEmail}'. Please use your DOB in DDMMYYYY format (e.g. 09052000).`
          };
        }

        return {
          success: false,
          error: error.message || 'Authentication error. Please check your credentials.'
        };
      }

      if (!data?.session || !data?.user) {
        return {
          success: false,
          error: `No authenticated session returned for '${cleanEmail}'.`
        };
      }

      setSession(data.session);
      setUser(data.user);

      // Determine user role
      const userRole = await fetchRoleAndSetUser(data.user);

      if (!userRole) {
        return {
          success: false,
          error: 'Faculty profile missing. No application role is assigned to this account.'
        };
      }

      return { success: true, role: userRole };
    } catch (err) {
      console.error('[Auth Runtime Exception]:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected authentication error occurred.'
      };
    }
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
