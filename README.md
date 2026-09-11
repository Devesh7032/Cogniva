# Cogniva — University Academic Intelligence Platform

Cogniva is an enterprise university SaaS platform built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase**, and **Google Gemini AI**.

---

## 🚀 Quick Start — Clone & Run Guide

When cloning this repository for development or testing, follow these steps to set up the database and run Cogniva locally.

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Devesh7032/Cogniva.git
cd Cogniva
npm install
```

### 2. Configure Environment Variables

Create `.env` inside `artifacts/cogniva-platform/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional Gemini AI Keys (per role)
GEMINI_ADMIN_API_KEY=your_admin_gemini_key
GEMINI_FACULTY_API_KEY=your_faculty_gemini_key
GEMINI_STUDENT_API_KEY=your_student_gemini_key
```

> **Note**: A template is provided in `artifacts/cogniva-platform/.env.example`.

### 3. Database Schema Setup & Seed Data

Choose one of the two options to provision your Supabase backend:

#### **Option A: Single SQL Script (Recommended)**
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Open the file [`supabase/full_schema.sql`](./supabase/full_schema.sql).
3. Copy and execute the contents in the SQL Editor.
4. Run the seed script:
   ```bash
   npm run db:setup
   ```

#### **Option B: Migration Files**
1. Apply the migration SQL files in order from [`supabase/migrations/`](./supabase/migrations/):
   - `001_profiles.sql`
   - `002_academic_structure.sql`
   - `003_faculty_and_students.sql`
   - `004_subjects_and_timetable.sql`
   - `005_attendance_and_grades.sql`
   - `006_communications_and_materials.sql`
   - `007_storage_and_rls.sql`
2. Run the seed script:
   ```bash
   npm run db:setup
   ```

---

## 🔑 Login Credentials

The seed script creates the following pre-provisioned demo accounts:

### **Administrator Accounts**
- **Email**: `cdc@gmail.com` | **Password**: `cdc123`
- **Email**: `hod@gmail.com` | **Password**: `hod123`

### **Faculty Account**
- **Email**: `anjali.menon@example.edu` | **Password**: `faculty123password`

### **Student Accounts (2nd Year CSE, Section CSE-C)**
- **Email**: `student001@cogniva.edu` | **Password**: `10052004` (DOB 10/05/2004)
- **Email**: `student002@cogniva.edu` | **Password**: `10052004`
- ... up to `student020@cogniva.edu`

---

## 🛠️ Launch Application

Start the local development server:

```bash
cd artifacts/cogniva-platform
npm run dev
```

Open your browser at **`http://localhost:5175/`**.

---

## 🔒 Security & Data Architecture

- **Supabase Persistence First**: All notices, assignments, study materials, attendance, grades, and CGPA records write to Supabase tables first before local caching.
- **Role-Based Row Level Security (RLS)**: Policies isolate section and role access across Admin, Faculty, and Student accounts.
- **Zero API Key Leakage**: Gemini API keys stay server-side inside `process.env`.
