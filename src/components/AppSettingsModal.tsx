import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
  Trash2,
  BookOpen,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { AppSettings } from '../types';
import { api } from '../services/api';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export const AppSettingsModal: React.FC<Props> = ({ onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'guide'>('settings');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await api.updateSettings(settings);
      setStatusMsg({ text: 'Ajustes guardados correctamente', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al guardar ajustes', type: 'error' });
    }
  };

  const handleSeedDemo = async () => {
    try {
      await api.seedDemoData();
      setStatusMsg({ text: 'Datos de prueba [DEMO] cargados correctamente', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al cargar DEMO', type: 'error' });
    }
  };

  const handleClearDemo = async () => {
    try {
      await api.clearDemoData();
      setStatusMsg({ text: 'Datos DEMO eliminados completamente', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al eliminar DEMO', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Ajustes del Sistema</h3>
              <p className="text-xs text-slate-500">Configuración operativa, datos DEMO y guía paso a paso</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Ajustes Operativos
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guía Paso a Paso (Entregable 2)</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`m-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Visibilidad & General */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Visibilidad y Acceso
                </h4>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.generalScheduleVisibleToEmployees}
                    onChange={e =>
                      setSettings({ ...settings, generalScheduleVisibleToEmployees: e.target.checked })
                    }
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Cuadrante general visible para todos los empleados
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Si se desactiva, los empleados solo podrán ver su propio horario en «Mi Cuadrante».
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireFirstPasswordChange}
                    onChange={e =>
                      setSettings({ ...settings, requireFirstPasswordChange: e.target.checked })
                    }
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Obligar cambio de contraseña en el primer acceso
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Por defecto desactivado (el empleado puede cambiarla voluntariamente desde su perfil).
                    </p>
                  </div>
                </label>
              </div>

              {/* Cálculo de Jornada y Pausas */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Cálculo de Jornada y Pausas
                </h4>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.deductBreaks}
                    onChange={e => setSettings({ ...settings, deductBreaks: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Descontar pausas del cálculo de horas
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Por defecto no se descuentan pausas salvo indicación expresa.
                    </p>
                  </div>
                </label>

                {settings.deductBreaks && (
                  <div className="pl-6">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Minutos de pausa a descontar por turno
                    </label>
                    <input
                      type="number"
                      value={settings.breakMinutes}
                      onChange={e => setSettings({ ...settings, breakMinutes: parseInt(e.target.value, 10) || 0 })}
                      className="w-32 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Umbrales de Avisos Laborales */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Umbrales de Avisos Laborales (Convenio / Estatuto)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <label className="block font-semibold mb-1">Descanso mínimo entre jornadas (horas)</label>
                    <input
                      type="number"
                      value={settings.warningRestBetweenShiftsHours}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          warningRestBetweenShiftsHours: parseFloat(e.target.value) || 12,
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Estándar legal: 12 h</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <label className="block font-semibold mb-1">Máximo horas diarias ordinarias</label>
                    <input
                      type="number"
                      value={settings.warningMaxDailyHours}
                      onChange={e =>
                        setSettings({ ...settings, warningMaxDailyHours: parseFloat(e.target.value) || 9 })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Estándar legal: 9 h</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <label className="block font-semibold mb-1">Máximo horas semanales</label>
                    <input
                      type="number"
                      value={settings.warningMaxWeeklyHours}
                      onChange={e =>
                        setSettings({ ...settings, warningMaxWeeklyHours: parseFloat(e.target.value) || 40 })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Estándar legal: 40 h</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <label className="block font-semibold mb-1">Días mínimos de descanso semanal</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.warningMinWeeklyRestDays}
                      onChange={e =>
                        setSettings({ ...settings, warningMinWeeklyRestDays: parseFloat(e.target.value) || 1.5 })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Estándar legal: 1,5 días</span>
                  </div>
                </div>
              </div>

              {/* Botones de gestión de datos DEMO (Apartado 1 & 14) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Control de Datos de Prueba (DEMO)
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Regla de la especificación: Los 10 empleados iniciales son datos reales sin etiqueta DEMO. Cualquier
                  cuadrante o dato de prueba lleva obligatoriamente la etiqueta «DEMO» y se puede eliminar en un clic.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  >
                    Cargar cuadrante de ejemplo [DEMO]
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDemo}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar todos los datos DEMO</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ajustes</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl">
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  Guía Paso a Paso de Puesta en Marcha (Entregable 2)
                </h4>
                <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1">
                  Instrucciones detalladas para configurar la base de datos, las cuentas del administrador y los 10 empleados,
                  el envío de correos y la publicación en producción.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white">Paso 1: Base de Datos y Persistencia</h5>
                  <p className="mt-1">
                    La base de datos persistente está ubicada en <code>./data/database.json</code> con copias de seguridad
                    automáticas diarias en <code>./data/backups/</code>. Los datos se conservan íntegramente al cerrar sesión,
                    reiniciar el servidor o actualizar la página.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white">Paso 2: Administrador y 10 Empleados Iniciales</h5>
                  <p className="mt-1">
                    Se han cargado las 10 cuentas de empleados especificadas con sus alias reconocibles (Francisco Gallego, Aliz Varga,
                    Oscar David Millán, Francisco Javier Segundo, Inés Ruiz, Josep Vidal, Miriam García, Carlos Rodríguez,
                    Jakeline Munera, Antonio Torres) sin etiquetas DEMO. El administrador puede entrar con <code>admin@empresa.com</code> y
                    contraseña <code>admin</code>.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white">Paso 3: Notificaciones por Correo (Resend / SMTP)</h5>
                  <p className="mt-1">
                    Para habilitar el envío real de correos mediante Resend, configura la variable de entorno <code>RESEND_API_KEY</code>.
                    Por cumplimiento estricto de privacidad, los correos solo contienen «Tienes una novedad en la aplicación».
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white">Paso 4: Instalación PWA en Móvil</h5>
                  <p className="mt-1">
                    La aplicación es 100% PWA. En Android / Chrome, pulsa el botón «Instalar App» de la cabecera. En iPhone / Safari,
                    pulsa Compartir y selecciona «Añadir a la pantalla de inicio». Funciona sin tiendas de aplicaciones.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white">Paso 5: Cumplimiento Legal y Laboral</h5>
                  <p className="mt-1">
                    Recuerda contrastar con el asesor laboral el registro de jornada, los descansos mínimos de 12 horas y 1,5 días semanales
                    según el convenio colectivo aplicable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
