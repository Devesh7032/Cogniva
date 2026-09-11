import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Search,
  Plus,
  Trash2,
  Building2,
  UserCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import {
  fetchFacultyTimetable,
  fetchFacultyMembers,
  updateFacultyCabinLocation,
  upsertFacultyTimetableEntry,
  deleteFacultyTimetableEntry,
  parseTimetableExcel,
  importTimetableBatch,
  FacultyTimetableEntry,
  TimetableImportRow,
  FacultyMember
} from '../lib/academic-api';
import { useAuth } from '../lib/auth-context';

export function FacultyTimetableImportView() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<FacultyTimetableEntry[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cabin location edit state
  const [myCabin, setMyCabin] = useState('');
  const [isSavingCabin, setIsSavingCabin] = useState(false);
  const [cabinMessage, setCabinMessage] = useState('');

  // Excel Import State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<TimetableImportRow[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    invalidCount: number;
    errors: string[];
  } | null>(null);

  // Manual Add Slot Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<FacultyTimetableEntry>>({
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    subject_name: '',
    subject_code: '',
    section_name: 'CSE-C',
    room_number: 'CS-302',
    department: 'CSE',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facs, tt] = await Promise.all([
        fetchFacultyMembers(),
        fetchFacultyTimetable(),
      ]);

      setFacultyList(facs);
      setTimetable(tt);

      if (user?.email) {
        const currentFac = facs.find((f) => f.email.toLowerCase() === user.email?.toLowerCase());
        if (currentFac && currentFac.cabin_location) {
          setMyCabin(currentFac.cabin_location);
        } else {
          setMyCabin('Main Academic Block, Cabin 304');
        }
      }
    } catch (err) {
      console.error('Failed to load timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCabin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCabin.trim()) return;

    setIsSavingCabin(true);
    setCabinMessage('');
    try {
      const emailOrId = user?.email || 'FAC001';
      const res = await updateFacultyCabinLocation(emailOrId, myCabin.trim());
      if (res.success) {
        setCabinMessage('Cabin location updated successfully!');
        setTimeout(() => setCabinMessage(''), 3000);
        loadData();
      } else {
        setCabinMessage(res.error || 'Failed to update cabin location');
      }
    } catch {
      setCabinMessage('Failed to update cabin location');
    } finally {
      setIsSavingCabin(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setParseError(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const result = parseTimetableExcel(buffer);
      if (result.success) {
        setParsedRows(result.rows);
        setImportHeaders(result.headers);
      } else {
        setParseError(result.error || 'Failed to parse Excel timetable file');
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    try {
      const res = await importTimetableBatch(parsedRows);
      setImportSummary(res);
      setParsedRows([]);
      setExcelFile(null);
      loadData();
    } catch (err: any) {
      setParseError(err?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveManualSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.subject_name || !newSlot.section_name || !newSlot.room_number) return;

    const currentFac = facultyList.find(f => f.email.toLowerCase() === (user?.email || '').toLowerCase()) || facultyList[0];

    const res = await upsertFacultyTimetableEntry({
      ...newSlot,
      faculty_employee_id: currentFac?.employee_id || 'FAC001',
      faculty_name: currentFac?.name || 'Faculty Member',
      faculty_email: currentFac?.email || user?.email || 'faculty@cogniva.edu',
      cabin_location: myCabin || currentFac?.cabin_location || 'Main Academic Block',
    });

    if (res.success) {
      setShowAddModal(false);
      setNewSlot({
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '09:00',
        subject_name: '',
        subject_code: '',
        section_name: 'CSE-C',
        room_number: 'CS-302',
        department: 'CSE',
      });
      loadData();
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this timetable entry?')) {
      await deleteFacultyTimetableEntry(id);
      loadData();
    }
  };

  const filteredTimetable = timetable.filter((t) => {
    const matchesDay = t.day_of_week.toLowerCase() === selectedDay.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesDay;
    return (
      matchesDay &&
      (t.faculty_name.toLowerCase().includes(q) ||
        t.subject_name.toLowerCase().includes(q) ||
        t.section_name.toLowerCase().includes(q) ||
        t.room_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">
                  Campus Navigator Intelligence
                </span>
                <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Faculty Timetable & Schedule Center
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Upload class timetables, manage room allocations, and publish real-time faculty availability for students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Schedule Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cabin Location Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Cabin Location</span>
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Where students can find you during non-class hours.</p>

              <form onSubmit={handleUpdateCabin} className="mt-4 space-y-3">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={myCabin}
                    onChange={(e) => setMyCabin(e.target.value)}
                    placeholder="e.g. Main Academic Block, Cabin 304"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingCabin}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {isSavingCabin ? 'Saving...' : 'Update Cabin Location'}
                </button>
              </form>

              {cabinMessage && (
                <div className={`mt-3 text-xs p-2 rounded-lg ${cabinMessage.includes('successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {cabinMessage}
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Slots</span>
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{timetable.length}</span>
                <span className="text-xs text-slate-500">Active class slots loaded</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Faculty Members: <strong>{facultyList.length}</strong></span>
                <span>Time Window: <strong>8 AM - 3 PM</strong></span>
              </div>
            </div>
          </div>

          {/* Excel Import Card Header */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Timetable Excel Import</span>
                <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-white mt-2">Upload Faculty Timetable</h3>
              <p className="text-xs text-indigo-200 mt-1">
                Import Monday–Friday schedule sheets with room numbers, section codes, and subjects.
              </p>
            </div>
            <label className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition gap-2">
              <Upload className="w-4 h-4" />
              Select Excel File (.xlsx)
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Excel Preview & Validation Section */}
        {parseError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Timetable Parse Error</h4>
              <p className="text-xs mt-1 text-red-700">{parseError}</p>
            </div>
          </div>
        )}

        {importSummary && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Timetable Schedule Imported Successfully!
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-semibold">
              <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                <span className="block text-slate-500">New Slots Created</span>
                <span className="text-lg font-bold text-emerald-600">{importSummary.importedCount}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                <span className="block text-slate-500">Slots Updated</span>
                <span className="text-lg font-bold text-indigo-600">{importSummary.updatedCount}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                <span className="block text-slate-500">Skipped Rows</span>
                <span className="text-lg font-bold text-slate-600">{importSummary.skippedCount}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                <span className="block text-slate-500">Invalid Rows</span>
                <span className="text-lg font-bold text-amber-600">{importSummary.invalidCount}</span>
              </div>
            </div>
          </div>
        )}

        {parsedRows.length > 0 && (
          <div className="bg-white rounded-xl border border-indigo-200 shadow-md overflow-hidden">
            <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Preview Uploaded Timetable ({parsedRows.length} rows detected)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Verify extracted columns and schedule slots before writing to database.
                </p>
              </div>
              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-2"
              >
                {isImporting ? 'Importing Schedule...' : 'Confirm & Save Schedule'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Time Slot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{row.faculty_name}</td>
                      <td className="py-2.5 px-4">{row.subject_name}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 font-mono text-[11px] rounded text-slate-700">
                          {row.section_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-indigo-700">{row.room_number}</td>
                      <td className="py-2.5 px-4">{row.day_of_week}</td>
                      <td className="py-2.5 px-4 font-mono">{row.start_time} - {row.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timetable Schedule Grid & Browser */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Days Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty, room, subject, section..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading timetable records...</div>
            ) : filteredTimetable.length === 0 ? (
              <div className="p-12 text-center">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold text-sm">No schedule slots for {selectedDay}</p>
                <p className="text-slate-400 text-xs mt-1">Try changing the search query or upload an Excel timetable sheet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Time Slot</th>
                    <th className="py-3.5 px-6">Faculty Member</th>
                    <th className="py-3.5 px-6">Subject / Course</th>
                    <th className="py-3.5 px-6">Section</th>
                    <th className="py-3.5 px-6">Room / Lab</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTimetable.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-700">
                        {slot.start_time} - {slot.end_time}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{slot.faculty_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {slot.cabin_location || 'Main Academic Block'}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{slot.subject_name}</div>
                        {slot.subject_code && (
                          <div className="text-[11px] text-slate-400 font-mono">{slot.subject_code}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold font-mono text-[11px]">
                          {slot.section_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs">
                          {slot.room_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">Add New Timetable Slot</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value as any })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="text"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    placeholder="08:00"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="text"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    placeholder="09:00"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={newSlot.subject_name}
                  onChange={(e) => setNewSlot({ ...newSlot, subject_name: e.target.value })}
                  placeholder="e.g. Database Management Systems"
                  required
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <input
                    type="text"
                    value={newSlot.section_name}
                    onChange={(e) => setNewSlot({ ...newSlot, section_name: e.target.value })}
                    placeholder="e.g. CSE-C"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Lab *</label>
                  <input
                    type="text"
                    value={newSlot.room_number}
                    onChange={(e) => setNewSlot({ ...newSlot, room_number: e.target.value })}
                    placeholder="e.g. CS-302"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
