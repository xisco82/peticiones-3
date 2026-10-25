export type Role = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  aliases: string[];
  email: string;
  phone?: string;
  dni?: string;
  role: Role;
  status: 'active' | 'deactivated' | 'deleted';
  tempPassword?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ShiftType = 'work' | 'free' | 'rest' | 'sick' | 'vacation' | 'holiday';

export interface ShiftDetail {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  rawText: string;
  hours: number;
  isOvernight?: boolean;
  isSplit?: boolean;
  note?: string;
}

export type DayShift = ShiftDetail;

export interface EmployeeScheduleRow {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  warnings: string[];
  days: Record<string, ShiftDetail>;
}

export interface WeekSchedule {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  weekLabel: string;
  status: 'draft' | 'published';
  version: number;
  publishedAt?: string;
  publishedBy?: string;
  changeReason?: string;
  rows: EmployeeScheduleRow[];
  rawInputText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface ShiftChangeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'shift_change';
  date: string;
  currentShift: string;
  proposedShift: string;
  coworkerId?: string;
  coworkerName?: string;
  coworkerStatus?: 'pending' | 'accepted' | 'rejected';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DaysOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'days_off';
  startDate: string;
  endDate: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'absence';
  subType: 'communication' | 'leave_request';
  category: 'medico' | 'urgencia' | 'fuerza_mayor' | 'otro' | string;
  startDate: string;
  endDate: string;
  hasCertificate: boolean;
  status: 'pending' | 'acknowledged' | 'approved' | 'rejected';
  comments: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentItem {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  date: string;
  description: string;
  status: 'abierta' | 'en_investigacion' | 'resuelta' | string;
  comments: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'schedule_published'
    | 'schedule_modified'
    | 'request_created'
    | 'request_updated'
    | 'coworker_shift_request'
    | 'incident_updated'
    | string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: 'cuadrante' | 'solicitud' | 'empleado' | 'incidencia' | 'ajustes' | 'copia_seguridad' | string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
}

export interface AppSettings {
  generalScheduleVisibleToEmployees: boolean;
  requireFirstPasswordChange: boolean;
  deductBreaks: boolean;
  breakMinutes: number;
  warningRestBetweenShiftsHours: number;
  warningMaxDailyHours: number;
  warningMaxWeeklyHours: number;
  warningMinWeeklyRestDays: number;
  timezone: string;
  emailSenderDomain: string;
}

export interface AmbiguityItem {
  rawName: string;
  matchedEmployees: User[];
}

export interface ParseResult {
  success: boolean;
  weekStartDate: string;
  weekEndDate: string;
  weekLabel: string;
  rows: EmployeeScheduleRow[];
  errors: string[];
  warnings: string[];
  ambiguities: AmbiguityItem[];
  unknownEmployees?: string[];
}
