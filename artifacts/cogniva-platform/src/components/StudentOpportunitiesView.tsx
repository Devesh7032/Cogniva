import React, { useEffect, useState, useMemo } from 'react';
import {
  ExternalLink,
  Flame,
  Globe,
  Users,
  Calendar,
  Award,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Code2,
  Star,
  Check,
  Plus,
  X,
  ChevronRight,
  Target,
  Briefcase,
  Sprout,
  ArrowUpRight,
  SlidersHorizontal,
  Info,
  Layers,
  Zap,
  Building2,
  MapPin,
  Laptop,
  Compass,
  Eye,
  DollarSign,
  GraduationCap,
  Send,
  UserCheck,
  FileCheck2,
  Sparkle
} from 'lucide-react';
import {
  fetchHackathons,
  syncHackathons,
  Hackathon,
  fetchMultiSourceInternshipsWithHealth,
  Internship,
  InternshipSource,
  CompensationType,
  ProviderHealth,
  evaluateStudentEligibility,
  fetchStudentApplicationPipeline,
  updateStudentApplicationStatus,
  StudentApplicationRecord,
  ApplicationPipelineStatus,
  getCurrentStudentContext,
  fetchStudentGoals,
  fetchSavedOpportunityIds,
  toggleSaveOpportunityId,
  StudentContext,
  Goal
} from '../lib/academic-api';
import { useAuth } from '../lib/auth-context';

type TopTab = 'HACKATHONS' | 'INTERNSHIPS';

// Hackathon Radar Categories
type HackathonRadarCategory = 'BEST_MATCH' | 'CLOSING_SOON' | 'HIGH_PRIZE' | 'AI_ML' | 'BEGINNER';
type HackathonPlatformFilter = 'ALL' | 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST';

// Internship Radar Categories
type InternshipRadarCategory = 'BEST_MATCH' | 'RECENTLY_POSTED' | 'AI_ML' | 'SOFTWARE' | 'REMOTE' | 'RESEARCH';
type InternshipCategoryFilter = 'ALL' | 'BEST_MATCH' | 'PAID' | 'REMOTE' | 'AI_ML' | 'SOFTWARE' | 'CLOUD' | 'DATA' | 'RESEARCH' | 'SAVED' | 'APPLIED';

export function StudentOpportunitiesView() {
  const { user } = useAuth();

  // Top-Level Navigation Tab
  const [activeTab, setActiveTab] = useState<TopTab>('HACKATHONS');

  // Shared Datasets & Student Context
  const [loading, setLoading] = useState(true);
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // ---------------------------------------------------------------------------
  // HACKATHON STATE & FILTERS
  // ---------------------------------------------------------------------------
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [syncingHackathons, setSyncingHackathons] = useState(false);
  const [activeHackathonRadar, setActiveHackathonRadar] = useState<HackathonRadarCategory>('BEST_MATCH');
  const [hackathonPlatformFilter, setHackathonPlatformFilter] = useState<HackathonPlatformFilter>('ALL');
  const [hackathonSearchQuery, setHackathonSearchQuery] = useState('');
  const [savedHackathonIds, setSavedHackathonIds] = useState<string[]>([]);
  const [selectedDrawerHackathon, setSelectedDrawerHackathon] = useState<Hackathon | null>(null);

  // ---------------------------------------------------------------------------
  // INTERNSHIP MULTI-SOURCE & ELIGIBILITY STATE
  // ---------------------------------------------------------------------------
  const [internships, setInternships] = useState<Internship[]>([]);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [pipelineMap, setPipelineMap] = useState<Record<string, StudentApplicationRecord>>({});
  const [eligibleOnlyToggle, setEligibleOnlyToggle] = useState<boolean>(true);
  const [internshipSourceFilter, setInternshipSourceFilter] = useState<'ALL' | InternshipSource>('ALL');
  const [activeInternshipRadar, setActiveInternshipRadar] = useState<InternshipRadarCategory>('BEST_MATCH');
  const [internshipCategoryFilter, setInternshipCategoryFilter] = useState<InternshipCategoryFilter>('ALL');
  const [internshipSearchQuery, setInternshipSearchQuery] = useState('');
  const [savedInternshipIds, setSavedInternshipIds] = useState<string[]>([]);
  const [selectedDrawerInternship, setSelectedDrawerInternship] = useState<Internship | null>(null);
  const [updatingPipelineId, setUpdatingPipelineId] = useState<string | null>(null);

  // Live Timer State (1s tick)
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAllOpportunities();
  }, [user?.email]);

  const loadAllOpportunities = async () => {
    setLoading(true);
    try {
      const email = user?.email || 'student001@cogniva.edu';

      const [hList, multiRes, ctx, gList, savedHacks, savedInts, pipeline] = await Promise.all([
        fetchHackathons(),
        fetchMultiSourceInternshipsWithHealth(),
        getCurrentStudentContext(email),
        fetchStudentGoals(email),
        fetchSavedOpportunityIds(email, 'hackathon'),
        fetchSavedOpportunityIds(email, 'internship'),
        fetchStudentApplicationPipeline(email)
      ]);

      setHackathons(hList);
      setInternships(multiRes.internships);
      setProviderHealth(multiRes.health);
      setStudentCtx(ctx);
      setGoals(gList);
      setSavedHackathonIds(savedHacks);
      setSavedInternshipIds(savedInts);
      setPipelineMap(pipeline);
    } catch (err) {
      console.error('[StudentOpportunitiesView] Error loading opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHackathons = async () => {
    setSyncingHackathons(true);
    try {
      const updated = await syncHackathons();
      setHackathons(updated);
    } catch (err) {
      console.warn('Manual sync failed:', err);
    } finally {
      setSyncingHackathons(false);
    }
  };

  const handleToggleSaveHackathon = async (id: string) => {
    const email = user?.email || 'student001@cogniva.edu';
    const updated = await toggleSaveOpportunityId(email, id, 'hackathon');
    setSavedHackathonIds(updated);
  };

  const handleToggleSaveInternship = async (id: string) => {
    const email = user?.email || 'student001@cogniva.edu';
    const updated = await toggleSaveOpportunityId(email, id, 'internship');
    setSavedInternshipIds(updated);
  };

  const handleUpdateApplicationStatus = async (internshipId: string, status: ApplicationPipelineStatus) => {
    const email = user?.email || 'student001@cogniva.edu';
    setUpdatingPipelineId(internshipId);
    try {
      const updatedMap = await updateStudentApplicationStatus(email, internshipId, status);
      setPipelineMap(updatedMap);
    } catch (err) {
      console.error('Failed to update pipeline status:', err);
    } finally {
      setUpdatingPipelineId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // HACKATHON COMPUTED METRICS
  // ---------------------------------------------------------------------------
  const hackathonsWithMatch = useMemo(() => {
    const studentSkills = ['AI', 'Python', 'React', 'Java', 'Machine Learning'];
    const dept = studentCtx?.department || studentCtx?.departmentId || 'CSE';
    const goalTitle = goals[0]?.title || '';

    return hackathons.map(h => {
      let score = 55;
      const reasons: string[] = [];

      if (h.status === 'LIVE') score += 20;
      if (h.status === 'ENDING_SOON') score += 25;
      if (h.mode === 'Online' || h.mode === 'Hybrid') {
        score += 10;
        reasons.push('✓ 100% Online & accessible mode');
      }

      const text = `${h.title} ${h.description} ${(h.categories || []).join(' ')} ${(h.skills || []).join(' ')}`.toLowerCase();
      if (text.includes(dept.toLowerCase()) || text.includes('computer') || text.includes('tech')) {
        score += 15;
        reasons.push(`✓ Directly aligns with ${dept} department curriculum`);
      }

      if (goalTitle && text.includes(goalTitle.toLowerCase())) {
        score += 15;
        reasons.push(`✓ Advances active goal: "${goalTitle}"`);
      }

      for (const sk of studentSkills) {
        if (text.includes(sk.toLowerCase())) {
          score += 5;
          if (reasons.length < 3 && !reasons.some(r => r.includes(sk))) {
            reasons.push(`✓ Leverages your ${sk} technical skills`);
          }
        }
      }

      const finalScore = Math.min(99, Math.max(60, Math.round(score)));
      return {
        hackathon: h,
        score: finalScore,
        reasons: reasons.slice(0, 3)
      };
    });
  }, [hackathons, studentCtx, goals]);

  const filteredHackathons = useMemo(() => {
    return hackathonsWithMatch.filter(({ hackathon: h }) => {
      // Platform Filter
      if (hackathonPlatformFilter === 'UNSTOP' && h.source !== 'UNSTOP') return false;
      if (hackathonPlatformFilter === 'DEVFOLIO' && h.source !== 'DEVFOLIO') return false;
      if (hackathonPlatformFilter === 'DEVPOST' && h.source !== 'DEVPOST') return false;

      // Search Query
      if (hackathonSearchQuery.trim()) {
        const q = hackathonSearchQuery.toLowerCase().trim();
        const txt = `${h.title} ${h.description} ${(h.skills || []).join(' ')} ${(h.categories || []).join(' ')}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }

      // Radar Category
      if (activeHackathonRadar === 'CLOSING_SOON') return h.status === 'ENDING_SOON';
      if (activeHackathonRadar === 'HIGH_PRIZE') {
        return (h.prize || '').toLowerCase().includes('lakh') || (h.prize || '').includes('$') || (h.prize || '').toLowerCase().includes('000');
      }
      if (activeHackathonRadar === 'AI_ML') {
        const txt = `${h.title} ${h.description} ${(h.categories || []).join(' ')}`.toLowerCase();
        return txt.includes('ai') || txt.includes('machine learning') || txt.includes('data');
      }
      if (activeHackathonRadar === 'BEGINNER') {
        const txt = `${h.title} ${h.description} ${h.eligibility || ''}`.toLowerCase();
        return txt.includes('beginner') || txt.includes('all students') || txt.includes('undergraduate');
      }

      return true;
    }).sort((a, b) => b.score - a.score);
  }, [hackathonsWithMatch, hackathonPlatformFilter, hackathonSearchQuery, activeHackathonRadar]);

  const bestMatchHackathon = useMemo(() => {
    if (hackathonsWithMatch.length === 0) return null;
    const sorted = [...hackathonsWithMatch].sort((a, b) => b.score - a.score);
    return sorted[0];
  }, [hackathonsWithMatch]);

  // ---------------------------------------------------------------------------
  // INTERNSHIP COMPUTED METRICS & ELIGIBILITY EVALUATION
  // ---------------------------------------------------------------------------
  const internshipsWithMatch = useMemo(() => {
    const studentSkills = ['Python', 'AI', 'Machine Learning', 'React', 'Java', 'SQL'];
    const dept = studentCtx?.department || studentCtx?.departmentId || 'CSE';
    const goalTitle = goals[0]?.title || '';

    return internships.map(inst => {
      let score = 60;
      const reasons: string[] = [];

      const text = `${inst.title} ${inst.description} ${inst.company_name} ${(inst.skills || []).join(' ')}`.toLowerCase();

      // Academic Eligibility Evaluation
      const eligibility = evaluateStudentEligibility(inst, studentCtx);

      if (eligibility.isEligible) {
        score += 15;
        reasons.push(`✓ ${eligibility.reason}`);
      }

      if (text.includes('ai') || text.includes('machine learning') || text.includes('python')) {
        score += 10;
        reasons.push('✓ Direct match with your AI / ML career interest');
      }

      for (const sk of studentSkills) {
        if (text.includes(sk.toLowerCase())) {
          score += 5;
          if (reasons.length < 3 && !reasons.some(r => r.includes(sk))) {
            reasons.push(`✓ Matches your ${sk} skill tag`);
          }
        }
      }

      if (inst.work_mode === 'Remote') {
        score += 10;
        reasons.push('✓ Flexible 100% Remote work mode');
      }

      if (goalTitle && text.includes(goalTitle.toLowerCase())) {
        score += 10;
        reasons.push(`✓ Supports target goal: "${goalTitle}"`);
      }

      const finalScore = Math.min(98, Math.max(65, Math.round(score)));
      return {
        internship: inst,
        score: finalScore,
        reasons: reasons.slice(0, 3),
        eligibility
      };
    });
  }, [internships, studentCtx, goals]);

  const filteredInternships = useMemo(() => {
    return internshipsWithMatch.filter(({ internship: inst, eligibility }) => {
      // 1. Hard Academic Eligibility Filter (If toggle ON)
      if (eligibleOnlyToggle && !eligibility.isEligible) {
        return false;
      }

      // 2. Source Provider Filter
      if (internshipSourceFilter !== 'ALL' && inst.source !== internshipSourceFilter) {
        return false;
      }

      // 3. Category & Pipeline Filter
      if (internshipCategoryFilter === 'SAVED') return savedInternshipIds.includes(inst.id);
      if (internshipCategoryFilter === 'APPLIED') return !!pipelineMap[inst.id];
      if (internshipCategoryFilter === 'PAID') return inst.compensation_type === 'PAID';
      if (internshipCategoryFilter === 'REMOTE') return inst.work_mode === 'Remote';
      if (internshipCategoryFilter === 'AI_ML') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('ai') || txt.includes('machine learning') || txt.includes('python');
      }
      if (internshipCategoryFilter === 'SOFTWARE') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('software') || txt.includes('java') || txt.includes('react') || txt.includes('developer');
      }
      if (internshipCategoryFilter === 'CLOUD') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('cloud') || txt.includes('aws') || txt.includes('devops');
      }
      if (internshipCategoryFilter === 'DATA') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('data') || txt.includes('sql') || txt.includes('analytics');
      }
      if (internshipCategoryFilter === 'RESEARCH') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('research') || txt.includes('lab') || txt.includes('quantum');
      }

      // 4. Search Query
      if (internshipSearchQuery.trim()) {
        const q = internshipSearchQuery.toLowerCase().trim();
        const txt = `${inst.title} ${inst.company_name} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }

      // 5. Radar Category
      if (activeInternshipRadar === 'REMOTE') return inst.work_mode === 'Remote';
      if (activeInternshipRadar === 'AI_ML') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('ai') || txt.includes('machine learning');
      }
      if (activeInternshipRadar === 'SOFTWARE') {
        const txt = `${inst.title} ${inst.description} ${(inst.skills || []).join(' ')}`.toLowerCase();
        return txt.includes('software') || txt.includes('developer');
      }

      return true;
    }).sort((a, b) => b.score - a.score);
  }, [
    internshipsWithMatch,
    eligibleOnlyToggle,
    internshipSourceFilter,
    internshipCategoryFilter,
    internshipSearchQuery,
    activeInternshipRadar,
    savedInternshipIds,
    pipelineMap
  ]);

  const bestMatchInternship = useMemo(() => {
    if (filteredInternships.length === 0) return null;
    return filteredInternships[0];
  }, [filteredInternships]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-2">
      {/* 1. HERO & TOP-LEVEL NAVIGATION TABS */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-semibold block mb-1">
            COGNIVA STUDENT HUB · CAREER OPPORTUNITIES
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Find opportunities worth your time
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
            Discover verified hackathons and official internships with multi-source feeds, real stipend intelligence, and academic year eligibility matching.
          </p>
        </div>

        {/* TOP-LEVEL OPPORTUNITY TOGGLE SWITCH */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto shrink-0 shadow-sm">
          <button
            onClick={() => setActiveTab('HACKATHONS')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'HACKATHONS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame size={16} className={activeTab === 'HACKATHONS' ? 'fill-white' : 'text-amber-500'} />
            🔥 Hackathons ({hackathons.length})
          </button>

          <button
            onClick={() => setActiveTab('INTERNSHIPS')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'INTERNSHIPS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={16} className={activeTab === 'INTERNSHIPS' ? 'fill-white' : 'text-purple-600'} />
            💼 Internships ({internships.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <RefreshCw size={32} className="mx-auto text-blue-600 animate-spin mb-3" />
          <p className="text-slate-800 font-bold text-sm">Aggregating Multi-Source Verified Feeds...</p>
          <p className="text-slate-500 text-xs mt-1">Checking Internshala, LinkedIn, Wellfound, and Official Enterprise Portals...</p>
        </div>
      ) : activeTab === 'HACKATHONS' ? (
        /* =================================================================== */
        /* TAB 1: HACKATHONS SECTION                                           */
        /* =================================================================== */
        <div className="space-y-6">
          {/* HACKATHON HEADER & CONTEXT RADAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Flame className="text-amber-500 fill-amber-500" size={20} />
                🔥 TOP HACKATHONS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified competitions aggregated live from official providers: <strong className="text-slate-700">Unstop • Devfolio • Devpost</strong>.
              </p>
            </div>

            <button
              onClick={handleSyncHackathons}
              disabled={syncingHackathons}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
            >
              <RefreshCw size={14} className={syncingHackathons ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              {syncingHackathons ? 'Syncing Feeds...' : 'Sync Hackathons'}
            </button>
          </div>

          {/* HACKATHON OPPORTUNITY RADAR TABS */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            {([
              { key: 'BEST_MATCH', label: '🔥 Best Match' },
              { key: 'CLOSING_SOON', label: '⏰ Closing Soon' },
              { key: 'HIGH_PRIZE', label: '🏆 High Prize' },
              { key: 'AI_ML', label: '🤖 AI / ML' },
              { key: 'BEGINNER', label: '🌱 Beginner' }
            ] as const).map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveHackathonRadar(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeHackathonRadar === cat.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* HACKATHON BEST MATCH FEATURED CARD */}
          {bestMatchHackathon && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
                      🏆 BEST HACKATHON MATCH ({bestMatchHackathon.score}% MATCH)
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono border border-blue-200 font-bold">
                      {bestMatchHackathon.hackathon.source}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {bestMatchHackathon.hackathon.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                    {bestMatchHackathon.hackathon.description}
                  </p>

                  {/* Reasons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {bestMatchHackathon.reasons.map((r, i) => (
                      <span key={i} className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shrink-0 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prize Pool:</span>
                    <span className="text-amber-800 font-bold">{bestMatchHackathon.hackathon.prize || 'Certificates & Swag'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="text-slate-800 font-medium">{bestMatchHackathon.hackathon.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Team Size:</span>
                    <span className="text-slate-800 font-medium">{bestMatchHackathon.hackathon.team_size || '1 - 4 members'}</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={bestMatchHackathon.hackathon.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      View Official Hackathon
                      <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={() => handleToggleSaveHackathon(bestMatchHackathon.hackathon.id)}
                      className={`w-full py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 border cursor-pointer ${
                        savedHackathonIds.includes(bestMatchHackathon.hackathon.id)
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Star size={13} className={savedHackathonIds.includes(bestMatchHackathon.hackathon.id) ? 'fill-amber-500 text-amber-500' : ''} />
                      {savedHackathonIds.includes(bestMatchHackathon.hackathon.id) ? 'Saved' : '☆ Save Opportunity'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HACKATHONS GRID & FILTERS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              {/* Platform Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'UNSTOP', 'DEVFOLIO', 'DEVPOST'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setHackathonPlatformFilter(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      hackathonPlatformFilter === p ? 'bg-white text-blue-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={hackathonSearchQuery}
                  onChange={e => setHackathonSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHackathons.map(({ hackathon: h, score }) => {
                const isSaved = savedHackathonIds.includes(h.id);
                return (
                  <div key={h.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200 font-bold">
                          {h.source}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {score}% Match
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                        {h.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-600 pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-medium">{h.mode}</span>
                        {h.prize && <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold">{h.prize}</span>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDrawerHackathon(h)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={13} className="text-blue-600" />
                        Details
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSaveHackathon(h.id)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            isSaved ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Star size={14} className={isSaved ? 'fill-amber-500 text-amber-500' : ''} />
                        </button>

                        <a
                          href={h.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                        >
                          Official
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* TAB 2: MULTI-SOURCE INTERNSHIPS SECTION                             */
        /* =================================================================== */
        <div className="space-y-6">
          {/* PROVIDER AVAILABILITY & HEALTH PANEL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={16} className="text-purple-600" />
                  MULTI-SOURCE INTERNSHIP SYSTEM · PROVIDER HEALTH PANEL
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of connected career platforms. Fail-soft architecture ensures zero deadlocks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-mono font-bold">
                  {internships.length} Active Listings Verified
                </span>
              </div>
            </div>

            {/* Provider Status Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {providerHealth.map(ph => {
                const isAvailable = ph.status === 'AVAILABLE';
                const isInitializing = ph.status === 'INITIALIZING';
                return (
                  <div
                    key={ph.source}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {ph.source === 'INTERNSHALA' ? 'Internshala' : ph.source === 'LINKEDIN' ? 'LinkedIn' : ph.source === 'WELLFOUND' ? 'Wellfound' : 'Official Portals'}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvailable ? 'bg-emerald-500 animate-pulse' : isInitializing ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {isAvailable ? `${ph.activeCount} active` : ph.status}
                      </span>
                      <span
                        className={`font-bold text-[10px] uppercase ${
                          isAvailable ? 'text-emerald-700' : isInitializing ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {ph.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACADEMIC ELIGIBILITY & SOURCE FILTERS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Academic Eligibility Banner & Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-purple-600">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Academic Year Eligibility Engine
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                      Current: 2nd Year (B.Tech CSE)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Filter out final-year-only or graduate-only opportunities automatically.
                  </p>
                </div>

                <button
                  onClick={() => setEligibleOnlyToggle(!eligibleOnlyToggle)}
                  className={`ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    eligibleOnlyToggle
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck size={14} />
                  {eligibleOnlyToggle ? 'Eligible For Me: ON' : 'Eligible For Me: OFF'}
                </button>
              </div>

              {/* Source Provider Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto self-start lg:self-auto">
                {(['ALL', 'INTERNSHALA', 'LINKEDIN', 'WELLFOUND', 'OFFICIAL_CAREER_PORTAL'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setInternshipSourceFilter(src)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      internshipSourceFilter === src
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {src === 'ALL' ? 'All Sources' : src === 'INTERNSHALA' ? 'Internshala' : src === 'LINKEDIN' ? 'LinkedIn' : src === 'WELLFOUND' ? 'Wellfound' : 'Official Portals'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {([
                  { key: 'ALL', label: 'All Categories' },
                  { key: 'PAID', label: '🟢 Paid Stipend' },
                  { key: 'REMOTE', label: '🏠 Remote' },
                  { key: 'AI_ML', label: '🤖 AI / ML' },
                  { key: 'SOFTWARE', label: '💻 Software' },
                  { key: 'SAVED', label: `⭐ Saved (${savedInternshipIds.length})` },
                  { key: 'APPLIED', label: `⚡ Applied Pipeline (${Object.keys(pipelineMap).length})` }
                ] as const).map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setInternshipCategoryFilter(cat.key)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      internshipCategoryFilter === cat.key ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, skills, company..."
                  value={internshipSearchQuery}
                  onChange={e => setInternshipSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* BEST MATCH INTERNSHIP FEATURED CARD */}
          {bestMatchInternship && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-purple-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold">
                      STRONG MATCH ({bestMatchInternship.score}% MATCH)
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono border border-blue-200 font-bold">
                      {bestMatchInternship.internship.source}
                    </span>
                    {/* Compensation Badge */}
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-mono border border-emerald-200 font-bold">
                      {bestMatchInternship.internship.stipend_text || 'PAID STIPEND'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 font-bold text-lg">
                      {bestMatchInternship.internship.company_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {bestMatchInternship.internship.title}
                      </h3>
                      <p className="text-sm font-semibold text-purple-700">
                        {bestMatchInternship.internship.company_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                    {bestMatchInternship.internship.description}
                  </p>

                  {/* Reasons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {bestMatchInternship.reasons.map((r, i) => (
                      <span key={i} className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shrink-0 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stipend:</span>
                    <span className="text-emerald-700 font-bold">{bestMatchInternship.internship.stipend_text || 'Stipend Provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-800 font-medium">{bestMatchInternship.internship.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Work Mode:</span>
                    <span className="text-blue-700 font-bold">{bestMatchInternship.internship.work_mode}</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={bestMatchInternship.internship.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Apply on {bestMatchInternship.internship.source === 'INTERNSHALA' ? 'Internshala' : bestMatchInternship.internship.source === 'LINKEDIN' ? 'LinkedIn' : bestMatchInternship.internship.source === 'WELLFOUND' ? 'Wellfound' : 'Official Portal'}
                      <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={() => handleToggleSaveInternship(bestMatchInternship.internship.id)}
                      className={`w-full py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 border cursor-pointer ${
                        savedInternshipIds.includes(bestMatchInternship.internship.id)
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Star size={13} className={savedInternshipIds.includes(bestMatchInternship.internship.id) ? 'fill-amber-500 text-amber-500' : ''} />
                      {savedInternshipIds.includes(bestMatchInternship.internship.id) ? 'Saved' : '☆ Save Opportunity'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INTERNSHIPS GRID */}
          {filteredInternships.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-500">
              <Briefcase size={36} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-800">No verified internships match your current filters.</p>
              <p className="text-xs text-slate-500 mt-1">Try toggling "Eligible For Me: OFF" or clearing search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInternships.map(({ internship: inst, score, eligibility }) => {
                const isSaved = savedInternshipIds.includes(inst.id);
                const pipeline = pipelineMap[inst.id];

                return (
                  <div key={inst.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between group">
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200 font-bold">
                          {inst.source}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {pipeline && (
                            <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <FileCheck2 size={11} />
                              {pipeline.status}
                            </span>
                          )}

                          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {score}% Match
                          </span>
                        </div>
                      </div>

                      {/* Title & Company */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                          {inst.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors truncate">
                            {inst.title}
                          </h4>
                          <p className="text-xs text-purple-700 truncate font-semibold">{inst.company_name}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {inst.description}
                      </p>

                      {/* Stipend & Work Mode Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono pt-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                          <DollarSign size={10} />
                          {inst.stipend_text || 'Paid Stipend'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-blue-700 font-medium">{inst.work_mode}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">{inst.location || 'Remote'}</span>
                      </div>

                      {/* Eligibility Status Pill */}
                      <div className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        eligibility.isEligible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <GraduationCap size={12} className={eligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'} />
                        <span className="truncate">{eligibility.reason}</span>
                      </div>
                    </div>

                    {/* Footer Actions & Pipeline Control */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDrawerInternship(inst)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye size={13} className="text-purple-600" />
                          Details
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSaveInternship(inst.id)}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isSaved ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Star size={14} className={isSaved ? 'fill-amber-500 text-amber-500' : ''} />
                          </button>

                          <a
                            href={inst.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                          >
                            Official
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {/* Pipeline Fast-Selector */}
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-mono">Status:</span>
                        <div className="flex items-center gap-1">
                          {(['Applied', 'Interview', 'Offer'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => handleUpdateApplicationStatus(inst.id, st)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                pipeline?.status === st
                                  ? 'bg-purple-600 text-white'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* HACKATHON IN-PAGE DETAIL DRAWER                                             */}
      {/* --------------------------------------------------------------------------- */}
      {selectedDrawerHackathon && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDrawerHackathon(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">Verified Hackathon Detail</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedDrawerHackathon.title}</h3>
              </div>
              <button onClick={() => setSelectedDrawerHackathon(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed whitespace-pre-line text-slate-600">{selectedDrawerHackathon.description}</p>
              
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <div>Source: <strong className="text-slate-900">{selectedDrawerHackathon.source}</strong></div>
                <div>Mode: <strong className="text-slate-900">{selectedDrawerHackathon.mode}</strong></div>
                <div>Prize: <strong className="text-amber-800 font-bold">{selectedDrawerHackathon.prize || 'Swag & Certificates'}</strong></div>
                <div>Team Size: <strong className="text-slate-900">{selectedDrawerHackathon.team_size || '1-4'}</strong></div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <strong className="text-xs text-blue-900 font-bold uppercase font-mono flex items-center gap-1.5">
                  <Briefcase size={14} className="text-blue-600" />
                  CAREER CONNECTION
                </strong>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Participating in this hackathon builds portfolio evidence for software engineering and AI internship roles.
                </p>
                <button
                  onClick={() => {
                    setSelectedDrawerHackathon(null);
                    setActiveTab('INTERNSHIPS');
                  }}
                  className="mt-1 text-xs text-blue-700 hover:text-blue-900 underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Explore matching internships →
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleToggleSaveHackathon(selectedDrawerHackathon.id)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Star size={13} className={savedHackathonIds.includes(selectedDrawerHackathon.id) ? 'fill-amber-500 text-amber-500' : ''} />
                {savedHackathonIds.includes(selectedDrawerHackathon.id) ? 'Saved' : 'Save'}
              </button>

              <a
                href={selectedDrawerHackathon.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                View Official Hackathon
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* INTERNSHIP IN-PAGE DETAIL DRAWER                                            */}
      {/* --------------------------------------------------------------------------- */}
      {selectedDrawerInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDrawerInternship(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-purple-700 uppercase">Multi-Source Official Internship Detail</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedDrawerInternship.title}</h3>
                <p className="text-xs text-purple-700 font-semibold">{selectedDrawerInternship.company_name}</p>
              </div>
              <button onClick={() => setSelectedDrawerInternship(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed whitespace-pre-line text-slate-600">{selectedDrawerInternship.description}</p>
              
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <div>Source: <strong className="text-slate-900">{selectedDrawerInternship.source}</strong></div>
                <div>Stipend: <strong className="text-emerald-700 font-bold">{selectedDrawerInternship.stipend_text || 'Provided'}</strong></div>
                <div>Work Mode: <strong className="text-blue-700">{selectedDrawerInternship.work_mode}</strong></div>
                <div>Location: <strong className="text-slate-900">{selectedDrawerInternship.location}</strong></div>
              </div>

              {/* Academic Eligibility Breakdown */}
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <strong className="text-xs text-purple-900 font-bold uppercase font-mono flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-purple-600" />
                  WHY YOU'RE ELIGIBLE
                </strong>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {selectedDrawerInternship.eligibility || 'Open to computer science and engineering undergraduates in 2nd, 3rd, and 4th year programs.'}
                </p>
              </div>

              {/* Application Pipeline Controls in Drawer */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 font-mono block">Track Application Pipeline</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer'] as const).map(st => {
                    const currentStatus = pipelineMap[selectedDrawerInternship.id]?.status;
                    const isActive = currentStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateApplicationStatus(selectedDrawerInternship.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleToggleSaveInternship(selectedDrawerInternship.id)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Star size={13} className={savedInternshipIds.includes(selectedDrawerInternship.id) ? 'fill-amber-500 text-amber-500' : ''} />
                {savedInternshipIds.includes(selectedDrawerInternship.id) ? 'Saved' : 'Save'}
              </button>

              <a
                href={selectedDrawerInternship.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                View Official Listing
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
