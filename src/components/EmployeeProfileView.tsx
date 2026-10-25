import React, { useState } from 'react';
import {
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  Tag,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const EmployeeProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setStatusMsg({ text: 'La contraseña debe tener al menos 4 caracteres', success: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'Las contraseñas no coinciden', success: false });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(newPassword);
      setStatusMsg({ text: 'Contraseña actualizada con éxito', success: true });
      setNewPassword('');
      setConfirmPassword('');
      refreshUser();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al actualizar contraseña', success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-600/20">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{user.email}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60">
                Empleado Activo
              </span>
            </div>
          </div>
        </div>

        {/* Alias tags */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Tus alias reconocidos por el sistema para asignación de turnos:</span>
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {user.aliases.map((al, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-200"
              >
                {al}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cambiar mi Contraseña</h3>
        </div>
        <p className="text-xs text-slate-500">
          Puedes actualizar tu contraseña en cualquier momento. Recuerda utilizar una clave que recuerdes fácilmente.
        </p>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs max-w-sm">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md active:scale-95 transition"
          >
            {isSubmitting ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>

      {/* Privacy Notice (Apartado 11) */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Aviso de Privacidad y Protección de Datos</span>
        </div>
        <p className="leading-relaxed">
          Tus datos personales y registros de jornada se procesan con fines exclusivos de organización laboral interna.
          En cumplimiento de la normativa de protección de datos, la empresa nunca solicitará diagnósticos médicos para justificar
          ausencias. Solo el administrador y tú tenéis acceso a tus solicitudes personales y comunicaciones.
        </p>
      </div>
    </div>
  );
};
