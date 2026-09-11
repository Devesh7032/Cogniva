import {
  fetchFacultyMembers,
  fetchFacultyTimetable,
  FacultyMember,
  FacultyTimetableEntry
} from './academic-api';

export interface FacultyLocationStatus {
  facultyId: string;
  employeeId: string;
  facultyName: string;
  email: string;
  department: string;
  cabinLocation: string;
  phone?: string;
  status: 'SCHEDULED_IN_CLASS' | 'NO_SCHEDULED_CLASS' | 'UNKNOWN';
  currentClass?: {
    subjectCode?: string;
    subjectName: string;
    sectionName: string;
    roomNumber: string;
    startTime: string;
    endTime: string;
    timeSlot: string;
    dayOfWeek: string;
  };
  nextClass?: {
    subjectCode?: string;
    subjectName: string;
    sectionName: string;
    roomNumber: string;
    startTime: string;
    endTime: string;
    timeSlot: string;
    dayOfWeek: string;
  };
  daySchedule: Array<{
    id: string;
    startTime: string;
    endTime: string;
    subjectName: string;
    sectionName: string;
    roomNumber: string;
    isCurrent: boolean;
  }>;
  freeSlotsToday: Array<{
    startTime: string;
    endTime: string;
    label: string;
  }>;
  recommendedMeetingTime?: {
    timeSlot: string;
    reason: string;
    location: string;
  };
  displayLocation: string;
  statusBadgeColor: 'blue' | 'emerald' | 'amber' | 'slate';
}

export interface SectionCurrentClassStatus {
  sectionName: string;
  department: string;
  status: 'CLASS_IN_PROGRESS' | 'NO_SCHEDULED_CLASS';
  currentClass?: {
    subjectName: string;
    subjectCode?: string;
    roomNumber: string;
    facultyName: string;
    facultyEmail?: string;
    cabinLocation?: string;
    timeSlot: string;
  };
  nextClass?: {
    subjectName: string;
    roomNumber: string;
    facultyName: string;
    timeSlot: string;
  };
}

// Convert "HH:MM" or "H:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
}

// Format 24-hour "HH:MM" into "09:00 AM" or "02:00 PM"
export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const mins = timeToMinutes(timeStr);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function getDayNameFromDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export async function getFacultyCurrentLocation(
  facultyEmailOrEmpIdOrId: string,
  customDate?: Date
): Promise<FacultyLocationStatus | null> {
  const cleanTarget = facultyEmailOrEmpIdOrId.trim().toLowerCase();
  const allFaculty = await fetchFacultyMembers();
  
  const fac = allFaculty.find(
    (f) =>
      f.id.toLowerCase() === cleanTarget ||
      f.employee_id.toLowerCase() === cleanTarget ||
      f.email.toLowerCase() === cleanTarget ||
      f.name.toLowerCase().includes(cleanTarget)
  );

  if (!fac) return null;

  const targetDate = customDate || new Date();
  const dayName = getDayNameFromDate(targetDate);
  const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

  const timetable = await fetchFacultyTimetable({
    facultyEmployeeId: fac.employee_id,
    facultyEmail: fac.email,
  });

  const daySchedule = timetable
    .filter((t) => t.day_of_week.toLowerCase() === dayName.toLowerCase())
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let currentEntry: FacultyTimetableEntry | undefined;
  let nextEntry: FacultyTimetableEntry | undefined;

  for (const entry of daySchedule) {
    const startM = timeToMinutes(entry.start_time);
    const endM = timeToMinutes(entry.end_time);

    if (currentMinutes >= startM && currentMinutes < endM) {
      currentEntry = entry;
    } else if (startM > currentMinutes && !nextEntry) {
      nextEntry = entry;
    }
  }

  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
  const cabinLocation = fac.cabin_location || 'Main Academic Block';

  let status: 'SCHEDULED_IN_CLASS' | 'NO_SCHEDULED_CLASS' | 'UNKNOWN' = 'NO_SCHEDULED_CLASS';
  let displayLocation = `No scheduled class — ${cabinLocation}`;
  let statusBadgeColor: 'blue' | 'emerald' | 'amber' | 'slate' = 'emerald';

  if (isWeekend) {
    status = 'NO_SCHEDULED_CLASS';
    displayLocation = 'Weekend / Campus Closed';
    statusBadgeColor = 'slate';
  } else if (currentEntry) {
    status = 'SCHEDULED_IN_CLASS';
    displayLocation = `Scheduled in Room ${currentEntry.room_number} (${currentEntry.section_name} - ${currentEntry.subject_name})`;
    statusBadgeColor = 'blue';
  } else {
    status = 'NO_SCHEDULED_CLASS';
    displayLocation = `No scheduled class right now — Likely in Cabin: ${cabinLocation}`;
    statusBadgeColor = 'emerald';
  }

  const freeSlotsToday: Array<{ startTime: string; endTime: string; label: string }> = [];
  const standardSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
  ];

  standardSlots.forEach((slot) => {
    const startM = timeToMinutes(slot.start);
    const endM = timeToMinutes(slot.end);
    const hasClass = daySchedule.some((entry) => {
      const eStart = timeToMinutes(entry.start_time);
      const eEnd = timeToMinutes(entry.end_time);
      return Math.max(startM, eStart) < Math.min(endM, eEnd);
    });

    if (!hasClass && !isWeekend) {
      const isLunch = slot.start === '12:00';
      freeSlotsToday.push({
        startTime: slot.start,
        endTime: slot.end,
        label: isLunch
          ? `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)} (Lunch Break)`
          : `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)} (Free / Office Hours)`,
      });
    }
  });

  let recommendedMeetingTime: { timeSlot: string; reason: string; location: string } | undefined;

  const bestFreeSlot = freeSlotsToday.find((s) => s.startTime !== '12:00') || freeSlotsToday[0];
  if (bestFreeSlot && !isWeekend) {
    recommendedMeetingTime = {
      timeSlot: `${formatTime12Hour(bestFreeSlot.startTime)} - ${formatTime12Hour(bestFreeSlot.endTime)} (${dayName})`,
      reason: '1-Hour Free Office Window (No Scheduled Class)',
      location: cabinLocation,
    };
  }

  const mappedDaySchedule = daySchedule.map((entry) => {
    const startM = timeToMinutes(entry.start_time);
    const endM = timeToMinutes(entry.end_time);
    return {
      id: entry.id,
      startTime: entry.start_time,
      endTime: entry.end_time,
      subjectName: entry.subject_name,
      sectionName: entry.section_name,
      roomNumber: entry.room_number,
      isCurrent: Boolean(!isWeekend && currentMinutes >= startM && currentMinutes < endM),
    };
  });

  return {
    facultyId: fac.id,
    employeeId: fac.employee_id,
    facultyName: fac.name,
    email: fac.email,
    department: fac.department || 'Computer Science & Engineering',
    cabinLocation,
    phone: fac.phone,
    status,
    currentClass: currentEntry
      ? {
          subjectCode: currentEntry.subject_code,
          subjectName: currentEntry.subject_name,
          sectionName: currentEntry.section_name,
          roomNumber: currentEntry.room_number,
          startTime: currentEntry.start_time,
          endTime: currentEntry.end_time,
          timeSlot: `${formatTime12Hour(currentEntry.start_time)} - ${formatTime12Hour(currentEntry.end_time)}`,
          dayOfWeek: currentEntry.day_of_week,
        }
      : undefined,
    nextClass: nextEntry
      ? {
          subjectCode: nextEntry.subject_code,
          subjectName: nextEntry.subject_name,
          sectionName: nextEntry.section_name,
          roomNumber: nextEntry.room_number,
          startTime: nextEntry.start_time,
          endTime: nextEntry.end_time,
          timeSlot: `${formatTime12Hour(nextEntry.start_time)} - ${formatTime12Hour(nextEntry.end_time)}`,
          dayOfWeek: nextEntry.day_of_week,
        }
      : undefined,
    daySchedule: mappedDaySchedule,
    freeSlotsToday,
    recommendedMeetingTime,
    displayLocation,
    statusBadgeColor,
  };
}

export async function getSectionCurrentClass(
  sectionName: string,
  customDate?: Date
): Promise<SectionCurrentClassStatus> {
  const cleanSec = sectionName.trim().toUpperCase();
  const targetDate = customDate || new Date();
  const dayName = getDayNameFromDate(targetDate);
  const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

  const sectionTimetable = await fetchFacultyTimetable({
    sectionName: cleanSec,
    dayOfWeek: dayName,
  });

  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  let currentEntry: FacultyTimetableEntry | undefined;
  let nextEntry: FacultyTimetableEntry | undefined;

  for (const entry of sectionTimetable) {
    const startM = timeToMinutes(entry.start_time);
    const endM = timeToMinutes(entry.end_time);

    if (currentMinutes >= startM && currentMinutes < endM) {
      currentEntry = entry;
    } else if (startM > currentMinutes && !nextEntry) {
      nextEntry = entry;
    }
  }

  if (isWeekend || !currentEntry) {
    return {
      sectionName: cleanSec,
      department: 'CSE',
      status: 'NO_SCHEDULED_CLASS',
      nextClass: nextEntry
        ? {
            subjectName: nextEntry.subject_name,
            roomNumber: nextEntry.room_number,
            facultyName: nextEntry.faculty_name,
            timeSlot: `${formatTime12Hour(nextEntry.start_time)} - ${formatTime12Hour(nextEntry.end_time)}`,
          }
        : undefined,
    };
  }

  return {
    sectionName: cleanSec,
    department: currentEntry.department || 'CSE',
    status: 'CLASS_IN_PROGRESS',
    currentClass: {
      subjectName: currentEntry.subject_name,
      subjectCode: currentEntry.subject_code,
      roomNumber: currentEntry.room_number,
      facultyName: currentEntry.faculty_name,
      facultyEmail: currentEntry.faculty_email,
      cabinLocation: currentEntry.cabin_location,
      timeSlot: `${formatTime12Hour(currentEntry.start_time)} - ${formatTime12Hour(currentEntry.end_time)}`,
    },
    nextClass: nextEntry
      ? {
          subjectName: nextEntry.subject_name,
          roomNumber: nextEntry.room_number,
          facultyName: nextEntry.faculty_name,
          timeSlot: `${formatTime12Hour(nextEntry.start_time)} - ${formatTime12Hour(nextEntry.end_time)}`,
        }
      : undefined,
  };
}

export async function getAllFacultyLocationsSummary(
  searchQuery?: string,
  departmentFilter?: string,
  customDate?: Date
): Promise<FacultyLocationStatus[]> {
  const allFaculty = await fetchFacultyMembers();
  const results: FacultyLocationStatus[] = [];

  for (const fac of allFaculty) {
    const loc = await getFacultyCurrentLocation(fac.id, customDate);
    if (loc) {
      results.push(loc);
    }
  }

  let filtered = results;

  if (departmentFilter && departmentFilter !== 'ALL') {
    const depTarget = departmentFilter.toLowerCase();
    filtered = filtered.filter((f) => f.department.toLowerCase().includes(depTarget));
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (f) =>
        f.facultyName.toLowerCase().includes(q) ||
        f.employeeId.toLowerCase().includes(q) ||
        f.cabinLocation.toLowerCase().includes(q) ||
        (f.currentClass && (
          f.currentClass.subjectName.toLowerCase().includes(q) ||
          f.currentClass.sectionName.toLowerCase().includes(q) ||
          f.currentClass.roomNumber.toLowerCase().includes(q)
        )) ||
        (f.nextClass && (
          f.nextClass.subjectName.toLowerCase().includes(q) ||
          f.nextClass.sectionName.toLowerCase().includes(q) ||
          f.nextClass.roomNumber.toLowerCase().includes(q)
        ))
    );
  }

  return filtered;
}
