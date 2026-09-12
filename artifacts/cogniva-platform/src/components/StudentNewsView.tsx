import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  NewsItem,
  NewsCategory,
  NEWS_CATEGORIES,
  fetchStudentIntelligenceNews,
} from '../lib/cogniva-intelligence-news';
import {
  Newspaper,
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Tag,
  ArrowRight,
  Clock,
  Info,
  X,
  BookOpen,
  Laptop,
  GraduationCap,
  Briefcase,
  Trophy,
  Building,
  Rocket,
  Award,
  Gift,
  Share2
} from 'lucide-react';

export function StudentNewsView() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('for_you');
  const [mustKnowItems, setMustKnowItems] = useState<NewsItem[]>([]);
  const [feedItems, setFeedItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('ALL');

  // Selected article drawer state
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadNewsFeed();
  }, [user?.email, activeCategory]);

  const loadNewsFeed = async () => {
    setLoading(true);
    const res = await fetchStudentIntelligenceNews({
      userEmail: user?.email,
      category: activeCategory,
      searchQuery: searchQuery.trim(),
    });

    setMustKnowItems(res.mustKnowItems);
    setFeedItems(res.feedItems);
    setLastUpdated(res.lastUpdated);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNewsFeed();
    setRefreshing(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNewsFeed();
  };

  const getCategoryIcon = (cat: NewsCategory) => {
    switch (cat) {
      case 'ai': return <Sparkles className="w-4 h-4 text-violet-600" />;
      case 'technology': return <Laptop className="w-4 h-4 text-cyan-600" />;
      case 'study': return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'careers': return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'internships': return <Briefcase className="w-4 h-4 text-amber-600" />;
      case 'hackathons': return <Trophy className="w-4 h-4 text-rose-600" />;
      case 'business': return <Building className="w-4 h-4 text-slate-600" />;
      case 'entrepreneurship': return <Rocket className="w-4 h-4 text-sky-600" />;
      case 'scholarships': return <Award className="w-4 h-4 text-teal-600" />;
      case 'tools_offers': return <Gift className="w-4 h-4 text-emerald-600" />;
      default: return <Flame className="w-4 h-4 text-blue-600" />;
    }
  };

  const filteredFeedItems = feedItems.filter((item) => {
    if (contentTypeFilter === 'ALL') return true;
    return item.content_type === contentTypeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* 1. PAGE HEADER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
            <Newspaper className="w-3.5 h-3.5 text-blue-600" />
            Cogniva Intelligence Feed
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Intelligence
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Important updates worth knowing — AI, technology, learning, careers, business and opportunities curated for students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium">
            Updated: <strong className="text-slate-800">{lastUpdated || 'Just now'}</strong>
          </span>
        </div>
      </div>

      {/* 2. SEARCH & QUICK FILTERS BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search AI, internships, scholarships, technology, Jio offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Source Type:
          </label>
          <select
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Verified Sources</option>
            <option value="OFFICIAL">Official Product Announcements</option>
            <option value="REPUTABLE">Reputable Tech News</option>
          </select>
        </div>
      </div>

      {/* 3. HORIZONTAL CATEGORY NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {NEWS_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {getCategoryIcon(cat.id)}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. TOP FEATURED SECTION - IMPORTANT TODAY */}
      {activeCategory === 'for_you' && mustKnowItems.length > 0 && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-lg font-extrabold text-slate-900">IMPORTANT TODAY</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Top high-impact announcements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mustKnowItems.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      <Flame className="w-3 h-3 text-amber-400" />
                      MUST KNOW
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{item.source_name}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.cogniva_summary || item.original_description}
                  </p>

                  {/* WHY THIS MATTERS */}
                  <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-xs space-y-1">
                    <span className="font-bold text-blue-300 uppercase tracking-wider block text-[10px]">
                      Why This Matters
                    </span>
                    <p className="text-slate-200 text-xs leading-relaxed font-medium">
                      {item.why_it_matters}
                    </p>
                  </div>

                  {/* Eligibility Condition */}
                  {item.eligibility_notes && (
                    <div className="text-[11px] text-amber-200 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 font-medium">
                      <strong>Eligibility:</strong> {item.eligibility_notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Verified official source</span>
                  <a
                    href={item.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors"
                  >
                    View Official Offer
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAIN INTELLIGENCE FEED */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {activeCategory === 'for_you' ? 'Recommended Intelligence Stream' : NEWS_CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="text-xs text-slate-500">
              Verified stories ranked for your academic department & career goals.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {filteredFeedItems.length} Stories
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium animate-pulse">
            Curating student news stream...
          </div>
        ) : filteredFeedItems.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No news articles found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your category selection or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFeedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.category_label}
                      </span>
                      {item.is_must_know && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          🔥 MUST KNOW
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{item.source_name}</span>
                  </div>

                  {/* Title & Excerpt */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">
                      {item.original_description}
                    </p>
                  </div>

                  {/* WHY THIS MATTERS */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-blue-700 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Why This Matters For You
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed font-medium">
                      {item.why_it_matters}
                    </p>
                  </div>

                  {/* Eligibility notes if present */}
                  {item.eligibility_notes && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                      <strong>Eligibility Conditions:</strong> {item.eligibility_notes}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">{item.verification_status}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedArticle(item)}
                      className="font-bold text-slate-600 hover:text-slate-900 text-xs"
                    >
                      View Details
                    </button>
                    <a
                      href={item.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Read Full Story
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. ARTICLE DETAIL DRAWER */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  {selectedArticle.category_label} · {selectedArticle.source_name}
                </span>
                <h2 className="text-xl font-extrabold text-white leading-snug">{selectedArticle.title}</h2>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Source: {selectedArticle.source_name}</span>
                  <span className="text-emerald-700 font-semibold">{selectedArticle.verification_status}</span>
                </div>
                <div className="text-slate-600">
                  Published: {new Date(selectedArticle.published_at).toLocaleString()}
                </div>
              </div>

              {/* Original Content / Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary & Original Excerpt</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                  {selectedArticle.original_description}
                </p>
              </div>

              {/* Cogniva Why It Matters */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Cogniva Value & Relevance Analysis
                </h4>
                <p className="text-sm text-slate-800 bg-blue-50/60 p-4 rounded-2xl border border-blue-100 leading-relaxed font-medium">
                  {selectedArticle.why_it_matters}
                </p>
              </div>

              {/* Eligibility Condition if present */}
              {selectedArticle.eligibility_notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Eligibility Requirements</h4>
                  <div className="text-xs text-amber-900 bg-amber-50 p-4 rounded-2xl border border-amber-200 font-semibold">
                    {selectedArticle.eligibility_notes}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Close
              </button>
              <a
                href={selectedArticle.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
              >
                Open Original Source Website
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
