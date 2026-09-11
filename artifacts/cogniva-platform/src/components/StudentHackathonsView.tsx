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
  Zap
} from 'lucide-react';
import { 
  fetchHackathons, 
  syncHackathons, 
  Hackathon, 
  getCurrentStudentContext, 
  fetchStudentGoals, 
  StudentContext, 
  Goal 
} from '../lib/academic-api';
import { useAuth } from '../lib/auth-context';

type RadarCategory = 'BEST_MATCH' | 'CLOSING_SOON' | 'HIGH_PRIZE' | 'AI_ML' | 'CAREER' | 'BEGINNER';
type PlatformFilter = 'ALL' | 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST';

interface MatchCalculation {
  score: number;
  reasons: string[];
}

export function StudentHackathonsView() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Student Context & Goals
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Filtering & Interaction States
  const [activeRadar, setActiveRadar] = useState<RadarCategory>('BEST_MATCH');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Saved / Shortlisted Hackathon IDs
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Detail Drawer State
  const [selectedDrawerHackathon, setSelectedDrawerHackathon] = useState<Hackathon | null>(null);

  // Comparison State (Max 3)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Live Timer State (Tick every second)
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    try {
      const email = user?.email || 'student001@cogniva.edu';
      const [hList, ctx, gList] = await Promise.all([
        fetchHackathons(),
        getCurrentStudentContext(email),
        fetchStudentGoals(email)
      ]);

      setHackathons(hList);
      setStudentCtx(ctx);
      setGoals(gList);

      if (hList.length > 0 && hList[0].last_synced_at) {
        setLastSynced(new Date(hList[0].last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }

      // Load saved IDs from localStorage
      const savedRaw = localStorage.getItem(`cogniva_saved_hackathons_${email.toLowerCase()}`);
      if (savedRaw) {
        setSavedIds(JSON.parse(savedRaw));
      }
    } catch (err) {
      console.error('Failed to load verified hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const freshData = await syncHackathons();
      setHackathons(freshData);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Save / Shortlist
  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanEmail = (user?.email || 'student001@cogniva.edu').toLowerCase();
    setSavedIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem(`cogniva_saved_hackathons_${cleanEmail}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle Compare Selection
  const toggleCompare = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], id]; // Slide window
      }
      return [...prev, id];
    });
  };

  // Deterministic Match Calculation Engine
  const calculateMatch = (hackathon: Hackathon): MatchCalculation => {
    let score = 75;
    const reasons: string[] = [];
    const combinedText = (hackathon.title + ' ' + (hackathon.categories || []).join(' ') + ' ' + (hackathon.skills || []).join(' ')).toLowerCase();
    const dept = (studentCtx?.department || 'CSE').toLowerCase();

    if (combinedText.includes('ai') || combinedText.includes('ml') || combinedText.includes('python') || combinedText.includes('data')) {
      score += 10;
      reasons.push(`Direct alignment with your ${studentCtx?.department || 'CSE'} AI/ML curriculum`);
    } else if (combinedText.includes('web') || combinedText.includes('cloud') || combinedText.includes('code')) {
      score += 6;
      reasons.push(`Matches core ${studentCtx?.department || 'CSE'} software development skills`);
    }

    const activeGoal = goals.length > 0 ? goals[0] : null;
    if (activeGoal) {
      const gTitle = activeGoal.title.toLowerCase();
      if (gTitle.includes('ml') || gTitle.includes('research') || gTitle.includes('internship') || gTitle.includes('ai')) {
        if (combinedText.includes('ai') || combinedText.includes('ml') || combinedText.includes('neural') || combinedText.includes('deep')) {
          score += 9;
          reasons.push(`Directly advances your goal: "${activeGoal.title}"`);
        }
      }
    }

    if (hackathon.mode === 'Online') {
      score += 4;
      reasons.push('100% Online mode — easy to balance with semester timetable');
    }

    reasons.push(`Verified official listing from ${hackathon.source}`);
    const finalScore = Math.min(98, Math.max(76, score));

    return {
      score: finalScore,
      reasons: reasons.slice(0, 3)
    };
  };

  // Helper for live countdown
  const getRemainingTime = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const dTime = new Date(deadlineStr).getTime();
    if (isNaN(dTime)) return null;
    
    const diff = dTime - nowTime;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h ${mins}m ${secs}s remaining`;
  };

  // Filtered & Sorted Opportunities
  const processedHackathons = useMemo(() => {
    return hackathons
      .map(h => ({
        ...h,
        matchData: calculateMatch(h),
        remainingText: getRemainingTime(h.registration_deadline)
      }))
      .filter(h => {
        // Platform Filter
        if (selectedPlatform !== 'ALL' && h.source !== selectedPlatform) return false;

        // Saved Filter
        if (showSavedOnly && !savedIds.includes(h.id)) return false;

        // Radar Filter
        if (activeRadar === 'CLOSING_SOON' && h.status !== 'ENDING_SOON' && !h.remainingText?.includes('h ')) return false;
        if (activeRadar === 'HIGH_PRIZE' && (!h.prize || h.prize === 'N/A')) return false;
        if (activeRadar === 'AI_ML') {
          const t = (h.title + ' ' + (h.categories || []).join(' ') + ' ' + (h.skills || []).join(' ')).toLowerCase();
          if (!t.includes('ai') && !t.includes('ml') && !t.includes('data') && !t.includes('neural') && !t.includes('learning')) return false;
        }
        if (activeRadar === 'CAREER' && h.matchData.score < 85) return false;
        if (activeRadar === 'BEGINNER') {
          const t = (h.title + ' ' + h.description + ' ' + (h.eligibility || '')).toLowerCase();
          if (t.includes('expert') || t.includes('senior')) return false;
        }

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = h.title.toLowerCase().includes(q);
          const matchDesc = h.description.toLowerCase().includes(q);
          const matchSkills = (h.skills || []).some(s => s.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchSkills) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (activeRadar === 'CLOSING_SOON') {
          const tA = new Date(a.registration_deadline || '2099').getTime();
          const tB = new Date(b.registration_deadline || '2099').getTime();
          return tA - tB;
        }
        if (activeRadar === 'HIGH_PRIZE') {
          return (b.prize ? 1 : 0) - (a.prize ? 1 : 0);
        }
        return b.matchData.score - a.matchData.score;
      });
  }, [hackathons, selectedPlatform, showSavedOnly, activeRadar, searchQuery, savedIds, goals, studentCtx, nowTime]);

  // #1 Featured Best Match Hackathon
  const bestMatchHackathon = useMemo(() => {
    if (processedHackathons.length === 0) return null;
    return processedHackathons[0];
  }, [processedHackathons]);

  // Closing Soon Hackathons List
  const closingSoonList = useMemo(() => {
    return hackathons
      .map(h => ({ ...h, remainingText: getRemainingTime(h.registration_deadline) }))
      .filter(h => h.registration_deadline && (h.status === 'ENDING_SOON' || h.remainingText?.includes('d') || h.remainingText?.includes('h')))
      .slice(0, 3);
  }, [hackathons, nowTime]);

  // Selected Compare Hackathons
  const compareHackathonsList = useMemo(() => {
    return compareIds.map(id => {
      const found = hackathons.find(h => h.id === id);
      if (!found) return null;
      return {
        ...found,
        matchData: calculateMatch(found),
        remainingText: getRemainingTime(found.registration_deadline)
      };
    }).filter(Boolean) as (Hackathon & { matchData: MatchCalculation; remainingText: string | null })[];
  }, [compareIds, hackathons]);

  const getSourceBadge = (source: 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST') => {
    switch (source) {
      case 'DEVFOLIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1"><Sparkles size={11} /> Devfolio</span>;
      case 'UNSTOP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Flame size={11} /> Unstop</span>;
      case 'DEVPOST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1"><Globe size={11} /> Devpost</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ------------------------------------------------------------------------ */}
      {/* PART 1: HERO BANNER & REAL TIME COUNTER                                 */}
      {/* ------------------------------------------------------------------------ */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/25">
                Cogniva Opportunity Radar
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-mono">Real External Feeds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Don't browse hundreds of hackathons. <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Find the ones worth your time.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Cogniva analyzes verified opportunities from Unstop, Devfolio, and Devpost against your skills, goals, and academic profile.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-card/80 border border-border px-4 py-2.5 rounded-xl text-center shadow-inner">
              <span className="text-2xl font-black text-teal-400 font-mono">{hackathons.length}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono block">Verified Opportunities</span>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="button button-secondary text-xs flex items-center gap-2 py-2.5 px-4 cursor-pointer"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin text-teal-400' : ''} />
              {syncing ? 'Verifying Feeds…' : 'Refresh Feeds'}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* PART 2: OPPORTUNITY RADAR INTERACTIVE NAVIGATION (MAIN VISUAL TWIST)     */}
      {/* ------------------------------------------------------------------------ */}
      <div className="panel p-6 bg-card/60 border border-border space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Zap size={14} className="text-teal-400" />
              <span>Interactive Filter Node</span>
            </div>
            <h2 className="text-base font-bold text-foreground">Cogniva Opportunity Radar</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">Select a radar dimension to re-rank opportunities</span>
        </div>

        {/* Radar Nodes Selection Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'BEST_MATCH', label: 'Best Match', icon: Flame, color: 'border-teal-500/60 bg-teal-500/10 text-teal-300' },
            { id: 'CLOSING_SOON', label: 'Closing Soon', icon: Clock, color: 'border-amber-500/60 bg-amber-500/10 text-amber-300' },
            { id: 'HIGH_PRIZE', label: 'High Prize', icon: Award, color: 'border-yellow-500/60 bg-yellow-500/10 text-yellow-300' },
            { id: 'AI_ML', label: 'AI / ML', icon: Sparkles, color: 'border-purple-500/60 bg-purple-500/10 text-purple-300' },
            { id: 'CAREER', label: 'Career Boost', icon: Briefcase, color: 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300' },
            { id: 'BEGINNER', label: 'Beginner Friendly', icon: Sprout, color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300' },
          ].map((node) => {
            const Icon = node.icon;
            const isActive = activeRadar === node.id;
            return (
              <button
                key={node.id}
                onClick={() => { setActiveRadar(node.id as RadarCategory); setShowSavedOnly(false); }}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                  isActive 
                    ? `${node.color} shadow-lg ring-1 ring-teal-500/30 scale-102` 
                    : 'bg-card/40 border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon size={16} className={isActive ? '' : 'text-muted-foreground'} />
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />}
                </div>
                <span className="text-xs font-semibold block">{node.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* PART 3: FEATURED "BEST MATCH FOR YOU" HERO CARD                          */}
      {/* ------------------------------------------------------------------------ */}
      {bestMatchHackathon && !showSavedOnly && (
        <div className="panel p-6 sm:p-8 bg-gradient-to-br from-card via-card to-indigo-950/20 border border-teal-500/30 rounded-2xl relative overflow-hidden shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" /> #1 BEST MATCH FOR YOU
              </span>
              {getSourceBadge(bestMatchHackathon.source)}
            </div>

            {/* Match Score Badge */}
            <div className="bg-teal-500/15 border border-teal-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-xl font-black text-teal-300 font-mono">{bestMatchHackathon.matchData.score}%</span>
              <span className="text-[10px] uppercase font-mono text-teal-400 font-semibold leading-tight">
                Match <br /> Score
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Real Event Image */}
            <div className="lg:col-span-5 h-48 lg:h-56 rounded-xl overflow-hidden border border-border bg-muted/40 relative">
              {bestMatchHackathon.image_url ? (
                <img src={bestMatchHackathon.image_url} alt={bestMatchHackathon.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-slate-900">
                  <Code2 size={32} className="text-teal-400" />
                  <span className="text-xs font-mono">{bestMatchHackathon.source} Verified Event</span>
                </div>
              )}
            </div>

            {/* Content & Intelligence */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground leading-snug hover:text-teal-300 transition-colors">
                  {bestMatchHackathon.title}
                </h2>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                  {bestMatchHackathon.description}
                </p>
              </div>

              {/* Why Cogniva Recommends This */}
              <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                  <Sparkles size={12} /> Why Cogniva Recommends This
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {bestMatchHackathon.matchData.reasons.map((reason, idx) => (
                    <div key={idx} className="text-xs text-foreground/90 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
                      <span className="truncate">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline & Quick Specs */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/60 pt-3 font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Clock size={14} /> {bestMatchHackathon.remainingText || 'Active Registration'}
                  </span>
                  <span>•</span>
                  <span>Mode: <strong className="text-foreground">{bestMatchHackathon.mode}</strong></span>
                </div>
                {bestMatchHackathon.prize && (
                  <span className="text-yellow-300 font-bold flex items-center gap-1">
                    <Award size={14} /> {bestMatchHackathon.prize}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={bestMatchHackathon.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary text-xs font-semibold py-2.5 px-4 cursor-pointer"
                >
                  View Official Hackathon <ExternalLink size={14} />
                </a>
                <button
                  onClick={(e) => toggleSave(bestMatchHackathon.id, e)}
                  className={`button text-xs py-2.5 px-4 cursor-pointer ${
                    savedIds.includes(bestMatchHackathon.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'button-secondary'
                  }`}
                >
                  <Star size={14} className={savedIds.includes(bestMatchHackathon.id) ? 'fill-amber-400 text-amber-400' : ''} />
                  {savedIds.includes(bestMatchHackathon.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={(e) => toggleCompare(bestMatchHackathon.id, e)}
                  className={`button text-xs py-2.5 px-4 cursor-pointer ${
                    compareIds.includes(bestMatchHackathon.id)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'button-secondary'
                  }`}
                >
                  <Layers size={14} />
                  {compareIds.includes(bestMatchHackathon.id) ? 'In Compare' : '+ Compare'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* PART 4: "CLOSING SOON" CAROUSEL / HIGHLIGHT SECTION                     */}
      {/* ------------------------------------------------------------------------ */}
      {closingSoonList.length > 0 && !showSavedOnly && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Closing Soon Opportunities</h3>
                <p className="text-[11px] text-muted-foreground">Approaching registration deadlines — action required</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {closingSoonList.map(h => (
              <div
                key={h.id}
                onClick={() => setSelectedDrawerHackathon(h)}
                className="panel p-4 bg-card/60 border border-amber-500/30 rounded-xl space-y-2.5 hover:border-amber-500/60 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  {getSourceBadge(h.source)}
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Clock size={11} /> {h.remainingText || 'Ending Soon'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">{h.title}</h4>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <span>Prize: <strong className="text-yellow-300">{h.prize || 'Standard'}</strong></span>
                  <span className="text-teal-400 font-semibold flex items-center gap-1">Details <ChevronRight size={12} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* PART 5: SMART DISCOVERY CARDS & PLATFORM FILTERS                        */}
      {/* ------------------------------------------------------------------------ */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Explore All Opportunities</h3>
            <p className="text-xs text-muted-foreground">Showing verified opportunities matching your active filters</p>
          </div>

          {/* Search & Platform Control */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search opportunities or skills…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`button text-xs py-1.5 px-3 cursor-pointer shrink-0 ${
                showSavedOnly ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold' : 'button-secondary'
              }`}
            >
              <Star size={13} className={showSavedOnly ? 'fill-amber-400 text-amber-400' : ''} />
              Saved ({savedIds.length})
            </button>
          </div>
        </div>

        {/* Platform Source Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="text-muted-foreground text-[11px] font-mono mr-1">Source:</span>
          {[
            { id: 'ALL', label: 'All Sources' },
            { id: 'UNSTOP', label: '🔥 Unstop' },
            { id: 'DEVFOLIO', label: '✨ Devfolio' },
            { id: 'DEVPOST', label: '🌐 Devpost' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id as PlatformFilter)}
              className={`px-3 py-1 rounded-md border transition-all cursor-pointer ${
                selectedPlatform === p.id 
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-semibold' 
                  : 'bg-card/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="panel p-12 text-center text-muted-foreground space-y-3">
            <RefreshCw size={24} className="animate-spin text-teal-400 mx-auto" />
            <p className="text-sm font-medium">Fetching verified external hackathons from Unstop, Devfolio, & Devpost…</p>
          </div>
        ) : processedHackathons.length === 0 ? (
          /* Honest Empty State */
          <div className="panel p-12 text-center text-muted-foreground space-y-3">
            <Globe size={32} className="mx-auto text-muted-foreground/60" />
            <h3 className="text-sm font-semibold text-foreground">No verified opportunities match this filter right now</h3>
            <p className="text-xs max-w-md mx-auto">
              {searchQuery || showSavedOnly || selectedPlatform !== 'ALL'
                ? 'Try clearing your search query or selecting a different platform source.'
                : 'No active hackathons available for this specific radar dimension right now.'}
            </p>
            <button onClick={() => { setSearchQuery(''); setSelectedPlatform('ALL'); setShowSavedOnly(false); setActiveRadar('BEST_MATCH'); }} className="button button-secondary text-xs cursor-pointer">
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedHackathons.map((h) => (
              <div
                key={h.id}
                onClick={() => setSelectedDrawerHackathon(h)}
                className="panel p-5 bg-card/70 border border-border rounded-xl flex flex-col justify-between hover:border-border/90 hover:shadow-lg transition-all duration-200 group cursor-pointer space-y-4"
              >
                {/* Card Top Header */}
                <div className="flex items-center justify-between">
                  {getSourceBadge(h.source)}
                  <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {h.matchData.score}% MATCH
                  </span>
                </div>

                {/* Event Image */}
                <div className="w-full h-36 rounded-lg overflow-hidden border border-border bg-muted/40 relative">
                  {h.image_url ? (
                    <img src={h.image_url} alt={h.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5 bg-slate-900">
                      <Code2 size={24} className="text-teal-400" />
                      <span className="text-[10px] font-mono">{h.source} Official Event</span>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-foreground leading-snug group-hover:text-teal-300 transition-colors line-clamp-1">
                    {h.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {h.description}
                  </p>
                </div>

                {/* Attributes Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-3 border-t border-border/60 font-mono">
                  <div>
                    <span className="text-[10px] block text-muted-foreground/80">Deadline</span>
                    <strong className="text-amber-300 font-semibold truncate block">
                      {h.remainingText || h.registration_deadline || 'Open'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted-foreground/80">Prize</span>
                    <strong className="text-yellow-300 font-semibold truncate block">
                      {h.prize || 'Standard'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted-foreground/80">Mode</span>
                    <strong className="text-foreground truncate block">{h.mode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted-foreground/80">Team Size</span>
                    <strong className="text-foreground truncate block">{h.team_size || 'Open'}</strong>
                  </div>
                </div>

                {/* Skills Chips */}
                {h.skills && h.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {h.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleSave(h.id, e)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        savedIds.includes(h.id) 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title="Save Opportunity"
                    >
                      <Star size={14} className={savedIds.includes(h.id) ? 'fill-amber-400 text-amber-400' : ''} />
                    </button>
                    <button
                      onClick={(e) => toggleCompare(h.id, e)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        compareIds.includes(h.id) 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title="Add to Compare"
                    >
                      <Layers size={14} />
                    </button>
                  </div>

                  <span className="text-teal-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* PART 6: FLOATING COMPARE TRAY & COMPARISON MODAL                         */}
      {/* ------------------------------------------------------------------------ */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-card border border-teal-500/40 rounded-xl shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <Layers size={16} className="text-teal-400" />
            <span><strong className="text-teal-300 font-mono">{compareIds.length}</strong> opportunities selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="button button-primary text-xs font-semibold py-1.5 px-3 cursor-pointer"
            >
              Compare Side-by-Side
            </button>
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              title="Clear Selection"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && compareHackathonsList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <div className="eyebrow text-teal-400">Opportunity Decision Matrix</div>
                <h2 className="text-lg font-bold text-foreground">Compare Selected Hackathons</h2>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80"
              >
                <X size={16} />
              </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-${compareHackathonsList.length} gap-4`}>
              {compareHackathonsList.map((h, idx) => (
                <div key={h.id} className="panel p-4 bg-muted/20 border border-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    {getSourceBadge(h.source)}
                    <span className="text-xs font-mono font-bold text-teal-300">{h.matchData.score}% Match</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{h.title}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono block mt-1">Organized by {h.organizer || h.source}</span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-border/60 pt-3 font-mono">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Deadline</span>
                      <strong className="text-amber-300 font-semibold">{h.remainingText || h.registration_deadline || 'Open'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Prize</span>
                      <strong className="text-yellow-300 font-semibold">{h.prize || 'Standard'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Mode & Team</span>
                      <strong className="text-foreground">{h.mode} • Team {h.team_size || 'Open'}</strong>
                    </div>
                  </div>

                  <a
                    href={h.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-primary w-full justify-center text-xs font-semibold py-2 cursor-pointer"
                  >
                    View Official Event <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* PART 7: HACKATHON DETAIL DRAWER                                         */}
      {/* ------------------------------------------------------------------------ */}
      {selectedDrawerHackathon && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDrawerHackathon(null)}>
          <aside 
            className="w-full max-w-lg bg-card border-l border-border h-full p-6 space-y-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2">
                {getSourceBadge(selectedDrawerHackathon.source)}
                <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {calculateMatch(selectedDrawerHackathon).score}% MATCH
                </span>
              </div>
              <button 
                onClick={() => setSelectedDrawerHackathon(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80"
              >
                <X size={16} />
              </button>
            </div>

            {/* Image */}
            {selectedDrawerHackathon.image_url && (
              <div className="w-full h-48 rounded-xl overflow-hidden border border-border bg-muted/40">
                <img src={selectedDrawerHackathon.image_url} alt={selectedDrawerHackathon.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title & Description */}
            <div>
              <h2 className="text-lg font-bold text-foreground leading-snug">{selectedDrawerHackathon.title}</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{selectedDrawerHackathon.description}</p>
            </div>

            {/* Why Recommended */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border/60 space-y-2">
              <div className="text-xs font-bold text-teal-400 font-mono flex items-center gap-1.5">
                <Sparkles size={14} /> Why Cogniva Recommends This
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {calculateMatch(selectedDrawerHackathon).reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-4 rounded-xl border border-border/40 font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block">Registration Deadline</span>
                <strong className="text-amber-300 font-bold">{getRemainingTime(selectedDrawerHackathon.registration_deadline) || selectedDrawerHackathon.registration_deadline || 'Open'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                <strong className="text-yellow-300 font-bold">{selectedDrawerHackathon.prize || 'Standard'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Event Mode</span>
                <strong className="text-foreground">{selectedDrawerHackathon.mode}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Team Size</span>
                <strong className="text-foreground">{selectedDrawerHackathon.team_size || 'Open'}</strong>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={selectedDrawerHackathon.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary w-full justify-center text-xs font-semibold py-3 cursor-pointer"
              >
                View Official Hackathon <ExternalLink size={14} />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={(e) => toggleSave(selectedDrawerHackathon.id, e)}
                  className={`button flex-1 justify-center text-xs py-2.5 cursor-pointer ${
                    savedIds.includes(selectedDrawerHackathon.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'button-secondary'
                  }`}
                >
                  <Star size={14} className={savedIds.includes(selectedDrawerHackathon.id) ? 'fill-amber-400 text-amber-400' : ''} />
                  {savedIds.includes(selectedDrawerHackathon.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={(e) => toggleCompare(selectedDrawerHackathon.id, e)}
                  className={`button flex-1 justify-center text-xs py-2.5 cursor-pointer ${
                    compareIds.includes(selectedDrawerHackathon.id)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'button-secondary'
                  }`}
                >
                  <Layers size={14} />
                  {compareIds.includes(selectedDrawerHackathon.id) ? 'In Compare' : '+ Compare'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
