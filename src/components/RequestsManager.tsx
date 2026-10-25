import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  SunMedium,
  HeartPulse,
  AlertOctagon,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  UserCheck,
  FileCheck,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  User,
  ShiftChangeRequest,
  DaysOffRequest,
  AbsenceRequest,
  IncidentItem,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { syncDatabaseToFirestore, firebaseConfig } from '../services/firebase';
import { Cloud, Database } from 'lucide-react';

interface Props {
  employees: User[];
}

export const RequestsManager: React.FC<Props> = ({ employees }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'shift' | 'daysoff' | 'absence' | 'incident'>('shift');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>([]);
  const [daysOffRequests, setDaysOffRequests] = useState<DaysOffRequest[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);

  // Modals for creating new requests
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showDaysOffModal, setShowDaysOffModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Resolution modal
  const [resolvingItem, setResolvingItem] = useState<{
    type: 'shift-change' | 'days-off' | 'absence' | 'incident';
    id: string;
    action: 'approved' | 'rejected' | 'resolving';
  } | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [applyToSchedule, setApplyToSchedule] = useState(true);

  // Comment thread state
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Form states
  const [shiftForm, setShiftForm] = useState({
    date: new Date().toISOString().split('T')[0],
    currentShift: '09:00-17:00',
    proposedShift: '14:00-22:00',
    coworkerId: '',
    comments: '',
  });

  const [daysOffForm, setDaysOffForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    comment: '',
  });

  const [absenceForm, setAbsenceForm] = useState({
    subType: 'communication' as 'communication' | 'leave_request',
    category: 'medico',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    hasCertificate: false,
    comment: '',
  });

  const [incidentForm, setIncidentForm] = useState({
    category: 'Turno / Relevo',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [syncingToFirestore, setSyncingToFirestore] = useState(false);

  const handleSyncRequestsToFirestore = async () => {
    setSyncingToFirestore(true);
    try {
      const allReqs = [
        ...shiftRequests,
        ...daysOffRequests,
        ...absenceRequests,
      ];
      const res = await syncDatabaseToFirestore({
        requests: allReqs,
        incidents: incidents,
      });
      setFeedbackMsg({
        text: `¡Sincronización confirmada! ${res.syncedCount} peticiones e incidencias enlazadas con Firebase Firestore (${firebaseConfig.projectId}).`,
        type: 'success',
      });
    } catch (e: any) {
      setFeedbackMsg({ text: `Error al sincronizar con Firestore: ${e.message}`, type: 'error' });
    } finally {
      setSyncingToFirestore(false);
    }
  };

  const handleSeedSampleTestRequests = async () => {
    try {
      const res = await api.seedTestRequests();
      setFeedbackMsg({
        text: `¡Se han añadido ${res.count} peticiones de test! Ahora figuran en la lista y puedes sincronizarlas a Firestore.`,
        type: 'success',
      });
      fetchData();
    } catch (e: any) {
      setFeedbackMsg({ text: `Error al crear peticiones de test: ${e.message}`, type: 'error' });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqs, incs] = await Promise.all([api.getRequests(), api.getIncidents()]);
      setShiftRequests(reqs.shiftRequests);
      setDaysOffRequests(reqs.daysOffRequests);
      setAbsenceRequests(reqs.absenceRequests);
      setIncidents(incs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle Create Shift Request
  const handleCreateShiftRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShiftChangeRequest({
        date: shiftForm.date,
        currentShift: shiftForm.currentShift,
        proposedShift: shiftForm.proposedShift,
        coworkerId: shiftForm.coworkerId || undefined,
        comments: shiftForm.comments || undefined,
      });
      setShowShiftModal(false);
      setFeedbackMsg({ text: 'Solicitud de cambio de turno enviada con éxito', type: 'success' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al enviar solicitud', type: 'error' });
    }
  };

  // Handle Create Days Off
  const handleCreateDaysOff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDaysOffRequest(daysOffForm);
      setShowDaysOffModal(false);
      setFeedbackMsg({ text: 'Solicitud de días libres registrada con éxito', type: 'success' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al enviar solicitud', type: 'error' });
    }
  };

  // Handle Create Absence
  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAbsenceRequest(absenceForm);
      setShowAbsenceModal(false);
      setFeedbackMsg({ text: 'Comunicación de ausencia registrada', type: 'success' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al enviar ausencia', type: 'error' });
    }
  };

  // Handle Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIncident(incidentForm);
      setShowIncidentModal(false);
      setFeedbackMsg({ text: 'Incidencia reportada correctamente', type: 'success' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al reportar incidencia', type: 'error' });
    }
  };

  // Handle Admin Resolution
  const handleConfirmResolution = async () => {
    if (!resolvingItem) return;
    try {
      if (resolvingItem.type === 'incident') {
        await api.updateIncidentStatus(resolvingItem.id, {
          status: resolvingItem.action === 'approved' ? 'resuelta' : 'en_investigacion',
          comment: resolutionComment || undefined,
        });
      } else {
        await api.updateRequestStatus(resolvingItem.type, resolvingItem.id, {
          status: resolvingItem.action,
          comment: resolutionComment || undefined,
          applyToSchedule: resolvingItem.type === 'shift-change' && resolvingItem.action === 'approved' ? applyToSchedule : false,
        });
      }

      setResolvingItem(null);
      setResolutionComment('');
      setFeedbackMsg({ text: 'Trámite resuelto y notificado', type: 'success' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al resolver', type: 'error' });
    }
  };

  // Handle Coworker Response to shift change
  const handleCoworkerResponse = async (id: string, response: 'accepted' | 'rejected') => {
    try {
      await api.respondCoworkerShiftChange(id, response);
      setFeedbackMsg({
        text: response === 'accepted' ? 'Has aceptado la propuesta de intercambio' : 'Has rechazado la propuesta',
        type: 'success',
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al responder', type: 'error' });
    }
  };

  // Handle Adding a Comment to thread
  const handleAddComment = async (type: 'shift-change' | 'days-off' | 'absence', id: string) => {
    if (!commentText.trim()) return;
    try {
      await api.addRequestComment(type, id, commentText.trim());
      setCommentText('');
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al añadir comentario', type: 'error' });
    }
  };

  const pendingShift = shiftRequests.filter(r => r.status === 'pending').length;
  const pendingDays = daysOffRequests.filter(r => r.status === 'pending').length;
  const openInc = incidents.filter(i => i.status === 'abierta').length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isAdmin ? 'Gestión de Solicitudes e Incidencias' : 'Mis Solicitudes e Incidencias'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tramitación de cambios de turno entre compañeros, solicitud de días libres, ausencias médicas con estricta privacidad y reporte de incidencias.
          </p>
        </div>

        {/* Action Button for Admin and Employees */}
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncRequestsToFirestore}
              disabled={syncingToFirestore}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Cloud className={`w-3.5 h-3.5 ${syncingToFirestore ? 'animate-spin' : ''}`} />
              <span>{syncingToFirestore ? 'Sincronizando...' : 'Sincronizar a Firebase Firestore'}</span>
            </button>
            <button
              onClick={handleSeedSampleTestRequests}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Recargar Peticiones de Test</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowShiftModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pedir Cambio de Turno</span>
            </button>
            <button
              onClick={() => setShowDaysOffModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Días Libres / Vacaciones</span>
            </button>
            <button
              onClick={() => setShowAbsenceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Comunicar Ausencia</span>
            </button>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Incidencia</span>
            </button>
          </div>
        )}
      </div>

      {/* Synchronization Status Bar */}
      <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Base de datos: {shiftRequests.length + daysOffRequests.length + absenceRequests.length} peticiones y {incidents.length} incidencias registradas
          </span>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            • Firestore DB: {firebaseConfig.firestoreDatabaseId || 'ai-studio-gestindeturnosys...'}
          </span>
        </div>

        <button
          onClick={handleSyncRequestsToFirestore}
          disabled={syncingToFirestore}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Sincronizar a Firestore</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-3 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('shift')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'shift'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Cambios de Turno</span>
          {pendingShift > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
              {pendingShift}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('daysoff')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'daysoff'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <SunMedium className="w-4 h-4" />
          <span>Días Libres / Vacaciones</span>
          {pendingDays > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
              {pendingDays}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('absence')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'absence'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Ausencias Médicas</span>
        </button>

        <button
          onClick={() => setActiveTab('incident')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
            activeTab === 'incident'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Incidencias</span>
          {openInc > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px]">
              {openInc}
            </span>
          )}
        </button>
      </div>

      {/* 1. SHIFT CHANGE REQUESTS */}
      {activeTab === 'shift' && (
        <div className="space-y-4">
          {shiftRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No hay solicitudes de cambio de turno registradas
            </div>
          ) : (
            shiftRequests.map(item => {
              const isCoworkerTarget = item.coworkerId === user?.id && item.coworkerStatus === 'pending';
              const isPending = item.status === 'pending';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{item.employeeName}</span>
                      <span className="text-xs text-slate-400">• Fecha: <strong>{item.date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'approved' ? 'Aprobada' : item.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Shift details exchange */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Turno Actual:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.currentShift}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Turno Solicitado:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.proposedShift}</span>
                    </div>
                  </div>

                  {item.coworkerName && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      <span>
                        Compañero propuesto para intercambio: <strong>{item.coworkerName}</strong> (Estado:{' '}
                        {item.coworkerStatus === 'accepted'
                          ? 'Aceptado por compañero'
                          : item.coworkerStatus === 'rejected'
                          ? 'Rechazado por compañero'
                          : 'Pendiente de aceptar'}
                        )
                      </span>
                    </div>
                  )}

                  {/* Coworker action button */}
                  {isCoworkerTarget && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                      <span className="text-amber-900 dark:text-amber-200 font-semibold">
                        {item.employeeName} te ha propuesto este intercambio de turno. ¿Aceptas?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCoworkerResponse(item.id, 'rejected')}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 rounded-lg font-bold text-rose-600"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleCoworkerResponse(item.id, 'accepted')}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold shadow-xs"
                        >
                          Aceptar Cambio
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Resolution Buttons */}
                  {isAdmin && isPending && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          setResolvingItem({ type: 'shift-change', id: item.id, action: 'approved' })
                        }
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                      >
                        Aprobar y Aplicar a Cuadrante
                      </button>
                      <button
                        onClick={() =>
                          setResolvingItem({ type: 'shift-change', id: item.id, action: 'rejected' })
                        }
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}

                  {/* Comments Thread */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Comentarios:</span>
                      {item.comments.map(c => (
                        <div key={c.id} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.userName}: </span>
                          <span className="text-slate-600 dark:text-slate-300">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje o aclaración..."
                      value={activeThreadId === item.id ? commentText : ''}
                      onFocus={() => setActiveThreadId(item.id)}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddComment('shift-change', item.id);
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                    <button
                      onClick={() => handleAddComment('shift-change', item.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. DAYS OFF / VACATIONS */}
      {activeTab === 'daysoff' && (
        <div className="space-y-4">
          {daysOffRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No hay peticiones de días libres o vacaciones registradas
            </div>
          ) : (
            daysOffRequests.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.employeeName}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Desde: <strong>{item.startDate}</strong> hasta: <strong>{item.endDate}</strong>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : item.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {item.status === 'approved' ? 'Aprobada' : item.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>

                {item.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    «{item.comment}»
                  </p>
                )}

                {isAdmin && item.status === 'pending' && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setResolvingItem({ type: 'days-off', id: item.id, action: 'approved' })}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                    >
                      Aprobar Días Libres
                    </button>
                    <button
                      onClick={() => setResolvingItem({ type: 'days-off', id: item.id, action: 'rejected' })}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. ABSENCE REQUESTS */}
      {activeTab === 'absence' && (
        <div className="space-y-4">
          {absenceRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No hay ausencias médicas comunicadas
            </div>
          ) : (
            absenceRequests.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.employeeName}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fechas: <strong>{item.startDate}</strong> al <strong>{item.endDate}</strong>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.subType === 'communication' ? 'Comunicación' : 'Petición de Permiso'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between">
                  <span>Tipo: <strong className="capitalize">{item.category}</strong></span>
                  <span>Justificante aportado: <strong>{item.hasCertificate ? 'Sí' : 'Pendiente'}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. INCIDENTS */}
      {activeTab === 'incident' && (
        <div className="space-y-4">
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No hay incidencias registradas
            </div>
          ) : (
            incidents.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.category}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Reportada por <strong>{item.employeeName}</strong> el {item.date}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.status === 'resuelta'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.status === 'resuelta' ? 'Resuelta' : 'Abierta'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl leading-relaxed">
                  {item.description}
                </p>

                {isAdmin && item.status !== 'resuelta' && (
                  <button
                    onClick={() =>
                      setResolvingItem({ type: 'incident', id: item.id, action: 'approved' })
                    }
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                  >
                    Marcar como Resuelta
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: CREATE SHIFT CHANGE REQUEST */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Solicitar Cambio de Turno</h3>
            <form onSubmit={handleCreateShiftRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Fecha del turno a cambiar *</label>
                <input
                  type="date"
                  value={shiftForm.date}
                  onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mi turno actual *</label>
                <input
                  type="text"
                  value={shiftForm.currentShift}
                  onChange={e => setShiftForm({ ...shiftForm, currentShift: e.target.value })}
                  placeholder="09:00-17:00 / Mañana"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Turno deseado *</label>
                <input
                  type="text"
                  value={shiftForm.proposedShift}
                  onChange={e => setShiftForm({ ...shiftForm, proposedShift: e.target.value })}
                  placeholder="14:00-22:00 / Tarde"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Compañero con quien intercambiar (opcional)</label>
                <select
                  value={shiftForm.coworkerId}
                  onChange={e => setShiftForm({ ...shiftForm, coworkerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                >
                  <option value="">Cualquier compañero / Solicitud directa al Administrador</option>
                  {employees
                    .filter(e => e.id !== user?.id && e.status === 'active')
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Motivo o comentario</label>
                <textarea
                  value={shiftForm.comments}
                  onChange={e => setShiftForm({ ...shiftForm, comments: e.target.value })}
                  rows={2}
                  placeholder="Indica el motivo..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-indigo-600 text-white rounded-xl shadow-md">
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DAYS OFF */}
      {showDaysOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Solicitar Días Libres / Vacaciones</h3>
            <form onSubmit={handleCreateDaysOff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={daysOffForm.startDate}
                    onChange={e => setDaysOffForm({ ...daysOffForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fecha de Fin *</label>
                  <input
                    type="date"
                    value={daysOffForm.endDate}
                    onChange={e => setDaysOffForm({ ...daysOffForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Comentario</label>
                <textarea
                  value={daysOffForm.comment}
                  onChange={e => setDaysOffForm({ ...daysOffForm, comment: e.target.value })}
                  rows={2}
                  placeholder="Detalles sobre la petición..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDaysOffModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-amber-600 text-white rounded-xl shadow-md">
                  Enviar Petición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ABSENCE */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Comunicar Ausencia</h3>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              En cumplimiento estricto de la ley de protección de datos, no es necesario detallar diagnósticos médicos.
            </p>
            <form onSubmit={handleCreateAbsence} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={absenceForm.startDate}
                    onChange={e => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fecha de Fin *</label>
                  <input
                    type="date"
                    value={absenceForm.endDate}
                    onChange={e => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoría general</label>
                <select
                  value={absenceForm.category}
                  onChange={e => setAbsenceForm({ ...absenceForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                >
                  <option value="medico">Cita médica / Reposo</option>
                  <option value="urgencia">Urgencia personal</option>
                  <option value="fuerza_mayor">Fuerza mayor</option>
                  <option value="otro">Otro permiso reglamentario</option>
                </select>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={absenceForm.hasCertificate}
                  onChange={e => setAbsenceForm({ ...absenceForm, hasCertificate: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Dispongo de justificante oficial para aportar</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-rose-600 text-white rounded-xl shadow-md">
                  Registrar Ausencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INCIDENT */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Reportar Incidencia</h3>
            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <input
                  type="text"
                  value={incidentForm.category}
                  onChange={e => setIncidentForm({ ...incidentForm, category: e.target.value })}
                  placeholder="Ej: Turno / Relevo / Operativa"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fecha del suceso *</label>
                <input
                  type="date"
                  value={incidentForm.date}
                  onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción detallada *</label>
                <textarea
                  value={incidentForm.description}
                  onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  rows={3}
                  placeholder="Explica qué ha sucedido..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-md">
                  Enviar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL FOR ADMIN */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Confirmar Resolución: <span className="capitalize">{resolvingItem.action}</span>
            </h3>

            <div className="space-y-3 text-xs mt-3">
              <div>
                <label className="block font-semibold mb-1">Comentario para el empleado (opcional)</label>
                <textarea
                  value={resolutionComment}
                  onChange={e => setResolutionComment(e.target.value)}
                  rows={2}
                  placeholder="Ej: Aprobado según lo acordado..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              {resolvingItem.type === 'shift-change' && resolvingItem.action === 'approved' && (
                <label className="flex items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToSchedule}
                    onChange={e => setApplyToSchedule(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                    Aplicar cambio automáticamente al cuadrante publicado
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmResolution}
                  className="px-5 py-2 font-bold bg-indigo-600 text-white rounded-xl shadow-md"
                >
                  Confirmar Resolución
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
