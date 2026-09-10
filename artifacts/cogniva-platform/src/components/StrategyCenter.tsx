import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  HeartPulse,
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock3,
  Target,
  Lightbulb,
  Check,
  MoreHorizontal,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { askStudentAi } from '../lib/ai-service';
import { CourseData, INITIAL_COURSE_DATA, parseCourseExcel } from '../lib/excelAnalytics';
import { useAuth } from '../lib/auth-context';

type Tone = 'teal' | 'amber' | 'coral' | 'violet';

interface FocusBlock {
  id: number | string;
  time: string;
  title: string;
  course: string;
  duration: string;
  complete: boolean;
  tone: Tone;
}

interface SkipSimulationResult {
  status: 'safe' | 'danger';
  message: string;
}

function Chip({ children, tone = 'teal' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function StrategyCenter() {
  const { user } = useAuth();

  // Excel Course Dataset state
  const [courseData, setCourseData] = useState<CourseData[]>(INITIAL_COURSE_DATA);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // Early Warning Flags state
  const [selectedSubject, setSelectedSubject] = useState<CourseData | null>(null);
  const [simulatingSubject, setSimulatingSubject] = useState<string | null>(null);
  const [skipResults, setSkipResults] = useState<Record<string, SkipSimulationResult>>({});

  // Focus Blocks & Rebalance state
  const [tasks, setTasks] = useState<FocusBlock[]>([
    { id: 1, time: '10:00', title: 'Finish ML evaluation notebook', course: 'CS402 · Deep work', duration: '90 min', complete: false, tone: 'teal' },
    { id: 2, time: '14:30', title: 'Probability practice set', course: 'MA301 · Recovery block', duration: '45 min', complete: false, tone: 'coral' },
    { id: 3, time: '17:00', title: 'Research mentor office hours', course: 'Career goal · Conversation', duration: '20 min', complete: false, tone: 'amber' }
  ]);
  const [view, setView] = useState<'Today' | 'This week'>('Today');

  // AI Rebalance & Credit Optimization state
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [creditLogic, setCreditLogic] = useState<string>(
    'Prioritized 4-credit Generative AI (C grade) over 2-credit Compiler Design to protect semester GPA.'
  );

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseCourseExcel(buffer);
      setCourseData(parsed);
    } catch (err) {
      console.error('Excel parse error:', err);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // AI Feature 1: "Safest Class to Skip" Simulation
  const handleSimulateSkip = async (course: CourseData) => {
    setSimulatingSubject(course.subject);
    try {
      const prompt = `A student has ${course.attendancePercentage}% attendance and current grade '${course.currentGrade}' in ${course.subject} (${course.credits} credits). The minimum required attendance threshold is 75%. Will skipping tomorrow's class put them in danger of falling below 75% or hurting their grade standing? Reply in pure JSON format: { "status": "safe" | "danger", "message": "Short 1-2 sentence explanation" }`;

      const res = await askStudentAi(prompt, user?.email, 'simulate_skip');
      if (res.success && res.answer) {
        try {
          const cleanJson = res.answer.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          setSkipResults(prev => ({
            ...prev,
            [course.subject]: {
              status: parsed.status === 'safe' ? 'safe' : 'danger',
              message: parsed.message || 'Simulation completed.'
            }
          }));
        } catch {
          const isDanger = course.attendancePercentage <= 78;
          setSkipResults(prev => ({
            ...prev,
            [course.subject]: {
              status: isDanger ? 'danger' : 'safe',
              message: isDanger
                ? `Skipping ${course.subject} will drop your attendance near or below the mandatory 75% threshold.`
                : `Skipping 1 session keeps attendance at ${course.attendancePercentage - 2}%, which remains above 75%.`
            }
          }));
        }
      } else {
        const isDanger = course.attendancePercentage <= 78;
        setSkipResults(prev => ({
          ...prev,
          [course.subject]: {
            status: isDanger ? 'danger' : 'safe',
            message: isDanger
              ? `Skipping ${course.subject} drops attendance near 75%. Not recommended.`
              : `Current attendance is ${course.attendancePercentage}%. 1 skip is within safety margins.`
          }
        }));
      }
    } catch {
      setSkipResults(prev => ({
        ...prev,
        [course.subject]: {
          status: course.attendancePercentage <= 78 ? 'danger' : 'safe',
          message: `Skipping ${course.subject} will adjust attendance to ${course.attendancePercentage - 2}%.`
        }
      }));
    } finally {
      setSimulatingSubject(null);
    }
  };

  // AI Features 2 & 3: Grade Arbitrage & Credit-Weighted Optimization ("↺ Rebalance")
  const handleRebalanceWithAi = async () => {
    setIsRebalancing(true);
    try {
      const courseSummary = courseData.map(c => `- ${c.subject}: ${c.credits} Credits, Grade: ${c.currentGrade}, Attendance: ${c.attendancePercentage}%`).join('\n');

      const prompt = `Analyze this student's schedule and course roster:
${courseSummary}

Task: Find the highest yield 'Grade Arbitrage' opportunity by shifting study hours from a low-credit or high-grade 'A' class to a high-credit 'C' or 'B' class. Generate 3 new focus blocks for today to execute this strategy.

Reply ONLY in pure JSON format:
{
  "blocks": [
    { "time": "10:00", "title": "Focus block title", "course": "Subject · Strategy Note", "duration": "90 min", "tone": "teal" },
    { "time": "14:30", "title": "Focus block title", "course": "Subject · Strategy Note", "duration": "45 min", "tone": "coral" },
    { "time": "17:00", "title": "Focus block title", "course": "Subject · Strategy Note", "duration": "30 min", "tone": "amber" }
  ],
  "creditLogic": "1-sentence explanation of why you prioritized the high-credit class for maximum GPA impact"
}`;

      const res = await askStudentAi(prompt, user?.email, 'rebalance_arbitrage');
      if (res.success && res.answer) {
        try {
          const cleanJson = res.answer.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const newTasks: FocusBlock[] = parsed.blocks.map((b: any, idx: number) => ({
              id: Date.now() + idx,
              time: b.time || '10:00',
              title: b.title || 'Arbitrage focus block',
              course: b.course || 'High-Credit Optimization',
              duration: b.duration || '60 min',
              complete: false,
              tone: (['teal', 'coral', 'amber', 'violet'] as Tone[]).includes(b.tone) ? b.tone : 'teal'
            }));
            setTasks(newTasks);
          }
          if (parsed.creditLogic) {
            setCreditLogic(parsed.creditLogic);
          }
        } catch {
          // Fallback state update
          setTasks([
            { id: Date.now() + 1, time: '10:00', title: 'Generative AI (4 Cr) - Intensive Review', course: 'High Credit · Grade C to B Shift', duration: '90 min', complete: false, tone: 'teal' },
            { id: Date.now() + 2, time: '14:30', title: 'Data Analytics (4 Cr) - Quiz Prep', course: 'High Credit · Grade Protection', duration: '60 min', complete: false, tone: 'coral' },
            { id: Date.now() + 3, time: '17:00', title: 'Compiler Design (2 Cr) - Quick Maintenance', course: 'Low Credit · Light Review', duration: '30 min', complete: false, tone: 'amber' }
          ]);
          setCreditLogic('Reallocated 1.5 study hours to 4-credit Generative AI (Grade C) away from 2-credit Compiler Design to maximize total CGPA yield.');
        }
      }
    } catch {
      setTasks(current => [...current].reverse());
    } finally {
      setIsRebalancing(false);
    }
  };

  const doneCount = tasks.filter(t => t.complete).length;

  return (
    <div className="page-frame space-y-6">
      {/* HEADER & EXCEL UPLOADER */}
      <div className="welcome-row flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-teal-400 font-bold">
            <Sparkles size={14} /> Master Student Hub · Unified Strategy Center
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 mt-1">
            Workload Risk & Adaptive Action Strategy
          </h1>
          <p className="lede text-slate-400 text-xs md:text-sm mt-1">
            Combined workload heatmap, early warning signals, focus blocks, and credit-weighted AI grade arbitrage.
          </p>
        </div>

        {/* Excel Import Control */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            id="strategy-excel-upload"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="strategy-excel-upload"
            className="button button-secondary text-xs px-3 py-2 cursor-pointer flex items-center gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500/50"
          >
            <FileSpreadsheet size={15} className="text-teal-400" />
            {isParsingExcel ? 'Parsing Sheet...' : fileName ? `Loaded: ${fileName}` : 'Import Course Excel (.xlsx)'}
          </label>
        </div>
      </div>

      {/* TOP SECTION: PRESERVED RISK & WORKLOAD PAGE */}
      <div className="space-y-6">
        <div className="insight-banner p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
          <div className="insight-banner-icon p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
            <HeartPulse size={20} />
          </div>
          <div className="flex-1">
            <strong className="text-slate-100 text-sm font-semibold block">Your current risk profile is recoverable.</strong>
            <p className="text-slate-400 text-xs mt-0.5">
              Course credits & attendance tracked across {courseData.length} subjects. Workload is high but manageable.
            </p>
          </div>
          <Chip tone="amber">Monitor</Chip>
        </div>

        {/* Heatmap & Early Warning Flags Grid */}
        <div className="two-column-grid">
          {/* Workload Heatmap */}
          <section className="panel">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="eyebrow">Workload Heatmap</div>
                <h2 className="text-lg font-bold text-slate-100">This week at a glance</h2>
                <p className="text-xs text-slate-400">Darker cells mean more scheduled academic load.</p>
              </div>
            </div>

            <div className="heatmap mt-4">
              <div className="heatmap-days flex justify-between text-xs text-slate-400 font-mono mb-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="heatmap-grid grid grid-cols-7 gap-1.5">
                {Array.from({ length: 35 }, (_, index) => (
                  <button
                    key={index}
                    className={`heat-cell heat-${(index * 3) % 5} h-7 rounded-md bg-slate-800/80 transition-all hover:scale-105`}
                    aria-label={`Workload cell ${index + 1}`}
                  />
                ))}
              </div>
              <div className="heatmap-legend flex items-center justify-end gap-2 text-[10px] text-slate-400 font-mono mt-3">
                <span>Light</span>
                <i className="heat-cell heat-0 w-3 h-3 rounded bg-slate-900 border border-slate-800 inline-block" />
                <i className="heat-cell heat-2 w-3 h-3 rounded bg-teal-800/60 inline-block" />
                <i className="heat-cell heat-4 w-3 h-3 rounded bg-teal-500 inline-block" />
                <span>Heavy</span>
              </div>
            </div>
          </section>

          {/* Early Warning Flags Panel (with AI Feature 1: Safest Class to Skip) */}
          <section className="panel">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="eyebrow">Early Warning Flags</div>
                <h2 className="text-lg font-bold text-slate-100">Signals & Attendance Risk</h2>
              </div>
            </div>

            <div className="flag-list space-y-3">
              {courseData.map((course, idx) => {
                const isLow = course.attendancePercentage <= 78;
                const tone: Tone = isLow ? 'coral' : course.attendancePercentage <= 82 ? 'amber' : 'teal';
                const skipResult = skipResults[course.subject];

                return (
                  <div
                    key={course.subject || idx}
                    className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-lg ${isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'}`}>
                          <AlertTriangle size={15} />
                        </span>
                        <div>
                          <strong className="text-slate-100 text-xs block">{course.subject}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {course.credits} Credits · Grade: <strong className="text-slate-200">{course.currentGrade}</strong> · Att: <strong className={isLow ? 'text-rose-400' : 'text-teal-300'}>{course.attendancePercentage}%</strong>
                          </span>
                        </div>
                      </div>
                      <Chip tone={tone}>{course.attendancePercentage}%</Chip>
                    </div>

                    {/* AI Feature 1 Interactive Link */}
                    <div className="pt-1.5 border-t border-slate-800/80 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSimulateSkip(course)}
                        disabled={simulatingSubject === course.subject}
                        className="text-left text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                      >
                        <BrainCircuit size={13} className="text-teal-400" />
                        {simulatingSubject === course.subject ? 'Simulating with Gemini AI...' : 'Simulate skipping tomorrow\'s class →'}
                      </button>

                      {/* AI Result Inline Alert */}
                      {skipResult && (
                        <div
                          className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                            skipResult.status === 'safe'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {skipResult.status === 'safe' ? (
                            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <strong className="block text-[11px] font-bold">
                              {skipResult.status === 'safe' ? 'SAFE TO SKIP (ATTENDANCE SAFE)' : 'DANGER ALERT (BELOW 75% RISK)'}
                            </strong>
                            <p className="text-[11px] mt-0.5 leading-snug">{skipResult.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM SECTION: PRESERVED ADAPTIVE ACTION PLANNER PAGE */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="welcome-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Adaptive Action Planner</div>
            <h2 className="text-xl font-bold text-slate-100">Make progress feel possible.</h2>
            <p className="lede text-xs text-slate-400">Time blocks adapt around deadlines, energy, and course credit weights.</p>
          </div>
          <div className="header-actions flex items-center gap-2">
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
              className="button button-primary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
              onClick={() =>
                setTasks(curr => [
                  ...curr,
                  {
                    id: Date.now(),
                    time: '19:30',
                    title: 'Review distributed systems flashcards',
                    course: 'CS404 · Light study',
                    duration: '30 min',
                    complete: false,
                    tone: 'violet'
                  }
                ])
              }
            >
              <Plus size={15} /> Add block
            </button>
          </div>
        </div>

        {/* Planner Overview Bar */}
        <div className="planner-overview p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="eyebrow">Thursday, 13 March</div>
            <h3 className="text-lg font-bold text-slate-100 mt-0.5">{tasks.length - doneCount} useful blocks left today.</h3>
            <p className="text-xs text-slate-400">Cogniva protected 45 minutes of recovery time after your morning lecture.</p>
          </div>
          <div className="planner-score text-center px-4 border-x border-slate-800">
            <strong className="text-2xl font-bold text-teal-400">{Math.round((doneCount / Math.max(1, tasks.length)) * 100)}%</strong>
            <span className="text-xs text-slate-400 block">complete</span>
          </div>
        </div>

        {/* Planner Layout: Focus Blocks & Planning Logic */}
        <div className="planner-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Focus Blocks Panel ("Your day in sequence") */}
          <section className="panel lg:col-span-2 planner-list-panel">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="eyebrow">Focus blocks</div>
                <h3 className="text-lg font-bold text-slate-100">
                  {view === 'Today' ? 'Your day in sequence' : 'Your week in sequence'}
                </h3>
              </div>

              {/* AI Features 2 & 3 Trigger: Rebalance Button */}
              <button
                type="button"
                onClick={handleRebalanceWithAi}
                disabled={isRebalancing}
                className="text-button text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/30"
              >
                <RefreshCw size={14} className={isRebalancing ? 'animate-spin' : ''} />
                {isRebalancing ? 'Optimizing Arbitrage...' : '↺ Rebalance (AI Grade Arbitrage)'}
              </button>
            </div>

            <div className="planner-list space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`planner-task p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between transition-all ${
                    task.complete ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="planner-time font-mono text-xs text-slate-400 font-medium">{task.time}</span>
                    <button
                      type="button"
                      className={`task-check w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                        task.complete ? 'border-teal-400 bg-teal-500/20 text-teal-300' : 'border-slate-700 hover:border-teal-400'
                      }`}
                      aria-label={`Complete ${task.title}`}
                      onClick={() =>
                        setTasks(curr =>
                          curr.map(item => (item.id === task.id ? { ...item, complete: !item.complete } : item))
                        )
                      }
                    >
                      {task.complete && <Check size={13} />}
                    </button>
                    <div>
                      <strong className="text-slate-100 text-xs block">{task.title}</strong>
                      <small className="text-[10px] text-slate-400 block">{task.course}</small>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Chip tone={task.tone}>{task.duration}</Chip>
                    <button
                      type="button"
                      className="icon-button subtle-button text-slate-500 hover:text-slate-300"
                      aria-label="Remove task"
                      onClick={() => setTasks(curr => curr.filter(item => item.id !== task.id))}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Planning Logic Panel ("Why this order?") */}
          <aside className="planner-aside space-y-4">
            <section className="panel">
              <div className="pb-3 border-b border-slate-800 mb-4">
                <div className="eyebrow">Planning logic</div>
                <h3 className="text-lg font-bold text-slate-100">Why this order?</h3>
              </div>

              <div className="logic-list space-y-3.5">
                {/* Row 1: Preserved */}
                <div className="flex items-start gap-3">
                  <div className="logic-icon p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 shrink-0">
                    <Clock3 size={15} />
                  </div>
                  <div>
                    <strong className="text-slate-200 text-xs block">Deadline first</strong>
                    <span className="text-[11px] text-slate-400 block leading-tight">ML notebook is due tomorrow.</span>
                  </div>
                </div>

                {/* Row 2: Preserved */}
                <div className="flex items-start gap-3">
                  <div className="logic-icon p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 shrink-0">
                    <HeartPulse size={15} />
                  </div>
                  <div>
                    <strong className="text-slate-200 text-xs block">Risk recovery</strong>
                    <span className="text-[11px] text-slate-400 block leading-tight">Probability needs a small, consistent lift.</span>
                  </div>
                </div>

                {/* Row 3 (NEW AI FEATURE 3): Credit Optimization */}
                <div className="flex items-start gap-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="logic-icon p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                    <Target size={15} />
                  </div>
                  <div>
                    <strong className="text-amber-300 text-xs block font-bold flex items-center gap-1">
                      <Sparkles size={12} /> Credit Optimization (AI)
                    </strong>
                    <span className="text-[11px] text-amber-200 block leading-tight mt-0.5 font-sans">
                      {creditLogic}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/student/explain"
                className="button button-secondary full-width text-xs mt-4 py-2 flex items-center justify-center gap-1.5"
              >
                <BrainCircuit size={15} /> See full explanation
              </Link>
            </section>

            <section className="panel planner-note p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl flex items-start gap-3">
              <Lightbulb size={19} className="text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 text-xs block font-semibold">Protect your energy</strong>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  You've planned {tasks.length * 45} minutes of focus today, inside your sustainable range.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
