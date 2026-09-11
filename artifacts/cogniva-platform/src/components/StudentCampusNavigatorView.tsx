import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Clock,
  Building2,
  Calendar,
  UserCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Phone,
  Mail,
  User,
  Compass,
  AlertCircle
} from 'lucide-react';
import {
  getAllFacultyLocationsSummary,
  getFacultyCurrentLocation,
  getSectionCurrentClass,
  FacultyLocationStatus,
  SectionCurrentClassStatus,
  formatTime12Hour
} from '../lib/faculty-location-service';
import { fetchFacultyTimetable, fetchStudentMembers, FacultyTimetableEntry } from '../lib/academic-api';

export function StudentCampusNavigatorView() {
  const [facultyLocations, setFacultyLocations] = useState<FacultyLocationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Time & Day Simulator Mode (Real-time vs Test Date)
  const [useSimulation, setUseSimulation] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [simulatedHour, setSimulatedHour] = useState('10');
  const [simulatedMinute, setSimulatedMinute] = useState('15');

  // Section Live Lookup State
  const [targetSection, setTargetSection] = useState('CSE-C');
  const [sectionStatus, setSectionStatus] = useState<SectionCurrentClassStatus | null>(null);

  // Selected Faculty Modal State
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyLocationStatus | null>(null);
  const [modalTab, setModalTab] = useState<'MEETING' | 'TIMETABLE'>('MEETING');

  useEffect(() => {
    loadData();
  }, [searchQuery, departmentFilter, useSimulation, simulatedDay, simulatedHour, simulatedMinute]);

  const getSimulatedDate = (): Date | undefined => {
    if (!useSimulation) return undefined;

    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };
    const now = new Date();
    const currentDayIndex = now.getDay();
    const targetDayIndex = dayMap[simulatedDay] ?? 1;
    const diff = targetDayIndex - currentDayIndex;

    const simDate = new Date(now);
    simDate.setDate(now.getDate() + diff);
    simDate.setHours(parseInt(simulatedHour, 10) || 10, parseInt(simulatedMinute, 10) || 0, 0, 0);
    return simDate;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const simDate = getSimulatedDate();
      const [facSummary, secSummary] = await Promise.all([
        getAllFacultyLocationsSummary(searchQuery, departmentFilter, simDate),
        getSectionCurrentClass(targetSection, simDate)
      ]);

      setFacultyLocations(facSummary);
      setSectionStatus(secSummary);
    } catch (err) {
      console.error('Failed to fetch campus navigator data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionQueryChange = async (sec: string) => {
    setTargetSection(sec);
    const simDate = getSimulatedDate();
    const res = await getSectionCurrentClass(sec, simDate);
    setSectionStatus(res);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  Campus Intelligence Navigator
                </span>
                <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Schedule Grounded
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Faculty Location & Availability Navigator
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Know where to go. Know when to go. Grounded in official college timetables and room allocations.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-right">
                <div className="text-xs text-slate-500">Tracked Faculty</div>
                <div className="text-lg font-extrabold text-indigo-900">{facultyLocations.length} Members</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-xs text-slate-500">Operating Hours</div>
                <div className="text-xs font-bold text-slate-800">08:00 AM – 03:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Controls & Simulator Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty name, subject (e.g. DBMS), section (e.g. CSE-C), or room (e.g. CS-302)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Computer Science">Computer Science & Eng (CSE)</option>
                <option value="Electronics">Electronics & Comm (ECE)</option>
                <option value="AI">AI & Data Science (AI&DS)</option>
                <option value="Mechanical">Mechanical Engineering (ME)</option>
              </select>
            </div>

            {/* Simulator Toggle */}
            <button
              onClick={() => setUseSimulation(!useSimulation)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                useSimulation
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {useSimulation ? 'Test Schedule Mode: ON' : 'Real-Time Clock Mode'}
            </button>
          </div>

          {/* Time Simulator Panel */}
          {useSimulation && (
            <div className="pt-4 border-t border-slate-100 bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <Clock className="w-4 h-4 text-amber-600" />
                Simulate Campus Clock for Evaluation:
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <select
                  value={simulatedDay}
                  onChange={(e) => setSimulatedDay(e.target.value as any)}
                  className="py-1.5 px-3 bg-white border border-amber-300 rounded-lg font-semibold text-slate-800"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>

                <div className="flex items-center gap-1">
                  <select
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(e.target.value)}
                    className="py-1.5 px-2 bg-white border border-amber-300 rounded-lg font-mono font-semibold"
                  >
                    {['08', '09', '10', '11', '12', '13', '14', '15'].map((h) => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <span className="font-bold text-amber-800">:</span>
                  <select
                    value={simulatedMinute}
                    onChange={(e) => setSimulatedMinute(e.target.value)}
                    className="py-1.5 px-2 bg-white border border-amber-300 rounded-lg font-mono font-semibold"
                  >
                    {['00', '15', '30', '45'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <span className="text-[11px] text-amber-700 bg-white px-2.5 py-1 rounded border border-amber-200 font-medium">
                  {simulatedDay} @ {simulatedHour}:{simulatedMinute} {parseInt(simulatedHour) >= 12 ? 'PM' : 'AM'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section Live Locator Widget */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[11px] font-semibold uppercase tracking-wider border border-indigo-400/30">
                Section Live Locator
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">Where is your class right now?</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Instantly locate room numbers and faculty in session for any section.
              </p>

              {/* Section selector buttons */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D', 'CSE-E', 'CSE-F'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handleSectionQueryChange(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition font-mono ${
                      targetSection === sec
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-indigo-950/80 text-indigo-200 hover:bg-indigo-900'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Live Location Result Card */}
            {sectionStatus && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-5 md:w-96 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-extrabold text-sm text-white">{sectionStatus.sectionName} Live Status</span>
                  {sectionStatus.status === 'CLASS_IN_PROGRESS' ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded font-semibold text-[11px] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      In Class
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded font-semibold text-[11px]">
                      No Class Right Now
                    </span>
                  )}
                </div>

                {sectionStatus.currentClass ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-indigo-300 block text-[11px]">Current Class Room</span>
                      <span className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        Room {sectionStatus.currentClass.roomNumber}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Subject:</span>
                        <span className="font-bold text-white">{sectionStatus.currentClass.subjectName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Faculty Handling:</span>
                        <span className="font-semibold text-indigo-100">{sectionStatus.currentClass.facultyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Slot:</span>
                        <span className="font-mono text-indigo-300">{sectionStatus.currentClass.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-indigo-200 py-2">
                    No active class session scheduled for {targetSection} at this time. Students are free or in break.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Faculty Availability & Location Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Faculty Availability Directory ({facultyLocations.length})
            </h2>
            <span className="text-xs text-slate-500">Updated from live class timetables</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center text-slate-400 text-sm">
              Evaluating current faculty locations & schedules...
            </div>
          ) : facultyLocations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No matching faculty found</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or department filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyLocations.map((fac) => (
                <div
                  key={fac.facultyId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Top status bar */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600 font-semibold">
                        {fac.employeeId}
                      </span>

                      {/* Status Badge */}
                      {fac.status === 'SCHEDULED_IN_CLASS' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                          In Class
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          No Class Right Now
                        </span>
                      )}
                    </div>

                    {/* Faculty Info */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{fac.facultyName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{fac.department}</p>
                    </div>

                    {/* Location Box */}
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      fac.status === 'SCHEDULED_IN_CLASS'
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    }`}>
                      <div className="flex items-start gap-2 font-semibold">
                        <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${fac.status === 'SCHEDULED_IN_CLASS' ? 'text-blue-600' : 'text-emerald-600'}`} />
                        <span>{fac.displayLocation}</span>
                      </div>

                      {fac.currentClass && (
                        <div className="pl-6 text-[11px] space-y-0.5 text-slate-700 pt-1 border-t border-blue-100">
                          <div>Section: <strong className="text-blue-900">{fac.currentClass.sectionName}</strong></div>
                          <div>Subject: {fac.currentClass.subjectName}</div>
                          <div>Slot: <span className="font-mono">{fac.currentClass.timeSlot}</span></div>
                        </div>
                      )}
                    </div>

                    {/* Cabin Details */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Office / Cabin: <strong>{fac.cabinLocation}</strong></span>
                    </div>

                    {/* Best Meeting Time Recommendation Badge */}
                    {fac.recommendedMeetingTime && (
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Best Meeting Time Window Today
                        </div>
                        <p className="text-indigo-700 font-semibold">{fac.recommendedMeetingTime.timeSlot}</p>
                        <p className="text-[11px] text-slate-500">Location: {fac.recommendedMeetingTime.location}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedFaculty(fac);
                        setModalTab('MEETING');
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Find Best Meeting Time
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFaculty(fac);
                        setModalTab('TIMETABLE');
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      Full Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Meeting Finder / Full Timetable */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider rounded border border-indigo-200">
                  {selectedFaculty.employeeId}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedFaculty.facultyName}</h3>
                <p className="text-xs text-slate-500">{selectedFaculty.department}</p>
              </div>
              <button
                onClick={() => setSelectedFaculty(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setModalTab('MEETING')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  modalTab === 'MEETING'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Recommended Meeting Windows
              </button>
              <button
                onClick={() => setModalTab('TIMETABLE')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  modalTab === 'TIMETABLE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Today Schedule Grid
              </button>
            </div>

            {/* Modal Content */}
            {modalTab === 'MEETING' ? (
              <div className="space-y-4 text-xs">
                {/* Office Location Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Official Office / Cabin</h4>
                    <p className="text-slate-600 mt-0.5">{selectedFaculty.cabinLocation}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Please visit during non-class free windows listed below.</p>
                  </div>
                </div>

                {/* Free Slots List */}
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2">Available Free Windows Today</h4>
                  {selectedFaculty.freeSlotsToday.length === 0 ? (
                    <p className="text-slate-500 italic py-2">No free slots remaining today.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedFaculty.freeSlotsToday.map((slot, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 font-semibold"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{slot.label}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-200/60 rounded text-[10px] text-emerald-800 font-mono">
                            Optimal Meeting Window
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Email */}
                {selectedFaculty.email && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Email: <strong>{selectedFaculty.email}</strong>
                    </span>
                    <a
                      href={`mailto:${selectedFaculty.email}`}
                      className="px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold"
                    >
                      Send Mail
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Today Schedule Breakdown</h4>
                {selectedFaculty.daySchedule.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl">
                    No scheduled classes today for {selectedFaculty.facultyName}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedFaculty.daySchedule.map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          slot.isCurrent
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{slot.subjectName}</div>
                          <div className="text-[11px] text-slate-500">
                            Section: <span className="font-mono text-slate-700 font-bold">{slot.sectionName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">{slot.startTime} - {slot.endTime}</div>
                          <div className="text-indigo-700 font-bold">Room {slot.roomNumber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
