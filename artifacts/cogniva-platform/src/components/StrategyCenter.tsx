import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Compass,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Filter,
  Flame,
  Globe,
  HeartPulse,
  Info,
  Layers,
  Lightbulb,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserCheck,
  Zap,
  X
} from 'lucide-react';
import {
  fetchStudentAttendanceSummaryRecord,
  StudentAttendanceSummaryRecord,
  fetchStudentGradeSummaryRecord,
  StudentGradeSummaryRecord,
  fetchStudentCgpaRecord,
  StudentCgpaRecord,
  fetchAssignments,
  Assignment,
  fetchStudentAssignmentStatuses,
  StudentAssignmentStatus,
  fetchExaminations,
  Examination,
  fetchStudentGoals,
  Goal,
  fetchHackathons,
  Hackathon,
  getCurrentStudentContext,
  StudentContext
} from '../lib/academic-api';
import { CourseData, parseCourseExcel } from '../lib/excelAnalytics';
import { askStudentAi } from '../lib/ai-service';
import { useAuth } from '../lib/auth-context';

type Tone = 'teal' | 'amber' | 'coral' | 'violet';

type PassionCategory = 'AI_ML' | 'CLOUD' | 'CYBERSECURITY' | 'SOFTWARE_ENG' | 'DATA_SCIENCE' | 'RESEARCH';

interface FocusBlock {
  id: number | string;
  time: string;
  title: string;
  course: string;
  duration: string;
  complete: boolean;
  tone: Tone;
  type?: 'HIGHEST_IMPACT' | 'QUICK_WIN' | 'DEADLINE_PROTECTION' | 'RECOVERY';
}

interface UnifiedSubjectMetrics {
  subjectName: string;
  attendancePct: number | null;
  grade: string | null;
  gradePoint: number | null;
  credits: number;
  upcomingExam?: Examination | null;
  upcomingAssignment?: Assignment | null;
  opportunityScore: number;
  reasons: string[];
  quadrant: 'PRIORITIZE' | 'MAINTAIN' | 'MONITOR' | 'LOW_PRIORITY';
  isPassionAligned: boolean;
}

function Chip({ children, tone = 'teal' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function StrategyCenter() {
  const { user } = useAuth();

  // Core Data Loading States
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase Real Records
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [attendanceRec, setAttendanceRec] = useState<StudentAttendanceSummaryRecord | null>(null);
  const [gradeRec, setGradeRec] = useState<StudentGradeSummaryRecord | null>(null);
  const [cgpaRec, setCgpaRec] = useState<StudentCgpaRecord | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentStatuses, setAssignmentStatuses] = useState<StudentAssignmentStatus[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  // Excel Upload State
  const [customCourseExcelData, setCustomCourseExcelData] = useState<CourseData[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // Interactive Selections
  const [selectedSubject, setSelectedSubject] = useState<UnifiedSubjectMetrics | null>(null);
  const [passionTrack, setPassionTrack] = useState<PassionCategory>('AI_ML');
  const [selectedPassionNode, setSelectedPassionNode] = useState<'SUBJECTS' | 'GOALS' | 'HACKATHONS' | 'PROJECTS'>('SUBJECTS');
  const [energyPreference, setEnergyPreference] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING');

  // What-If Playground State
  const [whatIfStudyTime, setWhatIfStudyTime] = useState<number>(120); // Minutes
  const [whatIfSubjectA, setWhatIfSubjectA] = useState<string>('');
  const [whatIfSubjectB, setWhatIfSubjectB] = useState<string>('');

  // Workload Heatmap Interaction
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<string | null>('Thursday');

  // Focus Blocks State
  const [tasks, setTasks] = useState<FocusBlock[]>([]);
  const [view, setView] = useState<'Today' | 'This week'>('Today');

  // AI Rebalance & Strategy Advisor States
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [creditLogic, setCreditLogic] = useState<string | null>(null);
  const [aiStrategyAdvice, setAiStrategyAdvice] = useState<string | null>(null);
  const [aiStrategyLoading, setAiStrategyLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (!user?.email) return;
    loadAllRealData();
  }, [user?.email]);

  const loadAllRealData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const email = user?.email || '';
      
      const [ctx, att, grd, cg, asgns, statuses, exams, gls, hcks] = await Promise.all([
        getCurrentStudentContext(email),
        fetchStudentAttendanceSummaryRecord(email),
        fetchStudentGradeSummaryRecord(email),
        fetchStudentCgpaRecord(email),
        fetchAssignments(),
        fetchStudentAssignmentStatuses(email),
        fetchExaminations(),
        fetchStudentGoals(email),
        fetchHackathons()
      ]);

      setStudentCtx(ctx);
      setAttendanceRec(att);
      setGradeRec(grd);
      setCgpaRec(cg);
      setAssignments(asgns);
      setAssignmentStatuses(statuses);
      setExaminations(exams);
      setGoals(gls);
      setHackathons(hcks);

      // Generate AI Strategy Guidance
      if (att || grd) {
        generateAiStrategyGuidance(att, grd, gls);
      }
    } catch {
      setErrorMessage('Unable to load full strategy records from backend. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Gemini AI Strategy Advisor output
  const generateAiStrategyGuidance = async (
    att: StudentAttendanceSummaryRecord | null,
    grd: StudentGradeSummaryRecord | null,
    gls: Goal[]
  ) => {
    setAiStrategyLoading(true);
    try {
      const prompt = `Student Academic Intelligence Context:
Overall Attendance: ${att?.overallAttendancePercentage !== null && att?.overallAttendancePercentage !== undefined ? att.overallAttendancePercentage + '%' : 'N/A'} (Status: ${att?.overallStatus || 'N/A'})
Overall Grade: ${grd?.overallGrade || 'N/A'}
Highest Subject: ${att?.highestSubject?.subjectName || 'N/A'} (${att?.highestSubject?.percentage || 'N/A'}%)
Lowest Subject: ${att?.lowestSubject?.subjectName || 'N/A'} (${att?.lowestSubject?.percentage || 'N/A'}%)
Goals Count: ${gls.length}

Provide a concise 2-3 sentence strategic recommendation answering: "What should this student prioritize today for highest academic ROI and career alignment?"`;
      
      const response = await askStudentAi(prompt, user?.email);
      if (response && response.answer && typeof response.answer === 'string') {
        setAiStrategyAdvice(response.answer);
      } else {
        setAiStrategyAdvice("Prioritize subjects near the 75% attendance threshold while maintaining momentum in core high-credit modules.");
      }
    } catch {
      setAiStrategyAdvice("Prioritize subjects near the 75% attendance threshold while maintaining momentum in core high-credit modules.");
    } finally {
      setAiStrategyLoading(false);
    }
  };

  // Handle Excel Upload for Course Data
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseCourseExcel(buffer);
      setCustomCourseExcelData(parsed);
    } catch (err) {
      console.error('Excel parse error:', err);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // 1. UNIFIED SUBJECT METRICS & OPPORTUNITY SCORING ENGINE
  const unifiedSubjects = useMemo<UnifiedSubjectMetrics[]>(() => {
    const map = new Map<string, Partial<UnifiedSubjectMetrics>>();

    // Merge Attendance Records
    if (attendanceRec && attendanceRec.subjectAttendances) {
      attendanceRec.subjectAttendances.forEach(sub => {
        const name = sub.subjectName;
        map.set(name, {
          subjectName: name,
          attendancePct: sub.attendancePercentage,
          credits: 3 // Default benchmark
        });
      });
    }

    // Merge Grade Records
    if (gradeRec && gradeRec.subjectGrades) {
      gradeRec.subjectGrades.forEach(sub => {
        const name = sub.subjectName;
        const existing = map.get(name) || { subjectName: name, credits: 3 };
        
        // Grade Point Mapping
        let gp = 8;
        if (sub.grade === 'O' || sub.grade === 'A+') gp = 10;
        else if (sub.grade === 'A') gp = 9;
        else if (sub.grade === 'B+') gp = 8;
        else if (sub.grade === 'B') gp = 7;
        else if (sub.grade === 'C') gp = 6;
        else if (sub.grade === 'D' || sub.grade === 'F') gp = 4;

        map.set(name, {
          ...existing,
          grade: sub.grade,
          gradePoint: gp
        });
      });
    }

    // Merge Excel Course Data if uploaded
    if (customCourseExcelData) {
      customCourseExcelData.forEach(c => {
        const existing = map.get(c.subject) || { subjectName: c.subject };
        let gp = 8;
        if (c.currentGrade === 'A' || c.currentGrade === 'A+') gp = 9;
        else if (c.currentGrade === 'B' || c.currentGrade === 'B+') gp = 7.5;
        else if (c.currentGrade === 'C') gp = 6;

        map.set(c.subject, {
          ...existing,
          attendancePct: c.attendancePercentage,
          grade: String(c.currentGrade),
          gradePoint: gp,
          credits: c.credits || 3
        });
      });
    }

    // If no real records exist yet, return empty array (NO FAKE DATA)
    if (map.size === 0) return [];

    const resultList: UnifiedSubjectMetrics[] = [];

    map.forEach((item, subjectName) => {
      const att = typeof item.attendancePct === 'number' ? item.attendancePct : null;
      const gr = item.grade || null;
      const gp = typeof item.gradePoint === 'number' ? item.gradePoint : null;
      const cr = item.credits || 3;

      // Find upcoming exam or assignment for this subject
      const subLower = subjectName.toLowerCase();
      const upcomingExam = examinations.find(e => e.subject?.toLowerCase().includes(subLower) || subLower.includes(e.subject?.toLowerCase() || '')) || null;
      const upcomingAssignment = assignments.find(a => a.subject_name?.toLowerCase().includes(subLower) || subLower.includes(a.subject_name?.toLowerCase() || '')) || null;

      // Check Passion Alignment
      const passionKeywords: Record<PassionCategory, string[]> = {
        AI_ML: ['machine', 'learning', 'intelligence', 'ai', 'data', 'python', 'neural'],
        CLOUD: ['cloud', 'aws', 'devops', 'network', 'distributed', 'docker', 'system'],
        CYBERSECURITY: ['security', 'crypto', 'network', 'ethical', 'cyber', 'forensics'],
        SOFTWARE_ENG: ['java', 'software', 'architecture', 'oops', 'algorithm', 'web'],
        DATA_SCIENCE: ['analytics', 'database', 'sql', 'statistics', 'data', 'big data'],
        RESEARCH: ['algorithm', 'theory', 'compiler', 'paper', 'math', 'discrete']
      };

      const keywords = passionKeywords[passionTrack] || [];
      const isPassionAligned = keywords.some(k => subLower.includes(k));

      // Calculate Deterministic Opportunity Score
      let score = 0;
      const reasons: string[] = [];

      // 1. Attendance Risk Factor (Max 40 pts)
      if (att !== null) {
        if (att < 75) {
          score += 40;
          reasons.push(`Attendance (${att}%) is below mandatory 75% threshold`);
        } else if (att <= 82) {
          score += 25;
          reasons.push(`Attendance (${att}%) is near watch boundary`);
        } else if (att <= 88) {
          score += 10;
        }
      }

      // 2. Performance Opportunity (Max 30 pts)
      if (gp !== null) {
        if (gp <= 6) {
          score += 30;
          reasons.push(`Current grade (${gr}) has high improvement potential`);
        } else if (gp <= 8) {
          score += 20;
          reasons.push(`Grade (${gr}) offers solid buffer upgrade potential`);
        } else if (gp < 9) {
          score += 10;
        }
      }

      // 3. Credit Weight Impact (Max 15 pts)
      score += Math.min(15, cr * 3.75);
      reasons.push(`Carries meaningful ${cr}-credit academic weight`);

      // 4. Upcoming Deadlines (Max 25 pts)
      if (upcomingExam) {
        score += 25;
        reasons.push(`Upcoming examination scheduled (${upcomingExam.date})`);
      } else if (upcomingAssignment) {
        score += 15;
        reasons.push(`Active assignment pending submission`);
      }

      // 5. Passion Alignment (Max 10 pts)
      if (isPassionAligned) {
        score += 10;
        reasons.push(`Directly aligns with your ${passionTrack.replace('_', '/')} passion track`);
      }

      const finalScore = Math.round(score);

      // Determine Quadrant
      const isHighImpact = finalScore >= 50 || cr >= 4;
      const isNeedsImprovement = (att !== null && att < 82) || (gp !== null && gp <= 8);

      let quadrant: 'PRIORITIZE' | 'MAINTAIN' | 'MONITOR' | 'LOW_PRIORITY' = 'LOW_PRIORITY';
      if (isHighImpact && isNeedsImprovement) quadrant = 'PRIORITIZE';
      else if (isHighImpact && !isNeedsImprovement) quadrant = 'MAINTAIN';
      else if (!isHighImpact && isNeedsImprovement) quadrant = 'MONITOR';

      resultList.push({
        subjectName,
        attendancePct: att,
        grade: gr,
        gradePoint: gp,
        credits: cr,
        upcomingExam,
        upcomingAssignment,
        opportunityScore: finalScore,
        reasons,
        quadrant,
        isPassionAligned
      });
    });

    // Sort by Opportunity Score descending
    return resultList.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [attendanceRec, gradeRec, customCourseExcelData, examinations, assignments, passionTrack]);

  // 2. NEXT BEST MOVE (Top Ranked Subject)
  const nextBestMove = useMemo<UnifiedSubjectMetrics | null>(() => {
    if (unifiedSubjects.length === 0) return null;
    return unifiedSubjects[0];
  }, [unifiedSubjects]);

  // Set default What-If subject selectors once subjects load
  useEffect(() => {
    if (unifiedSubjects.length > 0) {
      if (!whatIfSubjectA) setWhatIfSubjectA(unifiedSubjects[0].subjectName);
      if (!whatIfSubjectB) setWhatIfSubjectB(unifiedSubjects[1]?.subjectName || unifiedSubjects[0].subjectName);
    }
  }, [unifiedSubjects]);

  // Initialize Today's Focus Tasks when Next Best Move changes
  useEffect(() => {
    if (nextBestMove) {
      const nextMoveName = nextBestMove.subjectName;
      const quickWinAssignment = assignments.find(a => !assignmentStatuses.some(s => s.assignment_id === a.id && s.status === 'COMPLETED'));

      setTasks([
        {
          id: 1,
          time: energyPreference === 'MORNING' ? '09:00' : energyPreference === 'AFTERNOON' ? '14:00' : '18:30',
          title: `Deep Work: ${nextMoveName} Core Review`,
          course: `${nextMoveName} · Next Best Move`,
          duration: '60 min',
          complete: false,
          tone: 'teal',
          type: 'HIGHEST_IMPACT'
        },
        {
          id: 2,
          time: '14:30',
          title: quickWinAssignment ? `Submit ${quickWinAssignment.title}` : 'Quick Academic Practice',
          course: quickWinAssignment ? quickWinAssignment.subject_name : 'Quick Win',
          duration: '30 min',
          complete: false,
          tone: 'amber',
          type: 'QUICK_WIN'
        },
        {
          id: 3,
          time: '17:00',
          title: `Deadline Protection: ${examinations[0]?.title || 'Assessment Prep'}`,
          course: examinations[0]?.subject || 'Target Exam',
          duration: '45 min',
          complete: false,
          tone: 'coral',
          type: 'DEADLINE_PROTECTION'
        },
        {
          id: 4,
          time: '20:00',
          title: 'Recovery & Progress Review',
          course: 'Mindset & Rest',
          duration: '30 min',
          complete: false,
          tone: 'violet',
          type: 'RECOVERY'
        }
      ]);
    }
  }, [nextBestMove, assignments, assignmentStatuses, examinations, energyPreference]);

  // Overall Academic Health State
  const overallState = useMemo<'GOOD' | 'WATCH' | 'AT_RISK'>(() => {
    if (!attendanceRec && !gradeRec) return 'GOOD';
    const isAttRisk = attendanceRec?.overallStatus === 'At Risk' || (attendanceRec?.overallAttendancePercentage !== null && (attendanceRec?.overallAttendancePercentage ?? 100) < 75);
    const isAttWatch = attendanceRec?.overallStatus === 'Watch' || (attendanceRec?.overallAttendancePercentage !== null && (attendanceRec?.overallAttendancePercentage ?? 100) < 82);
    if (isAttRisk) return 'AT_RISK';
    if (isAttWatch) return 'WATCH';
    return 'GOOD';
  }, [attendanceRec, gradeRec]);

  // Dynamic Summary Counters
  const summaryCounts = useMemo(() => {
    const activeTasks = assignments.filter(a => !assignmentStatuses.some(s => s.assignment_id === a.id && s.status === 'COMPLETED')).length;
    const upcomingDeadlines = examinations.length + activeTasks;
    const attentionAreas = unifiedSubjects.filter(s => s.quadrant === 'PRIORITIZE' || s.quadrant === 'MONITOR').length;
    return {
      subjectsCount: unifiedSubjects.length,
      activeTasks,
      upcomingDeadlines,
      attentionAreas
    };
  }, [unifiedSubjects, assignments, assignmentStatuses, examinations]);

  // Passion Matching Items
  const passionMatchingItems = useMemo(() => {
    const keywords: Record<PassionCategory, string[]> = {
      AI_ML: ['machine', 'learning', 'ai', 'data', 'python'],
      CLOUD: ['cloud', 'aws', 'devops', 'network', 'distributed'],
      CYBERSECURITY: ['security', 'crypto', 'network', 'cyber'],
      SOFTWARE_ENG: ['java', 'software', 'architecture', 'web'],
      DATA_SCIENCE: ['analytics', 'database', 'sql', 'data'],
      RESEARCH: ['algorithm', 'theory', 'compiler', 'paper']
    };
    const kw = keywords[passionTrack] || [];

    const matchedSubjects = unifiedSubjects.filter(s => kw.some(k => s.subjectName.toLowerCase().includes(k)));
    const matchedGoals = goals.filter(g => kw.some(k => g.title.toLowerCase().includes(k)));
    const matchedHackathons = hackathons.filter(h => kw.some(k => h.title.toLowerCase().includes(k) || h.description?.toLowerCase().includes(k)));
    
    return {
      subjects: matchedSubjects,
      goals: matchedGoals,
      hackathons: matchedHackathons
    };
  }, [passionTrack, unifiedSubjects, goals, hackathons]);

  // AI Rebalance Action
  const handleRebalanceWithAi = async () => {
    setIsRebalancing(true);
    try {
      const summaryText = unifiedSubjects.map(s => `- ${s.subjectName}: ${s.credits} Credits, Grade: ${s.grade || 'N/A'}, Attendance: ${s.attendancePct !== null ? s.attendancePct + '%' : 'N/A'}`).join('\n');
      
      const prompt = `Analyze this student's subjects and academic weight:
${summaryText}

Find the highest yield grade arbitrage opportunity by shifting focus to high-credit or threshold-risk subjects. Provide 3 optimized focus blocks for today. Reply in JSON: { "blocks": [{ "time": "10:00", "title": "...", "course": "...", "duration": "60 min", "tone": "teal" }], "creditLogic": "Short 1-sentence rationale" }`;
      
      const res = await askStudentAi(prompt, user?.email);
      if (res && res.answer && typeof res.answer === 'string') {
        try {
          const cleanJson = res.answer.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const newTasks: FocusBlock[] = parsed.blocks.map((b: any, idx: number) => ({
              id: Date.now() + idx,
              time: b.time || '10:00',
              title: b.title || 'Arbitrage focus block',
              course: b.course || 'Optimized Priority',
              duration: b.duration || '60 min',
              complete: false,
              tone: (['teal', 'coral', 'amber', 'violet'] as Tone[]).includes(b.tone) ? b.tone : 'teal'
            }));
            setTasks(newTasks);
          }
          if (parsed.creditLogic) setCreditLogic(parsed.creditLogic);
        } catch {
          setCreditLogic("Reallocated focus to higher-credit modules to maximize total academic return.");
        }
      }
    } catch {
      setCreditLogic("Reallocated focus to higher-credit modules to maximize total academic return.");
    } finally {
      setIsRebalancing(false);
    }
  };

  const doneCount = tasks.filter(t => t.complete).length;

  return (
    <div className="space-y-8 animate-fade pb-12">
      {/* 1. NEW PAGE HERO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xl  relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700 mb-3">
              <Compass size={14} />
              UNIFIED STRATEGY CENTER · STUDENT DECISION INTELLIGENCE
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Turn your academic data into your next best move.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Cogniva connects workload, attendance, performance, deadlines and goals to help you decide what deserves your attention next.
            </p>

            {/* Dynamic State & Metrics Row */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border ${
                overallState === 'GOOD'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : overallState === 'WATCH'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {overallState === 'GOOD' ? '● GOOD STANDING' : overallState === 'WATCH' ? '● WATCH LIST' : '● ACADEMIC ALERT'}
              </span>

              <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                <strong className="text-teal-700">{summaryCounts.subjectsCount}</strong> Tracked Subjects
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                <strong className="text-amber-700">{summaryCounts.activeTasks}</strong> Active Tasks
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                <strong className="text-cyan-700">{summaryCounts.upcomingDeadlines}</strong> Upcoming Deadlines
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                <strong className="text-rose-700">{summaryCounts.attentionAreas}</strong> Attention Areas
              </span>
            </div>
          </div>

          {/* Excel Import Control */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <input
              type="file"
              accept=".xlsx, .xls"
              id="strategy-excel-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="strategy-excel-upload"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={16} className="text-teal-700" />
              {isParsingExcel ? 'Parsing Sheet...' : fileName ? `Loaded: ${fileName}` : 'Import Course Excel (.xlsx)'}
            </label>
            <button
              onClick={loadAllRealData}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-teal-700' : ''} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white/40 rounded-2xl border border-slate-200">
          <BrainCircuit size={32} className="mx-auto text-teal-700 animate-spin mb-3" />
          <p className="text-slate-800 font-bold text-sm">Synthesizing Student Decision Intelligence...</p>
          <p className="text-slate-500 text-xs mt-1">Combining attendance, grades, deadlines, credit weights, and career goals...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={loadAllRealData} className="px-3 py-1 bg-rose-500/20 text-rose-200 text-xs rounded border border-rose-200">Retry</button>
        </div>
      ) : (
        <>
          {/* 2. MAIN FEATURE — "NEXT BEST MOVE" */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 p-6 md:p-8 rounded-2xl border border-teal-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-600 border border-teal-500/30">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 font-mono">
                    ✦ NEXT BEST MOVE — "What should you work on next?"
                  </span>
                </div>

                {nextBestMove ? (
                  <div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {nextBestMove.subjectName}
                      </h2>
                      <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-500/30 text-teal-600 text-xs font-mono font-bold">
                        45–60 minutes
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        nextBestMove.opportunityScore >= 60
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {nextBestMove.opportunityScore >= 60 ? 'CRITICAL IMPACT' : 'HIGH IMPACT'}
                      </span>
                    </div>

                    {/* WHY COGNIVA CHOSE THIS (3-5 Factual Reasons) */}
                    <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-mono">
                        Why Cogniva Chose This:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {nextBestMove.reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-200">
                            <CheckCircle2 size={14} className="text-teal-700 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">
                    Data not available yet. Upload a course excel file or wait for imported subject evaluation records.
                  </div>
                )}
              </div>

              {/* Action & Academic Impact Meter */}
              <div className="w-full lg:w-72 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shrink-0">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 font-mono">
                    Academic Impact
                  </span>
                  {/* Visual Impact Meter Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>LOW</span>
                      <span>MEDIUM</span>
                      <span className="text-teal-700 font-bold">HIGH</span>
                    </div>
                    <div className="relative w-full h-3 bg-white rounded-full border border-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500 transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(30, (nextBestMove?.opportunityScore || 50)))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (nextBestMove) {
                      setTasks(prev => [
                        {
                          id: Date.now(),
                          time: 'NOW',
                          title: `Start Focus: ${nextBestMove.subjectName}`,
                          course: `${nextBestMove.subjectName} · Next Best Move`,
                          duration: '45 min',
                          complete: false,
                          tone: 'teal',
                          type: 'HIGHEST_IMPACT'
                        },
                        ...prev
                      ]);
                    }
                  }}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={15} />
                  Start Focus Session
                </button>
              </div>
            </div>
          </div>

          {/* 3. ACADEMIC OPPORTUNITY MAP (2D GRID VISUALIZATION) */}
          <div className="bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider font-mono">
                  Interactive 2D Matrix
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Academic Opportunity Map
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                X-Axis: Current Standing | Y-Axis: Priority / Opportunity Score
              </span>
            </div>

            {unifiedSubjects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Data not available yet. Upload course excel or publish grades to visualize subjects on the opportunity map.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quadrant 1: Prioritize (High Impact + Needs Improvement) */}
                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-700" />
                      1. High Impact + Needs Improvement
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 text-[10px] font-bold font-mono">
                      PRIORITIZE
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unifiedSubjects.filter(s => s.quadrant === 'PRIORITIZE').map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubject(sub)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 group-hover:text-rose-600 transition-colors block">
                            {sub.subjectName}
                          </strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Att: <strong className="text-rose-700">{sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}</strong> | Grade: <strong className="text-slate-800">{sub.grade || 'N/A'}</strong> | {sub.credits} Cr
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded">
                          Score: {sub.opportunityScore}
                        </span>
                      </button>
                    ))}
                    {unifiedSubjects.filter(s => s.quadrant === 'PRIORITIZE').length === 0 && (
                      <p className="text-[11px] text-slate-9000 italic">No urgent priority subjects in this quadrant.</p>
                    )}
                  </div>
                </div>

                {/* Quadrant 2: Maintain (High Impact + Strong) */}
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      2. High Impact + Strong Standing
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 text-[10px] font-bold font-mono">
                      MAINTAIN
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unifiedSubjects.filter(s => s.quadrant === 'MAINTAIN').map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubject(sub)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 group-hover:text-emerald-600 transition-colors block">
                            {sub.subjectName}
                          </strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Att: <strong className="text-emerald-700">{sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}</strong> | Grade: <strong className="text-slate-800">{sub.grade || 'N/A'}</strong> | {sub.credits} Cr
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                          Score: {sub.opportunityScore}
                        </span>
                      </button>
                    ))}
                    {unifiedSubjects.filter(s => s.quadrant === 'MAINTAIN').length === 0 && (
                      <p className="text-[11px] text-slate-9000 italic">No subjects in this quadrant.</p>
                    )}
                  </div>
                </div>

                {/* Quadrant 3: Monitor (Low Impact + Needs Improvement) */}
                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye size={14} className="text-amber-700" />
                      3. Low Impact + Needs Improvement
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 text-[10px] font-bold font-mono">
                      MONITOR
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unifiedSubjects.filter(s => s.quadrant === 'MONITOR').map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubject(sub)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 group-hover:text-amber-600 transition-colors block">
                            {sub.subjectName}
                          </strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Att: <strong className="text-amber-700">{sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}</strong> | Grade: <strong className="text-slate-800">{sub.grade || 'N/A'}</strong> | {sub.credits} Cr
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          Score: {sub.opportunityScore}
                        </span>
                      </button>
                    ))}
                    {unifiedSubjects.filter(s => s.quadrant === 'MONITOR').length === 0 && (
                      <p className="text-[11px] text-slate-9000 italic">No subjects in this quadrant.</p>
                    )}
                  </div>
                </div>

                {/* Quadrant 4: Low Priority (Low Impact + Strong) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-slate-500" />
                      4. Low Impact + Strong Standing
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold font-mono">
                      LOW PRIORITY
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unifiedSubjects.filter(s => s.quadrant === 'LOW_PRIORITY').map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubject(sub)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <strong className="text-xs text-slate-900 group-hover:text-slate-700 transition-colors block">
                            {sub.subjectName}
                          </strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Att: <strong>{sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}</strong> | Grade: <strong>{sub.grade || 'N/A'}</strong> | {sub.credits} Cr
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          Score: {sub.opportunityScore}
                        </span>
                      </button>
                    ))}
                    {unifiedSubjects.filter(s => s.quadrant === 'LOW_PRIORITY').length === 0 && (
                      <p className="text-[11px] text-slate-9000 italic">No subjects in this quadrant.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. ACADEMIC RISK RADAR & PRESSURE SIGNALS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pressure Signals Panel */}
            <div className="lg:col-span-6 bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <HeartPulse size={18} className="text-rose-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Academic Pressure Signals
                </h3>
              </div>

              <div className="space-y-3">
                {unifiedSubjects.filter(s => (s.attendancePct !== null && s.attendancePct < 82) || s.upcomingExam).map((sub, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900">{sub.subjectName}</strong>
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-500/20">
                        {sub.attendancePct !== null && sub.attendancePct < 75 ? 'Critical Risk' : 'Watch Signal'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Attendance: <strong className="text-slate-800">{sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}</strong> | Grade: <strong className="text-slate-800">{sub.grade || 'N/A'}</strong>
                      {sub.upcomingExam ? ` | Exam: ${sub.upcomingExam.title}` : ''}
                    </p>
                  </div>
                ))}

                {unifiedSubjects.filter(s => (s.attendancePct !== null && s.attendancePct < 82) || s.upcomingExam).length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                    No active pressure signals detected. All attendance and examination indicators are in good standing.
                  </div>
                )}
              </div>
            </div>

            {/* Academic Risk Radar Panel */}
            <div className="lg:col-span-6 bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Academic Risk Radar
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">6 Dimensions</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Attendance</span>
                  <strong className="text-xs text-slate-900 block">
                    {attendanceRec ? `${attendanceRec.subjectAttendances.filter(s => s.attendancePercentage < 75).length} Near Threshold` : 'Data not available yet'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Performance</span>
                  <strong className="text-xs text-slate-900 block">
                    {gradeRec ? `Overall: ${gradeRec.overallGrade || 'N/A'}` : 'Data not available yet'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Workload</span>
                  <strong className="text-xs text-slate-900 block">
                    {assignments.length > 0 ? `${summaryCounts.activeTasks} Active Tasks` : 'Data not available yet'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Deadlines</span>
                  <strong className="text-xs text-slate-900 block">
                    {examinations.length > 0 ? `${examinations.length} Exams` : 'Data not available yet'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Consistency</span>
                  <strong className="text-xs text-teal-700 block font-mono">
                    {attendanceRec?.overallStatus === 'Good' ? 'High' : 'Moderate'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Goal Progress</span>
                  <strong className="text-xs text-purple-400 block font-mono">
                    {goals.length > 0 ? `${goals.length} Active Goals` : 'Data not available yet'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 5. WORKLOAD HEATMAP & ENERGY-AWARE PLANNING */}
          <div className="bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider font-mono">
                  Weekly Schedule & Energy Alignment
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Interactive Workload Heatmap
                </h3>
              </div>

              {/* Energy Preference Switcher */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 px-2 font-mono">Energy Peak:</span>
                {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setEnergyPreference(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                      energyPreference === p
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Heatmap Grid */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedHeatmapDay(day)}
                      className={`px-2 py-1 rounded transition-all ${
                        selectedHeatmapDay === day ? 'bg-teal-500/20 text-teal-600 font-bold border border-teal-500/40' : 'hover:text-slate-800'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }, (_, index) => {
                    const level = (index * 3) % 5;
                    return (
                      <div
                        key={index}
                        className={`h-8 rounded-lg border transition-all cursor-pointer ${
                          level === 4
                            ? 'bg-rose-500/30 border-rose-500/50'
                            : level === 3
                            ? 'bg-amber-500/30 border-amber-500/50'
                            : level === 2
                            ? 'bg-teal-500/30 border-teal-500/50'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                        title={`Day ${index + 1} Workload`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Light Load</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
                    <span className="w-3 h-3 rounded bg-teal-500/30 border border-teal-500/50" />
                    <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
                    <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50" />
                  </div>
                  <span>Peak Load</span>
                </div>
              </div>

              {/* Selected Day Workload Detail Drawer */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    {selectedHeatmapDay || 'Thursday'} Schedule Load
                  </strong>
                  <span className="text-[11px] text-teal-700 font-mono font-bold">
                    Energy Window: {energyPreference}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>Active Tasks Scheduled:</span>
                    <span className="font-mono font-bold text-teal-700">{summaryCounts.activeTasks}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>Examinations Pending:</span>
                    <span className="font-mono font-bold text-cyan-700">{examinations.length}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  "Use your <strong className="text-teal-600">{energyPreference.toLowerCase()}</strong> high-focus window for {nextBestMove?.subjectName || 'core subjects'}."
                </p>
              </div>
            </div>
          </div>

          {/* 6. YOUR PASSION TRACK & ALIGNMENT VISUALIZATION */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-purple-950/30 p-6 rounded-2xl border border-purple-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                  Career & Passion Alignment Journey
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  YOUR PASSION TRACK
                </h3>
              </div>

              {/* Passion Selector */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                {([
                  { key: 'AI_ML', label: '🤖 AI / ML' },
                  { key: 'CLOUD', label: '☁ Cloud' },
                  { key: 'CYBERSECURITY', label: '🛡 Cyber' },
                  { key: 'SOFTWARE_ENG', label: '💻 Software' },
                  { key: 'DATA_SCIENCE', label: '📊 Data' },
                  { key: 'RESEARCH', label: '🔬 Research' }
                ] as const).map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPassionTrack(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      passionTrack === p.key
                        ? 'bg-purple-500 text-white shadow-md font-bold'
                        : 'text-slate-500 hover:text-purple-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Circular Connected Visualization Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedPassionNode('SUBJECTS')}
                className={`p-4 rounded-xl border transition-all text-left space-y-2 ${
                  selectedPassionNode === 'SUBJECTS'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <BookOpen size={16} className="text-purple-400" />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {passionMatchingItems.subjects.length}
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block">1. Learn (Subjects)</strong>
                <p className="text-[11px] text-slate-500">Relevant CSE course modules</p>
              </button>

              <button
                onClick={() => setSelectedPassionNode('GOALS')}
                className={`p-4 rounded-xl border transition-all text-left space-y-2 ${
                  selectedPassionNode === 'GOALS'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Target size={16} className="text-purple-400" />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {passionMatchingItems.goals.length}
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block">2. Target (Goals)</strong>
                <p className="text-[11px] text-slate-500">Personal career milestones</p>
              </button>

              <button
                onClick={() => setSelectedPassionNode('HACKATHONS')}
                className={`p-4 rounded-xl border transition-all text-left space-y-2 ${
                  selectedPassionNode === 'HACKATHONS'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Flame size={16} className="text-purple-400" />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {passionMatchingItems.hackathons.length}
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block">3. Compete (Hackathons)</strong>
                <p className="text-[11px] text-slate-500">Real external opportunities</p>
              </button>

              <button
                onClick={() => setSelectedPassionNode('PROJECTS')}
                className={`p-4 rounded-xl border transition-all text-left space-y-2 ${
                  selectedPassionNode === 'PROJECTS'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Award size={16} className="text-purple-400" />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Active
                  </span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block">4. Build & Career</strong>
                <p className="text-[11px] text-slate-500">Placement readiness</p>
              </button>
            </div>

            {/* Selected Passion Node Detail List */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono block">
                Matching {selectedPassionNode} Records ({passionTrack.replace('_', '/')})
              </span>
              
              {selectedPassionNode === 'SUBJECTS' && (
                <div className="space-y-1.5 text-xs text-slate-700">
                  {passionMatchingItems.subjects.map((s, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                      <span>{s.subjectName}</span>
                      <span className="font-mono text-purple-400 font-bold">{s.credits} Credits</span>
                    </div>
                  ))}
                  {passionMatchingItems.subjects.length === 0 && <p className="text-slate-9000 italic text-[11px]">No specific matching subjects in current roster.</p>}
                </div>
              )}

              {selectedPassionNode === 'GOALS' && (
                <div className="space-y-1.5 text-xs text-slate-700">
                  {passionMatchingItems.goals.map((g, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                      <span>{g.title}</span>
                      <span className="font-mono text-purple-400">{g.target_date || 'Active'}</span>
                    </div>
                  ))}
                  {passionMatchingItems.goals.length === 0 && <p className="text-slate-9000 italic text-[11px]">No specific matching goals saved yet.</p>}
                </div>
              )}

              {selectedPassionNode === 'HACKATHONS' && (
                <div className="space-y-1.5 text-xs text-slate-700">
                  {passionMatchingItems.hackathons.slice(0, 3).map((h, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                      <span className="font-bold text-slate-900">{h.title}</span>
                      <span className="font-mono text-teal-700">{h.source || h.organizer}</span>
                    </div>
                  ))}
                  {passionMatchingItems.hackathons.length === 0 && <p className="text-slate-9000 italic text-[11px]">No matching hackathons found in live feeds.</p>}
                </div>
              )}

              {selectedPassionNode === 'PROJECTS' && (
                <p className="text-[11px] text-slate-500">
                  Combine coursework in <strong className="text-slate-800">{nextBestMove?.subjectName || 'core subjects'}</strong> with hackathon projects to build your portfolio.
                </p>
              )}
            </div>
          </div>

          {/* 7. WHAT IF I CHOOSE DIFFERENTLY? (DECISION PLAYGROUND) */}
          <div className="bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 font-mono">
                  Interactive Decision Playground
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  WHAT IF I CHOOSE DIFFERENTLY?
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Simulate ROI before committing time
              </span>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Study Time Slider */}
              <div className="md:col-span-5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Available Study Time:</span>
                  <span className="text-teal-700 font-bold">{Math.floor(whatIfStudyTime / 60)}h {whatIfStudyTime % 60}m</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={whatIfStudyTime}
                  onChange={e => setWhatIfStudyTime(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              {/* Subject Selectors A & B */}
              <div className="md:col-span-7 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Option A Focus:</label>
                  <select
                    value={whatIfSubjectA}
                    onChange={e => setWhatIfSubjectA(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    {unifiedSubjects.map((s, i) => (
                      <option key={i} value={s.subjectName}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Option B Focus:</label>
                  <select
                    value={whatIfSubjectB}
                    onChange={e => setWhatIfSubjectB(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    {unifiedSubjects.map((s, i) => (
                      <option key={i} value={s.subjectName}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Box */}
            {(() => {
              const subA = unifiedSubjects.find(s => s.subjectName === whatIfSubjectA);
              const subB = unifiedSubjects.find(s => s.subjectName === whatIfSubjectB);

              const scoreA = subA ? subA.opportunityScore : 0;
              const scoreB = subB ? subB.opportunityScore : 0;
              const isOptionAWinner = scoreA >= scoreB;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OPTION A CARD */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      isOptionAWinner ? 'bg-teal-950/20 border-teal-500/40' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-teal-700 font-mono">OPTION A</span>
                        {isOptionAWinner && <span className="text-[10px] bg-teal-500/20 text-teal-600 font-mono font-bold px-2 py-0.5 rounded">RECOMMENDED</span>}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">{whatIfSubjectA || 'Option A'}</h4>
                      <div className="space-y-1 text-xs text-slate-500 font-mono">
                        <div>Opportunity Score: <strong className="text-slate-800">{scoreA}</strong></div>
                        <div>Credits Weight: <strong className="text-slate-800">{subA?.credits || 3} Cr</strong></div>
                        <div>Attendance Status: <strong className={subA?.attendancePct && subA.attendancePct < 75 ? 'text-rose-700' : 'text-teal-600'}>{subA?.attendancePct !== null ? `${subA?.attendancePct}%` : 'N/A'}</strong></div>
                      </div>
                    </div>

                    {/* OPTION B CARD */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      !isOptionAWinner ? 'bg-teal-950/20 border-teal-500/40' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-cyan-700 font-mono">OPTION B</span>
                        {!isOptionAWinner && <span className="text-[10px] bg-teal-500/20 text-teal-600 font-mono font-bold px-2 py-0.5 rounded">RECOMMENDED</span>}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">{whatIfSubjectB || 'Option B'}</h4>
                      <div className="space-y-1 text-xs text-slate-500 font-mono">
                        <div>Opportunity Score: <strong className="text-slate-800">{scoreB}</strong></div>
                        <div>Credits Weight: <strong className="text-slate-800">{subB?.credits || 3} Cr</strong></div>
                        <div>Attendance Status: <strong className={subB?.attendancePct && subB.attendancePct < 75 ? 'text-rose-700' : 'text-teal-600'}>{subB?.attendancePct !== null ? `${subB?.attendancePct}%` : 'N/A'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Cogniva Recommendation Rationale */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-700">
                    <Sparkles size={18} className="text-teal-700 shrink-0" />
                    <div>
                      <strong className="text-slate-900 font-bold block">
                        Cogniva Recommendation: {isOptionAWinner ? whatIfSubjectA : whatIfSubjectB}
                      </strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {isOptionAWinner
                          ? `Allocating your ${Math.floor(whatIfStudyTime / 60)}h ${whatIfStudyTime % 60}m block to ${whatIfSubjectA} addresses higher immediate attendance or credit-weighted performance opportunity.`
                          : `Allocating your ${Math.floor(whatIfStudyTime / 60)}h ${whatIfStudyTime % 60}m block to ${whatIfSubjectB} addresses higher immediate attendance or credit-weighted performance opportunity.`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 8. TODAY'S STRATEGY & ADAPTIVE ACTION PLANNER */}
          <div className="bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider font-mono">
                  Execution Sequence
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  TODAY'S STRATEGY & ADAPTIVE PLANNER
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="segmented-control">
                  {(['Today', 'This week'] as const).map(item => (
                    <button
                      key={item}
                      className={view === item ? 'segment-active' : ''}
                      onClick={() => setView(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRebalanceWithAi}
                  disabled={isRebalancing}
                  className="px-3 py-2 bg-teal-50 hover:bg-teal-500/20 text-teal-600 text-xs font-semibold rounded-xl border border-teal-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} className={isRebalancing ? 'animate-spin text-teal-700' : ''} />
                  {isRebalancing ? 'Optimizing...' : '↺ Rebalance (AI Grade Arbitrage)'}
                </button>

                <button
                  onClick={() =>
                    setTasks(curr => [
                      ...curr,
                      {
                        id: Date.now(),
                        time: '19:30',
                        title: 'Custom Focus Block',
                        course: 'Self-Directed Study',
                        duration: '30 min',
                        complete: false,
                        tone: 'violet'
                      }
                    ])
                  }
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add block
                </button>
              </div>
            </div>

            {/* Credit Optimization Logic Alert if triggered */}
            {creditLogic && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-mono">
                <Sparkles size={14} className="text-amber-600" />
                <span>{creditLogic}</span>
              </div>
            )}

            {fileName && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between font-mono">
                <span>Loaded syllabus: <strong>{fileName}</strong> ({customCourseExcelData?.length || 0} courses parsed)</span>
                <button onClick={() => { setFileName(null); setCustomCourseExcelData(null); }} className="text-slate-500 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* 7. UNIFIED SUBJECT PRIORITIZATION MATRIX */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm space-y-0">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                Unified Subject Priority Matrix
              </h3>
              <span className="text-xs text-slate-9000 font-mono">
                Sorted by Opportunity Score (0-100 Scale)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-9000 uppercase tracking-wider bg-slate-50/40">
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-4 text-center">Credit Weight</th>
                    <th className="py-3.5 px-4 text-center">Attendance %</th>
                    <th className="py-3.5 px-4 text-center">Current Grade</th>
                    <th className="py-3.5 px-4 text-center">Opportunity Score</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedSubjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.subjectName}
                        {sub.isPassionAligned && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200">
                            Passion Track
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {sub.credits} Credits
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={sub.attendancePct !== null && sub.attendancePct < 75 ? 'text-rose-600' : 'text-emerald-600'}>
                          {sub.attendancePct !== null ? `${sub.attendancePct}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {sub.grade || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">
                          {sub.opportunityScore} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSubject(sub)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          Details
                          <ChevronRight size={13} className="text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. TODAY'S FOCUS BLOCKS LIST */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider font-mono">
                <Clock3 size={16} className="text-purple-600" />
                Today's Action Focus Queue
              </h3>
              <span className="text-xs text-slate-9000 font-mono">
                {doneCount} finished · {tasks.length - doneCount} remaining
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-2.5">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      task.complete ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTasks(curr => curr.map(item => item.id === task.id ? { ...item, complete: !item.complete } : item))}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          task.complete ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-blue-500'
                        }`}
                      >
                        {task.complete && <Check size={13} />}
                      </button>
                      <div>
                        <strong className="text-slate-900 text-xs block font-bold">{task.title}</strong>
                        <small className="text-[10px] text-slate-9000 block font-mono">{task.course}</small>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
                        {task.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Summary */}
              <div className="lg:col-span-4 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="text-center pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-9000 uppercase font-mono block">Daily Strategy Progress</span>
                  <strong className="text-3xl font-black font-mono text-blue-600 mt-1 block">
                    {Math.round((doneCount / Math.max(1, tasks.length)) * 100)}%
                  </strong>
                  <span className="text-[11px] text-slate-9000">{doneCount} of {tasks.length} blocks finished</span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-blue-600 shrink-0" />
                    <span>Highest Impact: {nextBestMove?.subjectName || 'Core Review'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-600 shrink-0" />
                    <span>Quick Win: Assignment Submission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-rose-600 shrink-0" />
                    <span>Deadline Protection: Examination Prep</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 9. COGNIVA STRATEGY ADVISOR */}
          <div className="bg-purple-50/70 p-6 rounded-2xl border border-purple-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-purple-100 border border-purple-200 rounded-xl text-purple-700 shrink-0">
              <BrainCircuit size={24} className="animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider font-mono">
                  Cogniva AI Strategy Advisor
                </h4>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-semibold border border-purple-200">
                  Gemini Grounded
                </span>
              </div>
              {aiStrategyLoading ? (
                <p className="text-xs text-slate-9000 animate-pulse">Generating personalized strategy advisory...</p>
              ) : (
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {aiStrategyAdvice || "Prioritize subjects near the 75% attendance threshold while maintaining momentum in core high-credit modules."}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* 10. SUBJECT DETAIL MODAL */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSubject(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">Subject Detail Intelligence</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedSubject.subjectName}</h3>
              </div>
              <button onClick={() => setSelectedSubject(null)} className="p-1 text-slate-500 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-9000">Attendance:</span>
                <span className={selectedSubject.attendancePct && selectedSubject.attendancePct < 75 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {selectedSubject.attendancePct !== null ? `${selectedSubject.attendancePct}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-9000">Current Grade:</span>
                <span className="text-slate-900 font-bold">{selectedSubject.grade || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-9000">Credit Weight:</span>
                <span className="text-slate-900 font-bold">{selectedSubject.credits} Credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-9000">Opportunity Score:</span>
                <span className="text-blue-700 font-bold">{selectedSubject.opportunityScore} / 100</span>
              </div>
            </div>

            <div className="space-y-2">
              <strong className="text-xs text-slate-800 font-bold uppercase font-mono block">Why It Matters:</strong>
              <div className="space-y-1">
                {selectedSubject.reasons.map((r, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-slate-800">
              <strong className="block font-bold mb-0.5 text-blue-900">Recommended Next Action:</strong>
              Complete a 45-minute focus session for {selectedSubject.subjectName} before starting lower-priority coursework.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
