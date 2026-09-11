import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Flame,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { 
  getCurrentStudentContext, 
  fetchNotices, 
  markNoticeAsRead, 
  Notice, 
  StudentContext 
} from '../lib/academic-api';
import { fetchLiveAcademicNews, AcademicNewsItem } from '../lib/academicNewsProvider';
import { supabase } from '../lib/supabase';

interface StudentEntryAlertModalProps {
  onNavigateToAlerts?: () => void;
}

export function StudentEntryAlertModal({ onNavigateToAlerts }: StudentEntryAlertModalProps) {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'NOTICE' | 'NEWS' | null>(null);
  
  // Notices state
  const [unreadNotices, setUnreadNotices] = useState<Notice[]>([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  
  // News state
  const [highValueNews, setHighValueNews] = useState<AcademicNewsItem | null>(null);
  
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    initDecisionEngine();
  }, [user?.email]);

  // Realtime Notice Channel Setup
  useEffect(() => {
    if (!studentCtx) return;
    
    const channel = supabase
      .channel('student_live_entry_notices')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        async (payload) => {
          const newNotice = payload.new as Notice;
          const cleanSec = (studentCtx.sectionName || 'CSE-C').trim().toUpperCase();
          const targetSec = (newNotice.section || '').trim().toUpperCase();

          const isTargeted = targetSec === 'ALL' || targetSec === cleanSec || targetSec.endsWith(cleanSec) || cleanSec.endsWith(targetSec);
          const isHighPriority = newNotice.priority === 'Urgent' || (newNotice.priority as string) === 'High' || newNotice.priority === 'Important';

          if (isTargeted && isHighPriority) {
            setUnreadNotices(prev => [newNotice, ...prev]);
            setCurrentNoticeIndex(0);
            setActiveModal('NOTICE');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentCtx]);

  const initDecisionEngine = async () => {
    try {
      const email = user?.email || 'student001@cogniva.edu';
      const ctx = await getCurrentStudentContext(email);
      setStudentCtx(ctx);

      const cleanEmail = email.toLowerCase().trim();
      const cleanRegno = (ctx.registerNumber || '').toLowerCase().trim();
      const secName = ctx.sectionName || 'CSE-C';

      // 1. Fetch Section Notices
      const allNotices = await fetchNotices(secName);
      
      // Filter unread High/Urgent notices for current student
      const unreadHighNotices = allNotices.filter((n) => {
        const isPriority = n.priority === 'Urgent' || (n.priority as string) === 'High' || n.priority === 'Important';
        if (!isPriority) return false;

        const readByList = (n.read_by || []).map(r => String(r).toLowerCase().trim());
        const isRead = readByList.includes(cleanEmail) || (cleanRegno && readByList.includes(cleanRegno));
        
        // Check session-level dismissal
        const sessionDismissed = sessionStorage.getItem(`cogniva_dismissed_notice_${n.id}`);
        
        return !isRead && !sessionDismissed;
      });

      if (unreadHighNotices.length > 0) {
        setUnreadNotices(unreadHighNotices);
        setCurrentNoticeIndex(0);
        setActiveModal('NOTICE');
        return;
      }

      // 2. If no unread notice, check for unseen High-Value Academic News
      const newsFeed = await fetchLiveAcademicNews();
      const seenNewsRaw = localStorage.getItem(`cogniva_seen_news_${cleanEmail}`);
      const seenNewsIds = new Set<string>(seenNewsRaw ? JSON.parse(seenNewsRaw) : []);
      const sessionNewsDismissed = sessionStorage.getItem(`cogniva_session_news_dismissed`);

      if (!sessionNewsDismissed) {
        const topHighValueNews = newsFeed.find(item => item.importance === 'HIGH_VALUE' && !seenNewsIds.has(item.id));
        if (topHighValueNews) {
          setHighValueNews(topHighValueNews);
          setActiveModal('NEWS');
          return;
        }
      }

      // 3. Neither exists -> No entry alert modal
      setActiveModal(null);
    } catch (err) {
      console.warn('[EntryAlertEngine] Notice/News decision engine warning:', err);
      setActiveModal(null);
    }
  };

  // --------------------------------------------------------------------------
  // NOTICE ACTIONS
  // --------------------------------------------------------------------------
  const currentNotice = unreadNotices[currentNoticeIndex] || null;

  const handleCloseNotice = async () => {
    if (!currentNotice || !user?.email) return;
    const nId = currentNotice.id;
    sessionStorage.setItem(`cogniva_dismissed_notice_${nId}`, 'true');
    await markNoticeAsRead(nId, user.email);

    if (currentNoticeIndex < unreadNotices.length - 1) {
      setCurrentNoticeIndex(prev => prev + 1);
    } else {
      setActiveModal(null);
    }
  };

  const handleViewNotice = async () => {
    if (!currentNotice || !user?.email) return;
    const nId = currentNotice.id;
    sessionStorage.setItem(`cogniva_dismissed_notice_${nId}`, 'true');
    await markNoticeAsRead(nId, user.email);
    setActiveModal(null);
    
    if (onNavigateToAlerts) {
      onNavigateToAlerts();
    } else {
      window.location.assign('/student/alerts');
    }
  };

  // --------------------------------------------------------------------------
  // NEWS ACTIONS
  // --------------------------------------------------------------------------
  const handleCloseNews = () => {
    if (!highValueNews || !user?.email) return;
    markNewsAsSeen(highValueNews.id);
    sessionStorage.setItem('cogniva_session_news_dismissed', 'true');
    setActiveModal(null);
  };

  const handleReadNewsArticle = () => {
    if (!highValueNews || !user?.email) return;
    markNewsAsSeen(highValueNews.id);
    sessionStorage.setItem('cogniva_session_news_dismissed', 'true');
    setActiveModal(null);
    window.open(highValueNews.url, '_blank', 'noopener,noreferrer');
  };

  const markNewsAsSeen = (newsId: string) => {
    const cleanEmail = (user?.email || 'student001@cogniva.edu').toLowerCase().trim();
    const key = `cogniva_seen_news_${cleanEmail}`;
    try {
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(newsId)) {
        list.push(newsId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}
  };

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. ADMIN / FACULTY ANNOUNCEMENT POPUP OVERLAY                            */}
      {/* ------------------------------------------------------------------------ */}
      {activeModal === 'NOTICE' && currentNotice && (
        <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-muted/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center font-bold">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span>Entry Notification</span>
                  {unreadNotices.length > 1 && (
                    <span className="text-teal-400 font-bold">
                      • {currentNoticeIndex + 1} of {unreadNotices.length}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground">Official Section Announcement</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                currentNotice.priority === 'Urgent' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {currentNotice.priority.toUpperCase()}
              </span>
              <button 
                onClick={handleCloseNotice}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Close Announcement"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {currentNotice.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-mono">
                <span>By: <strong className="text-foreground">{currentNotice.faculty_name || 'Admin'}</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-teal-400">{currentNotice.section || studentCtx?.sectionName || 'CSE-C'}</strong></span>
                <span>•</span>
                <span>{new Date(currentNotice.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Optional Image */}
            {currentNotice.image_url && (
              <div className="rounded-lg overflow-hidden border border-border max-h-56 bg-muted/30">
                <img 
                  src={currentNotice.image_url} 
                  alt={currentNotice.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Main Text Content */}
            <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-lg border border-border/40 font-normal">
              {(currentNotice as any).content || currentNotice.description}
            </div>

            {/* Attachment link if present */}
            {((currentNotice as any).attachment_path || currentNotice.image_url || currentNotice.image_path) && (
              <div className="flex items-center gap-2 p-2.5 rounded border border-border/60 bg-muted/40 text-xs">
                <ExternalLink size={14} className="text-teal-400 shrink-0" />
                <span className="text-muted-foreground truncate">Attachment included</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/30">
            <button
              onClick={handleCloseNotice}
              className="button button-secondary text-xs"
            >
              Dismiss (X)
            </button>

            <div className="flex items-center gap-2">
              {unreadNotices.length > 1 && currentNoticeIndex < unreadNotices.length - 1 && (
                <button
                  onClick={handleCloseNotice}
                  className="button button-secondary text-xs text-teal-400"
                >
                  Next Announcement <ChevronRight size={14} />
                </button>
              )}
              <button
                onClick={handleViewNotice}
                className="button button-primary text-xs font-semibold py-2 px-4"
              >
                View Full Notice <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* 2. ACADEMIC INTELLIGENCE HIGH-VALUE NEWS POPUP OVERLAY                   */}
      {/* ------------------------------------------------------------------------ */}
      {activeModal === 'NEWS' && highValueNews && (
        <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-purple-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">
                  Academic Intelligence • High Value News
                </div>
                <h3 className="text-sm font-semibold text-foreground">Technology & Learning Discovery</h3>
              </div>
            </div>

            <button 
              onClick={handleCloseNews}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Close Academic News"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground leading-snug">
                {highValueNews.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 font-mono">
                <span className="text-purple-300">{highValueNews.source}</span>
                <span>•</span>
                <span>{new Date(highValueNews.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/20 p-3.5 rounded-lg border border-border/40">
              {highValueNews.description}
            </p>

            {/* Why This Matters */}
            <div className="bg-purple-500/10 p-3.5 rounded-lg border border-purple-500/20 space-y-1">
              <div className="text-[11px] font-bold text-purple-300 font-mono uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={13} /> Why this matters for your learning path:
              </div>
              <p className="text-xs text-purple-200/90 leading-normal">
                {highValueNews.learning_path_relevance}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/30">
            <button
              onClick={handleCloseNews}
              className="button button-secondary text-xs"
            >
              Close (X)
            </button>

            <button
              onClick={handleReadNewsArticle}
              className="button button-primary text-xs font-semibold py-2 px-4"
            >
              Read Full Article <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
