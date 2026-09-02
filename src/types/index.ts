// TypeScript Type Definitions for TKB THCS 2018 System

export type UserRole = 'admin' | 'principal' | 'teacher' | 'viewer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Week {
  id: string;
  academicYearId: string;
  weekNumber: number; // 1..37
  name: string; // e.g. "Tuần 01"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface DayConfig {
  dayOfWeek: number; // 2 = Monday, 3 = Tuesday, ..., 7 = Saturday
  name: string; // "Thứ 2", "Thứ 3", etc.
  isActive: boolean;
}

export interface TimeSlotConfig {
  morningPeriodsCount: number; // Default 4
  afternoonPeriodsCount: number; // Default 4
  periodTimes: {
    period: number; // 1..8
    session: 'morning' | 'afternoon';
    startTime: string; // e.g. "07:15"
    endTime: string;   // e.g. "08:00"
  }[];
}

export interface Grade {
  id: string;
  code: string; // "6", "7", "8", "9"
  name: string; // "Khối 6", "Khối 7", etc.
}

export interface ClassRoom {
  id: string;
  code: string; // e.g. "6A1"
  name: string; // e.g. "Lớp 6A1"
  gradeId: string;
  headTeacherId?: string;
  studentCount: number;
  roomName?: string;
  shift?: 'morning' | 'afternoon' | 'both'; // Buổi học: 'morning' (Sáng), 'afternoon' (Chiều), 'both' (Học cả 2 buổi)
  maxPeriodsPerDay?: number; // Tối đa tiết học/ngày
  status: 'active' | 'inactive';
}

export interface SubjectComponent {
  id: string;
  subjectId: string;
  code: string; // e.g. "PHYSICS", "CHEMISTRY", "BIOLOGY", "HISTORY", "GEOGRAPHY"
  name: string; // e.g. "Vật lí", "Hóa học", "Sinh học"
  defaultPeriodsPerWeek: number;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  headTeacherId?: string;
}

export interface Subject {
  id: string;
  code: string; // e.g. "MATH", "KHTN", "KHXH", "VAN", "ENG"
  name: string; // e.g. "Toán", "KHTN", "Lịch sử & Địa lí"
  category: 'natural_science' | 'social_science' | 'general' | 'elective';
  hasComponents: boolean;
  components?: SubjectComponent[];
  defaultPeriodsPerWeek: number;
}

export interface Teacher {
  id: string;
  code: string; // e.g. "GV01"
  fullName: string;
  department: string; // e.g. "Tổ KHTN", "Tổ Toán-Tin", "Tổ Văn-Sử"
  mainSubjectId: string;
  qualifiedSubjectIds: string[]; // Subject IDs or Component IDs teacher can teach
  maxPeriodsPerWeek: number;
  maxPeriodsPerDay: number;
  maxSessionsPerDay: number;
  maxDaysPerWeek: number;
  note?: string;
  allowDoubleBooking?: boolean;
  status: 'active' | 'inactive';
}

export interface Room {
  id: string;
  code: string; // e.g. "LAB_PHY", "COMP_1"
  name: string; // e.g. "Phòng Thí nghiệm KHTN", "Phòng Tin học 1"
  type: 'general' | 'lab' | 'computer' | 'gym';
  isShared: boolean; // if shared between classes
}

// Master Teaching Assignment (Phân công gốc)
export interface MasterAssignment {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  componentId?: string; // Optional if subject has sub-components
  teacherId: string;
  periodsPerWeek: number;
  note?: string;
}

// Weekly Teaching Assignment (Phân công theo tuần)
export interface WeeklyAssignment {
  id: string;
  weekId: string;
  classId: string;
  subjectId: string;
  componentId?: string;
  teacherId: string;
  periodsPerWeek: number;
  isCustomized: boolean; // true if overridden from master assignment
  note?: string;
}

// Unavailability / Holidays
export interface DayOff {
  id: string;
  weekId?: string; // If undefined, applies globally
  date?: string; // YYYY-MM-DD
  dayOfWeek?: number; // 2..7
  session?: 'morning' | 'afternoon' | 'all';
  period?: number;
  periods?: number[]; // Specific period numbers e.g. [1, 2]
  targetType: 'school' | 'grade' | 'class';
  targetId?: string; // gradeId or classId
  reason: string;
}

export interface TeacherUnavailability {
  id: string;
  weekId?: string;
  teacherId: string;
  dayOfWeek: number; // 2..7
  periods: number[]; // e.g. [1, 2, 3]
  reason: string;
}

export interface TeacherAvoidSlot {
  id: string;
  weekId?: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
  level: 'hard' | 'soft'; // Hard = forbidden, Soft = penalize
  reason?: string;
}

export interface LockedSlot {
  id: string;
  weekId: string;
  classId: string;
  dayOfWeek: number;
  period: number;
  subjectId: string;
  componentId?: string;
  teacherId: string;
  isLocked: boolean;
}

export interface FixedPeriodRule {
  id: string;
  dayOfWeek: number; // e.g. 2
  period: number; // e.g. 1
  subjectId: string; // e.g. 'sbj_hdtn'
  componentId?: string;
  reason: string; // e.g. 'Chào cờ đầu tuần (HĐTN)'
}

export interface SoftConstraintWeight {
  id: string;
  code: string;
  name: string;
  weight: number; // 1..10 scale
  description: string;
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  weekId: string;
  classId: string;
  dayOfWeek: number; // 2..7
  period: number; // 1..8
  session: 'morning' | 'afternoon';
  subjectId: string;
  componentId?: string;
  teacherId: string;
  roomId?: string;
  isLocked: boolean;
}

export interface TimetableVersion {
  id: string;
  weekId: string;
  versionNumber: number; // 1, 2, 3
  name: string; // e.g. "TKB Tuần 3 - Version 01"
  createdAt: string;
  createdBy: string;
  isCurrent: boolean;
  score: {
    hardViolations: number;
    softPenalty: number;
    scheduledPeriods: number;
    totalRequiredPeriods: number;
    completionRate: number;
  };
  entries: TimetableEntry[];
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: 'hard_constraint' | 'soft_constraint' | 'precheck';
  code: string;
  message: string;
  details?: {
    classId?: string;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    componentId?: string;
    teacherId?: string;
    teacherName?: string;
    dayOfWeek?: number;
    period?: number;
    missingPeriods?: number;
    conflictingEntries?: string[];
  };
  recommendation?: string;
}

export interface PreCheckResult {
  isValid: boolean;
  issues: ValidationIssue[];
  totalRequiredPeriods: number;
  totalAvailableTeacherSlots: number;
  summary: {
    totalClasses: number;
    totalTeachers: number;
    totalAssignments: number;
  };
}

export interface SolverResult {
  success: boolean;
  version?: TimetableVersion;
  issues: ValidationIssue[];
  executionTimeMs: number;
  conflictReport?: {
    unassignedAssignments: {
      classId: string;
      className: string;
      subjectId: string;
      subjectName: string;
      componentId?: string;
      componentName?: string;
      teacherId: string;
      teacherName: string;
      required: number;
      assigned: number;
      missing: number;
      reasons: string[];
      suggestions: string[];
    }[];
  };
}

export interface AIActionRequest {
  action: 'teacher_unavailability' | 'lock_slot' | 'update_assignment' | 'run_solver' | 'explain_conflicts';
  parameters: Record<string, any>;
  explanation: string;
  requiresConfirmation: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
}

export interface SchoolState {
  academicYears: AcademicYear[];
  weeks: Week[];
  dayConfigs: DayConfig[];
  timeSlotConfig: TimeSlotConfig;
  grades: Grade[];
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  departments?: Department[];
  rooms: Room[];
  masterAssignments: MasterAssignment[];
  weeklyAssignments: Record<string, WeeklyAssignment[]>;
  dayOffs: DayOff[];
  teacherUnavailabilities: TeacherUnavailability[];
  teacherAvoidSlots: TeacherAvoidSlot[];
  lockedSlots: Record<string, LockedSlot[]>;
  fixedPeriodRules?: FixedPeriodRule[];
  softWeights: SoftConstraintWeight[];
  timetableVersions: Record<string, TimetableVersion[]>;
  auditLogs: AuditLog[];
}

export type DatabaseState = SchoolState;

export interface AIAssistantResponse {
  answer: string;
  proposedAction?: AIActionRequest;
  action?: {
    type: 'run_solver' | 'lock_slot' | 'update_assignment';
    classId?: string;
    dayOfWeek?: number;
    period?: number;
    parameters?: Record<string, any>;
  };
}

export type AIResponse = AIAssistantResponse;

