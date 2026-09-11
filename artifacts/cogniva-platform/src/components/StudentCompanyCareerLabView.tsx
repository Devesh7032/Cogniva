import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Zap,
  CheckSquare,
  ChevronRight,
  RefreshCw,
  Plus,
  Compass,
  Code,
  Lock,
  User,
  SlidersHorizontal,
  X,
  FileCheck,
  BrainCircuit,
  Info
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { getCurrentStudentContext, StudentContext } from '../lib/academic-api';
import {
  VERIFIED_COMPANIES,
  VERIFIED_COMPANY_ROLES,
  Company,
  CompanyRole,
  StudentResume,
  ResumeMatchResult,
  EligibilityEvaluation,
  evaluateRoleEligibility,
  analyzeResumeMatch,
  createCompanyGoalRoadmap,
  fetchStudentResume,
  saveStudentResume
} from '../lib/companyCareerService';

export function StudentCompanyCareerLabView() {
  const { user } = useAuth();
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [resume, setResume] = useState<StudentResume | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');

  // Selected Target Company Workspace
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeRole, setActiveRole] = useState<CompanyRole | null>(null);

  // Resume Tailoring Modal / Edit Mode State
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [resumeSkillsInput, setResumeSkillsInput] = useState('');
  const [goalCreatedToast, setGoalCreatedToast] = useState<string | null>(null);

  // Comparison Drawer State
  const [compareCompanies, setCompareCompanies] = useState<Company[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Active Tab in Workspace
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'roles' | 'resume' | 'interview' | 'roadmap'>('overview');

  useEffect(() => {
    loadStudentData();
  }, [user?.email]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const email = user?.email || 'student001@cogniva.edu';
      const [ctx, res] = await Promise.all([
        getCurrentStudentContext(email),
        fetchStudentResume(email)
      ]);
      setStudentCtx(ctx);
      setResume(res);
      setResumeSkillsInput(res.skills.join(', '));
    } catch (err) {
      console.error('Error loading student profile for Career Lab:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Companies
  const filteredCompanies = VERIFIED_COMPANIES.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.career_tracks.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTrack =
      selectedTrack === 'ALL' ||
      c.career_tracks.some(t => t.toLowerCase().includes(selectedTrack.toLowerCase()));

    return matchesSearch && matchesTrack;
  });

  const handleSelectCompany = (company: Company) => {
    setActiveCompany(company);
    const companyRoles = VERIFIED_COMPANY_ROLES.filter(r => r.company_id === company.id);
    setActiveRole(companyRoles[0] || null);
    setWorkspaceTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveResumeSkills = async () => {
    if (!resume) return;
    const updatedSkills = resumeSkillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updated = await saveStudentResume({
      ...resume,
      skills: updatedSkills
    });
    setResume(updated);
    setIsEditingResume(false);
  };

  const handleAddGoal = async (role: CompanyRole) => {
    if (!activeCompany) return;
    const email = user?.email || 'student001@cogniva.edu';
    await createCompanyGoalRoadmap(activeCompany, role, email);
    setGoalCreatedToast(`Successfully created 6-phase target roadmap for ${activeCompany.name} ${role.title}! View in your Goals center.`);
    setTimeout(() => setGoalCreatedToast(null), 5000);
  };

  const toggleCompareCompany = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareCompanies.some(c => c.id === company.id)) {
      setCompareCompanies(prev => prev.filter(c => c.id !== company.id));
    } else {
      if (compareCompanies.length >= 3) {
        alert('You can compare up to 3 target companies side-by-side.');
        return;
      }
      setCompareCompanies(prev => [...prev, company]);
    }
  };

  const allCareerTracks = Array.from(
    new Set(VERIFIED_COMPANIES.flatMap(c => c.career_tracks))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {goalCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-teal-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{goalCreatedToast}</span>
          <button onClick={() => setGoalCreatedToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Company Career Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Company Preparation Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Select your target company to unlock personalized <strong className="text-slate-800">"How to Get Hired Here"</strong> roadmaps, student eligibility evaluations, ATS resume match analysis, and interview preparation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {activeCompany && (
            <button
              onClick={() => setActiveCompany(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Compass className="w-4 h-4" />
              <span>Company Directory</span>
            </button>
          )}
          {compareCompanies.length > 0 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Compare ({compareCompanies.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TARGET COMPANY DIRECTORY GRID */}
      {!activeCompany && (
        <div className="space-y-6">
          {/* Search & Track Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search target company by name, industry, or role (e.g. Deloitte, Amazon, Software, Consulting)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Track Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold shrink-0 mr-1">
                Filter Track:
              </span>
              <button
                onClick={() => setSelectedTrack('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                  selectedTrack === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Tracks ({VERIFIED_COMPANIES.length})
              </button>
              {allCareerTracks.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTrack(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                    selectedTrack === t
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map(comp => {
              const compRoles = VERIFIED_COMPANY_ROLES.filter(r => r.company_id === comp.id);
              const isComparing = compareCompanies.some(c => c.id === comp.id);

              return (
                <div
                  key={comp.id}
                  onClick={() => handleSelectCompany(comp)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Logo / Mark */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-2 group-hover:scale-105 transition-transform shrink-0">
                        {comp.logo_url ? (
                          <img
                            src={comp.logo_url}
                            alt={comp.name}
                            className="max-h-8 max-w-full object-contain"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-serif font-bold text-slate-800 text-base">
                            {comp.logo_mark}
                          </span>
                        )}
                      </div>

                      {/* Source Verified Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={e => toggleCompareCompany(comp, e)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                            isComparing
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isComparing ? '✓ Comparing' : '+ Compare'}
                        </button>
                      </div>
                    </div>

                    {/* Company Name & Industry */}
                    <div className="mb-2">
                      <div className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                        {comp.industry}
                      </div>
                      <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {comp.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {comp.description}
                    </p>

                    {/* Career Tracks */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {comp.career_tracks.slice(0, 3).map((tr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
                        >
                          {tr}
                        </span>
                      ))}
                      {comp.career_tracks.length > 3 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-mono">
                          +{comp.career_tracks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{compRoles.length} Verified Student Roles</span>
                    </div>

                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-mono uppercase text-[10px]">
                      <span>Open Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: TARGET COMPANY WORKSPACE PAGE */}
      {activeCompany && (
        <div className="space-y-6">
          {/* Company Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Logo Mark */}
                <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-md flex items-center justify-center shrink-0">
                  {activeCompany.logo_url ? (
                    <img
                      src={activeCompany.logo_url}
                      alt={activeCompany.name}
                      className="max-h-10 max-w-full object-contain"
                    />
                  ) : (
                    <span className="font-serif font-bold text-slate-900 text-xl">
                      {activeCompany.logo_mark}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {activeCompany.industry}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Source Verified Portal</span>
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold font-serif tracking-tight">
                    {activeCompany.name} Career Lab
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    “Build your personalized path from college to your target role at {activeCompany.name}.”
                  </p>
                </div>
              </div>

              {/* Official Source Link */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <a
                  href={activeCompany.careers_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/15"
                >
                  <span>Official Careers Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                </a>

                {activeRole && (
                  <button
                    onClick={() => handleAddGoal(activeRole)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
                  >
                    <Target className="w-4 h-4" />
                    <span>Create Deloitte Goal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Career Tracks Strip */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold shrink-0">
                Supported Tracks:
              </span>
              {activeCompany.career_tracks.map((tr, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-xs font-medium shrink-0"
                >
                  {tr}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setWorkspaceTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                workspaceTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Overview & Guidance</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                workspaceTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Student Opportunities & Roles</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('resume')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                workspaceTab === 'resume'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Resume Alignment & Gap Analysis</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('interview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                workspaceTab === 'interview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Selection & Interview Prep</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & GUIDANCE */}
          {workspaceTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Sourced Overview & Process */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Company Box */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-slate-900">
                      About {activeCompany.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      Source: {activeCompany.source}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeCompany.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-800 block">Target Academic Focus</span>
                      <span className="text-slate-500 mt-0.5 block">{activeCompany.what_they_look_for.academic_focus}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-800 block">Cultural Values</span>
                      <span className="text-slate-500 mt-0.5 block">{activeCompany.what_they_look_for.cultural_values.join(' • ')}</span>
                    </div>
                  </div>
                </div>

                {/* Sourced Hiring Process Stages */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    Typical Selection Process at {activeCompany.name}
                  </h3>
                  <div className="space-y-3">
                    {activeCompany.recruitment_process.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{idx + 1}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase text-indigo-600 font-bold">
                            {st.stage}
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                            {st.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {st.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Resume Guidance (Official vs Cogniva) */}
              <div className="space-y-6">
                {/* Official Guidance Box */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs font-mono uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Official Company Guidance</span>
                  </div>
                  <p className="text-xs text-blue-950 leading-relaxed font-medium">
                    "{activeCompany.official_resume_guidance}"
                  </p>
                  <div className="text-[10px] font-mono text-blue-600 pt-2 border-t border-blue-200/60">
                    Verified from official {activeCompany.name} recruiting resources.
                  </div>
                </div>

                {/* Cogniva Recommendation Box */}
                <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs font-mono uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4 text-purple-600" />
                    <span>Cogniva AI Recommendation</span>
                  </div>
                  <p className="text-xs text-purple-950 leading-relaxed">
                    {activeCompany.cogniva_resume_recommendation}
                  </p>
                  <div className="text-[10px] font-mono text-purple-600 pt-2 border-t border-purple-200/60">
                    Analytical recommendation tailored to student profiles.
                  </div>
                </div>

                {/* What They Look For Box */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold font-serif text-slate-900 text-sm">
                    Core Technical Stack Expected
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCompany.what_they_look_for.technical_skills.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT OPPORTUNITIES & ROLES */}
          {workspaceTab === 'roles' && (
            <div className="space-y-6">
              {/* Opportunities List */}
              <div className="space-y-4">
                {VERIFIED_COMPANY_ROLES.filter(r => r.company_id === activeCompany.id).map(role => {
                  const evalResult = evaluateStudentEligibility(role, studentCtx);
                  const isSelectedRole = activeRole?.id === role.id;

                  return (
                    <div
                      key={role.id}
                      className={`bg-white rounded-2xl p-6 border transition-all shadow-sm space-y-4 ${
                        isSelectedRole
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase rounded-md">
                              {role.role_type}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                evalResult.isEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {evalResult.statusBadge}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {role.location} • {role.work_mode}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold font-serif text-slate-900">
                            {role.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                            {role.description}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setActiveRole(role);
                              setWorkspaceTab('resume');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Prepare Resume</span>
                          </button>
                          <a
                            href={role.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                          >
                            <span>Official Apply</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        </div>
                      </div>

                      {/* Eligibility Banner Box */}
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                          evalResult.isEligible
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/70 border-amber-200 text-amber-900'
                        }`}
                      >
                        {evalResult.isEligible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold">Eligibility Check:</span> {evalResult.reason}
                        </div>
                      </div>

                      {/* Required Skills Badges */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold mr-1">
                          Required Skills:
                        </span>
                        {role.required_skills.map((sk, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RESUME ALIGNMENT & GAP ANALYSIS */}
          {workspaceTab === 'resume' && activeRole && (
            <div className="space-y-6">
              {/* Role Context Bar */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                    Target Role Selected
                  </div>
                  <h2 className="text-xl font-bold font-serif mt-0.5">
                    {activeRole.title} ({activeCompany.name})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingResume(!isEditingResume)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{isEditingResume ? 'Close Editor' : 'Edit My Resume Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Resume Edit Box */}
              {isEditingResume && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4 animate-in fade-in duration-150">
                  <h3 className="text-base font-bold font-serif text-slate-900">
                    Update Resume Skills & Profile
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Technical Skills (comma separated):
                    </label>
                    <input
                      type="text"
                      value={resumeSkillsInput}
                      onChange={e => setResumeSkillsInput(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingResume(false)}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResumeSkills}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Save & Recalculate Match
                    </button>
                  </div>
                </div>
              )}

              {/* Match Scores & Radar */}
              {(() => {
                const matchRes = analyzeResumeMatch(resume, activeRole, studentCtx);

                return (
                  <div className="space-y-6">
                    {/* Scores Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Overall Match Circle Card */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-mono uppercase font-bold text-indigo-600 mb-2">
                          Overall Resume Alignment
                        </div>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-3xl font-serif shadow-md mb-2">
                          {matchRes.overallMatchScore}%
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {matchRes.overallMatchScore >= 80 ? 'Strong Match for Role' : 'Moderate Match - Gaps Identified'}
                        </span>
                      </div>

                      {/* Detailed Breakdown Card */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2 space-y-3">
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-500">
                          Deterministic Match Score Breakdown
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between font-semibold mb-1">
                              <span>Technical Skills Match</span>
                              <span>{matchRes.skillsMatchScore}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${matchRes.skillsMatchScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between font-semibold mb-1">
                              <span>Project Alignment</span>
                              <span>{matchRes.projectMatchScore}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${matchRes.projectMatchScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between font-semibold mb-1">
                              <span>Keyword ATS Coverage</span>
                              <span>{matchRes.keywordCoverageScore}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${matchRes.keywordCoverageScore}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gap Analysis: You Have vs Role Expects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
                        <h4 className="font-bold text-xs font-mono uppercase text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Matched Skills You Have</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchRes.matchedSkills.map((sk, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold">
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <h4 className="font-bold text-xs font-mono uppercase text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Priority Skill Gaps to Build</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchRes.prioritySkillGaps.map((sk, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold">
                              + {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actionable Tailoring Recommendations */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-base font-bold font-serif text-slate-900">
                        Tailoring Recommendations for {activeCompany.name}
                      </h3>
                      <div className="space-y-2">
                        {matchRes.tailoredBulletSuggestions.map((sug, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: SELECTION & INTERVIEW PREP */}
          {workspaceTab === 'interview' && activeRole && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  Interview Preparation for {activeRole.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical DSA Box */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs font-mono uppercase text-indigo-600 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-indigo-600" />
                      <span>Key DSA & Coding Topics</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                      {activeRole.interview_topics.dsa_core.map((tp, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical Core Box */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs font-mono uppercase text-indigo-600 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Technical Architecture Topics</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                      {activeRole.interview_topics.technical.map((tp, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: COMPANY COMPARISON MODAL */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-600 font-bold">
                  Side-by-Side Target Company Comparison
                </div>
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  Comparing {compareCompanies.length} Target Companies
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareCompanies.map(c => {
                  const cRoles = VERIFIED_COMPANY_ROLES.filter(r => r.company_id === c.id);
                  return (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="font-bold text-base text-slate-900 font-serif">{c.name}</div>
                      <div className="text-xs text-indigo-600 font-mono">{c.industry}</div>
                      <div className="text-xs text-slate-600">
                        <strong>Verified Student Roles:</strong> {cRoles.length}
                      </div>
                      <div className="text-xs text-slate-600">
                        <strong>Official Guidance:</strong> {c.official_resume_guidance}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
