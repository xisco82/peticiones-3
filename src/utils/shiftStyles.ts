import { ShiftDetail } from '../types';

export function getShiftBadgeStyle(shift?: ShiftDetail | null): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (!shift) {
    return {
      bg: 'bg-slate-50 dark:bg-slate-800/40',
      text: 'text-slate-400',
      border: 'border-dashed border-slate-200 dark:border-slate-700',
      label: '-',
    };
  }

  const raw = (shift.rawText || '').trim().toUpperCase();

  if (shift.type === 'free' || raw === 'L' || raw === 'LIBRE' || raw === 'DESC' || raw === 'DESCANSO') {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/70 dark:border-emerald-800/60',
      label: 'LIBRE',
    };
  }

  if (raw === 'AP' || raw.includes('ASUNTO')) {
    return {
      bg: 'bg-teal-50 dark:bg-teal-950/50',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      label: 'AP (Asuntos Pr.)',
    };
  }

  if (shift.type === 'vacation' || raw === 'V' || raw === 'VAC' || raw === 'VACACIONES') {
    return {
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
      label: 'VACACIONES',
    };
  }

  if (shift.type === 'sick' || raw === 'BP' || raw === 'BAJA' || raw === 'IT' || raw === 'MEDICO') {
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      label: 'BAJA (BP)',
    };
  }

  if (shift.type === 'holiday' || raw.includes('FEST')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      label: 'FESTIVO',
    };
  }

  if (raw === 'M' || raw === 'MAÑANA' || raw === 'MANANA') {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/70 dark:border-amber-800/60',
      label: 'MAÑANA (07-15)',
    };
  }

  if (raw === 'T' || raw === 'TARDE') {
    return {
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200/70 dark:border-orange-800/60',
      label: 'TARDE (15-23)',
    };
  }

  if (raw === 'N' || raw === 'NOCHE' || shift.isOvernight) {
    return {
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200/70 dark:border-indigo-800/60',
      label: 'NOCHE (23-07)',
    };
  }

  if (shift.isSplit) {
    return {
      bg: 'bg-violet-50 dark:bg-violet-950/50',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-200 dark:border-violet-800',
      label: `${shift.rawText} (${shift.hours}h)`,
    };
  }

  return {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/70 dark:border-blue-800/60',
    label: shift.startTime && shift.endTime ? `${shift.startTime}-${shift.endTime}` : shift.rawText,
  };
}
