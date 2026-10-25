import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  Sparkles,
  Save,
  Send,
  HelpCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  Info,
} from 'lucide-react';
import { User, WeekSchedule, ParseResult, EmployeeScheduleRow, ShiftDetail } from '../types';
import { parseScheduleInput, getWeekDates, formatDaySpanish } from '../utils/scheduleParser';
import { api } from '../services/api';
import { INITIAL_EMPLOYEES } from '../constants/initialData';
import { OFFICIAL_SCHEDULE_TEXT } from '../constants/officialSchedule';

interface Props {
  employees: User[];
  onSchedulePublished: () => void;
  onRefreshEmployees?: () => void;
}

export const AdminScheduleManager: React.FC<Props> = ({ employees, onSchedulePublished, onRefreshEmployees }) => {
  const [inputText, setInputText] = useState('');
  const [targetWeekDate, setTargetWeekDate] = useState('2026-11-02');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [existingSchedules, setExistingSchedules] = useState<WeekSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  // Publish / Modify modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isModifyingPublished, setIsModifyingPublished] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Inline editing inside preview
  const [editingCell, setEditingCell] = useState<{ empId: string; dateStr: string } | null>(null);
  const [cellInputValue, setCellInputValue] = useState('');

  const fetchExistingSchedules = async () => {
    try {
      const list = await api.getSchedules();
      setExistingSchedules(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExistingSchedules();
  }, []);

  const effectiveEmployees = (employees && employees.length > 0) ? employees : INITIAL_EMPLOYEES;

  const handlePreview = () => {
    if (!inputText.trim()) {
      setFeedbackMsg({ text: 'Por favor, pega el texto o tabla del cuadrante', type: 'error' });
      return;
    }

    const res = parseScheduleInput(inputText, effectiveEmployees, targetWeekDate);
    setParseResult(res);
    setFeedbackMsg(null);

    // Check if there is already a published schedule for this week
    const existing = existingSchedules.find(
      s => s.weekStartDate === res.weekStartDate && s.status === 'published'
    );
    if (existing) {
      setIsModifyingPublished(true);
      setSelectedScheduleId(existing.id);
    } else {
      setIsModifyingPublished(false);
      setSelectedScheduleId(null);
    }
  };

  const handleResolveAmbiguity = (rawName: string, chosenEmployeeId: string) => {
    const chosen = employees.find(e => e.id === chosenEmployeeId);
    if (!chosen) return;

    // Replace the ambiguous name token in inputText with chosen's full name
    const regex = new RegExp(`\\b${rawName}\\b`, 'i');
    const newText = inputText.replace(regex, chosen.name);
    setInputText(newText);

    // Re-run preview
    setTimeout(() => {
      const res = parseScheduleInput(newText, employees, targetWeekDate);
      setParseResult(res);
    }, 50);
  };

  const handleQuickAddEmployee = async (rawName: string) => {
    setIsSubmitting(true);
    try {
      const created = await api.createUser({
        name: rawName,
        aliases: [rawName],
        role: 'employee',
        status: 'active',
        email: `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}@empresa.com`,
      });
      setFeedbackMsg({ text: `Empleado «${created.name}» registrado correctamente en el sistema.`, type: 'success' });
      onRefreshEmployees?.();

      const updatedEmployees = [...employees, created];
      const res = parseScheduleInput(inputText, updatedEmployees, targetWeekDate);
      setParseResult(res);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al añadir empleado', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!parseResult) return;
    setIsSubmitting(true);
    try {
      await api.saveDraft({
        id: selectedScheduleId || undefined,
        weekStartDate: parseResult.weekStartDate,
        weekEndDate: parseResult.weekEndDate,
        weekLabel: parseResult.weekLabel,
        rows: parseResult.rows,
        rawInputText: inputText,
      });
      setFeedbackMsg({ text: 'Cuadrante guardado como borrador con éxito', type: 'success' });
      fetchExistingSchedules();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al guardar borrador', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishSubmit = async () => {
    if (!parseResult || !parseResult.success) return;
    if (isModifyingPublished && !changeReason.trim()) {
      setFeedbackMsg({ text: 'Debes indicar el motivo de la modificación del cuadrante', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.publishSchedule({
        id: selectedScheduleId || undefined,
        weekStartDate: parseResult.weekStartDate,
        weekEndDate: parseResult.weekEndDate,
        weekLabel: parseResult.weekLabel,
        rows: parseResult.rows,
        rawInputText: inputText,
        changeReason: isModifyingPublished ? changeReason.trim() : undefined,
      });

      setShowConfirmModal(false);
      setChangeReason('');
      setFeedbackMsg({
        text: isModifyingPublished
          ? 'Nueva versión del cuadrante publicada y notificaciones enviadas'
          : 'Cuadrante publicado con éxito. Visible para los empleados.',
        type: 'success',
      });
      fetchExistingSchedules();
      onSchedulePublished();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al publicar cuadrante', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCellEdit = (empId: string, dateStr: string) => {
    if (!parseResult) return;
    const updatedRows = parseResult.rows.map(row => {
      if (row.employeeId !== empId) return row;
      const rawText = cellInputValue.trim() || 'LIBRE';
      const isFree = ['libre', 'desc', 'vac'].includes(rawText.toLowerCase());
      const newShift: ShiftDetail = isFree
        ? { type: 'free', rawText, hours: 0 }
        : { type: 'work', rawText, hours: 8 };

      const newDays = { ...row.days, [dateStr]: newShift };
      const newTotal = Object.values(newDays).reduce((sum, s) => sum + s.hours, 0);

      return {
        ...row,
        days: newDays,
        totalHours: Math.round(newTotal * 100) / 100,
      };
    });

    setParseResult({ ...parseResult, rows: updatedRows });
    setEditingCell(null);
  };

  // Example templates for 1-click loading as per Section 5 & Section 13
  const loadExample = (type: string) => {
    if (type === 'official') {
      setInputText(OFFICIAL_SCHEDULE_TEXT);
      setTargetWeekDate('2026-11-02');
      const res = parseScheduleInput(OFFICIAL_SCHEDULE_TEXT, effectiveEmployees, '2026-11-02');
      setParseResult(res);
    } else if (type === 'sheets') {
      setInputText(
`\t26/10\t27/10\t28/10\t29/10\t30/10\t31/10\t01/11
\tLUNES\tMARTES\tMIERCOLES\tJUEVES\tVIERNES\tSABADO\tDOMINGO
XISCO\tM\tM\tM\tM\tL\tL\tM
ALIZ\tL\tM\tM\tM\tM\tM\tL
OSCAR\tL\tN\tN\tN\tN\tL\tN
MIRIAM\tM\tM\tM\tL\tL\tN\tT
JOSEP\tT\tT\tT\tT\tT\tL\tL
JAVI\tN\tL\tL\tM\tM\tM\tM
TONI\tBP\tBP\tBP\tBP\tBP\tBP\tBP
INES\tT\tL\tL\tT\tT\tT\tT
CARLOS\tM\tT\tT\tL\tL\tT\t10:00-18:00
JAKELINE\tL\tL\tV\tV\tM\tM\tM`
      );
      setTargetWeekDate('2026-10-26');
    } else if (type === 'ex1') {
      setInputText(
`SEMANA DEL 2 AL 8 DE NOVIEMBRE
Francisco Gallego: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: LIBRE Jueves: 14:00-22:00 Viernes: 14:00-22:00 Sábado: LIBRE Domingo: LIBRE
Aliz Varga: Lunes: 14:00-22:00 Martes: LIBRE Miércoles: 09:00-17:00 Jueves: 09:00-17:00 Viernes: LIBRE Sábado: 14:00-22:00 Domingo: 14:00-22:00
Oscar David: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: 09:00-17:00 Jueves: LIBRE Viernes: LIBRE Sábado: 09:00-17:00 Domingo: 09:00-17:00
Javier Segundo: Lunes: LIBRE Martes: 14:00-22:00 Miércoles: 14:00-22:00 Jueves: 14:00-22:00 Viernes: 14:00-22:00 Sábado: LIBRE Domingo: LIBRE
Inés Ruiz: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: LIBRE Jueves: LIBRE Viernes: 09:00-17:00 Sábado: 09:00-17:00 Domingo: 09:00-17:00
Josep Vidal: Lunes: LIBRE Martes: LIBRE Miércoles: 14:00-22:00 Jueves: 14:00-22:00 Viernes: 14:00-22:00 Sábado: 14:00-22:00 Domingo: LIBRE
Miriam García: Lunes: 09:00-17:00 Martes: LIBRE Miércoles: 09:00-17:00 Jueves: 09:00-17:00 Viernes: 09:00-17:00 Sábado: LIBRE Domingo: LIBRE
Carlos Rodríguez: Lunes: 14:00-22:00 Martes: 14:00-22:00 Miércoles: LIBRE Jueves: LIBRE Viernes: 14:00-22:00 Sábado: 14:00-22:00 Domingo: LIBRE
Jakeline Munera: Lunes: LIBRE Martes: 09:00-17:00 Miércoles: 09:00-17:00 Jueves: 09:00-17:00 Viernes: LIBRE Sábado: 09:00-17:00 Domingo: 09:00-17:00
Antonio Torres: Lunes: 14:00-22:00 Martes: 14:00-22:00 Miércoles: 14:00-22:00 Jueves: LIBRE Viernes: LIBRE Sábado: LIBRE Domingo: 14:00-22:00`
      );
      setTargetWeekDate('2026-11-02');
    } else if (type === 'excel') {
      setInputText(
`Empleado\tLunes\tMartes\tMiércoles\tJueves\tViernes\tSábado\tDomingo
Francisco Gallego\t09:00-17:00\t09:00-17:00\tLIBRE\t14:00-22:00\t14:00-22:00\tLIBRE\tLIBRE
Aliz Varga\t14:00-22:00\tLIBRE\t09:00-17:00\t09:00-17:00\tLIBRE\t14:00-22:00\t14:00-22:00
Oscar David\t09:00-17:00\t09:00-17:00\t09:00-17:00\tLIBRE\tLIBRE\t09:00-17:00\t09:00-17:00
Josep Vidal\t09:00-13:00 / 17:00-21:00\t09:00-17:00\tLIBRE\tLIBRE\t14:00-22:00\tLIBRE\tLIBRE`
      );
      setTargetWeekDate('2026-11-02');
    } else if (type === 'cross-year') {
      setInputText(
`SEMANA DEL 28 DE DICIEMBRE AL 3 DE ENERO DE 2027
Francisco Gallego: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: LIBRE Jueves: 14:00-22:00 Viernes: FESTIVO Sábado: LIBRE Domingo: LIBRE
Aliz Varga: Lunes: 14:00-22:00 Martes: LIBRE Miércoles: 09:00-17:00 Jueves: 09:00-17:00 Viernes: FESTIVO Sábado: 14:00-22:00 Domingo: 14:00-22:00`
      );
      setTargetWeekDate('2026-12-28');
    } else if (type === 'dst') {
      // 25 October 2026 DST shift
      setInputText(
`SEMANA DEL 19 AL 25 DE OCTUBRE DE 2026
Josep Vidal: Lunes: LIBRE Martes: LIBRE Miércoles: LIBRE Jueves: LIBRE Viernes: LIBRE Sábado: 22:00-06:00 Domingo: LIBRE`
      );
      setTargetWeekDate('2026-10-19');
    } else if (type === 'ambiguous') {
      // "Francisco" is ambiguous between Francisco Gallego and Francisco Javier Segundo!
      setInputText(
`SEMANA DEL 2 AL 8 DE NOVIEMBRE
Francisco: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: LIBRE Jueves: 14:00-22:00 Viernes: 14:00-22:00 Sábado: LIBRE Domingo: LIBRE`
      );
      setTargetWeekDate('2026-11-02');
    }
  };

  const weekDates = parseResult ? getWeekDates(parseResult.weekStartDate) : [];

  return (
    <div className="space-y-6">
      {/* Top banner / introduction */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Pegar Cuadrante Semanal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Copia y pega directamente las celdas desde <strong>Google Sheets</strong> o Excel (incluyendo cabeceras con fechas como <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 font-mono">26/10</code> a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 font-mono">01/11</code> y turnos <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 font-mono">M, T, N, L, V, BP</code> u horas exactas). El intérprete reconoce alias (Xisco, Javi, Toni, etc.), detecta automáticamente la semana y calcula los totales.
            </p>
          </div>

          {/* Quick example loader */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 px-1">Cargar plantilla:</span>
            <button
              onClick={() => loadExample('official')}
              className="text-xs px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1 cursor-pointer"
              title="Cuadrante oficial 02/11 al 08/11 con 10 empleados"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oficial (02/11 - 08/11)</span>
            </button>
            <button
              onClick={() => loadExample('sheets')}
              className="text-xs px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Sheets (26/10)</span>
            </button>
            <button
              onClick={() => loadExample('ex1')}
              className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 dark:border-slate-600 shadow-2xs"
            >
              10 Empleados (Texto)
            </button>
            <button
              onClick={() => loadExample('excel')}
              className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 dark:border-slate-600 shadow-2xs"
            >
              Tabla Excel
            </button>
            <button
              onClick={() => loadExample('dst')}
              className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 dark:border-slate-600 shadow-2xs"
              title="25 Oct 2026: noche con cambio horario (9h)"
            >
              Cambio de Hora (DST)
            </button>
            <button
              onClick={() => loadExample('cross-year')}
              className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium border border-slate-200 dark:border-slate-600 shadow-2xs"
            >
              Cruce de Año
            </button>
            <button
              onClick={() => loadExample('ambiguous')}
              className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium border border-amber-200 shadow-2xs"
              title="Prueba de alias ambiguo (Francisco)"
            >
              Prueba Ambiguo
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="mt-4">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={7}
            placeholder="Pega aquí el cuadrante en texto libre o copia y pega directamente desde una tabla de Excel con tabuladores...&#10;Ejemplo:&#10;SEMANA DEL 2 AL 8 DE NOVIEMBRE&#10;Francisco Gallego: Lunes: 09:00-17:00 Martes: 09:00-17:00 Miércoles: LIBRE Jueves: 14:00-22:00 Viernes: 14:00-22:00 Sábado: LIBRE Domingo: LIBRE"
            className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
          />
        </div>

        {/* Action bar below textarea */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Semana base (Lunes):</span>
            <input
              type="date"
              value={targetWeekDate}
              onChange={e => setTargetWeekDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            {inputText && (
              <button
                onClick={() => {
                  setInputText('');
                  setParseResult(null);
                }}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-xl"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition"
            >
              <Eye className="w-4 h-4" />
              <span>PREVISUALIZAR CUADRANTE</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Ambiguity Resolution Modal / Banner */}
      {parseResult && parseResult.ambiguities.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Se requiere resolver ambigüedad de nombres (Regla: Nunca adivinar)
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Un nombre o alias introducido coincide con más de un empleado. Elige exactamente a cuál corresponde:
              </p>
              {parseResult.ambiguities.map(amb => (
                <div key={amb.rawName} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Nombre en texto: «<strong className="text-indigo-600">{amb.rawName}</strong>»
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {amb.matchedEmployees.map(me => (
                      <button
                        key={me.id}
                        onClick={() => handleResolveAmbiguity(amb.rawName, me.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition"
                      >
                        Asignar a: {me.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation Feedback: Errors & Warnings */}
      {parseResult && (
        <div className="space-y-3">
          {parseResult.errors.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>ERRORES QUE BLOQUEAN LA PUBLICACIÓN ({parseResult.errors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-700 dark:text-rose-300">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>

              {parseResult.unknownEmployees && parseResult.unknownEmployees.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900/60">
                  <div className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 mb-2">
                    Puedes dar de alta a los empleados faltantes con un solo clic:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parseResult.unknownEmployees.map(rawName => (
                      <button
                        key={rawName}
                        onClick={() => handleQuickAddEmployee(rawName)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95 flex items-center gap-1"
                      >
                        <span>➕ Añadir «{rawName}» como empleado</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {parseResult.warnings.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>AVISOS DE JORNADA Y DESCANSO ({parseResult.warnings.length})</span>
                <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                  (Permiten publicar previa confirmación)
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {parseResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {parseResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{parseResult.weekLabel}</h3>
                {isModifyingPublished ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                    Modificación de Cuadrante ya Publicado
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Nuevo Cuadrante
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {parseResult.rows.length} empleados procesados. Haz clic en cualquier celda para corregir o ajustar turnos.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>GUARDAR COMO BORRADOR</span>
              </button>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!parseResult.success || isSubmitting}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
                  parseResult.success
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                    : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
                title={!parseResult.success ? 'Corrige los errores antes de publicar' : 'Publicar cuadrante para empleados'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>PUBLICAR CUADRANTE</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-bold sticky left-0 bg-slate-100/90 dark:bg-slate-800 z-10 min-w-[180px]">
                    Empleado
                  </th>
                  {weekDates.map((dateStr, idx) => {
                    const info = formatDaySpanish(dateStr);
                    return (
                      <th key={dateStr} className="py-3 px-3 font-semibold min-w-[120px] text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{info.dayName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {info.dayNumber} {info.monthName.slice(0, 3)}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 font-bold text-right min-w-[90px]">Total Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parseResult.rows.map(row => (
                  <tr key={row.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                      <div>{row.employeeName}</div>
                      {row.warnings.length > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{row.warnings.length} aviso(s)</span>
                        </div>
                      )}
                    </td>

                    {weekDates.map(dateStr => {
                      const shift = row.days[dateStr];
                      const isEditing = editingCell?.empId === row.employeeId && editingCell.dateStr === dateStr;

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
                          className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/60 relative group"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={cellInputValue}
                                onChange={e => setCellInputValue(e.target.value)}
                                placeholder="09:00-17:00 / LIBRE"
                                className="w-full text-[11px] p-1 rounded border border-indigo-500 bg-white dark:bg-slate-800 outline-none"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleApplyCellEdit(row.employeeId, dateStr);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                              <button
                                onClick={() => handleApplyCellEdit(row.employeeId, dateStr)}
                                className="p-1 bg-emerald-600 text-white rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingCell({ empId: row.employeeId, dateStr });
                                setCellInputValue(shift ? shift.rawText : 'LIBRE');
                              }}
                              className={`p-1.5 rounded-lg text-center cursor-pointer transition select-none ${badgeColor} hover:ring-1 hover:ring-indigo-400`}
                              title="Haz clic para editar turno"
                            >
                              <div className="font-semibold text-xs leading-tight">
                                {shift ? shift.rawText : 'LIBRE'}
                              </div>
                              {shift && shift.hours > 0 && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {shift.hours} h {shift.isOvernight && '🌙'}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      <span className={row.totalHours > 40 ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {row.totalHours} h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Publish */}
      {showConfirmModal && parseResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Confirmar Publicación del Cuadrante</span>
            </h3>

            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>
                <strong>Semana:</strong> {parseResult.weekLabel}
              </p>
              <p>
                <strong>Empleados incluidos:</strong> {parseResult.rows.length} de {employees.length} activos
              </p>
              <p>
                <strong>Avisos pendientes:</strong> {parseResult.warnings.length}
              </p>
            </div>

            {isModifyingPublished && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Motivo de la modificación (Obligatorio, quedará en el historial y se avisará a los empleados):
                </label>
                <textarea
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  rows={2}
                  placeholder="Ej: Cambio de turno por necesidades del servicio o sustitución..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublishSubmit}
                disabled={isSubmitting || (isModifyingPublished && !changeReason.trim())}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Publicando...' : 'Confirmar y Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
