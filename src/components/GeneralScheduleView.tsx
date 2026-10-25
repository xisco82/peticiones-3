import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Eye,
  Lock,
  Clock,
  Sparkles,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { WeekSchedule, AppSettings } from '../types';
import { formatDaySpanish, getWeekDates } from '../utils/scheduleParser';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const GeneralScheduleView: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [list, sets] = await Promise.all([
          api.getSchedules(),
          api.getSettings().catch(() => null),
        ]);
        setSchedules(list);
        setSettings(sets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleExportCSV = () => {
    if (!currentSchedule) return;
    const dates = getWeekDates(currentSchedule.weekStartDate);
    const headers = ['Empleado', ...dates.map(d => formatDaySpanish(d).dayName), 'Total Horas'];
    const rows = currentSchedule.rows.map(r => {
      const dayValues = dates.map(d => r.days[d]?.rawText || 'LIBRE');
      return [r.employeeName, ...dayValues, `${r.totalHours} h`];
    });

    const csvContent = [headers.join(';'), ...rows.map(row => row.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuadrante_${currentSchedule.weekStartDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Cargando cuadrante general...</div>;
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto shadow-xs">
        <Calendar className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">No hay cuadrantes disponibles</h3>
        <p className="text-xs text-slate-500 mt-1">Aún no se han guardado ni publicado cuadrantes semanales.</p>
      </div>
    );
  }

  const currentSchedule = schedules[selectedWeekIndex] || schedules[0];
  const weekDates = getWeekDates(currentSchedule.weekStartDate);

  // If general schedule is restricted for employees:
  const isRestrictedForEmployee = !isAdmin && settings && !settings.generalScheduleVisibleToEmployees;

  const baseRows = isRestrictedForEmployee
    ? currentSchedule.rows.filter(r => r.employeeId === user?.id)
    : currentSchedule.rows;

  const filteredRows = baseRows.filter(r =>
    r.employeeName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
              Cuadrante General de la Empresa
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                currentSchedule.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50'
              }`}
            >
              {currentSchedule.status === 'published' ? `Publicado v${currentSchedule.version}` : 'Borrador'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currentSchedule.weekLabel}
          </h2>
        </div>

        {/* Filters, Actions and Week Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar empleado..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Descargar cuadrante en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Imprimir cuadrante o guardar en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedWeekIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedWeekIndex === 0}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {selectedWeekIndex + 1} / {schedules.length}
            </span>
            <button
              onClick={() => setSelectedWeekIndex(prev => Math.min(schedules.length - 1, prev + 1))}
              disabled={selectedWeekIndex === schedules.length - 1}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>
          </div>
        </div>
      </div>

      {isRestrictedForEmployee && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Vista personal:</strong> La dirección ha configurado el sistema para que cada empleado visualice exclusivamente su turno asignado.
          </span>
        </div>
      )}

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-bold sticky left-0 bg-slate-100/90 dark:bg-slate-800 z-10 min-w-[180px]">
                  Empleado
                </th>
                {weekDates.map(dateStr => {
                  const info = formatDaySpanish(dateStr);
                  return (
                    <th key={dateStr} className="py-3 px-3 font-semibold min-w-[120px] text-center">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{info.dayName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {info.dayNumber} {info.monthName.slice(0, 3)}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-4 font-bold text-right min-w-[90px]">Total Semanal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map(row => {
                const isMe = row.employeeId === user?.id;

                return (
                  <tr
                    key={row.employeeId}
                    className={`transition ${
                      isMe
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-white truncate">{row.employeeName}</span>
                        {isMe && (
                          <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                            TÚ
                          </span>
                        )}
                      </div>
                    </td>

                    {weekDates.map(dateStr => {
                      const shift = row.days[dateStr];

                      // Strict privacy enforcement:
                      // If the shift is a sick leave or absence, and user is NOT admin and NOT this employee,
                      // never show sensitive reason, show only "No disponible" or code!
                      let displayLabel = shift ? shift.rawText : 'LIBRE';
                      if (!isAdmin && !isMe && shift?.type === 'sick') {
                        displayLabel = 'No disponible';
                      }

                      let badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                      const code = (shift?.rawText || '').trim().toUpperCase();
                      if (code === 'M') {
                        badgeColor = 'bg-sky-50 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800';
                      } else if (code === 'T') {
                        badgeColor = 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800';
                      } else if (code === 'N' || shift?.isOvernight) {
                        badgeColor = 'bg-violet-50 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200 border border-violet-200/80 dark:border-violet-800';
                      } else if (code === 'BP' || shift?.type === 'sick') {
                        badgeColor = 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800';
                      } else if (code === 'V' || shift?.type === 'vacation') {
                        badgeColor = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800';
                      } else if (shift?.type === 'holiday') {
                        badgeColor = 'bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800';
                      } else if (shift?.type === 'work') {
                        badgeColor = 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800';
                      }

                      return (
                        <td
                          key={dateStr}
                          className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/60"
                        >
                          <div className={`p-1.5 rounded-lg text-center ${badgeColor}`}>
                            <div className="font-semibold text-xs leading-tight">{displayLabel}</div>
                            {shift && shift.hours > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {shift.hours} h {shift.isOvernight && '🌙'}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {row.totalHours} h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
