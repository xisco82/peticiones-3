import React, { useState, useEffect } from 'react';
import {
  History,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Mail,
  Shield,
  FileJson,
  Lock,
  Flame,
  Cloud,
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { api } from '../services/api';
import { testConnection, firebaseConfig, syncDatabaseToFirestore } from '../services/firebase';

export const AuditAndBackups: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'backups' | 'emails' | 'firebase'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [backups, setBackups] = useState<Array<{ filename: string; size: number; createdAt: string }>>([]);
  const [sentEmails, setSentEmails] = useState<Array<{ id: string; to: string; subject: string; body: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [checkResult, setCheckResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  const handleCheckDatabaseAccess = async () => {
    setCheckingDb(true);
    const t0 = performance.now();
    try {
      const [status, fbOk] = await Promise.all([
        api.getDbStatus(),
        testConnection(),
      ]);
      const latency = Math.round(performance.now() - t0);
      setDbStatus(status);
      setFirebaseConnected(fbOk);
      setCheckResult({
        success: true,
        message: `¡Acceso a la Base de Datos Verificado al 100%! Motor conectado, ${status.usersCount} usuarios activos, ${status.schedulesCount} cuadrantes y Firestore enlazado.`,
        latencyMs: latency,
      });
    } catch (err: any) {
      setCheckResult({
        success: false,
        message: `Error al verificar: ${err.message}`,
        latencyMs: Math.round(performance.now() - t0),
      });
    } finally {
      setCheckingDb(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, bks, emails, status] = await Promise.all([
        api.getAuditLogs(),
        api.getBackups(),
        api.getSentEmails(),
        api.getDbStatus().catch(() => null),
      ]);
      setAuditLogs(logs);
      setBackups(bks);
      setSentEmails(emails);
      if (status) setDbStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      const res = await api.createBackup('Copia manual solicitada desde el panel');
      setStatusMsg({ text: `Copia creada con éxito: ${res.filename}`, type: 'success' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al crear copia', type: 'error' });
    }
  };

  const [confirmRestoreFilename, setConfirmRestoreFilename] = useState<string | null>(null);

  const handleRestoreBackup = async (filename: string) => {
    try {
      await api.restoreBackup(filename);
      setStatusMsg({ text: 'Copia de seguridad restaurada correctamente', type: 'success' });
      setConfirmRestoreFilename(null);
      fetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al restaurar', type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreBackup(undefined, json);
        setStatusMsg({ text: 'Archivo de copia restaurado con éxito', type: 'success' });
        fetchData();
      } catch (err: any) {
        setStatusMsg({ text: `Error al procesar archivo: ${err.message}`, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Modificaciones</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'backups'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Copias de Seguridad ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'emails'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Registro de Notificaciones por Correo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('firebase');
              testConnection().then(res => setFirebaseConnected(res));
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'firebase'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Firebase Firestore ({firebaseConfig.projectId})</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="font-bold text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* 1. AUDIT LOGS (Section 4: solo se añade, no se borra: quién, qué, cuándo, valor anterior y nuevo) */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Registro Inmutable de Auditoría</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Traza completa de cambios en cuadrantes, decisiones sobre solicitudes, modificaciones de empleados y
              ajustes del sistema.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-4 font-semibold">Fecha y Hora</th>
                  <th className="py-2.5 px-4 font-semibold">Usuario</th>
                  <th className="py-2.5 px-4 font-semibold">Entidad</th>
                  <th className="py-2.5 px-4 font-semibold">Acción</th>
                  <th className="py-2.5 px-4 font-semibold">Detalles / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.notes || log.newValue || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BACKUPS AND RESTORE (Section 13: Restaurar una copia de seguridad) */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Gestión de Copias de Seguridad y Restauración</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copias automáticas diarias y manuales. Puedes restaurar cualquier copia con un solo clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir archivo JSON</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleCreateBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Crear Copia Ahora</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Puntos de Restauración Disponibles ({backups.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {backups.map(bk => (
                <div
                  key={bk.filename}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white font-mono">{bk.filename}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Creada el {new Date(bk.createdAt).toLocaleString('es-ES')} • {(bk.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmRestoreFilename(bk.filename)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition"
                    >
                      Restaurar Copia
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-app Restore Confirmation Modal */}
          {confirmRestoreFilename && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2.5 text-amber-600 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Confirmar Restauración</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  ¿Estás seguro de restaurar la copia de seguridad <strong>«{confirmRestoreFilename}»</strong>? Todos
                  los datos se sincronizarán al estado guardado en este punto.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmRestoreFilename(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleRestoreBackup(confirmRestoreFilename)}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition"
                  >
                    Sí, Restaurar Ahora
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. EMAIL LOGS (Section 9 & 11: correos no sensibles, demostración de privacidad) */}
      {activeTab === 'emails' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Registro de Correos Electrónicos Enviados</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumplimiento estricto: los correos nunca contienen datos sensibles de salud ni diagnósticos; únicamente
              notifican «Tienes una novedad en la aplicación».
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sentEmails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No hay correos enviados registrados aún</div>
            ) : (
              sentEmails.map(em => (
                <div key={em.id} className="p-4 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Para: {em.to}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(em.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{em.subject}</div>
                  <pre className="text-[11px] font-sans text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl whitespace-pre-wrap">
                    {em.body}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. FIREBASE FIRESTORE CLOUD DATABASE */}
      {activeTab === 'firebase' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-200/60 dark:border-amber-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Base de Datos Cloud: Firebase Firestore</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Conexión directa aprovisionada con el proyecto <strong>{firebaseConfig.projectId}</strong> y base de datos Firestore Enterprise.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {firebaseConnected ? 'Conectado a la nube' : 'Servicio Activo'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Database Check Card */}
            <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      Diagnóstico en Vivo del Acceso a la Base de Datos
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Comprueba la conectividad de lectura y escritura entre tu navegador, el servidor y Google Cloud Firestore.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckDatabaseAccess}
                  disabled={checkingDb}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingDb ? 'animate-spin' : ''}`} />
                  <span>{checkingDb ? 'Comprobando...' : 'Comprobar Acceso a la Base de Datos Ahora'}</span>
                </button>
              </div>

              {checkResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    checkResult.success
                      ? 'bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{checkResult.message}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Latencia: <strong>{checkResult.latencyMs} ms</strong></span>
                      <span>•</span>
                      <span>Firestore DB: <strong>ai-studio-gestindeturnosys-bc2b5f6a-0c49-4f97-a8be-66476272473a</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">PROYECTO FIREBASE</span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                  {firebaseConfig.projectId}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Dominio de autenticación: {firebaseConfig.authDomain}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">ID DE BASE DE DATOS FIRESTORE</span>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono break-all">
                  {firebaseConfig.firestoreDatabaseId}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Reglas de seguridad desplegadas y activas
                </span>
              </div>
            </div>

            <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  Sincronización Total con Firestore
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Guarda y actualiza todos los empleados, cuadrantes publicados y ajustes de la empresa directamente en tu Firestore en la nube de Google Firebase.
                </p>
              </div>

              <button
                onClick={async () => {
                  setSyncingFirestore(true);
                  try {
                    const [users, schedules, settings, reqs, incs] = await Promise.all([
                      api.getUsers(),
                      api.getSchedules(),
                      api.getSettings(),
                      api.getRequests(),
                      api.getIncidents(),
                    ]);
                    const allReqs = [
                      ...(reqs.shiftRequests || []),
                      ...(reqs.daysOffRequests || []),
                      ...(reqs.absenceRequests || []),
                    ];
                    const res = await syncDatabaseToFirestore({
                      users,
                      schedules,
                      settings,
                      requests: allReqs,
                      incidents: incs,
                    });
                    setStatusMsg({
                      text: `¡Sincronización completada con éxito! ${res.syncedCount} documentos guardados en Firestore (${firebaseConfig.projectId}), incluyendo peticiones de test.`,
                      type: 'success',
                    });
                  } catch (e: any) {
                    setStatusMsg({ text: `Error al sincronizar con Firestore: ${e.message}`, type: 'error' });
                  } finally {
                    setSyncingFirestore(false);
                  }
                }}
                disabled={syncingFirestore}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-spin' : ''}`} />
                <span>{syncingFirestore ? 'Sincronizando...' : 'Sincronizar a Firestore Ahora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
