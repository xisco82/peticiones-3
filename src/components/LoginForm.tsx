import React, { useState } from 'react';
import {
  CalendarDays,
  KeyRound,
  Mail,
  LogIn,
  AlertCircle,
  Users,
  UserPlus,
  CheckCircle2,
  Phone,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { APP_BRAND } from '../constants/branding';
import { InteractiveLogo } from './InteractiveLogo';
import { api } from '../services/api';
import { DatabaseSyncIndicator } from './DatabaseSyncIndicator';

export const LoginForm: React.FC = () => {
  const { login, quickUsers, switchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New employee registration modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [modalTab, setModalTab] = useState<'register' | 'lookup'>('register');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDni, setNewEmpDni] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [createdEmpInfo, setCreatedEmpInfo] = useState<{ name: string; email: string; pass: string } | null>(null);
  const [showCreatedPass, setShowCreatedPass] = useState(false);

  // DNI Lookup state
  const [lookupDni, setLookupDni] = useState('');
  const [lookupResult, setLookupResult] = useState<User | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor introduce tu correo y contraseña');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupDni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupDni.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const found = await api.lookupEmployeeByDni(lookupDni.trim());
      if (found) {
        setLookupResult(found);
      } else {
        setLookupError('No se encontró ningún empleado registrado con ese DNI/NIE');
      }
    } catch {
      setLookupError('Error al consultar DNI');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRegisterEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim()) {
      setErrorMsg('Nombre y correo electrónico son obligatorios');
      return;
    }

    setRegSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.registerEmployee({
        name: newEmpName.trim(),
        email: newEmpEmail.trim(),
        dni: newEmpDni.trim() || undefined,
        phone: newEmpPhone.trim() || undefined,
      });

      setCreatedEmpInfo({
        name: res.user.name,
        email: res.user.email,
        pass: res.tempPassword,
      });

      setSuccessBanner(
        `¡Cuenta creada con éxito para ${res.user.name}! Se han enviado las credenciales a su correo ${res.user.email}.`
      );

      setTimeout(() => {
        switchUser(res.user);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta de empleado');
      setRegSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <InteractiveLogo size="xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{APP_BRAND.name}</h1>
          <p className="text-xs text-slate-500">{APP_BRAND.subtitle}</p>
        </div>

        {/* Database Synchronization Indicator */}
        <div className="pt-1">
          <DatabaseSyncIndicator variant="bar" />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>{successBanner}</span>
              <p className="mt-1 font-semibold text-emerald-900">Entrando a la app para que definas tu contraseña...</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu.correo@empresa.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Introduce tu contraseña"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider text-slate-900 dark:text-white"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión'}</span>
          </button>
        </form>

        {/* Employee portal & registration */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowEmployeeModal(true)}
            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-emerald-950/20 transition cursor-pointer flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Portal de Empleados: Crear cuenta o acceso
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
              Acceder →
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} {APP_BRAND.name}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {APP_BRAND.copyrightText}
          </p>
        </div>
      </div>

      {/* EMPLOYEE ACCESS & REGISTRATION MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Acceso de Empleado</h3>
                  <p className="text-[11px] text-slate-500">Crea tu cuenta nueva o accede si ya eres empleado</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setCreatedEmpInfo(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdEmpInfo ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Usuario Creado y Notificado!</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Se ha registrado la cuenta para <strong>{createdEmpInfo.name}</strong> y se ha enviado la clave inicial a su correo <strong>{createdEmpInfo.email}</strong>.
                </p>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-700 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Datos de la cuenta:</span>
                  <div className="text-xs"><strong>Correo:</strong> <span className="font-mono">{createdEmpInfo.email}</span></div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <strong className="text-xs">Contraseña inicial: </strong>
                      <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                        {showCreatedPass ? createdEmpInfo.pass : '••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreatedPass(!showCreatedPass)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {showCreatedPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showCreatedPass ? 'Ocultar' : 'Revelar'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-900 dark:text-indigo-200 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>A continuación entrarás a la aplicación y se te pedirá definir tu nueva contraseña personal secreta.</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                  >
                    Continuar al Panel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold mb-3">
                  <button
                    type="button"
                    onClick={() => setModalTab('register')}
                    className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                      modalTab === 'register'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Crear Nueva Cuenta
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('lookup')}
                    className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                      modalTab === 'lookup'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Acceder con DNI / Recuperar
                  </button>
                </div>

                {modalTab === 'register' ? (
                  /* Registration Form */
                  <form onSubmit={handleRegisterEmployeeSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Nombre y Apellidos *
                      </label>
                      <input
                        type="text"
                        value={newEmpName}
                        onChange={e => setNewEmpName(e.target.value)}
                        placeholder="Ej: Laura Martínez Gomis"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        DNI / NIE (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newEmpDni}
                        onChange={e => setNewEmpDni(e.target.value)}
                        placeholder="Ej: 43215526K o X4366728V"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        value={newEmpEmail}
                        onChange={e => setNewEmpEmail(e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        A este correo se enviará la contraseña inicial y los avisos de cuadrantes.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Teléfono móvil (Opcional)
                      </label>
                      <input
                        type="tel"
                        value={newEmpPhone}
                        onChange={e => setNewEmpPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{regSubmitting ? 'Creando cuenta...' : 'Crear Cuenta y Recibir Contraseña'}</span>
                    </button>
                  </form>
                ) : (
                  /* Lookup by DNI Form */
                  <form onSubmit={handleLookupDni} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Introduce tu DNI o NIE
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lookupDni}
                          onChange={e => setLookupDni(e.target.value)}
                          placeholder="Ej: 43215526K o X4366728V"
                          className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          required
                        />
                        <button
                          type="submit"
                          disabled={lookupLoading}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                        >
                          {lookupLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                    </div>

                    {lookupError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
                        {lookupError}
                      </div>
                    )}

                    {lookupResult && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>¡Cuenta Encontrada en el Censo!</span>
                        </div>
                        <div>
                          <strong>Nombre:</strong> {lookupResult.name}
                        </div>
                        <div>
                          <strong>Correo:</strong> <span className="font-mono">{lookupResult.email}</span>
                        </div>
                        {lookupResult.dni && (
                          <div>
                            <strong>DNI:</strong> <span className="font-mono">{lookupResult.dni}</span>
                          </div>
                        )}
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEmail(lookupResult.email);
                              setShowEmployeeModal(false);
                            }}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                          >
                            Usar este Correo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchUser(lookupResult);
                              setShowEmployeeModal(false);
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                          >
                            Entrar Ahora
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* Existing employees quick list */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    2. O conectar como empleado existente
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {quickUsers
                      .filter(u => u.role === 'employee')
                      .slice(0, 6)
                      .map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            switchUser(emp);
                            setShowEmployeeModal(false);
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">{emp.email}</span>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            Entrar →
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
