import * as XLSX from 'xlsx';

export interface CourseData {
  subject: string;
  credits: number;
  currentGrade: number | string;
  attendancePercentage: number;
}

export const INITIAL_COURSE_DATA: CourseData[] = [
  { subject: 'Data Analytics', credits: 4, currentGrade: 'A', attendancePercentage: 85 },
  { subject: 'Cloud Computing', credits: 4, currentGrade: 'A+', attendancePercentage: 92 },
  { subject: 'Embedded Programming', credits: 3, currentGrade: 'B+', attendancePercentage: 78 },
  { subject: 'Generative AI', credits: 4, currentGrade: 'C', attendancePercentage: 72 },
  { subject: 'Compiler Design', credits: 2, currentGrade: 'B', attendancePercentage: 80 }
];

export function parseCourseExcel(arrayBuffer: ArrayBuffer): CourseData[] {
  try {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) return INITIAL_COURSE_DATA;

    const headers = Object.keys(rawRows[0]);
    const norm = (s: string) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const subjHeader = headers.find(h => ['subject', 'course', 'title', 'subjectname', 'coursename'].some(k => norm(h).includes(k))) || headers[0];
    const credHeader = headers.find(h => ['credit', 'credits', 'cred', 'weight'].some(k => norm(h).includes(k)));
    const gradeHeader = headers.find(h => ['grade', 'currentgrade', 'mark', 'marks', 'score'].some(k => norm(h).includes(k)));
    const attHeader = headers.find(h => ['attendance', 'attendancepercentage', 'att', 'pct', 'percentage'].some(k => norm(h).includes(k)));

    const parsed: CourseData[] = [];

    rawRows.forEach((row, idx) => {
      const subject = String(row[subjHeader] || `Subject ${idx + 1}`).trim();
      if (!subject) return;

      const rawCred = credHeader ? parseFloat(String(row[credHeader]).replace(/[^0-9.]/g, '')) : NaN;
      const credits = !isNaN(rawCred) && rawCred > 0 ? rawCred : 3;

      const rawGrade = gradeHeader ? String(row[gradeHeader]).trim().toUpperCase() : 'B';
      const currentGrade = rawGrade || 'B';

      const rawAtt = attHeader ? parseFloat(String(row[attHeader]).replace(/[^0-9.]/g, '')) : NaN;
      const attendancePercentage = !isNaN(rawAtt) && rawAtt >= 0 && rawAtt <= 100 ? Math.round(rawAtt) : 80;

      parsed.push({
        subject,
        credits,
        currentGrade,
        attendancePercentage
      });
    });

    return parsed.length > 0 ? parsed : INITIAL_COURSE_DATA;
  } catch (err) {
    console.error('Error parsing course Excel:', err);
    return INITIAL_COURSE_DATA;
  }
}
