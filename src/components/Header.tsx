import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Bell,
  User as UserIcon,
  LogOut,
  Sliders,
  CheckCircle2,
  Users,
  KeyRound,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { APP_BRAND } from '../constants/branding';
import { InteractiveLogo } from './InteractiveLogo';
import { DatabaseSyncIndicator } from './DatabaseSyncIndicator';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenTests: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenTests,
}) => {
  const { user, quickUsers, switchUser, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; success: boolean } | null>(null);

  const isAdmin = user?.role === 'admin';

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifs();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ text: 'Mínimo 4 caracteres', success: false });
      return;
    }
    try {
      await api.changePassword(newPassword);
      setPasswordMsg({ text: 'Contraseña cambiada con éxito', success: true });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
        setNewPassword('');
      }, 1200);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Error al cambiar contraseña', success: false });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <InteractiveLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{APP_BRAND.name}</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {isAdmin ? 'Admin' : 'Empleado'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {APP_BRAND.subtitle}
              </p>
            </div>
          </div>

          {/* Quick-switch user bar & actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <DatabaseSyncIndicator variant="badge" />
            <PWAInstallButton />

            {/* Test Suite Button */}
            <button
              onClick={onOpenTests}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
              title="Ejecutar pruebas obligatorias del apartado 13"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verificar Pruebas</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifPopover && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span>Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 mt-2">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">No hay notificaciones recientes</p>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            if (!n.read) {
                              await api.markNotificationRead(n.id);
                              fetchNotifs();
                            }
                          }}
                          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
                            n.read ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-indigo-50/60 dark:bg-indigo-950/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-medium text-xs text-slate-900 dark:text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Switch User Selector */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                  isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {user?.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {isAdmin ? 'Administrador' : 'Empleado'}
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cambiar mi contraseña</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                      >
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ajustes del sistema</span>
                      </button>
                    )}
                  </div>

                  {/* Fast Profile Switcher */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cambiar de cuenta rápido
                      </span>
                      <Users className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                      {quickUsers.map(qu => (
                        <button
                          key={qu.id}
                          onClick={() => {
                            switchUser(qu);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg text-left transition ${
                            user?.id === qu.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <span className="block truncate">{qu.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{qu.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                          </div>
                          {user?.id === qu.id && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Panel Principal
                </button>
                <button
                  onClick={() => setActiveTab('manage-schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeTab === 'manage-schedule'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Pegar y Gestionar Cuadrante</span>
                </button>
                <button
                  onClick={() => setActiveTab('general-schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'general-schedule'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Cuadrante General
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'requests'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Solicitudes e Incidencias
                </button>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'employees'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Empleados (10 cuentas)
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'audit'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Historial y Copias
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('my-schedule')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'my-schedule'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Mi Cuadrante
                </button>
                <button
                  onClick={() => setActiveTab('general-schedule')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'general-schedule'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Cuadrante General
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'requests'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Mis Solicitudes
                </button>
                <button
                  onClick={() => setActiveTab('my-profile')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'my-profile'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Mi Perfil
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Cambiar mi contraseña</h3>
            <p className="text-xs text-slate-500 mb-4">
              Introduce tu nueva clave de acceso personal.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              {passwordMsg && (
                <p className={`text-xs ${passwordMsg.success ? 'text-emerald-600 font-medium' : 'text-rose-600'}`}>
                  {passwordMsg.text}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Guardar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
