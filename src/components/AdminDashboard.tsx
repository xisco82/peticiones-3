import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ArrowLeftRight,
  SunMedium,
  HeartPulse,
  AlertOctagon,
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { WeekSchedule, ShiftChangeRequest, DaysOffRequest, AbsenceRequest, IncidentItem, User } from '../types';
import { DatabaseSyncIndicator } from './DatabaseSyncIndicator';

interface Props {
  onNavigate: (tab: string) => void;
  employees: User[];
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate, employees }) => {
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>([]);
  const [daysOffRequests, setDaysOffRequests] = useState<DaysOffRequest[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sch, req, inc] = await Promise.all([
          api.getSchedules(),
          api.getRequests(),
          api.getIncidents(),
        ]);
        setSchedules(sch);
        setShiftRequests(req.shiftRequests);
        setDaysOffRequests(req.daysOffRequests);
        setAbsenceRequests(req.absenceRequests);
        setIncidents(inc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingShiftChanges = shiftRequests.filter(r => r.status === 'pending').length;
  const pendingDaysOff = daysOffRequests.filter(r => r.status === 'pending').length;
  const totalAbsences = absenceRequests.length;
  const openIncidents = incidents.filter(i => i.status === 'abierta').length;
  const totalPending = pendingShiftChanges + pendingDaysOff + openIncidents;

  const lastPublishedSchedule = schedules.find(s => s.status === 'published');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800">
            Panel del Administrador
          </span>
          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            Gestión Central de Turnos y Solicitudes
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Control de cuadrantes semanales, 10 cuentas de empleados activas, resolución de cambios de turno,
            ausencias médicas con estricta privacidad e incidencias.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('manage-schedule')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Pegar Nuevo Cuadrante</span>
            </button>

            <button
              onClick={() => onNavigate('general-schedule')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs backdrop-blur-xs transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Ver Cuadrante General</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Database Synchronization Status Card */}
      <DatabaseSyncIndicator variant="card" />

      {/* Operational Counters (Section 8) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Contadores Operativos
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Solicitudes de cambio pendientes */}
          <div
            onClick={() => onNavigate('requests')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cambios de Turno</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl group-hover:scale-110 transition">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {pendingShiftChanges}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">pendientes de revisión</span>
          </div>

          {/* 2. Días libres solicitados */}
          <div
            onClick={() => onNavigate('requests')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Días Libres / Vacaciones</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl group-hover:scale-110 transition">
                <SunMedium className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {pendingDaysOff}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">peticiones pendientes</span>
          </div>

          {/* 3. Ausencias comunicadas */}
          <div
            onClick={() => onNavigate('requests')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Ausencias Médicas</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl group-hover:scale-110 transition">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {totalAbsences}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">comunicadas en el sistema</span>
          </div>

          {/* 4. Incidencias abiertas */}
          <div
            onClick={() => onNavigate('requests')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Incidencias Abiertas</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl group-hover:scale-110 transition">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">
              {openIncidents}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">requieren atención</span>
          </div>
        </div>
      </div>

      {/* Last Published Schedule Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Último Cuadrante Publicado
            </span>
            {lastPublishedSchedule ? (
              <div className="mt-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {lastPublishedSchedule.weekLabel} (Versión v{lastPublishedSchedule.version})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publicado el{' '}
                  {lastPublishedSchedule.publishedAt
                    ? new Date(lastPublishedSchedule.publishedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Reciente'}{' '}
                  • {lastPublishedSchedule.rows.length} empleados incluidos
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Aún no se ha publicado ningún cuadrante definitivo.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('manage-schedule')}
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:opacity-90 transition"
            >
              Publicar Nuevo
            </button>
            {lastPublishedSchedule && (
              <button
                onClick={() => onNavigate('general-schedule')}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Ver Tabla Completa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Plantilla de Empleados</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {employees.filter(e => e.status === 'active').length} empleados activos
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Añade nuevos empleados, edita alias para el reconocimiento al pegar cuadrantes y restablece claves temporales.
          </p>
        </div>

        <div
          onClick={() => onNavigate('requests')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Resolución de Solicitudes</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalPending} trámites requieren decisión
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Aprueba o rechaza cambios de turno y días libres. Los cambios aprobados actualizan el cuadrante en tiempo real.
          </p>
        </div>

        <div
          onClick={() => onNavigate('audit')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Historial y Copias</h4>
              <p className="text-xs text-slate-500 mt-0.5">Auditoría inmutable y restauración</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Registro de todas las modificaciones quién-qué-cuándo, copias de seguridad descargables y restauración inmediata.
          </p>
        </div>
      </div>
    </div>
  );
};
