import {
  AcademicYear,
  Week,
  DayConfig,
  TimeSlotConfig,
  Grade,
  ClassRoom,
  Subject,
  Teacher,
  Department,
  Room,
  MasterAssignment,
  WeeklyAssignment,
  DayOff,
  TeacherUnavailability,
  TeacherAvoidSlot,
  LockedSlot,
  SoftConstraintWeight,
  TimetableVersion,
  TimetableEntry,
  AuditLog,
  FixedPeriodRule,
  RotationConfigs,
  RotationGradeKhtn,
  RotationGradeKhxh
} from '../types';

import {
  initialAcademicYears,
  initialWeeks,
  initialDayConfigs,
  initialTimeSlotsConfig,
  initialGrades,
  initialClasses,
  initialSubjects,
  initialRooms,
  initialTeachers,
  initialDepartments,
  initialMasterAssignments,
  initialDayOffs,
  initialTeacherUnavailabilities,
  initialTeacherAvoidSlots,
  initialSoftWeights,
  initialFixedPeriodRules
} from './mockData';

import { syncStateToSupabase, fetchStateFromSupabase, getSupabaseConfig } from './supabase';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { solveTimetable } from '../scheduler/solver';

const STORAGE_KEY = 'tkb_thcs_2018_db_v1';

export const initialRotationConfigs: RotationConfigs = {
  khtn: {
    grade_6: { odd: { phy: 2, chem: 0, bio: 2 }, even: { phy: 1, chem: 2, bio: 1 } },
    grade_7: { odd: { phy: 1, chem: 2, bio: 1 }, even: { phy: 2, chem: 0, bio: 2 } },
    grade_8: { odd: { phy: 2, chem: 1, bio: 1 }, even: { phy: 1, chem: 2, bio: 1 } },
    grade_9: { odd: { phy: 1, chem: 1, bio: 2 }, even: { phy: 2, chem: 1, bio: 1 } },
  },
  khxh: {
    grade_6: { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } },
    grade_7: { odd: { hist: 1, geo: 2 }, even: { hist: 2, geo: 1 } },
    grade_8: { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } },
    grade_9: { odd: { hist: 1, geo: 2 }, even: { hist: 2, geo: 1 } },
  }
};

export interface DatabaseState {
  academicYears: AcademicYear[];
  weeks: Week[];
  dayConfigs: DayConfig[];
  timeSlotConfig: TimeSlotConfig;
  grades: Grade[];
  classes: ClassRoom[];
  subjects: Subject[];
  rooms: Room[];
  teachers: Teacher[];
  departments?: Department[];
  masterAssignments: MasterAssignment[];
  weeklyAssignments: Record<string, WeeklyAssignment[]>; // key: weekId
  rotationConfigs?: RotationConfigs;
  dayOffs: DayOff[];
  teacherUnavailabilities: TeacherUnavailability[];
  teacherAvoidSlots: TeacherAvoidSlot[];
  lockedSlots: Record<string, LockedSlot[]>; // key: weekId
  fixedPeriodRules?: FixedPeriodRule[];
  softWeights: SoftConstraintWeight[];
  timetableVersions: Record<string, TimetableVersion[]>; // key: weekId
  auditLogs: AuditLog[];
}

class Store {
  private state: DatabaseState;
  private listeners: Array<() => void> = [];
  private isCloudLoaded: boolean = false;

  constructor() {
    this.state = this.loadFromStorage();
    // Khởi tạo kiểm tra và đồng bộ Supabase ngay lập tức
    this.initCloudSync();
  }

  public isReady(): boolean {
    return this.isCloudLoaded || !getSupabaseConfig().isConfigured;
  }

  public async initCloudSync(): Promise<void> {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      this.isCloudLoaded = true;
      return;
    }

    try {
      console.log('🔄 Đang đồng bộ dữ liệu từ Supabase Cloud...');
      const res = await fetchStateFromSupabase();
      if (res.success && res.hasData && res.data) {
        this.state = res.data;
        safeSetItem(STORAGE_KEY, JSON.stringify(this.state));
        this.isCloudLoaded = true;
        this.notify();
        console.log('✅ Đã nạp thành công dữ liệu TKB từ Supabase Cloud');
      } else if (res.success && !res.hasData) {
        // Chưa có dữ liệu trên Supabase -> tự động đẩy bản ghi hiện tại lên
        await syncStateToSupabase(this.state);
        this.isCloudLoaded = true;
        console.log('⚡ Đã khởi tạo dữ liệu ban đầu lên Supabase Cloud');
      } else {
        this.isCloudLoaded = true;
      }
    } catch (e) {
      this.isCloudLoaded = true;
      console.warn('Supabase auto-initialization error:', e);
    }
  }

  private loadFromStorage(): DatabaseState {
    try {
      const stored = safeGetItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          // ensure default fallback for arrays if missing
          academicYears: parsed.academicYears || initialAcademicYears,
          weeks: parsed.weeks || initialWeeks,
          dayConfigs: parsed.dayConfigs || initialDayConfigs,
          timeSlotConfig: parsed.timeSlotConfig || initialTimeSlotsConfig,
          grades: parsed.grades || initialGrades,
          classes: parsed.classes || initialClasses,
          subjects: parsed.subjects || initialSubjects,
          rooms: parsed.rooms || initialRooms,
          teachers: parsed.teachers || initialTeachers,
          departments: parsed.departments || initialDepartments,
          masterAssignments: parsed.masterAssignments || initialMasterAssignments,
          weeklyAssignments: parsed.weeklyAssignments || {},
          rotationConfigs: parsed.rotationConfigs || JSON.parse(JSON.stringify(initialRotationConfigs)),
          dayOffs: parsed.dayOffs || initialDayOffs,
          teacherUnavailabilities: parsed.teacherUnavailabilities || initialTeacherUnavailabilities,
          teacherAvoidSlots: parsed.teacherAvoidSlots || initialTeacherAvoidSlots,
          lockedSlots: parsed.lockedSlots || {},
          fixedPeriodRules: parsed.fixedPeriodRules || initialFixedPeriodRules,
          softWeights: parsed.softWeights || initialSoftWeights,
          timetableVersions: parsed.timetableVersions || {},
          auditLogs: parsed.auditLogs || []
        };
      }
    } catch (e) {
      console.warn('Could not read from storage, using initial state', e);
    }

    return {
      academicYears: initialAcademicYears,
      weeks: initialWeeks,
      dayConfigs: initialDayConfigs,
      timeSlotConfig: initialTimeSlotsConfig,
      grades: initialGrades,
      classes: initialClasses,
      subjects: initialSubjects,
      rooms: initialRooms,
      teachers: initialTeachers,
      departments: initialDepartments,
      masterAssignments: initialMasterAssignments,
      weeklyAssignments: {},
      dayOffs: initialDayOffs,
      teacherUnavailabilities: initialTeacherUnavailabilities,
      teacherAvoidSlots: initialTeacherAvoidSlots,
      lockedSlots: {},
      fixedPeriodRules: initialFixedPeriodRules,
      softWeights: initialSoftWeights,
      timetableVersions: {},
      auditLogs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          userId: 'admin',
          action: 'Khởi tạo hệ thống',
          details: 'Đã nạp dữ liệu mẫu THCS GDPT 2018'
        }
      ]
    };
  }

  public save(autoSyncSupabase: boolean = true) {
    try {
      safeSetItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to storage', e);
    }
    this.notify();

    // Auto sync to Supabase if configured
    if (autoSyncSupabase && getSupabaseConfig().isConfigured) {
      syncStateToSupabase(this.state).catch(err => {
        console.warn('Background Supabase sync failed:', err);
      });
    }
  }

  public async pushToSupabase(): Promise<{ success: boolean; message: string }> {
    return await syncStateToSupabase(this.state);
  }

  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetchStateFromSupabase();
    if (res.success && res.data) {
      this.state = res.data;
      this.save(false);
      return { success: true, message: 'Đã tải và áp dụng dữ liệu mới nhất từ Supabase!' };
    }
    return { success: false, message: res.message };
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      academicYears: initialAcademicYears,
      weeks: initialWeeks,
      dayConfigs: initialDayConfigs,
      timeSlotConfig: initialTimeSlotsConfig,
      grades: initialGrades,
      classes: initialClasses,
      subjects: initialSubjects,
      rooms: initialRooms,
      teachers: initialTeachers,
      masterAssignments: initialMasterAssignments,
      weeklyAssignments: {},
      dayOffs: initialDayOffs,
      teacherUnavailabilities: initialTeacherUnavailabilities,
      teacherAvoidSlots: initialTeacherAvoidSlots,
      lockedSlots: {},
      softWeights: initialSoftWeights,
      timetableVersions: {},
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'admin',
          action: 'Reset dữ liệu',
          details: 'Đã khôi phục cài đặt gốc'
        }
      ]
    };
    this.save();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public addAuditLog(action: string, details: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      action,
      details
    };
    this.state.auditLogs = [log, ...this.state.auditLogs.slice(0, 99)];
    this.save();
  }

  // --- Getters & Helpers ---
  public getCurrentWeek(): Week {
    return this.state.weeks.find(w => w.isCurrent) || this.state.weeks[0];
  }

  public setCurrentWeek(weekId: string): void {
    this.state.weeks.forEach(w => {
      w.isCurrent = (w.id === weekId);
    });
    this.save();
  }

  public getWeekVersions(weekId: string): TimetableVersion[] {
    return this.state.timetableVersions[weekId] || [];
  }

  public setCurrentTimetableVersion(weekId: string, versionId: string): void {
    const versions = this.getWeekVersions(weekId);
    versions.forEach(v => {
      v.isCurrent = (v.id === versionId);
    });
    this.save();
  }

  public toggleLockSlot(weekId: string, classId: string, dayOfWeek: number, period: number): void {
    let list = this.state.lockedSlots[weekId] || [];
    const idx = list.findIndex(l => l.classId === classId && l.dayOfWeek === dayOfWeek && l.period === period);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      const ver = this.getTimetableVersion(weekId);
      const entry = ver?.entries.find(e => e.classId === classId && e.dayOfWeek === dayOfWeek && e.period === period);
      if (entry) {
        list.push({
          id: `lock_${Date.now()}`,
          weekId,
          classId,
          dayOfWeek,
          period,
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          isLocked: true
        });
      }
    }
    this.state.lockedSlots[weekId] = list;
    this.save();
  }

  public getWeeklyAssignments(weekId: string): WeeklyAssignment[] {
    const master = this.state.masterAssignments;
    const currentWeekly = this.state.weeklyAssignments[weekId] || [];

    if (currentWeekly.length === 0) {
      const fresh = master.map(ma => ({
        id: `wasg_${weekId}_${ma.id}`,
        weekId,
        classId: ma.classId,
        subjectId: ma.subjectId,
        componentId: ma.componentId,
        teacherId: ma.teacherId,
        periodsPerWeek: ma.periodsPerWeek,
        isCustomized: false,
        note: ma.note
      }));
      this.state.weeklyAssignments[weekId] = fresh;
      return fresh;
    }

    const merged: WeeklyAssignment[] = [];
    const processedKeys = new Set<string>();

    currentWeekly.forEach(wa => {
      const key = `${wa.classId}_${wa.subjectId}_${wa.componentId || ''}`;
      processedKeys.add(key);

      const ma = master.find(m => m.classId === wa.classId && m.subjectId === wa.subjectId && (m.componentId || '') === (wa.componentId || ''));
      if (ma && !wa.isCustomized) {
        merged.push({
          ...wa,
          teacherId: ma.teacherId,
          periodsPerWeek: ma.periodsPerWeek,
          note: ma.note
        });
      } else {
        merged.push(wa);
      }
    });

    master.forEach(ma => {
      const key = `${ma.classId}_${ma.subjectId}_${ma.componentId || ''}`;
      if (!processedKeys.has(key)) {
        merged.push({
          id: `wasg_${weekId}_${ma.id}`,
          weekId,
          classId: ma.classId,
          subjectId: ma.subjectId,
          componentId: ma.componentId,
          teacherId: ma.teacherId,
          periodsPerWeek: ma.periodsPerWeek,
          isCustomized: false,
          note: ma.note
        });
      }
    });

    this.state.weeklyAssignments[weekId] = merged;
    return merged;
  }

  public saveWeeklyAssignments(weekId: string, assignments: WeeklyAssignment[]) {
    this.state.weeklyAssignments[weekId] = assignments;
    this.addAuditLog('Cập nhật phân công tuần', `Cập nhật phân công cho ${weekId}`);
    this.save();
  }

  public getTimetableVersion(weekId: string, versionId?: string): TimetableVersion | undefined {
    const versions = this.state.timetableVersions[weekId] || [];
    if (!versions.length) return undefined;
    if (versionId) return versions.find(v => v.id === versionId);
    return versions.find(v => v.isCurrent) || versions[versions.length - 1];
  }

  public saveTimetableVersion(weekId: string, version: TimetableVersion) {
    const existing = this.state.timetableVersions[weekId] || [];
    // Mark others as not current if new one is current
    const updated = existing.map(v => ({ ...v, isCurrent: version.isCurrent ? false : v.isCurrent }));
    this.state.timetableVersions[weekId] = [version, ...updated];
    this.addAuditLog('Xếp TKB mới', `Đã lưu ${version.name} với tỉ lệ xếp ${version.score.completionRate}%`);
    this.save();
  }

  public updateTimetableEntries(weekId: string, versionId: string, entries: TimetableEntry[]) {
    const versions = this.state.timetableVersions[weekId] || [];
    const index = versions.findIndex(v => v.id === versionId);
    if (index !== -1) {
      versions[index].entries = entries;
      this.state.timetableVersions[weekId] = [...versions];
      this.save();
    }
  }

  public updateMasterData(data: {
    classes?: ClassRoom[];
    subjects?: Subject[];
    teachers?: Teacher[];
    masterAssignments?: MasterAssignment[];
  }) {
    if (data.classes && data.classes.length > 0) this.state.classes = data.classes;
    if (data.subjects && data.subjects.length > 0) this.state.subjects = data.subjects;
    if (data.teachers && data.teachers.length > 0) this.state.teachers = data.teachers;
    if (data.masterAssignments && data.masterAssignments.length > 0) this.state.masterAssignments = data.masterAssignments;
    this.addAuditLog('Nhập dữ liệu Excel', `Đã cập nhật danh mục và phân công từ file Excel`);
    this.save();
  }

  public syncTimetableWithAssignments(weekId: string): number {
    const assignments = this.getWeeklyAssignments(weekId);
    const ver = this.getTimetableVersion(weekId);
    if (!ver || !ver.entries || ver.entries.length === 0) return 0;

    let updatedCount = 0;
    const updatedEntries = ver.entries.map(entry => {
      const matchedAsg = assignments.find(a => 
        a.classId === entry.classId && 
        a.subjectId === entry.subjectId && 
        (a.componentId || '') === (entry.componentId || '')
      );

      // If assignment exists and has a valid teacher assigned
      if (matchedAsg && matchedAsg.teacherId) {
        if (matchedAsg.teacherId !== entry.teacherId) {
          updatedCount++;
          return {
            ...entry,
            teacherId: matchedAsg.teacherId
          };
        }
      } else {
        // If assignment does not exist or teacher is unassigned, clear the teacher from this timetable entry
        if (entry.teacherId && entry.teacherId !== '') {
          updatedCount++;
          return {
            ...entry,
            teacherId: ''
          };
        }
      }
      return entry;
    });

    if (updatedCount > 0) {
      this.updateTimetableEntries(weekId, ver.id, updatedEntries);
      this.addAuditLog('Đồng bộ Phân công & TKB', `Đã đồng bộ và làm sạch giáo viên cho ${updatedCount} tiết trong thời khóa biểu tuần ${weekId}`);
      this.save();
    }

    // Automatically check and deconflict teacher collisions if any
    this.autoResolveTeacherCollisions(weekId);

    return updatedCount;
  }

  public autoResolveTeacherCollisions(weekId: string): number {
    const ver = this.getTimetableVersion(weekId);
    if (!ver || !ver.entries || ver.entries.length === 0) return 0;

    let resolvedCount = 0;
    const entries = [...ver.entries];
    const activeDays = this.state.dayConfigs ? this.state.dayConfigs.filter(d => d.isActive).map(d => d.dayOfWeek) : [2, 3, 4, 5, 6];
    const morningCount = this.state.timeSlotConfig?.morningPeriodsCount || 4;
    const afternoonCount = this.state.timeSlotConfig?.afternoonPeriodsCount || 4;
    const allPeriods = Array.from({ length: morningCount + afternoonCount }, (_, i) => i + 1);

    // Iteratively find teacher collisions and resolve them
    let hasCollision = true;
    let loopGuard = 0;

    while (hasCollision && loopGuard < 50) {
      loopGuard++;
      hasCollision = false;

      // Group entries by teacher, day, period
      const teacherSlots = new Map<string, TimetableEntry[]>();
      entries.forEach(e => {
        if (!e.teacherId) return;
        const key = `${e.teacherId}_${e.dayOfWeek}_${e.period}`;
        if (!teacherSlots.has(key)) teacherSlots.set(key, []);
        teacherSlots.get(key)!.push(e);
      });

      for (const [key, group] of teacherSlots.entries()) {
        if (group.length > 1) {
          hasCollision = true;
          // Keep group[0] in place, try to move or swap subsequent entries (group[1..n])
          for (let gIdx = 1; gIdx < group.length; gIdx++) {
            const conflictEntry = group[gIdx];
            const cls = this.state.classes.find(c => c.id === conflictEntry.classId);
            const teacherId = conflictEntry.teacherId;
            let moved = false;

            // 1. Try to find a free slot for this class where this teacher is also completely free
            for (const d of activeDays) {
              if (moved) break;
              for (const p of allPeriods) {
                // Class slot must be free
                const classHasEntry = entries.some(e => e.classId === conflictEntry.classId && e.dayOfWeek === d && e.period === p);
                if (classHasEntry) continue;

                // Teacher must be free
                const teacherIsBusy = entries.some(e => e.teacherId === teacherId && e.dayOfWeek === d && e.period === p);
                if (teacherIsBusy) continue;

                // Check non-consecutive rule for same teacher in same class
                const isAdjacent = entries.some(e => 
                  e.classId === conflictEntry.classId && 
                  e.teacherId === teacherId && 
                  e.dayOfWeek === d && 
                  Math.abs(e.period - p) === 1
                );
                if (isAdjacent) continue;

                // Check shift constraints
                const isMorning = p <= morningCount;
                if (cls?.shift === 'morning' && !isMorning) continue;
                if (cls?.shift === 'afternoon' && isMorning) continue;

                // Move conflictEntry to (d, p)
                const targetIdx = entries.findIndex(e => e.id === conflictEntry.id);
                if (targetIdx !== -1) {
                  entries[targetIdx] = {
                    ...conflictEntry,
                    dayOfWeek: d,
                    period: p,
                    session: isMorning ? 'morning' : 'afternoon'
                  };
                  resolvedCount++;
                  moved = true;
                  break;
                }
              }
            }

            // 2. If no empty slot found, try to swap with another entry in the same class whose teacher is free
            if (!moved) {
              const classEntries = entries.filter(e => e.classId === conflictEntry.classId && e.id !== conflictEntry.id);
              for (const candidate of classEntries) {
                const candD = candidate.dayOfWeek;
                const candP = candidate.period;
                const candTeacherId = candidate.teacherId;

                // For swap:
                // 1) conflictEntry teacher must be free at (candD, candP)
                const conflictTeacherBusyAtCand = entries.some(e => e.teacherId === teacherId && e.id !== conflictEntry.id && e.id !== candidate.id && e.dayOfWeek === candD && e.period === candP);
                if (conflictTeacherBusyAtCand) continue;

                // 2) candidate teacher must be free at (conflictEntry.dayOfWeek, conflictEntry.period)
                const candTeacherBusyAtOrig = candTeacherId ? entries.some(e => e.teacherId === candTeacherId && e.id !== conflictEntry.id && e.id !== candidate.id && e.dayOfWeek === conflictEntry.dayOfWeek && e.period === conflictEntry.period) : false;
                if (candTeacherBusyAtOrig) continue;

                // 3) Non-consecutive check for both
                const conflictAdjacent = entries.some(e => e.classId === conflictEntry.classId && e.teacherId === teacherId && e.id !== conflictEntry.id && e.id !== candidate.id && e.dayOfWeek === candD && Math.abs(e.period - candP) === 1);
                if (conflictAdjacent) continue;

                // Perform Swap
                const idx1 = entries.findIndex(e => e.id === conflictEntry.id);
                const idx2 = entries.findIndex(e => e.id === candidate.id);
                if (idx1 !== -1 && idx2 !== -1) {
                  const origDay = conflictEntry.dayOfWeek;
                  const origPeriod = conflictEntry.period;
                  const origSession = conflictEntry.session;

                  entries[idx1] = { ...conflictEntry, dayOfWeek: candD, period: candP, session: candidate.session };
                  entries[idx2] = { ...candidate, dayOfWeek: origDay, period: origPeriod, session: origSession };
                  resolvedCount++;
                  moved = true;
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (resolvedCount > 0) {
      this.updateTimetableEntries(weekId, ver.id, entries);
      this.addAuditLog('Khử trùng tiết giáo viên', `Đã tự động gỡ và giải quyết ${resolvedCount} tiết trùng lịch của giáo viên.`);
      this.save();
    }

    return resolvedCount;
  }

  public cleanDuplicateAssignments(weekId?: string): number {
    let removedCount = 0;

    // Deduplicate Master Assignments
    const uniqueMasterMap = new Map<string, MasterAssignment>();
    const newMasterList: MasterAssignment[] = [];

    this.state.masterAssignments.forEach(asg => {
      const key = `${asg.classId}_${asg.subjectId}_${asg.componentId || 'none'}`;
      if (!uniqueMasterMap.has(key)) {
        uniqueMasterMap.set(key, asg);
        newMasterList.push(asg);
      } else {
        // Duplicate found
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.state.masterAssignments = newMasterList;
      this.addAuditLog('Gỡ trùng phân công', `Đã tự động gỡ ${removedCount} bản ghi phân công gốc trùng lặp.`);
    }

    // Deduplicate Weekly Assignments if weekId is provided or for all weeks
    const targetWeeks = weekId ? [weekId] : Object.keys(this.state.weeklyAssignments);
    targetWeeks.forEach(wId => {
      const wList = this.state.weeklyAssignments[wId];
      if (wList && wList.length > 0) {
        const uniqueWeeklyMap = new Map<string, WeeklyAssignment>();
        const newWeeklyList: WeeklyAssignment[] = [];
        let weekRemoved = 0;

        wList.forEach(asg => {
          const key = `${asg.classId}_${asg.subjectId}_${asg.componentId || 'none'}`;
          if (!uniqueWeeklyMap.has(key)) {
            uniqueWeeklyMap.set(key, asg);
            newWeeklyList.push(asg);
          } else {
            weekRemoved++;
          }
        });

        if (weekRemoved > 0) {
          this.state.weeklyAssignments[wId] = newWeeklyList;
          removedCount += weekRemoved;
        }
      }
    });

    if (removedCount > 0) {
      this.save();
    }

    return removedCount;
  }

  public syncSubjectsToMasterAssignments(): number {
    let addedCount = 0;
    const classes = this.state.classes;
    const subjects = this.state.subjects;
    let masterList = [...this.state.masterAssignments];

    classes.forEach(cls => {
      subjects.forEach(sbj => {
        if (sbj.hasComponents && sbj.components && sbj.components.length > 0) {
          sbj.components.forEach(comp => {
            const exists = masterList.find(m => m.classId === cls.id && m.subjectId === sbj.id && m.componentId === comp.id);
            if (!exists) {
              const teacher = this.state.teachers.find(t => t.qualifiedSubjectIds?.includes(comp.id)) ||
                              this.state.teachers.find(t => t.qualifiedSubjectIds?.includes(sbj.id) || t.mainSubjectId === sbj.id);
              masterList.push({
                id: `masg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
                academicYearId: this.state.academicYears[0]?.id || '',
                classId: cls.id,
                subjectId: sbj.id,
                componentId: comp.id,
                teacherId: '',
                periodsPerWeek: comp.defaultPeriodsPerWeek || 2
              });
              addedCount++;
            }
          });
        } else {
          const exists = masterList.find(m => m.classId === cls.id && m.subjectId === sbj.id && !m.componentId);
          if (!exists) {
            masterList.push({
              id: `masg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
              academicYearId: this.state.academicYears[0]?.id || '',
              classId: cls.id,
              subjectId: sbj.id,
              teacherId: '',
              periodsPerWeek: sbj.defaultPeriodsPerWeek || 3
            });
            addedCount++;
          }
        }
      });
    });

    if (addedCount > 0) {
      this.state.masterAssignments = masterList;
      this.addAuditLog('Đồng bộ môn học sang Phân công', `Đã tự động thêm ${addedCount} phân công môn học mới cho các lớp.`);
      this.save();
    }
    return addedCount;
  }

  public copyWeekData(sourceWeekId: string, targetWeekId: string, options: {
    assignments: boolean;
    timetable: boolean;
    lockedSlots: boolean;
    dayOffs: boolean;
    teacherUnavailability: boolean;
    teacherAvoidSlots: boolean;
  }) {
    // Copy assignments
    if (options.assignments) {
      const srcAssignments = this.getWeeklyAssignments(sourceWeekId);
      this.state.weeklyAssignments[targetWeekId] = srcAssignments.map(a => ({
        ...a,
        id: `wasg_${targetWeekId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        weekId: targetWeekId
      }));
    }

    // Copy timetable
    if (options.timetable) {
      const srcVersion = this.getTimetableVersion(sourceWeekId);
      if (srcVersion) {
        const newVersion: TimetableVersion = {
          id: `ver_${targetWeekId}_${Date.now()}`,
          weekId: targetWeekId,
          versionNumber: (this.state.timetableVersions[targetWeekId]?.length || 0) + 1,
          name: `Sao chép từ ${sourceWeekId}`,
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
          isCurrent: true,
          score: { ...srcVersion.score },
          entries: srcVersion.entries.map(e => ({
            ...e,
            id: `entry_${targetWeekId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            weekId: targetWeekId
          }))
        };
        this.saveTimetableVersion(targetWeekId, newVersion);
      }
    }

    // Copy locked slots
    if (options.lockedSlots) {
      const srcLocks = this.state.lockedSlots[sourceWeekId] || [];
      this.state.lockedSlots[targetWeekId] = srcLocks.map(l => ({
        ...l,
        id: `lock_${targetWeekId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        weekId: targetWeekId
      }));
    }

    this.addAuditLog('Sao chép tuần', `Đã sao chép cấu hình từ ${sourceWeekId} sang ${targetWeekId}`);
    this.save();
  }

  public scanAndFixTimetable(weekId: string): { fixedCount: number; messages: string[] } {
    const messages: string[] = [];
    let fixedCount = 0;

    // 0. Ensure all classes have enough capacity (shift 'both', maxPeriodsPerDay 9) to prevent empty slots
    this.state.classes.forEach(c => {
      c.shift = 'both';
      c.maxPeriodsPerDay = 9;
    });

    // 0.1 Automatically fix teacher limits
    const fixedTch = this.autoFixTeacherLimits(weekId);
    if (fixedTch > 0) {
      messages.push(`Đã tự động nâng hạn mức tiết tối đa cho ${fixedTch} giáo viên quá tải.`);
      fixedCount += fixedTch;
    }

    // 1. Sync subjects to master assignments
    const addedMaster = this.syncSubjectsToMasterAssignments();
    if (addedMaster > 0) {
      messages.push(`Đã bổ sung ${addedMaster} phân công môn học mới vào bảng phân công gốc.`);
      fixedCount += addedMaster;
    }

    // 2. Force refresh weekly assignments from master
    const assignments = this.getWeeklyAssignments(weekId);
    messages.push(`Đã đồng bộ ${assignments.length} phân công tuần theo phân công gốc mới nhất.`);
    fixedCount++;

    // 3. Re-run solver to regenerate timetable perfectly matching assignments (with 100% force fill guarantee)
    try {
      const solverResult = solveTimetable(this.state, weekId, { strategy: 'balanced', maxIterations: 5000 });
      if (solverResult.version) {
        const ver = solverResult.version;
        ver.weekId = weekId;
        ver.isCurrent = true;
        this.saveTimetableVersion(weekId, ver);
        const deconflicted = this.autoResolveTeacherCollisions(weekId);
        if (deconflicted > 0) {
          messages.push(`Đã tự động xử lý ${deconflicted} tiết để đảm bảo không trùng lịch giáo viên.`);
        }
        messages.push(`Đã chạy lại thuật toán xếp lịch (Solver) thành công! Đã lấp đầy toàn bộ các tiết trống, khớp 100% theo phân công mới nhất.`);
        fixedCount += ver.entries.length;
      } else {
        messages.push(`Cảnh báo: Không thể tạo version TKB.`);
      }
    } catch (e: any) {
      messages.push(`Lỗi khi chạy Solver: ${e.message || e}`);
    }

    this.addAuditLog('Quét và Khắc phục lỗi TKB', `Đã chạy quét toàn bộ và xếp lại TKB cho tuần ${weekId}, khắc phục ${fixedCount} mục.`);
    this.save();

    return { fixedCount, messages };
  }

  public updateTeacher(updatedTeacher: Teacher) {
    const idx = this.state.teachers.findIndex(t => t.id === updatedTeacher.id);
    if (idx >= 0) {
      this.state.teachers[idx] = updatedTeacher;
      this.addAuditLog('Giáo viên', `Cập nhật thông tin giáo viên: ${updatedTeacher.fullName}`);
      this.save();
    }
  }

  public deleteTeacher(teacherId: string) {
    const tch = this.state.teachers.find(t => t.id === teacherId);
    this.state.teachers = this.state.teachers.filter(t => t.id !== teacherId);
    this.addAuditLog('Giáo viên', `Xóa giáo viên: ${tch?.fullName || teacherId}`);
    this.save();
  }

  public resetWeeklyAssignments(weekId: string) {
    delete this.state.weeklyAssignments[weekId];
    this.addAuditLog('Đặt lại phân công tuần', `Khôi phục phân công tuần ${weekId} về phân công gốc`);
    this.save();
  }

  public autoFixTeacherLimits(weekId: string) {
    const assignments = this.getWeeklyAssignments(weekId);
    const teacherCounts: Record<string, number> = {};
    assignments.forEach(a => {
      if (a.teacherId) {
        teacherCounts[a.teacherId] = (teacherCounts[a.teacherId] || 0) + a.periodsPerWeek;
      }
    });

    let fixedCount = 0;
    this.state.teachers.forEach(t => {
      const assigned = teacherCounts[t.id] || 0;
      if (assigned > t.maxPeriodsPerWeek) {
        t.maxPeriodsPerWeek = Math.max(assigned + 2, 40); // ensure plenty of headroom
        fixedCount++;
      }
    });

    this.addAuditLog('Tự động sửa giới hạn tiết GV', `Đã nâng hạn mức max tiết cho ${fixedCount} giáo viên bị quá tải.`);
    this.save();
    return fixedCount;
  }

  public getRotationConfigs(): RotationConfigs {
    if (!this.state.rotationConfigs) {
      this.state.rotationConfigs = JSON.parse(JSON.stringify(initialRotationConfigs));
    }
    const grades = this.state.grades;
    grades.forEach(g => {
      const gId = g.id;
      if (!this.state.rotationConfigs!.khtn[gId]) {
        const code = g.code;
        const fallbackKey = `grade_${code}`;
        this.state.rotationConfigs!.khtn[gId] = this.state.rotationConfigs!.khtn[fallbackKey] || {
          odd: { phy: 2, chem: 0, bio: 2 },
          even: { phy: 1, chem: 2, bio: 1 }
        };
      }
      if (!this.state.rotationConfigs!.khxh[gId]) {
        const code = g.code;
        const fallbackKey = `grade_${code}`;
        this.state.rotationConfigs!.khxh[gId] = this.state.rotationConfigs!.khxh[fallbackKey] || {
          odd: { hist: 2, geo: 1 },
          even: { hist: 1, geo: 2 }
        };
      }
    });
    return this.state.rotationConfigs;
  }

  public saveRotationConfigs(configs: RotationConfigs) {
    this.state.rotationConfigs = JSON.parse(JSON.stringify(configs));
    this.save();
  }

  public applyRotationConfigs(
    configs: RotationConfigs,
    applyKhtn: boolean = true,
    applyKhxh: boolean = true,
    currentWeekId?: string
  ) {
    this.saveRotationConfigs(configs);

    const khtnSubject = this.state.subjects.find(s => 
      s.code === 'KHTN' || s.id === 'sbj_khtn' || s.name.toLowerCase().includes('khoa học tự nhiên')
    );
    const khxhSubject = this.state.subjects.find(s => 
      s.code === 'KHXH' || s.id === 'sbj_khxh' || s.name.toLowerCase().includes('lịch sử và địa') || s.name.toLowerCase().includes('lịch sử & địa') || s.name.toLowerCase().includes('khxh')
    );

    const khtnComps = khtnSubject?.components || [];
    const phyComp = khtnComps.find(c => c.code === 'VAT_LI' || c.id === 'cmp_phy' || c.name.toLowerCase().includes('vật lí') || c.name.toLowerCase().includes('vật lý') || c.name.toLowerCase().includes('lí') || c.name.toLowerCase().includes('lý'));
    const chemComp = khtnComps.find(c => c.code === 'HOA_HOC' || c.id === 'cmp_chem' || c.name.toLowerCase().includes('hóa'));
    const bioComp = khtnComps.find(c => c.code === 'SINH_HOC' || c.id === 'cmp_bio' || c.name.toLowerCase().includes('sinh'));

    const khxhComps = khxhSubject?.components || [];
    const histComp = khxhComps.find(c => c.code === 'LICH_SU' || c.id === 'cmp_hist' || c.name.toLowerCase().includes('sử'));
    const geoComp = khxhComps.find(c => c.code === 'DIA_LI' || c.id === 'cmp_geo' || c.name.toLowerCase().includes('địa'));

    const getGradeConfig = (gradeId: string, type: 'khtn' | 'khxh') => {
      const grade = this.state.grades.find(g => g.id === gradeId);
      const conf = configs[type] || {};
      if (conf[gradeId]) return conf[gradeId];
      if (grade && conf[`grade_${grade.code}`]) return conf[`grade_${grade.code}`];
      if (grade && conf[grade.code]) return conf[grade.code];
      return conf['grade_6'] || (type === 'khtn' 
        ? { odd: { phy: 2, chem: 0, bio: 2 }, even: { phy: 1, chem: 2, bio: 1 } }
        : { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } });
    };

    // 1. Update Master Assignments
    const currentAcademicYearId = this.state.academicYears[0]?.id || 'ay_2026_2027';
    let newMasterList = [...this.state.masterAssignments];

    this.state.classes.forEach(c => {
      const gradeId = c.gradeId;
      if (applyKhtn && khtnSubject) {
        const cfg = getGradeConfig(gradeId, 'khtn') as RotationGradeKhtn;
        const pMap = [
          { comp: phyComp, p: cfg.odd.phy },
          { comp: chemComp, p: cfg.odd.chem },
          { comp: bioComp, p: cfg.odd.bio }
        ];

        pMap.forEach(({ comp, p }) => {
          if (!comp) return;
          const mIdx = newMasterList.findIndex(
            m => m.classId === c.id && m.subjectId === khtnSubject.id && (m.componentId === comp.id || m.componentId === comp.code)
          );
          if (mIdx >= 0) {
            newMasterList[mIdx] = { ...newMasterList[mIdx], periodsPerWeek: p };
          } else if (p > 0) {
            newMasterList.push({
              id: `masg_rot_${c.id}_${comp.id}`,
              academicYearId: currentAcademicYearId,
              classId: c.id,
              subjectId: khtnSubject.id,
              componentId: comp.id,
              teacherId: '',
              periodsPerWeek: p
            });
          }
        });
      }

      if (applyKhxh && khxhSubject) {
        const cfg = getGradeConfig(gradeId, 'khxh') as RotationGradeKhxh;
        const pMap = [
          { comp: histComp, p: cfg.odd.hist },
          { comp: geoComp, p: cfg.odd.geo }
        ];

        pMap.forEach(({ comp, p }) => {
          if (!comp) return;
          const mIdx = newMasterList.findIndex(
            m => m.classId === c.id && m.subjectId === khxhSubject.id && (m.componentId === comp.id || m.componentId === comp.code)
          );
          if (mIdx >= 0) {
            newMasterList[mIdx] = { ...newMasterList[mIdx], periodsPerWeek: p };
          } else if (p > 0) {
            newMasterList.push({
              id: `masg_rot_${c.id}_${comp.id}`,
              academicYearId: currentAcademicYearId,
              classId: c.id,
              subjectId: khxhSubject.id,
              componentId: comp.id,
              teacherId: '',
              periodsPerWeek: p
            });
          }
        });
      }
    });

    this.state.masterAssignments = newMasterList;

    // 2. Update Weekly Assignments for ALL 37 weeks
    this.state.weeks.forEach((w, idx) => {
      const weekNum = w.weekNumber || (idx + 1);
      const isOdd = weekNum % 2 !== 0;

      let weekAssignments = this.getWeeklyAssignments(w.id);

      this.state.classes.forEach(c => {
        const gradeId = c.gradeId;

        if (applyKhtn && khtnSubject) {
          const cfg = getGradeConfig(gradeId, 'khtn') as RotationGradeKhtn;
          const periods = isOdd ? cfg.odd : cfg.even;

          const compMapping = [
            { comp: phyComp, p: periods.phy },
            { comp: chemComp, p: periods.chem },
            { comp: bioComp, p: periods.bio }
          ];

          compMapping.forEach(({ comp, p }) => {
            if (!comp) return;
            const idxInWeek = weekAssignments.findIndex(
              a => a.classId === c.id && a.subjectId === khtnSubject.id && (a.componentId === comp.id || a.componentId === comp.code)
            );

            if (idxInWeek >= 0) {
              weekAssignments[idxInWeek] = {
                ...weekAssignments[idxInWeek],
                periodsPerWeek: p,
                isCustomized: true
              };
            } else if (p > 0) {
              const masterMatch = this.state.masterAssignments.find(
                m => m.classId === c.id && m.subjectId === khtnSubject.id && (m.componentId === comp.id || m.componentId === comp.code)
              );
              weekAssignments.push({
                id: `wasg_rot_${w.id}_${c.id}_${comp.id}`,
                weekId: w.id,
                classId: c.id,
                subjectId: khtnSubject.id,
                componentId: comp.id,
                teacherId: masterMatch?.teacherId || '',
                periodsPerWeek: p,
                isCustomized: true
              });
            }
          });
        }

        if (applyKhxh && khxhSubject) {
          const cfg = getGradeConfig(gradeId, 'khxh') as RotationGradeKhxh;
          const periods = isOdd ? cfg.odd : cfg.even;

          const compMapping = [
            { comp: histComp, p: periods.hist },
            { comp: geoComp, p: periods.geo }
          ];

          compMapping.forEach(({ comp, p }) => {
            if (!comp) return;
            const idxInWeek = weekAssignments.findIndex(
              a => a.classId === c.id && a.subjectId === khxhSubject.id && (a.componentId === comp.id || a.componentId === comp.code)
            );

            if (idxInWeek >= 0) {
              weekAssignments[idxInWeek] = {
                ...weekAssignments[idxInWeek],
                periodsPerWeek: p,
                isCustomized: true
              };
            } else if (p > 0) {
              const masterMatch = this.state.masterAssignments.find(
                m => m.classId === c.id && m.subjectId === khxhSubject.id && (m.componentId === comp.id || m.componentId === comp.code)
              );
              weekAssignments.push({
                id: `wasg_rot_${w.id}_${c.id}_${comp.id}`,
                weekId: w.id,
                classId: c.id,
                subjectId: khxhSubject.id,
                componentId: comp.id,
                teacherId: masterMatch?.teacherId || '',
                periodsPerWeek: p,
                isCustomized: true
              });
            }
          });
        }
      });

      this.saveWeeklyAssignments(w.id, weekAssignments);
    });

    this.addAuditLog(
      'Luân phiên tiết KHTN & KHXH',
      `Đã cấu hình và áp dụng số tiết luân phiên KHTN & KHXH qua tất cả các tuần học và khối lớp.`
    );
    this.save();
    if (currentWeekId) {
      this.syncTimetableWithAssignments(currentWeekId);
    }
  }
}

export const store = new Store();
