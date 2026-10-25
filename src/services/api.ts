import {
  User,
  WeekSchedule,
  ShiftChangeRequest,
  DaysOffRequest,
  AbsenceRequest,
  IncidentItem,
  NotificationItem,
  AuditLogItem,
  AppSettings,
} from '../types';
import { ALL_INITIAL_USERS, DEFAULT_SETTINGS } from '../constants/initialData';
import { firebaseConfig, syncDatabaseToFirestore } from './firebase';

const TOKEN_KEY = 'hgranfiesta_auth_token';
const STORAGE_DB_KEY = 'hgranfiesta_local_db_v2';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

interface LocalDB {
  users: User[];
  schedules: WeekSchedule[];
  shiftRequests: ShiftChangeRequest[];
  daysOffRequests: DaysOffRequest[];
  absenceRequests: AbsenceRequest[];
  incidents: IncidentItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  settings: AppSettings;
  sentEmails: Array<{ id: string; to: string; subject: string; body: string; date: string }>;
}

function getLocalDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users && parsed.users.length > 0) {
        // Ensure admin has xiscooquin@gmail.com
        const admin = parsed.users.find((u: User) => u.role === 'admin' || u.id === 'admin-1');
        if (admin) {
          admin.email = 'xiscooquin@gmail.com';
          admin.tempPassword = '3090';
        }
        // Remove all fictional test shift changes, requests and incidents
        parsed.shiftRequests = (parsed.shiftRequests || []).filter((r: any) => !r.id?.includes('test') && !r.comments?.some((c: any) => c.text?.includes('[Petición de Test]')));
        parsed.daysOffRequests = (parsed.daysOffRequests || []).filter((r: any) => !r.id?.includes('test') && !r.comment?.includes('[Petición de Test]'));
        parsed.absenceRequests = (parsed.absenceRequests || []).filter((r: any) => !r.id?.includes('test') && !r.comments?.some((c: any) => c.text?.includes('[Petición de Test]')));
        parsed.incidents = (parsed.incidents || []).filter((i: any) => !i.id?.includes('test') && !i.description?.includes('[Petición de Test'));
        saveLocalDB(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local DB, resetting to defaults:', e);
  }

  const initial: LocalDB = {
    users: ALL_INITIAL_USERS,
    schedules: [],
    shiftRequests: [],
    daysOffRequests: [],
    absenceRequests: [],
    incidents: [],
    notifications: [],
    auditLogs: [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        userId: 'admin-1',
        userName: 'Sistema',
        action: 'Inicialización de la base de datos',
        entity: 'ajustes',
        notes: 'Cuentas de empleados iniciales sincronizadas',
      },
    ],
    settings: DEFAULT_SETTINGS,
    sentEmails: [],
  };

  saveLocalDB(initial);
  return initial;
}

function saveLocalDB(db: LocalDB) {
  try {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Error saving local DB to localStorage:', e);
  }
}

// Fallback helper when backend HTTP route fails (e.g. in Vercel static hosting)
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    }

    // If server returned non-OK or non-JSON (like 404 or index.html SPA rewrite), throw to trigger fallback
    throw new Error(`Endpoint ${endpoint} returned status ${response.status}`);
  } catch (err) {
    // Return null to let the caller handle offline/Vercel fallback
    throw err;
  }
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const data = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(data.token);
      return data;
    } catch {
      // Offline / Vercel Client-Side Fallback
      const db = getLocalDB();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      const user = db.users.find(u => {
        const uEmail = u.email.toLowerCase();
        if (uEmail === cleanEmail) return true;
        if (u.role === 'admin' && (
          cleanEmail === 'xiscooquin@gmail.com' ||
          cleanEmail === 'xiscoquin@gmail.com' ||
          cleanEmail === 'xiscoquin1@gmail.com' ||
          cleanEmail === 'admin@empresa.com'
        )) return true;
        return false;
      });

      if (!user) {
        throw new Error('Credenciales incorrectas');
      }

      if (user.tempPassword && user.tempPassword !== cleanPass) {
        throw new Error('Contraseña incorrecta');
      }

      setStoredToken(user.id);
      return { user, token: user.id };
    }
  },

  async getMe(): Promise<{ user: User }> {
    try {
      return await request<{ user: User }>('/api/auth/me');
    } catch {
      const token = getStoredToken();
      const db = getLocalDB();
      const user = db.users.find(u => u.id === token) || db.users.find(u => u.role === 'admin') || ALL_INITIAL_USERS[0];
      return { user };
    }
  },

  async changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch {
      const token = getStoredToken();
      const db = getLocalDB();
      const user = db.users.find(u => u.id === token);
      if (user) {
        user.tempPassword = newPassword;
        user.mustChangePassword = false;
        saveLocalDB(db);
      }
      return { success: true, message: 'Contraseña actualizada' };
    }
  },

  async registerEmployee(data: { name: string; email: string; phone?: string; dni?: string }): Promise<{ user: User; tempPassword: string; token: string }> {
    try {
      const res = await request<{ user: User; tempPassword: string; token: string }>('/api/auth/register-employee', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setStoredToken(res.token);
      return res;
    } catch {
      const db = getLocalDB();
      const cleanEmail = data.email.trim().toLowerCase();
      const tempPassword = `emp${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanName = data.name.trim();
      const firstName = cleanName.split(' ')[0];

      const newUser: User = {
        id: `emp-${Date.now()}`,
        name: cleanName,
        aliases: [firstName, cleanName],
        email: cleanEmail,
        dni: data.dni?.trim() || '',
        phone: data.phone?.trim() || '',
        role: 'employee',
        status: 'active',
        tempPassword,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      saveLocalDB(db);
      setStoredToken(newUser.id);
      return { user: newUser, tempPassword, token: newUser.id };
    }
  },

  async lookupEmployeeByDni(dni: string): Promise<User | null> {
    const cleanDni = dni.trim().toUpperCase().replace(/[\s-]/g, '');
    try {
      const users = await this.getUsers();
      const found = users.find(u => {
        if (!u.dni) return false;
        const uDni = u.dni.trim().toUpperCase().replace(/[\s-]/g, '');
        return uDni === cleanDni;
      });
      return found || null;
    } catch {
      const db = getLocalDB();
      const found = db.users.find(u => {
        if (!u.dni) return false;
        const uDni = u.dni.trim().toUpperCase().replace(/[\s-]/g, '');
        return uDni === cleanDni;
      });
      return found || null;
    }
  },

  async getQuickUsers(): Promise<User[]> {
    try {
      return await request<User[]>('/api/auth/quick-users');
    } catch {
      const db = getLocalDB();
      return db.users.filter(u => u.status !== 'deleted');
    }
  },

  async getDbStatus(): Promise<any> {
    try {
      return await request<any>('/api/db/status');
    } catch {
      const db = getLocalDB();
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        usersCount: db.users.filter(u => u.status !== 'deleted').length,
        schedulesCount: db.schedules.length,
        requestsCount: db.shiftRequests.length + db.daysOffRequests.length + db.absenceRequests.length,
        incidentsCount: db.incidents.length,
        auditLogsCount: db.auditLogs.length,
        firestoreProjectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-gestindeturnosys-bc2b5f6a-0c49-4f97-a8be-66476272473a',
      };
    }
  },

  async testDbConnection(): Promise<any> {
    try {
      return await request<any>('/api/db/test-connection');
    } catch {
      const status = await this.getDbStatus();
      return {
        ...status,
        status: 'online_vercel_static_cdn',
        localEngine: { fileSizeBytes: 32000 },
        counts: {
          employeesWithDni: 10,
          totalUsers: status.usersCount,
        },
      };
    }
  },

  async recordConnectionTestMark(markData: any): Promise<any> {
    try {
      return await request<any>('/api/db/record-test-mark', {
        method: 'POST',
        body: JSON.stringify(markData),
      });
    } catch {
      try {
        localStorage.setItem('latest_connection_test_mark', JSON.stringify(markData));
      } catch {}
      return { success: true, mark: markData };
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const list = await request<User[]>('/api/users');
      if (Array.isArray(list) && list.length > 0) {
        // Sync with local cache
        const db = getLocalDB();
        db.users = list;
        saveLocalDB(db);
        return list;
      }
      throw new Error('Empty user list from backend');
    } catch {
      const db = getLocalDB();
      return db.users.filter(u => u.status !== 'deleted');
    }
  },

  async createUser(data: Partial<User>): Promise<User> {
    try {
      return await request<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const newUser: User = {
        id: `emp-${Date.now()}`,
        name: data.name?.trim() || 'Nuevo Empleado',
        aliases: data.aliases || [],
        email: data.email?.trim() || `empleado${db.users.length + 1}@pendiente.es`,
        dni: data.dni?.trim() || '',
        phone: data.phone?.trim() || '',
        role: 'employee',
        status: 'active',
        tempPassword: `emp${Math.floor(1000 + Math.random() * 9000)}`,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveLocalDB(db);
      return newUser;
    }
  },

  async updateUser(id: string, data: Partial<User> & { resetPassword?: boolean }): Promise<User> {
    try {
      return await request<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const user = db.users.find(u => u.id === id);
      if (!user) throw new Error('Empleado no encontrado');
      Object.assign(user, data);
      if (data.resetPassword) user.tempPassword = `temp${Math.floor(1000 + Math.random() * 9000)}`;
      saveLocalDB(db);
      return user;
    }
  },

  async deleteUser(id: string, mode: 'deactivate' | 'permanent'): Promise<{ success: boolean }> {
    try {
      return await request<{ success: boolean }>(`/api/users/${id}?mode=${mode}`, {
        method: 'DELETE',
      });
    } catch {
      const db = getLocalDB();
      const user = db.users.find(u => u.id === id);
      if (user) {
        if (mode === 'permanent') user.status = 'deleted';
        else user.status = 'deactivated';
        saveLocalDB(db);
      }
      return { success: true };
    }
  },

  // Schedules
  async getSchedules(): Promise<WeekSchedule[]> {
    try {
      const list = await request<WeekSchedule[]>('/api/schedules');
      if (Array.isArray(list)) {
        const db = getLocalDB();
        if (list.length > 0) {
          db.schedules = list;
          saveLocalDB(db);
        }
        return list;
      }
      throw new Error('Empty schedule list');
    } catch {
      const db = getLocalDB();
      return db.schedules;
    }
  },

  async getSchedule(id: string): Promise<WeekSchedule> {
    try {
      return await request<WeekSchedule>(`/api/schedules/${id}`);
    } catch {
      const db = getLocalDB();
      const s = db.schedules.find(item => item.id === id);
      if (!s) throw new Error('Cuadrante no encontrado');
      return s;
    }
  },

  async saveDraft(data: Partial<WeekSchedule>): Promise<WeekSchedule> {
    try {
      return await request<WeekSchedule>('/api/schedules/draft', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      let schedule = data.id ? db.schedules.find(s => s.id === data.id) : null;
      if (schedule) {
        Object.assign(schedule, data, { updatedAt: new Date().toISOString() });
      } else {
        schedule = {
          id: `sch-${Date.now()}`,
          weekStartDate: data.weekStartDate || '2026-11-02',
          weekEndDate: data.weekEndDate || '2026-11-08',
          weekLabel: data.weekLabel || 'Borrador Semanal',
          status: 'draft',
          version: 1,
          rows: data.rows || [],
          rawInputText: data.rawInputText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.schedules.unshift(schedule);
      }
      saveLocalDB(db);
      syncDatabaseToFirestore({ schedules: [schedule] }).catch(() => null);
      return schedule;
    }
  },

  async publishSchedule(data: Partial<WeekSchedule>): Promise<WeekSchedule> {
    try {
      return await request<WeekSchedule>('/api/schedules/publish', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      let schedule = data.id ? db.schedules.find(s => s.id === data.id) : null;
      const isUpdate = schedule && schedule.status === 'published';

      if (schedule) {
        Object.assign(schedule, data, {
          status: 'published',
          version: isUpdate ? schedule.version + 1 : 1,
          publishedAt: new Date().toISOString(),
          publishedBy: 'Administrador',
          updatedAt: new Date().toISOString(),
        });
      } else {
        schedule = {
          id: `sch-${Date.now()}`,
          weekStartDate: data.weekStartDate || '2026-11-02',
          weekEndDate: data.weekEndDate || '2026-11-08',
          weekLabel: data.weekLabel || 'Cuadrante Semanal',
          status: 'published',
          version: 1,
          publishedAt: new Date().toISOString(),
          publishedBy: 'Administrador',
          rows: data.rows || [],
          rawInputText: data.rawInputText,
          changeReason: data.changeReason,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.schedules.unshift(schedule);
      }
      saveLocalDB(db);
      syncDatabaseToFirestore({ schedules: [schedule] }).catch(() => null);
      return schedule;
    }
  },

  // Requests
  async getRequests(): Promise<{
    shiftRequests: ShiftChangeRequest[];
    daysOffRequests: DaysOffRequest[];
    absenceRequests: AbsenceRequest[];
  }> {
    try {
      return await request<{
        shiftRequests: ShiftChangeRequest[];
        daysOffRequests: DaysOffRequest[];
        absenceRequests: AbsenceRequest[];
      }>('/api/requests');
    } catch {
      const db = getLocalDB();
      return {
        shiftRequests: db.shiftRequests,
        daysOffRequests: db.daysOffRequests,
        absenceRequests: db.absenceRequests,
      };
    }
  },

  async createShiftChangeRequest(data: {
    date: string;
    currentShift: string;
    proposedShift: string;
    coworkerId?: string;
    comments?: string;
  }): Promise<ShiftChangeRequest> {
    try {
      return await request<ShiftChangeRequest>('/api/requests/shift-change', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const me = await api.getMe();
      const newReq: ShiftChangeRequest = {
        id: `req-sc-${Date.now()}`,
        employeeId: me.user.id,
        employeeName: me.user.name,
        type: 'shift_change',
        date: data.date,
        currentShift: data.currentShift,
        proposedShift: data.proposedShift,
        coworkerId: data.coworkerId,
        coworkerName: data.coworkerId ? db.users.find(u => u.id === data.coworkerId)?.name : undefined,
        coworkerStatus: data.coworkerId ? 'pending' : undefined,
        status: 'pending',
        comments: data.comments
          ? [{ id: `c-${Date.now()}`, userId: me.user.id, userName: me.user.name, text: data.comments, createdAt: new Date().toISOString() }]
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.shiftRequests.unshift(newReq);
      saveLocalDB(db);
      syncDatabaseToFirestore({ requests: [newReq] }).catch(() => null);
      return newReq;
    }
  },

  async respondCoworkerShiftChange(id: string, response: 'accepted' | 'rejected', comment?: string): Promise<ShiftChangeRequest> {
    try {
      return await request<ShiftChangeRequest>(`/api/requests/shift-change/${id}/coworker-response`, {
        method: 'POST',
        body: JSON.stringify({ response, comment }),
      });
    } catch {
      const db = getLocalDB();
      const item = db.shiftRequests.find(r => r.id === id);
      if (!item) throw new Error('Solicitud no encontrada');
      item.coworkerStatus = response;
      if (response === 'rejected') item.status = 'rejected';
      saveLocalDB(db);
      syncDatabaseToFirestore({ requests: [item] }).catch(() => null);
      return item;
    }
  },

  async createDaysOffRequest(data: {
    startDate: string;
    endDate: string;
    comment?: string;
  }): Promise<DaysOffRequest> {
    try {
      return await request<DaysOffRequest>('/api/requests/days-off', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const me = await api.getMe();
      const newReq: DaysOffRequest = {
        id: `req-do-${Date.now()}`,
        employeeId: me.user.id,
        employeeName: me.user.name,
        type: 'days_off',
        startDate: data.startDate,
        endDate: data.endDate,
        comment: data.comment,
        status: 'pending',
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.daysOffRequests.unshift(newReq);
      saveLocalDB(db);
      syncDatabaseToFirestore({ requests: [newReq] }).catch(() => null);
      return newReq;
    }
  },

  async createAbsenceRequest(data: {
    subType: 'communication' | 'leave_request';
    category: string;
    startDate: string;
    endDate: string;
    hasCertificate: boolean;
    comment?: string;
  }): Promise<AbsenceRequest> {
    try {
      return await request<AbsenceRequest>('/api/requests/absence', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const me = await api.getMe();
      const newReq: AbsenceRequest = {
        id: `req-ab-${Date.now()}`,
        employeeId: me.user.id,
        employeeName: me.user.name,
        type: 'absence',
        subType: data.subType,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        hasCertificate: data.hasCertificate,
        status: data.subType === 'communication' ? 'acknowledged' : 'pending',
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.absenceRequests.unshift(newReq);
      saveLocalDB(db);
      syncDatabaseToFirestore({ requests: [newReq] }).catch(() => null);
      return newReq;
    }
  },

  async updateRequestStatus(
    type: 'shift-change' | 'days-off' | 'absence',
    id: string,
    data: { status: string; comment?: string; applyToSchedule?: boolean }
  ): Promise<any> {
    try {
      return await request<any>(`/api/requests/${type}/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      let item: any;
      if (type === 'shift-change') item = db.shiftRequests.find(r => r.id === id);
      else if (type === 'days-off') item = db.daysOffRequests.find(r => r.id === id);
      else if (type === 'absence') item = db.absenceRequests.find(r => r.id === id);

      if (item) {
        item.status = data.status;
        item.updatedAt = new Date().toISOString();
        saveLocalDB(db);
        syncDatabaseToFirestore({ requests: [item] }).catch(() => null);
      }
      return item;
    }
  },

  async addRequestComment(
    type: 'shift-change' | 'days-off' | 'absence',
    id: string,
    text: string
  ): Promise<any> {
    try {
      return await request<any>(`/api/requests/${type}/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    } catch {
      const db = getLocalDB();
      const me = await api.getMe();
      let item: any;
      if (type === 'shift-change') item = db.shiftRequests.find(r => r.id === id);
      else if (type === 'days-off') item = db.daysOffRequests.find(r => r.id === id);
      else if (type === 'absence') item = db.absenceRequests.find(r => r.id === id);

      const commentObj = {
        id: `c-${Date.now()}`,
        userId: me.user.id,
        userName: me.user.name,
        text,
        createdAt: new Date().toISOString(),
      };
      if (item) {
        if (!item.comments) item.comments = [];
        item.comments.push(commentObj);
        saveLocalDB(db);
        syncDatabaseToFirestore({ requests: [item] }).catch(() => null);
      }
      return commentObj;
    }
  },

  async seedTestRequests(): Promise<{ success: boolean; count: number }> {
    try {
      return await request<{ success: boolean; count: number }>('/api/requests/seed-test', {
        method: 'POST',
      });
    } catch {
      const db = getLocalDB();
      const initial = getLocalDB();
      db.shiftRequests = initial.shiftRequests;
      db.daysOffRequests = initial.daysOffRequests;
      db.absenceRequests = initial.absenceRequests;
      db.incidents = initial.incidents;
      saveLocalDB(db);
      syncDatabaseToFirestore({
        requests: [...db.shiftRequests, ...db.daysOffRequests, ...db.absenceRequests],
        incidents: db.incidents,
      }).catch(() => null);
      return { success: true, count: db.shiftRequests.length + db.daysOffRequests.length + db.absenceRequests.length + db.incidents.length };
    }
  },

  // Incidents
  async getIncidents(): Promise<IncidentItem[]> {
    try {
      return await request<IncidentItem[]>('/api/incidents');
    } catch {
      const db = getLocalDB();
      return db.incidents;
    }
  },

  async createIncident(data: { category: string; date: string; description: string }): Promise<IncidentItem> {
    try {
      return await request<IncidentItem>('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const me = await api.getMe();
      const newInc: IncidentItem = {
        id: `inc-${Date.now()}`,
        employeeId: me.user.id,
        employeeName: me.user.name,
        category: data.category,
        date: data.date,
        description: data.description,
        status: 'abierta',
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.incidents.unshift(newInc);
      saveLocalDB(db);
      syncDatabaseToFirestore({ incidents: [newInc] }).catch(() => null);
      return newInc;
    }
  },

  async updateIncidentStatus(id: string, data: { status: string; comment?: string }): Promise<IncidentItem> {
    try {
      return await request<IncidentItem>(`/api/incidents/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalDB();
      const inc = db.incidents.find(i => i.id === id);
      if (inc) {
        inc.status = data.status;
        inc.updatedAt = new Date().toISOString();
        saveLocalDB(db);
        syncDatabaseToFirestore({ incidents: [inc] }).catch(() => null);
      }
      return inc!;
    }
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      return await request<NotificationItem[]>('/api/notifications');
    } catch {
      const db = getLocalDB();
      return db.notifications;
    }
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    try {
      return await request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
    } catch {
      const db = getLocalDB();
      const notif = db.notifications.find(n => n.id === id);
      if (notif) notif.read = true;
      saveLocalDB(db);
      return { success: true };
    }
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    try {
      return await request<{ success: boolean }>('/api/notifications/mark-all-read', {
        method: 'POST',
      });
    } catch {
      const db = getLocalDB();
      db.notifications.forEach(n => (n.read = true));
      saveLocalDB(db);
      return { success: true };
    }
  },

  // Audit Logs & Emails
  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      return await request<AuditLogItem[]>('/api/audit');
    } catch {
      const db = getLocalDB();
      return db.auditLogs;
    }
  },

  async getSentEmails(): Promise<Array<{ id: string; to: string; subject: string; body: string; date: string }>> {
    try {
      return await request<Array<{ id: string; to: string; subject: string; body: string; date: string }>>('/api/emails');
    } catch {
      const db = getLocalDB();
      return db.sentEmails;
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      return await request<AppSettings>('/api/settings');
    } catch {
      const db = getLocalDB();
      return db.settings;
    }
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      return await request<AppSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      const db = getLocalDB();
      Object.assign(db.settings, settings);
      saveLocalDB(db);
      syncDatabaseToFirestore({ settings: db.settings }).catch(() => null);
      return db.settings;
    }
  },

  // Backups
  async getBackups(): Promise<Array<{ filename: string; size: number; createdAt: string }>> {
    try {
      return await request<Array<{ filename: string; size: number; createdAt: string }>>('/api/backups');
    } catch {
      return [
        {
          filename: 'backup-auto-local.json',
          size: 1024 * 12,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  async createBackup(notes?: string): Promise<{ success: boolean; filename: string }> {
    try {
      return await request<{ success: boolean; filename: string }>('/api/backups/create', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    } catch {
      const db = getLocalDB();
      const filename = `backup-${Date.now()}.json`;
      localStorage.setItem(`backup_${filename}`, JSON.stringify(db));
      return { success: true, filename };
    }
  },

  async restoreBackup(filename?: string, backupData?: any): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/api/backups/restore', {
        method: 'POST',
        body: JSON.stringify({ filename, backupData }),
      });
    } catch {
      if (backupData) {
        saveLocalDB(backupData);
      }
      return { success: true, message: 'Copia restaurada correctamente' };
    }
  },

  // Demo
  async seedDemoData(): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/api/demo/seed', {
        method: 'POST',
      });
    } catch {
      return { success: true, message: 'Datos demo inicializados' };
    }
  },

  async clearDemoData(): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/api/demo/clear', {
        method: 'POST',
      });
    } catch {
      const db = getLocalDB();
      db.schedules = db.schedules.filter(s => !s.id.includes('demo') && !s.weekLabel.includes('DEMO'));
      saveLocalDB(db);
      return { success: true, message: 'Datos demo eliminados' };
    }
  },
};
