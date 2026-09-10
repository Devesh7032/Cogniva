import React, { useEffect, useState } from 'react';
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
  Code2
} from 'lucide-react';
import { fetchHackathons, syncHackathons, Hackathon } from '../lib/academic-api';
import { useAuth } from '../lib/auth-context';

type PlatformFilter = 'ALL' | 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST';
type StatusFilter = 'ALL' | 'RECOMMENDED' | 'LIVE' | 'ENDING_SOON' | 'UPCOMING';

export function StudentHackathonsView() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('ALL');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHackathons();
      setHackathons(data);
      if (data.length > 0 && data[0].last_synced_at) {
        setLastSynced(new Date(data[0].last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load verified hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const unstopCount = hackathons.filter((h) => h.source === 'UNSTOP').length;
  const devfolioCount = hackathons.filter((h) => h.source === 'DEVFOLIO').length;
  const devpostCount = hackathons.filter((h) => h.source === 'DEVPOST').length;

  // Derive unique categories dynamically
  const categories = ['ALL', ...Array.from(new Set(hackathons.flatMap((h) => h.categories || [])))];

  // Filtering & Sorting
  const filteredHackathons = hackathons
    .filter((h) => {
      // 0. Platform Filter
      if (selectedPlatform !== 'ALL' && h.source !== selectedPlatform) return false;

      // 1. Status Filter
      if (activeFilter === 'LIVE' && h.status !== 'LIVE') return false;
      if (activeFilter === 'ENDING_SOON' && h.status !== 'ENDING_SOON') return false;
      if (activeFilter === 'UPCOMING' && h.status !== 'UPCOMING') return false;
      if (activeFilter === 'RECOMMENDED' && (h.relevance_score || 0) < 60) return false;

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && !(h.categories || []).includes(selectedCategory)) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = h.title.toLowerCase().includes(q);
        const matchDesc = h.description.toLowerCase().includes(q);
        const matchSkills = (h.skills || []).some((s) => s.toLowerCase().includes(q));
        const matchPlatform = h.source.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSkills && !matchPlatform) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'RECOMMENDED') {
        return (b.relevance_score || 0) - (a.relevance_score || 0);
      }
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });

  const getSourceBadge = (source: 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST') => {
    switch (source) {
      case 'DEVFOLIO':
        return (
          <span className="chip chip-violet flex items-center gap-1 font-mono font-bold">
            <Sparkles size={11} /> Devfolio
          </span>
        );
      case 'UNSTOP':
        return (
          <span className="chip chip-coral flex items-center gap-1 font-mono font-bold">
            <Flame size={11} /> Unstop
          </span>
        );
      case 'DEVPOST':
        return (
          <span className="chip chip-teal flex items-center gap-1 font-mono font-bold">
            <Globe size={11} /> Devpost
          </span>
        );
    }
  };

  const getStatusPill = (status: Hackathon['status']) => {
    switch (status) {
      case 'LIVE':
        return <span className="chip chip-coral font-semibold animate-pulse">🔴 LIVE NOW</span>;
      case 'ENDING_SOON':
        return <span className="chip chip-amber font-semibold">⏳ Ending Soon</span>;
      case 'UPCOMING':
        return <span className="chip chip-teal font-semibold">📅 Upcoming</span>;
      case 'ENDED':
        return <span className="chip chip-violet font-semibold">Ended</span>;
    }
  };

  return (
    <div className="page-frame space-y-6">
      {/* Header Banner */}
      <div className="welcome-row">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <span>Verified Source Intelligence</span>
            <span>·</span>
            <span>Unstop · Devfolio · Devpost</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 mt-1">
            🚀 Top Hackathons
          </h1>
          <p className="lede text-slate-400 text-sm mt-1">
            Real active hackathons automatically discovered from official Unstop, Devfolio, and Devpost feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck size={13} className="text-teal-400" /> Verified: {lastSynced}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="button button-secondary flex items-center gap-2 text-xs py-2 px-3 cursor-pointer"
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Verifying Feeds...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* Platform Source Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedPlatform('ALL')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedPlatform === 'ALL'
              ? 'bg-slate-900 border-teal-500/60 text-teal-300 shadow-md shadow-teal-500/10'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400">All Sources</span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-lg font-bold text-slate-100">{hackathons.length}</strong>
            <span className="text-[10px] text-slate-500 font-mono">Events</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedPlatform('UNSTOP')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedPlatform === 'UNSTOP'
              ? 'bg-slate-900 border-rose-500/60 text-rose-300 shadow-md shadow-rose-500/10'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
            <Flame size={12} /> Unstop
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-lg font-bold text-slate-100">{unstopCount}</strong>
            <span className="text-[10px] text-slate-500 font-mono">Verified</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedPlatform('DEVFOLIO')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedPlatform === 'DEVFOLIO'
              ? 'bg-slate-900 border-violet-500/60 text-violet-300 shadow-md shadow-violet-500/10'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-violet-400 flex items-center gap-1">
            <Sparkles size={12} /> Devfolio
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-lg font-bold text-slate-100">{devfolioCount}</strong>
            <span className="text-[10px] text-slate-500 font-mono">Verified</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedPlatform('DEVPOST')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedPlatform === 'DEVPOST'
              ? 'bg-slate-900 border-teal-500/60 text-teal-300 shadow-md shadow-teal-500/10'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-teal-400 flex items-center gap-1">
            <Globe size={12} /> Devpost
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-lg font-bold text-slate-100">{devpostCount}</strong>
            <span className="text-[10px] text-slate-500 font-mono">Verified</span>
          </div>
        </button>
      </div>

      {/* Control Bar: Status Filters & Search */}
      <div className="panel p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Main Status Tabs */}
          <div className="segmented-control">
            <button className={activeFilter === 'ALL' ? 'segment-active' : ''} onClick={() => setActiveFilter('ALL')}>
              All Statuses ({filteredHackathons.length})
            </button>
            <button className={activeFilter === 'RECOMMENDED' ? 'segment-active' : ''} onClick={() => setActiveFilter('RECOMMENDED')}>
              ✨ Profile Matched
            </button>
            <button className={activeFilter === 'LIVE' ? 'segment-active' : ''} onClick={() => setActiveFilter('LIVE')}>
              🔴 Live Now
            </button>
            <button className={activeFilter === 'ENDING_SOON' ? 'segment-active' : ''} onClick={() => setActiveFilter('ENDING_SOON')}>
              ⏳ Ending Soon
            </button>
            <button className={activeFilter === 'UPCOMING' ? 'segment-active' : ''} onClick={() => setActiveFilter('UPCOMING')}>
              📅 Upcoming
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hackathons or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <Filter size={11} /> Filter by Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="panel p-12 text-center text-slate-400 space-y-3">
          <RefreshCw size={24} className="spin mx-auto text-teal-400" />
          <p className="text-sm font-medium">Fetching verified external hackathons from Unstop, Devfolio, & Devpost...</p>
        </div>
      ) : filteredHackathons.length === 0 ? (
        /* Empty State */
        <div className="panel p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Globe size={24} />
          </div>
          <strong className="text-slate-200 block text-base font-semibold">No verified hackathons available right now</strong>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            {searchQuery || selectedCategory !== 'ALL' || selectedPlatform !== 'ALL'
              ? 'Try clearing your platform or category filter.'
              : 'External source feeds currently have no active verified listings. Click below to refresh source feeds.'}
          </p>
          <button onClick={handleSync} className="button button-primary text-xs mt-2 cursor-pointer">
            <RefreshCw size={13} /> Refresh External Feeds
          </button>
        </div>
      ) : (
        /* Hackathons Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredHackathons.map((h) => (
            <div
              key={h.id}
              className="panel flex flex-col justify-between p-5 relative transition-all duration-200 hover:border-slate-700 bg-slate-900/90 border-slate-800"
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {getSourceBadge(h.source)}
                  {getStatusPill(h.status)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <ShieldCheck size={11} className="text-teal-400" /> Verified
                </span>
              </div>

              {/* Title & Image */}
              <div className="space-y-2">
                {h.image_url ? (
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-slate-800 mb-3 bg-slate-950">
                    <img src={h.image_url} alt={h.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-lg border border-slate-800/80 mb-3 bg-slate-950/60 flex items-center justify-center text-slate-600 gap-2">
                    <Code2 size={24} />
                    <span className="text-xs font-mono">{h.source} Official Event</span>
                  </div>
                )}

                <h3 className="text-base font-bold text-slate-100 leading-snug hover:text-teal-400 transition-colors">
                  {h.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{h.description}</p>
              </div>

              {/* Verified Attributes Grid */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Globe size={13} className="text-slate-500 shrink-0" />
                  <span>
                    Mode: <strong className="text-slate-200">{h.mode}</strong>
                  </span>
                </div>

                {h.team_size && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users size={13} className="text-slate-500 shrink-0" />
                    <span>
                      Team: <strong className="text-slate-200">{h.team_size}</strong>
                    </span>
                  </div>
                )}

                {typeof h.participant_count === 'number' && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users size={13} className="text-teal-400 shrink-0" />
                    <span>
                      Participants: <strong className="text-teal-300 font-semibold">{h.participant_count.toLocaleString()}</strong>
                    </span>
                  </div>
                )}

                {h.prize && (
                  <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                    <Award size={13} className="text-amber-400 shrink-0" />
                    <span>
                      Prize: <strong className="text-amber-300 font-semibold">{h.prize}</strong>
                    </span>
                  </div>
                )}

                {h.registration_deadline && (
                  <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                    <Calendar size={13} className="text-teal-400 shrink-0" />
                    <span>
                      Deadline: <strong className="text-teal-300 font-semibold">{h.registration_deadline}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Skills Tags */}
              {h.skills && h.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {h.skills.map((skill) => (
                    <span key={skill} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Organizer / Eligibility */}
              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span>By: <strong className="text-slate-200">{h.organizer || h.source}</strong></span>
                {h.eligibility && <span className="truncate max-w-[180px] text-slate-400">{h.eligibility}</span>}
              </div>

              {/* Official Link Button */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <a
                  href={h.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 cursor-pointer"
                >
                  View Official Hackathon <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
