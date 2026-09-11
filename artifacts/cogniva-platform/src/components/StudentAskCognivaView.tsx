import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Database,
  BrainCircuit,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Award,
  Compass,
  ArrowRight,
  RefreshCw,
  User,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  generateGroundedAcademicResponse,
  GroundedAcademicResponse,
  ActionButton
} from '../lib/academic-ai-assistant';
import { getCurrentStudentContext, StudentContext } from '../lib/academic-api';
import {
  StudentPageHeader,
  StudentSectionHeading,
  StudentStatusBadge,
  StudentSkeletonLoader
} from './ui/student-design-system';

interface ChatMessage {
  id: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: string;
  dataBadge?: string;
  actionButtons?: ActionButton[];
  suggestedFollowUps?: string[];
  isMissingData?: boolean;
}

export function StudentAskCognivaView() {
  const { user } = useAuth();
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadContext();
  }, [user?.email]);

  const loadContext = async () => {
    setLoadingContext(true);
    try {
      const email = user?.email || 'student001@cogniva.edu';
      const ctx = await getCurrentStudentContext(email);
      setStudentCtx(ctx);

      const welcomeMsg: ChatMessage = {
        id: 'welcome-01',
        from: 'ai',
        text: `Hello ${ctx?.name || 'Student'}! I am **Ask Cogniva**, your college-wide academic intelligence assistant.\n\nI am connected directly to your official Cogniva database (**${ctx?.department || 'CSE'} ${ctx?.year || '2nd Year'} - Section ${ctx?.section?.replace(/^.*?-/, '') || 'C'}**).\n\nAsk me anything about your class advisor, subject faculty, attendance, pending assignments, uploaded study materials, exam marks, or CGPA!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: `Grounded in Cogniva Academic Data • ${ctx?.department || 'CSE'}-${ctx?.section?.replace(/^.*?-/, '') || 'C'}`,
        suggestedFollowUps: [
          'Who is my class advisor?',
          'Who is handling Compiler Design?',
          'What is my attendance?',
          'What assignments are due soon?'
        ]
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error('Failed to load student context for Ask Cogniva:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleAsk = async (customPrompt?: string) => {
    const promptToSubmit = (customPrompt || inputPrompt).trim();
    if (!promptToSubmit || isProcessing) return;

    const email = user?.email || 'student001@cogniva.edu';
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      from: 'user',
      text: promptToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsProcessing(true);

    try {
      const groundedRes: GroundedAcademicResponse = await generateGroundedAcademicResponse(email, promptToSubmit);

      const aiMsgId = `ai_${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        from: 'ai',
        text: groundedRes.answer || 'Unable to retrieve grounded response from Cogniva.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: groundedRes.groundedDataBadge,
        actionButtons: groundedRes.actionButtons,
        suggestedFollowUps: groundedRes.suggestedFollowUps,
        isMissingData: groundedRes.isMissingData
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        from: 'ai',
        text: `⚠️ **Cogniva Assistant Error**: ${err?.message || 'Database grounding connection interrupted.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    if (studentCtx) {
      const resetMsg: ChatMessage = {
        id: `reset_${Date.now()}`,
        from: 'ai',
        text: `Chat cleared. Ask me another question about your **${studentCtx.department} ${studentCtx.year} (${studentCtx.section})** academics!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBadge: `Grounded in Cogniva Academic Data • ${studentCtx.department}-${studentCtx.section.replace(/^.*?-/, '')}`,
        suggestedFollowUps: [
          'Who is my class advisor?',
          'What subjects do I have?',
          'What is my attendance?'
        ]
      };
      setMessages([resetMsg]);
    }
  };

  const quickPrompts = [
    { label: 'Who is my class advisor?', category: 'Faculty' },
    { label: 'Who is handling Compiler Design?', category: 'Faculty' },
    { label: 'What is my attendance?', category: 'Attendance' },
    { label: 'Which subject has lowest attendance?', category: 'Attendance' },
    { label: 'What assignments are pending?', category: 'Assignments' },
    { label: 'What is my current CGPA?', category: 'Academics' },
    { label: 'What study materials are uploaded?', category: 'Materials' },
    { label: 'What internships can I apply for?', category: 'Career' }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* PAGE HEADER */}
      <StudentPageHeader
        eyebrow="Student Intelligence • Grounded AI Assistant"
        title="Ask Cogniva."
        subtitle="Your college-aware academic assistant. Ask natural-language questions about your class advisor, subject faculty, attendance, assignments, study materials, or CGPA."
        actions={
          <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-indigo-900">
              {studentCtx ? `${studentCtx.department} ${studentCtx.year} (${studentCtx.section})` : 'Connecting...'}
            </span>
          </div>
        }
      />

      {/* QUICK SUGGESTIONS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5 uppercase">
            <Sparkles size={14} className="text-indigo-600" />
            Grounded Quick Questions
          </span>
          <button
            onClick={handleClearChat}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-mono"
          >
            Clear Conversation
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map(qp => (
            <button
              key={qp.label}
              onClick={() => handleAsk(qp.label)}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase">{qp.category}</span>
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT MESSAGES LOG */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 md:p-6 space-y-4 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map(msg => {
          const isAi = msg.from === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'} animate-fade`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <BrainCircuit size={16} />
                </div>
              )}

              <div className={`space-y-2 max-w-2xl ${isAi ? 'w-full' : ''}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAi
                      ? 'bg-white border border-slate-200/80 text-slate-900 shadow-sm'
                      : 'bg-blue-600 text-white font-medium ml-auto self-end shadow-sm'
                  }`}
                >
                  <div className={`flex items-center justify-between gap-2 mb-1.5 text-[10px] font-mono ${isAi ? 'text-slate-400' : 'text-blue-100'}`}>
                    <span className="font-bold uppercase tracking-wider">{isAi ? 'Cogniva Academic Assistant' : 'You'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Missing Data Warning */}
                  {msg.isMissingData && (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2 font-mono">
                      <Info size={14} className="text-amber-600 shrink-0" />
                      <span>Missing DB Record: Cogniva never fabricates or guesses missing facts.</span>
                    </div>
                  )}

                  {/* Data Grounding Badge */}
                  {msg.dataBadge && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-mono text-indigo-600">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      <span>{msg.dataBadge}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {msg.actionButtons.map((btn, idx) => (
                      <a
                        key={idx}
                        href={btn.href || '#'}
                        className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/80 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {btn.label}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Smart Follow-Up Suggestions */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Suggested Follow-ups:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map(s => (
                        <button
                          key={s}
                          onClick={() => handleAsk(s)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-medium rounded-lg border border-slate-200/80 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <ChevronRight size={11} className="text-indigo-600" />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs shadow-sm mt-0.5">
                  ME
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl text-xs font-mono text-indigo-700 animate-pulse shadow-sm">
            <RefreshCw size={16} className="animate-spin text-indigo-600" />
            <span>Querying Cogniva backend data tables and resolving grounded context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* COMPOSER INPUT */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask about class advisor, faculty, attendance, assignments, CGPA..."
          disabled={isProcessing}
          className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={() => handleAsk()}
          disabled={isProcessing || !inputPrompt.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <span>Ask</span>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

