import { User, EmployeeScheduleRow, ShiftDetail, ParseResult, AmbiguityItem } from '../types';
import { INITIAL_EMPLOYEES } from '../constants/initialData';

export function getWeekDates(weekStartDate: string): string[] {
  const dates: string[] = [];
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dayStr}`);
  }
  return dates;
}

const SPANISH_DAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const SPANISH_MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export function formatDaySpanish(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = d.getUTCDay();

  return {
    dayName: SPANISH_DAYS[dayOfWeek],
    dayNumber: day,
    monthName: SPANISH_MONTHS[month - 1],
    year,
  };
}

export function calculateShiftHours(dateStr: string, startTime: string, endTime: string): { hours: number; isOvernight: boolean } {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  const isOvernight = endMins <= startMins;

  if (isOvernight) {
    endMins += 24 * 60;
  }

  let totalHours = (endMins - startMins) / 60;

  // DST Special Case (Spain / Europe/Madrid autumn change):
  // Night from 24 to 25 October 2026: clocks are pushed back 1 hour (03:00 -> 02:00),
  // adding 1 extra hour to night shifts!
  if (
    isOvernight &&
    (dateStr === '2026-10-24' || dateStr === '2026-10-25') &&
    sh >= 21 &&
    eh <= 8
  ) {
    totalHours += 1;
  }

  return {
    hours: Math.round(totalHours * 100) / 100,
    isOvernight,
  };
}

export function parseShiftText(rawText: string, dateStr: string): ShiftDetail | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();

  // Codes
  if (upper === 'L' || upper === 'LIBRE' || upper === 'DESC' || upper === 'DESCANSO') {
    return { type: 'free', rawText: trimmed, hours: 0 };
  }
  if (upper === 'V' || upper === 'VAC' || upper === 'VACACIONES') {
    return { type: 'vacation', rawText: trimmed, hours: 0 };
  }
  if (upper === 'BP' || upper === 'BAJA' || upper === 'MEDICO' || upper === 'MÉDICO' || upper === 'IT') {
    return { type: 'sick', rawText: trimmed, hours: 0 };
  }
  if (upper === 'FESTIVO' || upper === 'FEST') {
    return { type: 'holiday', rawText: trimmed, hours: 0 };
  }
  if (upper === 'AP' || upper === 'ASUNTOS PROPIOS' || upper === 'PERMISO') {
    return { type: 'free', rawText: trimmed, hours: 0, note: 'Asuntos Propios' };
  }
  if (upper === 'M' || upper === 'MAÑANA' || upper === 'MANANA') {
    return { type: 'work', startTime: '07:00', endTime: '15:00', rawText: trimmed, hours: 8 };
  }
  if (upper === 'T' || upper === 'TARDE') {
    return { type: 'work', startTime: '15:00', endTime: '23:00', rawText: trimmed, hours: 8 };
  }
  if (upper === 'N' || upper === 'NOCHE') {
    const calc = calculateShiftHours(dateStr, '23:00', '07:00');
    return { type: 'work', startTime: '23:00', endTime: '07:00', rawText: trimmed, hours: calc.hours, isOvernight: true };
  }

  // Split shift: e.g. "09:00-13:00 / 17:00-21:00" or "09:00-13:00/17:00-21:00"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    let totalSplitHours = 0;
    let hasOvernight = false;

    for (const part of parts) {
      const match = part.trim().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) {
        const c = calculateShiftHours(dateStr, match[1], match[2]);
        totalSplitHours += c.hours;
        if (c.isOvernight) hasOvernight = true;
      }
    }

    if (totalSplitHours > 0) {
      return {
        type: 'work',
        rawText: trimmed,
        hours: Math.round(totalSplitHours * 100) / 100,
        isSplit: true,
        isOvernight: hasOvernight,
      };
    }
  }

  // Single time range: e.g. "09:00-17:00" or "09:00 - 17:00"
  const rangeMatch = trimmed.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    const calc = calculateShiftHours(dateStr, rangeMatch[1], rangeMatch[2]);
    return {
      type: 'work',
      startTime: rangeMatch[1],
      endTime: rangeMatch[2],
      rawText: trimmed,
      hours: calc.hours,
      isOvernight: calc.isOvernight,
    };
  }

  // Default fallback
  return {
    type: 'work',
    rawText: trimmed,
    hours: 8,
  };
}

export function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchEmployee(
  rawName: string,
  employees: User[]
): { employee?: User; ambiguous?: User[] } | null {
  const clean = normalizeStr(rawName);
  if (!clean) return null;

  // Resilient fallback: If caller passes empty array (e.g. before employees load), use initial list
  const list = (employees && employees.length > 0) ? employees : INITIAL_EMPLOYEES;

  // 1. Exact match by full name (normalized)
  const exact = list.find(e => normalizeStr(e.name) === clean);
  if (exact) return { employee: exact };

  // 2. Exact match in aliases (normalized)
  const exactAlias = list.filter(e =>
    e.aliases && e.aliases.some(a => normalizeStr(a) === clean)
  );
  if (exactAlias.length === 1) return { employee: exactAlias[0] };
  if (exactAlias.length > 1) return { ambiguous: exactAlias };

  // 3. Word/partial match: check if token matches the first name or specific alias
  const matches = list.filter(e => {
    const fullNameNorm = normalizeStr(e.name);
    const firstName = fullNameNorm.split(' ')[0];
    if (firstName === clean) return true;
    if (fullNameNorm.includes(clean)) return true;
    return e.aliases && e.aliases.some(a => {
      const aNorm = normalizeStr(a);
      return aNorm === clean || aNorm.includes(clean) || clean.includes(aNorm);
    });
  });

  if (matches.length === 1) return { employee: matches[0] };
  if (matches.length > 1) return { ambiguous: matches };

  return null;
}

const DAY_NAME_REGEX = /^(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES|S[AÁ]BADO|DOMINGO|DIAS?|FECHA|TURNO|TOTAL)$/i;

function isHeaderRow(parts: string[], rawLine: string): boolean {
  const upper = rawLine.toUpperCase().trim();
  if (upper.includes('SEMANA DEL')) return true;
  if (upper.startsWith('EMPLEADO')) return true;

  const nonBlankParts = parts.filter(p => p.trim().length > 0);
  if (nonBlankParts.length === 0) return true;

  // Check if first non-blank cell looks like a date (e.g. 26/10, 26/10/2026, 26-10)
  const first = nonBlankParts[0].trim();
  if (/^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/.test(first)) return true;

  // Check if first non-blank is a Spanish day name
  if (DAY_NAME_REGEX.test(first)) return true;

  // Count how many cells are dates or day names
  const dateOrDayCount = nonBlankParts.filter(p => {
    const t = p.trim();
    return /^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/.test(t) || DAY_NAME_REGEX.test(t);
  }).length;

  if (dateOrDayCount >= 2) return true;

  return false;
}

export function parseScheduleInput(
  inputText: string,
  employees: User[],
  fallbackStartDate?: string
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ambiguities: AmbiguityItem[] = [];
  const unknownSet = new Set<string>();

  // Use employees list or fallback to INITIAL_EMPLOYEES so empty state doesn't break
  const activeEmployees = (employees && employees.length > 0) ? employees : INITIAL_EMPLOYEES;

  // Keep lines intact without pre-trimming leading tabs!
  const rawLines = inputText
    .split(/\r?\n/)
    .map(l => l.replace(/\r/g, ''))
    .filter(l => l.trim().length > 0);

  let weekStartDate = fallbackStartDate || '2026-11-02';
  let weekEndDate = '2026-11-08';
  let weekLabel = 'SEMANA DEL 2 AL 8 DE NOVIEMBRE 2026';

  // Check header for week label / date hints
  const headerText = rawLines.slice(0, 3).join(' ');
  const weekMatch = headerText.match(/SEMANA\s+DEL\s+(\d{1,2})(?:\s+DE\s+([A-ZÁÉÍÓÚ]+))?\s+AL\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚ]+)(?:\s+(?:DE\s+)?(\d{4}))?/i);

  if (weekMatch) {
    const startDay = parseInt(weekMatch[1], 10);
    const startMonthName = weekMatch[2] ? weekMatch[2].toUpperCase() : weekMatch[4].toUpperCase();
    const endDay = parseInt(weekMatch[3], 10);
    const endMonthName = weekMatch[4].toUpperCase();
    const year = weekMatch[5] ? parseInt(weekMatch[5], 10) : 2026;

    const startMonthIdx = SPANISH_MONTHS.indexOf(startMonthName);
    const endMonthIdx = SPANISH_MONTHS.indexOf(endMonthName);

    if (startMonthIdx !== -1 && endMonthIdx !== -1) {
      let startYear = year;
      // Cross year check: Dec to Jan
      if (startMonthIdx === 11 && endMonthIdx === 0) {
        startYear = year - 1;
      }
      weekStartDate = `${startYear}-${String(startMonthIdx + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      weekEndDate = `${year}-${String(endMonthIdx + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      weekLabel = `SEMANA DEL ${startDay} DE ${startMonthName} AL ${endDay} DE ${endMonthName} DE ${year}`;
    }
  }

  // Check date header in TSV/Excel, e.g. "26/10\t27/10...\t01/11"
  for (const line of rawLines.slice(0, 3)) {
    const dateMatches = line.match(/\b(\d{1,2})\/(\d{1,2})\b/g);
    if (dateMatches && dateMatches.length >= 7) {
      const [d1, m1] = dateMatches[0].split('/').map(Number);
      const [d7, m7] = dateMatches[6].split('/').map(Number);
      const year = 2026;
      weekStartDate = `${year}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
      weekEndDate = `${year}-${String(m7).padStart(2, '0')}-${String(d7).padStart(2, '0')}`;
      weekLabel = `SEMANA DEL ${d1}/${m1} AL ${d7}/${m7} DE ${year}`;
      break;
    }
  }

  const weekDates = getWeekDates(weekStartDate);
  const rows: EmployeeScheduleRow[] = [];

  for (const line of rawLines) {
    // Check if line contains tabs (Excel / Google Sheets format)
    if (line.includes('\t')) {
      const parts = line.split('\t');

      // Check if this row is a header row (dates or day names like 26/10, LUNES, etc.)
      if (isHeaderRow(parts, line)) {
        continue;
      }

      // If the row starts with a blank cell, the employee name might be the first non-blank cell
      const rawEmpName = parts[0].trim() || parts.find(p => p.trim().length > 0) || '';
      if (!rawEmpName) continue;

      // Double check if rawEmpName itself looks like a date or header
      if (/^\d{1,2}[\/\-]\d{1,2}$/.test(rawEmpName) || DAY_NAME_REGEX.test(rawEmpName)) {
        continue;
      }

      const matchRes = matchEmployee(rawEmpName, activeEmployees);
      if (!matchRes) {
        unknownSet.add(rawEmpName);
        errors.push(`Empleado no reconocido: «${rawEmpName}»`);
        continue;
      }

      if (matchRes.ambiguous) {
        ambiguities.push({ rawName: rawEmpName, matchedEmployees: matchRes.ambiguous });
        errors.push(`Nombre ambiguo «${rawEmpName}». Coincide con varios empleados.`);
        continue;
      }

      const emp = matchRes.employee!;
      const days: Record<string, ShiftDetail> = {};
      let totalH = 0;
      const rowWarnings: string[] = [];

      // Find where shift data begins (after the employee name cell)
      const empIdx = parts.findIndex(p => p.trim() === rawEmpName);
      const shiftParts = parts.slice(empIdx + 1);

      // Next 7 columns are Monday to Sunday
      for (let i = 0; i < 7; i++) {
        const dateStr = weekDates[i];
        const shiftText = shiftParts[i] || 'LIBRE';
        const shift = parseShiftText(shiftText, dateStr) || { type: 'free', rawText: 'LIBRE', hours: 0 };
        days[dateStr] = shift;
        totalH += shift.hours;

        if (shift.hours > 9) {
          rowWarnings.push(`El ${dateStr} supera 9h ordinarias (${shift.hours}h).`);
        }
      }

      if (totalH > 40) {
        rowWarnings.push(`Supera el máximo semanal de 40 horas (${totalH}h).`);
      }

      rows.push({
        employeeId: emp.id,
        employeeName: emp.name,
        totalHours: Math.round(totalH * 100) / 100,
        warnings: rowWarnings,
        days,
      });

      if (rowWarnings.length > 0) {
        warnings.push(`${emp.name}: ${rowWarnings.join(' ')}`);
      }
      continue;
    }

    // Text format: "Francisco Gallego: Lunes: 09:00-17:00 Martes: 09:00-17:00..."
    if (line.includes(':')) {
      const firstColon = line.indexOf(':');
      const rawEmpName = line.slice(0, firstColon).trim();
      const rest = line.slice(firstColon + 1).trim();

      // Skip header lines that have colons (e.g. "SEMANA: ...")
      if (DAY_NAME_REGEX.test(rawEmpName) || rawEmpName.toUpperCase().includes('SEMANA')) {
        continue;
      }

      const matchRes = matchEmployee(rawEmpName, activeEmployees);
      if (!matchRes) {
        unknownSet.add(rawEmpName);
        errors.push(`Empleado no reconocido: «${rawEmpName}»`);
        continue;
      }

      if (matchRes.ambiguous) {
        ambiguities.push({ rawName: rawEmpName, matchedEmployees: matchRes.ambiguous });
        errors.push(`Nombre ambiguo «${rawEmpName}». Coincide con varios empleados.`);
        continue;
      }

      const emp = matchRes.employee!;
      const days: Record<string, ShiftDetail> = {};
      let totalH = 0;
      const rowWarnings: string[] = [];

      // Parse each day tokens e.g. Lunes: 09:00-17:00
      const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'SABADO', 'DOMINGO'];
      const pattern = new RegExp(`(${dayNames.join('|')}):\\s*([^:]+?)(?=(?:${dayNames.join('|')}):|$)`, 'gi');
      let m: RegExpExecArray | null;
      let dayIdx = 0;

      while ((m = pattern.exec(rest)) !== null && dayIdx < 7) {
        const shiftText = m[2].trim();
        const dateStr = weekDates[dayIdx];
        const shift = parseShiftText(shiftText, dateStr) || { type: 'free', rawText: 'LIBRE', hours: 0 };
        days[dateStr] = shift;
        totalH += shift.hours;

        if (shift.hours > 9) {
          rowWarnings.push(`El ${dateStr} supera 9h ordinarias (${shift.hours}h).`);
        }
        dayIdx++;
      }

      // If missing days, fill with LIBRE
      while (dayIdx < 7) {
        const dateStr = weekDates[dayIdx];
        days[dateStr] = { type: 'free', rawText: 'LIBRE', hours: 0 };
        dayIdx++;
      }

      if (totalH > 40) {
        rowWarnings.push(`Supera el máximo semanal de 40 horas (${totalH}h).`);
      }

      rows.push({
        employeeId: emp.id,
        employeeName: emp.name,
        totalHours: Math.round(totalH * 100) / 100,
        warnings: rowWarnings,
        days,
      });

      if (rowWarnings.length > 0) {
        warnings.push(`${emp.name}: ${rowWarnings.join(' ')}`);
      }
    }
  }

  const success = errors.length === 0 && rows.length > 0;

  return {
    success,
    weekStartDate,
    weekEndDate,
    weekLabel,
    rows,
    errors,
    warnings,
    ambiguities,
    unknownEmployees: Array.from(unknownSet),
  };
}
