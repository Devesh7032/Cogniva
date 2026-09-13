# Cogniva Platform — Teammate Setup & Onboarding Guide

Welcome to the **Cogniva Student Intelligence Platform** team codebase! Follow this guide to set up your local development environment securely.

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher (`node -v`)
- **pnpm**: `v10.x` or higher (`npm install -g pnpm@10.5.2`)
- **Git**: (`git --version`)

---

## 2. Step-by-Step Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Devesh7032/Cogniva.git
cd Cogniva
```

### Step 2: Install Workspace Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env` inside `artifacts/cogniva-platform`:
   ```bash
   cp .env.example artifacts/cogniva-platform/.env
   ```
2. Open `artifacts/cogniva-platform/.env` and replace the placeholder values with your personal or team development credentials:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Public Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Server-only)* Your Supabase Service Role Key
   - `GEMINI_ADMIN_API_KEY`: Your Google Gemini API Key for Admin AI Desk
   - `GEMINI_FACULTY_API_KEY`: Your Google Gemini API Key for Faculty AI Desk
   - `GEMINI_STUDENT_API_KEY`: Your Google Gemini API Key for Student AI Desk

> ⚠️ **SECURITY WARNING**: Never commit your `.env` or `.env.local` files to Git. The `.gitignore` file is configured to exclude all `.env` files automatically.

---

## 3. Launching Development Servers

Start the local development server:
```bash
pnpm --filter @workspace/cogniva-platform run dev
```

Open your browser at `http://localhost:5175`.

---

## 4. Environment & Integration Verification Checklist

After launching the application, verify that your integrations are operating cleanly:

1. **Verify Supabase Connection**:
   - Navigate to the Login screen.
   - Click **"Continue as Guest"** or attempt signing in with demo credentials.
   - Verify that data loads cleanly without database connection warnings.

2. **Verify Gemini AI Services**:
   - Log in as **Admin** (`admin1@cogniva.edu` / `01012000`) and test **Admin Ask Cogniva** (`/api/ai/admin`).
   - Log in as **Faculty** (`faculty1@cogniva.edu` / `01012000`) and test **Faculty Intelligence** (`/api/ai/faculty`).
   - Log in as **Student** (`student001@cogniva.edu` / `01012000`) and test **Ask Cogniva Student Assistant** (`/api/ai/student`).

---

## 5. Team Security & Credential Management

- Obtain API keys directly from your team lead or via your personal **Supabase Dashboard** and **Google AI Studio**.
- **NEVER** share real secret keys over GitHub issues, public chat channels, commit messages, or screenshots.
- If any secret key is accidentally exposed, immediately rotate/revoke the key in the provider's management console.
