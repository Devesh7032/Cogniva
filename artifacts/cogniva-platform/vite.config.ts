import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';
import { createClient } from '@supabase/supabase-js';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '5175';
const port = Number(rawPort);
const basePath = process.env.BASE_PATH || '/';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNzY3MSwiZXhwIjoyMTA0NTAzNjcxfQ.CA8XmqBZ0R0Sc306c8uYR0NXX_Xja5YKoFs7sewMud0';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function normalizeDobToPassword(dobStr: any): string {
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
  if (digitsOnly.length >= 6) return digitsOnly;
  return clean || '01012000';
}

function supabaseAuthPlugin(): Plugin {
  return {
    name: 'supabase-auth-sync-middleware',
    configureServer(server) {
      server.middlewares.use('/api/sync-user', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const { email, dob, role, name, regno, section } = data;

            if (!email) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Email is required' }));
            }

            const cleanEmail = String(email).trim().toLowerCase();
            const normPass = normalizeDobToPassword(dob);

            const { data: { users } } = await adminClient.auth.admin.listUsers();
            let authUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);

            if (!authUser) {
              const { data: created, error } = await adminClient.auth.admin.createUser({
                email: cleanEmail,
                password: normPass,
                email_confirm: true,
                user_metadata: { role: role || 'student', full_name: name || '', regno: regno || '', section: section || '' }
              });
              if (error) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: error.message }));
              }
              authUser = created.user;
            } else {
              await adminClient.auth.admin.updateUserById(authUser.id, {
                password: normPass,
                email_confirm: true,
                user_metadata: { role: role || 'student', full_name: name || '', regno: regno || '', section: section || '' }
              });
            }

            if (authUser) {
              await adminClient.from('profiles').upsert([
                { id: authUser.id, user_id: authUser.id, email: cleanEmail, full_name: name || cleanEmail, role: role || 'student' }
              ], { onConflict: 'email' });
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, userId: authUser?.id }));
          } catch (err) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    supabaseAuthPlugin(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
