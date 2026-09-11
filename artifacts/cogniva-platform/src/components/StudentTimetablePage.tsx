import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  getCurrentStudentContext,
  fetchStudentTimetable,
  FacultyTimetableEntry,
  StudentContext
} from '../lib/academic-api';

export function StudentTimetablePage() {
  const { user } = useAuth();
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<FacultyTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Day State
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const todayDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayDayName);

  useEffect(() => {
    loadTimetableData();
  }, [user?.email]);

  const loadTimetableData = async () => {
    setLoading(true);
    try {
      const ctx = await getCurrentStudentContext(user?.email);
      setStudentCtx(ctx);
      const sec = ctx.sectionName || 'CSE-C';
      const entries = await fetchStudentTimetable(sec);
      setTimetableEntries(entries);
    } catch (err) {
      console.error('Error loading student timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const sectionName = studentCtx?.sectionName || 'CSE-C';
  const deptName = studentCtx?.department || 'Computer Science & Engineering';

  // Filter timetable for selected day
  const selectedDayEntries = useMemo(() => {
    return timetableEntries
      .filter(t => t.day_of_week.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetableEntries, selectedDay]);

  // Live status helper
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getClassStatus = (startTimeStr: string, endTimeStr: string, day: string) => {
    if (day !== todayDayName) return null;
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (currentMinutes >= endMin) {
      return { label: 'Completed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      return { label: 'Now · Live Class', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold animate-pulse' };
    }
    const mins = startMin - currentMinutes;
    if (mins > 0 && mins < 60) {
      return { label: `Starts in ${mins} min`, color: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold' };
    }
    return { label: 'Upcoming', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  };

  const isSelectedDayToday = selectedDay === todayDayName;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <span>Academic Schedule · Section {sectionName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Student Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Dynamic weekly timetable grounded in official Supabase database allocations for <strong className="text-slate-800">{deptName} — Section {sectionName}</strong>.
          </p>
        </div>

        {/* Section Context Badges */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold">
            {sectionName}
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
            Semester {studentCtx?.semester || 4}
          </div>
        </div>
      </div>

      {/* Today Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">
              System Date & Day
            </div>
            <div className="text-base sm:text-lg font-bold font-serif">
              Today is {todayDayName}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {!isSelectedDayToday && (
          <button
            onClick={() => setSelectedDay(todayDayName)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition self-start sm:self-center"
          >
            <span>Jump to Today ({todayDayName.slice(0, 3)})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Day Selector Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {daysOfWeek.map(day => {
          const isToday = day === todayDayName;
          const isSelected = day === selectedDay;
          const dayEntriesCount = timetableEntries.filter(t => t.day_of_week.toLowerCase() === day.toLowerCase()).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex flex-col items-center min-w-[100px] shrink-0 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : isToday
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{day.slice(0, 3)}</span>
                {isToday && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-600'}`} />
                )}
              </div>
              <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                {dayEntriesCount > 0 ? `${dayEntriesCount} Classes` : 'No Classes'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timetable Schedule Grid for Selected Day */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold font-serif text-slate-900">
              {selectedDay} Schedule — Section {sectionName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDayEntries.length} scheduled periods • Grounded in Supabase timetable records
            </p>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Database Synchronized</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Fetching section timetable from Supabase...</span>
          </div>
        ) : selectedDayEntries.length > 0 ? (
          <div className="space-y-3">
            {selectedDayEntries.map((entry, index) => {
              const liveStatus = getClassStatus(entry.start_time, entry.end_time, selectedDay);

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    liveStatus?.label.includes('Live')
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Time & Period */}
                  <div className="flex items-center gap-4 min-w-[200px] shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      P{index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{entry.start_time} – {entry.end_time}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Period {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Subject & Faculty */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded">
                        {entry.subject_code || 'CS200'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {entry.subject_name}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.faculty_name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-slate-700 font-semibold">{entry.room_number}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Live Status Badge */}
                  {liveStatus && (
                    <div className="shrink-0 self-start md:self-center">
                      <span className={`px-3 py-1 rounded-full text-xs border ${liveStatus.color}`}>
                        {liveStatus.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State for Weekend or No Classes */
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Sun className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900">
                {selectedDay === 'Saturday' || selectedDay === 'Sunday'
                  ? `${selectedDay} — Weekend / No Classes Scheduled`
                  : `No Classes Scheduled for ${selectedDay}`}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                {selectedDay === 'Saturday' || selectedDay === 'Sunday'
                  ? 'Enjoy your weekend! Use this time for project work, skill development, or resting.'
                  : 'Your faculty/staff has not scheduled any periods for this section on this day.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
