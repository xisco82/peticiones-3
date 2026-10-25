import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  Copy,
  Check,
  Search,
  AlertTriangle,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface Props {
  employees: User[];
  onRefresh: () => void;
}

export const EmployeeManager: React.FC<Props> = ({ employees, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    aliases: '',
    email: '',
    dni: '',
    phone: '',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newPasswordCreated, setNewPasswordCreated] = useState<{ name: string; pass: string } | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const created = await api.createUser({
        name: formData.name.trim(),
        aliases: formData.aliases ? formData.aliases.split(',').map(s => s.trim()).filter(Boolean) : [],
        email: formData.email.trim() || undefined,
        dni: formData.dni.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });

      setNewPasswordCreated({ name: created.name, pass: created.tempPassword || 'emp1234' });
      setShowAddModal(false);
      setFormData({ name: '', aliases: '', email: '', dni: '', phone: '' });
      onRefresh();
    } catch (err: any) {
      setErrorNotification(err.message || 'Error al añadir empleado');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.updateUser(editingUser.id, {
        name: editingUser.name,
        aliases: editingUser.aliases,
        email: editingUser.email,
        dni: editingUser.dni,
        phone: editingUser.phone,
        status: editingUser.status,
      });
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      setErrorNotification(err.message || 'Error al actualizar empleado');
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const updated = await api.updateUser(user.id, { resetPassword: true });
      setNewPasswordCreated({ name: updated.name, pass: updated.tempPassword || 'temp1234' });
      onRefresh();
    } catch (err: any) {
      setErrorNotification(err.message || 'Error al restablecer contraseña');
    }
  };

  const handleDeleteConfirmed = async (mode: 'deactivate' | 'permanent') => {
    if (!deletingUser) return;
    try {
      await api.deleteUser(deletingUser.id, mode);
      setDeletingUser(null);
      onRefresh();
    } catch (err: any) {
      setErrorNotification(err.message || 'Error al eliminar');
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Add Button */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Gestión de Empleados</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {employees.length} registrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Las modificaciones en nombres y alias se reconocen de inmediato al pegar cuadrantes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o alias..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir Empleado</span>
          </button>
        </div>
      </div>

      {errorNotification && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center justify-between shadow-xs">
          <span>{errorNotification}</span>
          <button onClick={() => setErrorNotification(null)} className="font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Temporary Password notification banner */}
      {newPasswordCreated && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <strong>Contraseña generada para {newPasswordCreated.name}:</strong>
            <span className="ml-2 font-mono font-bold text-sm bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200">
              {newPasswordCreated.pass}
            </span>
            <span className="ml-2 text-slate-500">Cópiala y facilítasela al empleado.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(newPasswordCreated.pass, 'temp-banner')}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              {copiedId === 'temp-banner' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'temp-banner' ? 'Copiada' : 'Copiar clave'}</span>
            </button>
            <button
              onClick={() => setNewPasswordCreated(null)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => {
          const isDeactivated = emp.status === 'deactivated';

          return (
            <div
              key={emp.id}
              className={`rounded-2xl p-5 border transition ${
                isDeactivated
                  ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{emp.name}</h3>
                    {emp.role === 'admin' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                        Admin
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                      emp.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {emp.status === 'active' ? 'Cuenta Activa' : 'Desactivada'}
                  </span>
                </div>

                {/* Edit & Delete Buttons */}
                {emp.role !== 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingUser(emp)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar empleado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingUser(emp)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Eliminar o desactivar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Alias tags */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Alias reconocidos:</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {emp.aliases.length > 0 ? (
                    emp.aliases.map((al, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {al}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Sin alias</span>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-500">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.dni && (
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      DNI: {emp.dni}
                    </span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                )}
              </div>

              {/* Password info & reset */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clave: </span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {revealedPasswords[emp.id] ? (emp.tempPassword || '••••••••') : '••••••••'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {emp.tempPassword && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedPasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))
                      }
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title={revealedPasswords[emp.id] ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {revealedPasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {emp.tempPassword && (
                    <button
                      onClick={() => handleCopy(emp.tempPassword!, emp.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Copiar contraseña"
                    >
                      {copiedId === emp.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {emp.role !== 'admin' && (
                    <button
                      onClick={() => handleResetPassword(emp)}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Añadir Nuevo Empleado</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Laura Martínez Gómez"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Alias (separados por coma)</label>
                <input
                  type="text"
                  value={formData.aliases}
                  onChange={e => setFormData({ ...formData, aliases: e.target.value })}
                  placeholder="Ej: Laura, Laura M., Martínez"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Permite reconocer este empleado si en el texto del cuadrante aparece con apodo o apellido.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="laura@empresa.com (o déjalo en blanco para marcador)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">DNI / NIE (opcional)</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={e => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="Ej: 43215526K o X4366728V"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-indigo-600 text-white rounded-xl shadow-md">
                  Crear Cuenta y Generar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Editar Empleado</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Alias (separados por coma)</label>
                <input
                  type="text"
                  value={editingUser.aliases.join(', ')}
                  onChange={e =>
                    setEditingUser({
                      ...editingUser,
                      aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">DNI / NIE</label>
                <input
                  type="text"
                  value={editingUser.dni || ''}
                  onChange={e => setEditingUser({ ...editingUser, dni: e.target.value })}
                  placeholder="Ej: 43215526K"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado de la cuenta</label>
                <select
                  value={editingUser.status}
                  onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                >
                  <option value="active">Activo (Aparece en cuadrantes y puede acceder)</option>
                  <option value="deactivated">Desactivado (No puede entrar, no aparece en cuadrantes)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-indigo-600 text-white rounded-xl shadow-md">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Section 3: Desactivar vs Eliminar Definitivamente) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Eliminar o Desactivar a {deletingUser.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Elige qué acción deseas aplicar sobre esta cuenta:
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {/* Option A: Desactivar (Recomendado) */}
              <div
                onClick={() => handleDeleteConfirmed('deactivate')}
                className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                    a) Desactivar Cuenta (Recomendado)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                    Seguro
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  El empleado no podrá entrar y dejará de aparecer en nuevos cuadrantes, pero se conservará íntegramente
                  su historial de turnos pasados y registros.
                </p>
              </div>

              {/* Option B: Eliminar Definitivamente */}
              <div
                onClick={() => handleDeleteConfirmed('permanent')}
                className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                    b) ELIMINAR DEFINITIVAMENTE
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                    Irreversible
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Borra su cuenta y datos personales. En los cuadrantes históricos pasados figurará como «Empleado eliminado».
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
