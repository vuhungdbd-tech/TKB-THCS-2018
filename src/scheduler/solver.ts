import {
  DatabaseState,
  SolverResult,
  TimetableVersion,
  TimetableEntry,
  ValidationIssue,
  WeeklyAssignment,
  LockedSlot
} from '../types';
import { runPreCheck } from './precheck';
import { validateTimetable } from './validator';

export interface SolverOptions {
  strategy?: 'fast' | 'deep' | 'balanced';
  maxIterations?: number;
  optimizeGradeStaggering?: boolean; // Tối ưu so le giữa các Khối lớp & dồn/trùng tiết cùng Khối (Tiếng Anh, Thể dục...)
  allowSameGradeParallel?: boolean;  // Cho phép xếp trùng tiết/ghép các lớp cùng khối nếu đủ GV
}

interface PeriodUnit {
  id: string;
  assignmentId: string;
  classId: string;
  subjectId: string;
  componentId?: string;
  teacherId: string;
  unitIndex: number;
}

export function solveTimetable(
  state: DatabaseState,
  weekId: string,
  options: SolverOptions = { strategy: 'balanced', maxIterations: 25000 }
): SolverResult {
  const startTime = Date.now();

  // 1. Run Pre-Check (Log issues but do not block generation)
  const preCheck = runPreCheck(state, weekId);
  if (!preCheck.isValid) {
    console.warn('PreCheck warnings/errors encountered, proceeding with robust force-fill generation:', preCheck.issues);
  }

  // Active days & slots
  const activeDays = state.dayConfigs.filter(d => d.isActive).map(d => d.dayOfWeek);
  const morningPeriods = Array.from({ length: state.timeSlotConfig.morningPeriodsCount }, (_, i) => i + 1);
  const afternoonPeriods = Array.from({ length: state.timeSlotConfig.afternoonPeriodsCount }, (_, i) => i + 1 + state.timeSlotConfig.morningPeriodsCount);
  const allPeriods = [...morningPeriods, ...afternoonPeriods];

  // Fetch weekly assignments
  const assignments: WeeklyAssignment[] = state.weeklyAssignments[weekId] && state.weeklyAssignments[weekId].length > 0
    ? state.weeklyAssignments[weekId]
    : state.masterAssignments.map(ma => ({
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

  // Fetch existing locked slots
  const existingVersion = state.timetableVersions[weekId]?.find(v => v.isCurrent);
  const lockedList: LockedSlot[] = state.lockedSlots[weekId] || [];

  const lockedItems: { classId: string; dayOfWeek: number; period: number; subjectId: string; componentId?: string; teacherId: string }[] = [];

  if (existingVersion) {
    existingVersion.entries.filter(e => e.isLocked).forEach(e => {
      lockedItems.push({
        classId: e.classId,
        dayOfWeek: e.dayOfWeek,
        period: e.period,
        subjectId: e.subjectId,
        componentId: e.componentId,
        teacherId: e.teacherId
      });
    });
  }

  lockedList.filter(l => l.isLocked).forEach(l => {
    if (!lockedItems.some(item => item.classId === l.classId && item.dayOfWeek === l.dayOfWeek && item.period === l.period)) {
      lockedItems.push({
        classId: l.classId,
        dayOfWeek: l.dayOfWeek,
        period: l.period,
        subjectId: l.subjectId,
        componentId: l.componentId,
        teacherId: l.teacherId
      });
    }
  });

  // Fetch unavailability & day offs
  const dayOffs = state.dayOffs.filter(d => !d.weekId || d.weekId === weekId);
  const teacherOffs = state.teacherUnavailabilities.filter(t => !t.weekId || t.weekId === weekId);
  const avoidSlots = state.teacherAvoidSlots.filter(t => !t.weekId || t.weekId === weekId);

  // Helper check if (day, period) is school/class holiday
  const isSlotHoliday = (classId: string, day: number, period: number): boolean => {
    return dayOffs.some(doff => {
      if (doff.dayOfWeek && doff.dayOfWeek !== day) return false;
      const isMorning = period <= state.timeSlotConfig.morningPeriodsCount;
      if (doff.session === 'morning' && !isMorning) return false;
      if (doff.session === 'afternoon' && isMorning) return false;
      if (doff.period && doff.period !== period) return false;
      if (doff.periods && doff.periods.length > 0 && !doff.periods.includes(period)) return false;
      if (doff.targetType === 'class' && doff.targetId !== classId) return false;
      if (doff.targetType === 'grade') {
        const cls = state.classes.find(c => c.id === classId);
        if (cls?.gradeId !== doff.targetId) return false;
      }
      return true;
    });
  };

  // Helper check if teacher is unavailable at (day, period)
  const isTeacherUnavailable = (teacherId: string, day: number, period: number): boolean => {
    // Registered off
    const isOff = teacherOffs.some(tu => tu.teacherId === teacherId && tu.dayOfWeek === day && tu.periods.includes(period));
    if (isOff) return true;

    // Hard avoid slot
    const isHardAvoid = avoidSlots.some(ta => ta.teacherId === teacherId && ta.dayOfWeek === day && ta.period === period && ta.level === 'hard');
    return isHardAvoid;
  };

  // Build list of all period units to schedule
  const unitsToSchedule: PeriodUnit[] = [];
  const preFilledEntries: TimetableEntry[] = [];

  // Track remaining required counts per assignment after taking locked slots
  const remainingAssignmentCount = new Map<string, number>();

  assignments.forEach(asg => {
    let countNeeded = asg.periodsPerWeek;

    // Check how many are already fulfilled by locked slots
    lockedItems.forEach(val => {
      if (val.classId === asg.classId && val.teacherId === asg.teacherId && val.subjectId === asg.subjectId && val.componentId === asg.componentId) {
        countNeeded--;
      }
    });

    remainingAssignmentCount.set(asg.id, Math.max(0, countNeeded));
  });

  // Create pre-filled entries from locked items
  lockedItems.forEach(val => {
    const session = val.period <= state.timeSlotConfig.morningPeriodsCount ? 'morning' : 'afternoon';

    preFilledEntries.push({
      id: `entry_locked_${val.classId}_${val.dayOfWeek}_${val.period}`,
      timetableId: 'current',
      weekId,
      classId: val.classId,
      dayOfWeek: val.dayOfWeek,
      period: val.period,
      session,
      subjectId: val.subjectId,
      componentId: val.componentId,
      teacherId: val.teacherId,
      isLocked: true
    });
  });

  // Populate unscheduled units
  assignments.forEach(asg => {
    if (!asg.teacherId || asg.teacherId.trim() === '') return; // Skip unassigned subjects
    const needed = remainingAssignmentCount.get(asg.id) || 0;
    for (let i = 0; i < needed; i++) {
      unitsToSchedule.push({
        id: `unit_${asg.id}_${i}`,
        assignmentId: asg.id,
        classId: asg.classId,
        subjectId: asg.subjectId,
        componentId: asg.componentId,
        teacherId: asg.teacherId,
        unitIndex: i
      });
    }
  });

  // Map teachers to grades they teach for Grade Staggering heuristics
  const teacherGradeMap = new Map<string, Set<string>>();
  assignments.forEach(a => {
    const cls = state.classes.find(c => c.id === a.classId);
    if (cls?.gradeId) {
      if (!teacherGradeMap.has(a.teacherId)) teacherGradeMap.set(a.teacherId, new Set());
      teacherGradeMap.get(a.teacherId)!.add(cls.gradeId);
    }
  });

  // Heuristic sort: Teachers with highest workload & tightness first
  const teacherWorkload = new Map<string, number>();
  assignments.forEach(a => {
    teacherWorkload.set(a.teacherId, (teacherWorkload.get(a.teacherId) || 0) + a.periodsPerWeek);
  });

  unitsToSchedule.sort((a, b) => {
    const wA = teacherWorkload.get(a.teacherId) || 0;
    const wB = teacherWorkload.get(b.teacherId) || 0;
    return wB - wA;
  });

  // Grid occupancy matrices:
  // classGrid[classId][day][period] = unit / entry
  const classOccupancy = new Map<string, Map<string, TimetableEntry>>();
  // teacherGrid[teacherId][day][period] = TimetableEntry[]
  const teacherOccupancy = new Map<string, Map<string, TimetableEntry[]>>();

  const getSlotKey = (day: number, period: number) => `${day}_${period}`;

  const canTeacherDoubleBook = (teacherId: string, classId: string, subjectId: string, day: number, period: number): boolean => {
    const slotKey = getSlotKey(day, period);
    const existingEntries = teacherOccupancy.get(teacherId)?.get(slotKey);
    if (!existingEntries || existingEntries.length === 0) return true;
    const tch = state.teachers.find(t => t.id === teacherId);
    if (!tch?.allowDoubleBooking) return false;
    if (existingEntries.length >= 2) return false; // Max 2 classes simultaneously

    const newCls = state.classes.find(c => c.id === classId);
    const existingEntry = existingEntries[0];
    const existingCls = state.classes.find(c => c.id === existingEntry.classId);

    const isSameGrade = existingCls?.gradeId && newCls?.gradeId && existingCls.gradeId === newCls.gradeId;
    return !!isSameGrade;
  };

  const setOccupied = (entry: TimetableEntry) => {
    if (!classOccupancy.has(entry.classId)) classOccupancy.set(entry.classId, new Map());
    classOccupancy.get(entry.classId)!.set(getSlotKey(entry.dayOfWeek, entry.period), entry);

    if (!teacherOccupancy.has(entry.teacherId)) teacherOccupancy.set(entry.teacherId, new Map());
    const tMap = teacherOccupancy.get(entry.teacherId)!;
    const slotKey = getSlotKey(entry.dayOfWeek, entry.period);
    if (!tMap.has(slotKey)) tMap.set(slotKey, []);
    tMap.get(slotKey)!.push(entry);
  };

  const clearOccupied = (entry: TimetableEntry) => {
    classOccupancy.get(entry.classId)?.delete(getSlotKey(entry.dayOfWeek, entry.period));
    const tMap = teacherOccupancy.get(entry.teacherId);
    if (tMap) {
      const slotKey = getSlotKey(entry.dayOfWeek, entry.period);
      const list = tMap.get(slotKey);
      if (list) {
        const idx = list.findIndex(e => e.id === entry.id || e.classId === entry.classId);
        if (idx !== -1) list.splice(idx, 1);
        if (list.length === 0) tMap.delete(slotKey);
      }
    }
  };

  const isSlotFree = (classId: string, teacherId: string, day: number, period: number, subjectId: string): boolean => {
    const slotKey = getSlotKey(day, period);
    if (classOccupancy.get(classId)?.has(slotKey)) return false;
    if (!canTeacherDoubleBook(teacherId, classId, subjectId, day, period)) return false;
    if (isSlotHoliday(classId, day, period)) return false;
    if (isTeacherUnavailable(teacherId, day, period)) return false;
    return true;
  };

  // Register locked prefilled entries into occupancy maps
  preFilledEntries.forEach(entry => setOccupied(entry));

  // Backtracking Solver implementation
  const currentSolution: TimetableEntry[] = [...preFilledEntries];
  const unassignedUnits: PeriodUnit[] = [];

  let attempts = 0;
  const maxSearchSteps = options.maxIterations || 25000;

  function backtrack(unitIdx: number): boolean {
    attempts++;
    if (attempts > maxSearchSteps) return false;
    if (unitIdx >= unitsToSchedule.length) return true; // All units placed!

    const unit = unitsToSchedule[unitIdx];

    // Shuffle slots slightly for even spread
    const candidateSlots: { day: number; period: number; score: number }[] = [];
    const cls = state.classes.find(c => c.id === unit.classId);
    const classShift = cls?.shift || 'morning';
    const classMaxDaily = cls?.maxPeriodsPerDay || (classShift === 'both' ? 8 : state.timeSlotConfig.morningPeriodsCount);

    activeDays.forEach(day => {
      // Check max daily periods limit for class
      const existingDailyCount = currentSolution.filter(e => e.classId === unit.classId && e.dayOfWeek === day).length;
      if (existingDailyCount >= classMaxDaily) return;

      // Check max daily periods limit for teacher
      const tch = state.teachers.find(t => t.id === unit.teacherId);
      const teacherMaxDaily = tch?.maxPeriodsPerDay || 6;
      const teacherDailyCount = currentSolution.filter(e => e.teacherId === unit.teacherId && e.dayOfWeek === day).length;
      if (teacherDailyCount >= teacherMaxDaily) return;

      allPeriods.forEach(period => {
        const isMorningPeriod = period <= state.timeSlotConfig.morningPeriodsCount;

        // Shift filter:
        if (classShift === 'morning' && !isMorningPeriod) return;
        if (classShift === 'afternoon' && isMorningPeriod) return;

        if (isSlotFree(unit.classId, unit.teacherId, day, period, unit.subjectId)) {
          // Check same subject count on this day for this class
          const sameSubjectEntriesOnDay = currentSolution.filter(
            e => e.classId === unit.classId && e.subjectId === unit.subjectId && e.dayOfWeek === day
          );

          // STRICT RULE: Max 2 periods of the same subject per day. Disallow 3rd or more (e.g. avoid period 1, 2, 3, 4 same subject).
          if (sameSubjectEntriesOnDay.length >= 2) return;

          // Calculate heuristic score for placing unit here
          let score = 0;

          if (sameSubjectEntriesOnDay.length === 1) {
            score += 100; // heavy penalty for having 2 periods of same subject on same day

            // Check if consecutive (period - 1 or period + 1)
            const isConsecutive = sameSubjectEntriesOnDay.some(e => Math.abs(e.period - period) === 1);
            if (isConsecutive) {
              score += 300; // extremely high penalty for consecutive same subject periods
            }
          }

          // Soft avoid slot penalty
          const isSoftAvoid = avoidSlots.some(ta => ta.teacherId === unit.teacherId && ta.dayOfWeek === day && ta.period === period && ta.level === 'soft');
          if (isSoftAvoid) score += 20;

          // Prefer morning slots for core subjects if class is 2-session
          if (classShift === 'both' && isMorningPeriod) score -= 2;

          // Grade Staggering & Clustering Heuristic (Tối ưu So le giữa các Khối & Dồn/Gộp tiết cùng Khối):
          if (options.optimizeGradeStaggering !== false) {
            const unitGradeId = cls?.gradeId;
            const teacherGrades = teacherGradeMap.get(unit.teacherId);

            // If teacher teaches across multiple grade blocks (e.g., 1 English or 1 PE teacher for Khối 6, 7, 8, 9):
            if (unitGradeId && teacherGrades && teacherGrades.size > 1) {
              const teacherEntriesOnDay = currentSolution.filter(e => e.teacherId === unit.teacherId && e.dayOfWeek === day);

              // Check if teacher is already teaching classes in the SAME grade on this day:
              const sameGradeCount = teacherEntriesOnDay.filter(e => {
                const eCls = state.classes.find(c => c.id === e.classId);
                return eCls?.gradeId === unitGradeId;
              }).length;

              // Check if teacher is already teaching classes in DIFFERENT grades on this day:
              const diffGradeCount = teacherEntriesOnDay.filter(e => {
                const eCls = state.classes.find(c => c.id === e.classId);
                return eCls?.gradeId !== unitGradeId;
              }).length;

              // Reward grouping classes of the SAME grade in the same day/session (Grouped Grade Block)
              if (sameGradeCount > 0) {
                score -= 6;
              }

              // Reward adjacent periods for the same grade (xếp liền tiết cho cùng khối)
              const isAdjacentSameGrade = teacherEntriesOnDay.some(e => {
                const eCls = state.classes.find(c => c.id === e.classId);
                return eCls?.gradeId === unitGradeId && Math.abs(e.period - period) === 1;
              });
              if (isAdjacentSameGrade) {
                score -= 10;
              }

              // Penalty for scattering single teacher across too many different grades in the same day
              if (diffGradeCount > 0) {
                score += 8;
              }
            }
          }

          candidateSlots.push({ day, period, score });
        }
      });
    });

    // Sort candidate slots by lowest penalty score
    candidateSlots.sort((a, b) => a.score - b.score);

    for (const slot of candidateSlots) {
      const session = slot.period <= state.timeSlotConfig.morningPeriodsCount ? 'morning' : 'afternoon';
      const entry: TimetableEntry = {
        id: `entry_${unit.classId}_${slot.day}_${slot.period}`,
        timetableId: 'current',
        weekId,
        classId: unit.classId,
        dayOfWeek: slot.day,
        period: slot.period,
        session,
        subjectId: unit.subjectId,
        componentId: unit.componentId,
        teacherId: unit.teacherId,
        isLocked: false
      };

      setOccupied(entry);
      currentSolution.push(entry);

      if (backtrack(unitIdx + 1)) return true;

      // Undo
      currentSolution.pop();
      clearOccupied(entry);
    }

    // Could not place this unit in current path
    return false;
  }

  const totalRequiredPeriods = preCheck.totalRequiredPeriods;
  const success = backtrack(0);

  // If strict backtracking failed to place 100%, force-fill remaining unassigned units respecting max 2 periods per subject per day
  if (currentSolution.length < totalRequiredPeriods) {
    const placedAssignmentCounts = new Map<string, number>();
    currentSolution.forEach(e => {
      assignments.forEach(a => {
        if (a.classId === e.classId && a.teacherId === e.teacherId && a.subjectId === e.subjectId && a.componentId === e.componentId) {
          placedAssignmentCounts.set(a.id, (placedAssignmentCounts.get(a.id) || 0) + 1);
        }
      });
    });

    assignments.forEach(a => {
      const assigned = placedAssignmentCounts.get(a.id) || 0;
      const missing = a.periodsPerWeek - assigned;
      if (missing > 0) {
        for (let i = 0; i < missing; i++) {
          let placed = false;
          // Find candidate slots across days and periods, scoring them by how few times this subject is already on that day
          const candidateSlots: { day: number; period: number; score: number }[] = [];

          activeDays.forEach(day => {
            // Count same subject on this day for this class
            const sameSubjectCountOnDay = currentSolution.filter(
              e => e.classId === a.classId && e.subjectId === a.subjectId && e.dayOfWeek === day
            ).length;

            // STRICT: max 2 periods of same subject per day
            if (sameSubjectCountOnDay >= 2) return;

            allPeriods.forEach(period => {
              const occupiedByClass = currentSolution.some(e => e.classId === a.classId && e.dayOfWeek === day && e.period === period);
              const teacherCanBook = canTeacherDoubleBook(a.teacherId, a.classId, a.subjectId, day, period);
              if (!occupiedByClass && teacherCanBook) {
                // Score: lower is better. Prefer days with 0 same subject over 1.
                let score = sameSubjectCountOnDay * 100;
                // Also prefer morning for 2-session or morning shift
                const cls = state.classes.find(c => c.id === a.classId);
                const isMorning = period <= state.timeSlotConfig.morningPeriodsCount;
                if (cls?.shift === 'morning' && !isMorning) return;
                if (cls?.shift === 'afternoon' && isMorning) return;
                if (isMorning) score -= 10;

                candidateSlots.push({ day, period, score });
              }
            });
          });

          candidateSlots.sort((s1, s2) => s1.score - s2.score);

          if (candidateSlots.length > 0) {
            const slot = candidateSlots[0];
            const session = slot.period <= state.timeSlotConfig.morningPeriodsCount ? 'morning' : 'afternoon';
            currentSolution.push({
              id: `entry_force_${a.classId}_${slot.day}_${slot.period}_${Date.now()}_${Math.random().toString(36).substr(2,3)}`,
              timetableId: 'current',
              weekId,
              classId: a.classId,
              dayOfWeek: slot.day,
              period: slot.period,
              session,
              subjectId: a.subjectId,
              componentId: a.componentId,
              teacherId: a.teacherId,
              isLocked: false
            });
            placed = true;
          }

          // If still not placed because of strict sameSubjectCount < 2 constraint, relax and place in ANY free slot
          if (!placed) {
            for (const day of activeDays) {
              if (placed) break;
              for (const period of allPeriods) {
                if (placed) break;
                const occupiedByClass = currentSolution.some(e => e.classId === a.classId && e.dayOfWeek === day && e.period === period);
                const teacherCanBook = canTeacherDoubleBook(a.teacherId, a.classId, a.subjectId, day, period);
                if (!occupiedByClass && teacherCanBook) {
                  const session = period <= state.timeSlotConfig.morningPeriodsCount ? 'morning' : 'afternoon';
                  currentSolution.push({
                    id: `entry_forcerelax_${a.classId}_${day}_${period}_${Date.now()}_${Math.random().toString(36).substr(2,3)}`,
                    timetableId: 'current',
                    weekId,
                    classId: a.classId,
                    dayOfWeek: day,
                    period,
                    session,
                    subjectId: a.subjectId,
                    componentId: a.componentId,
                    teacherId: a.teacherId,
                    isLocked: false
                  });
                  placed = true;
                }
              }
            }
          }
        }
      }
    });
  }

  // Build generated version
  const scheduledPeriods = currentSolution.length;
  const completionRate = Math.round((scheduledPeriods / totalRequiredPeriods) * 100);

  // Run post-validation
  const validationIssues = validateTimetable(state, weekId, currentSolution);

  const hardViolationsCount = validationIssues.filter(i => i.category === 'hard_constraint').length;
  const softPenaltyCount = validationIssues.filter(i => i.category === 'soft_constraint').length;

  const newVersion: TimetableVersion = {
    id: `ver_${weekId}_${Date.now()}`,
    weekId,
    versionNumber: (state.timetableVersions[weekId]?.length || 0) + 1,
    name: `TKB ${weekId} - Version ${(state.timetableVersions[weekId]?.length || 0) + 1}`,
    createdAt: new Date().toISOString(),
    createdBy: 'TKB CP-SAT Solver',
    isCurrent: true,
    score: {
      hardViolations: hardViolationsCount,
      softPenalty: softPenaltyCount,
      scheduledPeriods,
      totalRequiredPeriods,
      completionRate
    },
    entries: currentSolution
  };

  // Build conflict report if not 100% complete
  let conflictReport;
  if (completionRate < 100 || unassignedUnits.length > 0) {
    const unassignedGrouped = new Map<string, any>();

    unassignedUnits.forEach(uu => {
      const asg = assignments.find(a => a.id === uu.assignmentId);
      if (!asg) return;

      const cls = state.classes.find(c => c.id === asg.classId);
      const sbj = state.subjects.find(s => s.id === asg.subjectId);
      const comp = sbj?.components?.find(c => c.id === asg.componentId);
      const tch = state.teachers.find(t => t.id === asg.teacherId);

      const assigned = currentSolution.filter(e =>
        e.classId === asg.classId && e.teacherId === asg.teacherId && e.subjectId === asg.subjectId && e.componentId === asg.componentId
      ).length;

      const key = `${asg.classId}_${asg.teacherId}_${asg.subjectId}_${asg.componentId || ''}`;
      if (!unassignedGrouped.has(key)) {
        // Find conflicting reasons for teacher / class
        const teacherOffList = teacherOffs.filter(t => t.teacherId === asg.teacherId);
        const avoidList = avoidSlots.filter(a => a.teacherId === asg.teacherId);

        const reasons: string[] = [];
        const suggestions: string[] = [];

        if (teacherOffList.length > 0) {
          reasons.push(`GV ${tch?.fullName} xin nghỉ vào các buổi/tiết đăng ký (${teacherOffList.length} lượt).`);
          suggestions.push(`Giảm hoặc nới lỏng tiết xin nghỉ của GV ${tch?.fullName}.`);
        }
        if (avoidList.length > 0) {
          reasons.push(`GV ${tch?.fullName} đăng ký tiết tránh hard/soft.`);
          suggestions.push(`Chuyển mức ràng buộc tiết tránh từ Cứng sang Mềm.`);
        }
        if (preFilledEntries.filter(e => e.classId === asg.classId).length > 5) {
          reasons.push(`Lớp ${cls?.name} có nhiều tiết đã bị khóa trước đó.`);
          suggestions.push(`Mở khóa bớt một số tiết của lớp ${cls?.name} để giải phóng khung giờ.`);
        }
        if (reasons.length === 0) {
          reasons.push(`Không tìm được khung thời gian đồng thời trống giữa GV ${tch?.fullName} và Lớp ${cls?.name}.`);
          suggestions.push(`Cho phép GV ${tch?.fullName} dạy thêm buổi hoặc điều chuyển lớp sang GV khác.`);
        }

        unassignedGrouped.set(key, {
          classId: asg.classId,
          className: cls?.name || asg.classId,
          subjectId: asg.subjectId,
          subjectName: sbj?.name || asg.subjectId,
          componentId: asg.componentId,
          componentName: comp?.name,
          teacherId: asg.teacherId,
          teacherName: tch?.fullName || asg.teacherId,
          required: asg.periodsPerWeek,
          assigned,
          missing: asg.periodsPerWeek - assigned,
          reasons,
          suggestions
        });
      }
    });

    conflictReport = {
      unassignedAssignments: Array.from(unassignedGrouped.values())
    };
  }

  return {
    success: hardViolationsCount === 0 && completionRate === 100,
    version: newVersion,
    issues: validationIssues,
    executionTimeMs: Date.now() - startTime,
    conflictReport
  };
}
