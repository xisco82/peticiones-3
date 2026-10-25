import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sparkles,
  Info,
  CalendarCheck,
  Printer,
} from 'lucide-react';
import { WeekSchedule, DayShift } from '../types';
import { formatDaySpanish, getWeekDates } from '../utils/scheduleParser';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const EmployeeMyScheduleView: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await api.getSchedules();
        // Only published schedules are returned by backend for employees
        setSchedules(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Cargando tus cuadrantes...
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Aún no hay cuadrantes publicados</h3>
        <p className="text-xs text-slate-500 mt-1">
          El administrador aún no ha publicado el cuadrante definitivo para esta semana.
        </p>
      </div>
    );
  }

  const currentSchedule = schedules[selectedWeekIndex] || schedules[0];
  const weekDates = getWeekDates(currentSchedule.weekStartDate);
  const myRow = currentSchedule.rows.find(r => r.employeeId === user?.id);

  return (
    <div className="space-y-6">
      {/* Week Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
            Mi Horario Semanal
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currentSchedule.weekLabel}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Versión <strong>v{currentSchedule.version}</strong></span>
            <span>•</span>
            <span>
              Publicado el{' '}
              {currentSchedule.publishedAt
                ? new Date(currentSchedule.publishedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Reciente'}
            </span>
            {currentSchedule.changeReason && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                (Motivo: {currentSchedule.changeReason})
              </span>
            )}
          </div>
        </div>

        {/* Pagination & Print buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Imprimir mi horario"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedWeekIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedWeekIndex === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-300">
              {selectedWeekIndex + 1} de {schedules.length}
            </span>
            <button
              onClick={() => setSelectedWeekIndex(prev => Math.min(schedules.length - 1, prev + 1))}
              disabled={selectedWeekIndex === schedules.length - 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Horas Semanales</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {myRow ? myRow.totalHours : 0} <span className="text-xs font-normal text-slate-400">horas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Días de Descanso</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {myRow
              ? Object.values(myRow.days).filter(d => d.type === 'free' || d.type === 'rest').length
              : 0}
            <span className="text-xs font-normal text-slate-400 ml-1">días</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Días Trabajados</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {myRow
              ? Object.values(myRow.days).filter(d => d.type === 'work').length
              : 0}
            <span className="text-xs font-normal text-slate-400 ml-1">días</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Zona Horaria Oficial</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Europe/Madrid</span>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Day Cards (Lunes a Domingo) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Detalle Diario de Turnos (Lunes a Domingo)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDates.map(dateStr => {
            const info = formatDaySpanish(dateStr);
            const shift = myRow?.days[dateStr];
            const isSick = shift?.type === 'sick' || shift?.rawText?.toUpperCase() === 'BP';
            const isVacation = shift?.type === 'vacation' || shift?.rawText?.toUpperCase() === 'V';
            const isWork = shift?.type === 'work' && !isSick && !isVacation;
            const isFree = (shift?.type === 'free' || shift?.type === 'rest' || shift?.rawText?.toUpperCase() === 'L') && !isSick && !isVacation;

            let cardBg = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
            if (isSick) {
              cardBg = 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60';
            } else if (isVacation) {
              cardBg = 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60';
            } else if (isWork) {
              cardBg = 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-xs';
            } else {
              cardBg = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800';
            }

            return (
              <div
                key={dateStr}
                className={`rounded-2xl p-4 border transition ${cardBg}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{info.dayName}</span>
                  <span className="text-xs text-slate-400">
                    {info.dayNumber} {info.monthName.slice(0, 3)}
                  </span>
                </div>

                <div className="mt-3">
                  {shift ? (
                    <div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <span>{shift.rawText}</span>
                        {shift.isOvernight && (
                          <span title="Turno nocturno">
                            <Moon className="w-4 h-4 text-indigo-500" />
                          </span>
                        )}
                      </div>

                      {isSick ? (
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                          Baja Médica / Permiso
                        </div>
                      ) : isVacation ? (
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          Vacaciones
                        </div>
                      ) : shift.hours > 0 ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {shift.hours} horas
                            {shift.rawText.toUpperCase() === 'M' && ' (Mañana)'}
                            {shift.rawText.toUpperCase() === 'T' && ' (Tarde)'}
                            {shift.rawText.toUpperCase() === 'N' && ' (Noche)'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                          Día Libre / Descanso
                        </div>
                      )}

                      {shift.note && (
                        <div className="mt-2 text-[11px] bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-600 dark:text-slate-300">
                          {shift.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">No asignado</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
