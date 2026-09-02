import {
  DatabaseState,
  TimetableEntry,
  ValidationIssue
} from '../types';

export function validateTimetable(
  state: DatabaseState,
  weekId: string,
  entries: TimetableEntry[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const dayOffs = state.dayOffs.filter(d => !d.weekId || d.weekId === weekId);
  const teacherOffs = state.teacherUnavailabilities.filter(t => !t.weekId || t.weekId === weekId);
  const avoidSlots = state.teacherAvoidSlots.filter(t => !t.weekId || t.weekId === weekId);

  // 1. Check Class Double Booking (1 class, 2 subjects at same slot)
  const classSlotMap = new Map<string, TimetableEntry[]>();
  // 2. Check Teacher Double Booking (1 teacher, 2 classes at same slot)
  const teacherSlotMap = new Map<string, TimetableEntry[]>();
  // 3. Check Room Double Booking
  const roomSlotMap = new Map<string, TimetableEntry[]>();

  entries.forEach(e => {
    // Class key: `${classId}_${dayOfWeek}_${period}`
    const cKey = `${e.classId}_${e.dayOfWeek}_${e.period}`;
    if (!classSlotMap.has(cKey)) classSlotMap.set(cKey, []);
    classSlotMap.get(cKey)!.push(e);

    // Teacher key: `${teacherId}_${dayOfWeek}_${period}`
    const tKey = `${e.teacherId}_${e.dayOfWeek}_${e.period}`;
    if (!teacherSlotMap.has(tKey)) teacherSlotMap.set(tKey, []);
    teacherSlotMap.get(tKey)!.push(e);

    // Room key
    if (e.roomId) {
      const rKey = `${e.roomId}_${e.dayOfWeek}_${e.period}`;
      if (!roomSlotMap.has(rKey)) roomSlotMap.set(rKey, []);
      roomSlotMap.get(rKey)!.push(e);
    }
  });

  // Verify Class Collisions
  classSlotMap.forEach((list, key) => {
    if (list.length > 1) {
      const sample = list[0];
      const classId = sample.classId;
      const dayStr = sample.dayOfWeek;
      const periodStr = sample.period;
      const cls = state.classes.find(c => c.id === classId);
      const subjectDetails = list.map(e => {
        const s = state.subjects.find(sbj => sbj.id === e.subjectId);
        const t = state.teachers.find(tch => tch.id === e.teacherId);
        const comp = s?.components?.find(c => c.id === e.componentId);
        const sName = comp ? comp.name : (s?.name || e.subjectId);
        return `${sName} (${t?.fullName || 'Chưa gán GV'})`;
      }).join(' và ');

      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'CLASS_COLLISION',
        message: `Lỗi trùng tiết, trùng lớp: Lớp ${cls?.name || classId} bị xếp trùng ${list.length} tiết học cùng lúc tại Thứ ${dayStr}, Tiết ${periodStr}: ${subjectDetails}.`,
        details: {
          classId,
          className: cls?.name,
          dayOfWeek: dayStr,
          period: periodStr,
          conflictingEntries: list.map(e => e.id)
        },
        recommendation: 'Kéo thả hoặc chuyển một trong các môn sang tiết khác để đảm bảo mỗi lớp chỉ học 1 tiết tại một thời điểm.'
      });
    }
  });

  // Verify Teacher Collisions
  teacherSlotMap.forEach((list, key) => {
    if (list.length > 1) {
      const sample = list[0];
      const teacherId = sample.teacherId;
      const dayStr = sample.dayOfWeek;
      const periodStr = sample.period;
      const tch = state.teachers.find(t => t.id === teacherId);

      const classSubjectDetails = list.map(e => {
        const c = state.classes.find(cls => cls.id === e.classId);
        const s = state.subjects.find(sbj => sbj.id === e.subjectId);
        const comp = s?.components?.find(cp => cp.id === e.componentId);
        const sName = comp ? comp.name : (s?.name || e.subjectId);
        return `${sName} ${c?.name || e.classId}`;
      }).join(' và ');

      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'TEACHER_COLLISION',
        message: `Lỗi trùng tiết giáo viên: Giáo viên ${tch?.fullName || teacherId} bị xếp trùng lịch dạy cùng lúc cho các lớp (${classSubjectDetails}) tại Thứ ${dayStr}, Tiết ${periodStr}.`,
        details: {
          teacherId,
          teacherName: tch?.fullName,
          dayOfWeek: dayStr,
          period: periodStr,
          conflictingEntries: list.map(e => e.id)
        },
        recommendation: 'Chuyển tiết dạy của một trong các lớp sang tiết khác hoặc ngày khác để đảm bảo giáo viên chỉ dạy 1 lớp tại một thời điểm.'
      });
    }
  });

  // Verify Room Collisions
  roomSlotMap.forEach((list, key) => {
    if (list.length > 1) {
      const sample = list[0];
      const roomId = sample.roomId;
      const dayStr = sample.dayOfWeek;
      const periodStr = sample.period;
      const rm = state.rooms.find(r => r.id === roomId);
      if (rm?.isShared) {
        issues.push({
          type: 'error',
          category: 'hard_constraint',
          code: 'ROOM_COLLISION',
          message: `Phòng học dùng chung ${rm.name} bị trùng ${list.length} lớp tại Thứ ${dayStr}, Tiết ${periodStr}.`,
          details: { dayOfWeek: dayStr, period: periodStr }
        });
      }
    }
  });

  // 4. Verify Holiday & Unavailability Constraints
  entries.forEach(e => {
    // School / Class Day off
    const isHoliday = dayOffs.some(doff => {
      if (doff.dayOfWeek && doff.dayOfWeek !== e.dayOfWeek) return false;
      const isMorning = e.period <= state.timeSlotConfig.morningPeriodsCount;
      if (doff.session === 'morning' && !isMorning) return false;
      if (doff.session === 'afternoon' && isMorning) return false;
      if (doff.period && doff.period !== e.period) return false;
      if (doff.periods && doff.periods.length > 0 && !doff.periods.includes(e.period)) return false;
      if (doff.targetType === 'class' && doff.targetId !== e.classId) return false;
      if (doff.targetType === 'grade') {
        const cls = state.classes.find(c => c.id === e.classId);
        if (cls?.gradeId !== doff.targetId) return false;
      }
      return true;
    });

    if (isHoliday) {
      const cls = state.classes.find(c => c.id === e.classId);
      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'HOLIDAY_VIOLATION',
        message: `Tiết học của Lớp ${cls?.name || e.classId} xếp vào thời gian nghỉ (Thứ ${e.dayOfWeek}, Tiết ${e.period}).`,
        details: { classId: e.classId, dayOfWeek: e.dayOfWeek, period: e.period }
      });
    }

    // Teacher Unavailability
    const isOff = teacherOffs.some(tu => tu.teacherId === e.teacherId && tu.dayOfWeek === e.dayOfWeek && tu.periods.includes(e.period));
    if (isOff) {
      const tch = state.teachers.find(t => t.id === e.teacherId);
      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'TEACHER_OFF_VIOLATION',
        message: `GV ${tch?.fullName} bị xếp dạy vào khoảng thời gian đã xin nghỉ (Thứ ${e.dayOfWeek}, Tiết ${e.period}).`,
        details: { teacherId: e.teacherId, teacherName: tch?.fullName, dayOfWeek: e.dayOfWeek, period: e.period }
      });
    }

    // Class Shift Validation
    const cls = state.classes.find(c => c.id === e.classId);
    if (cls) {
      const shift = cls.shift || 'morning';
      const isMorningPeriod = e.period <= state.timeSlotConfig.morningPeriodsCount;
      if (shift === 'morning' && !isMorningPeriod) {
        issues.push({
          type: 'warning',
          category: 'hard_constraint',
          code: 'CLASS_SHIFT_MISMATCH',
          message: `Lớp ${cls.name} (được cấu hình Buổi Sáng) bị xếp tiết vào Buổi Chiều (Thứ ${e.dayOfWeek}, Tiết ${e.period}).`,
          details: { classId: e.classId, className: cls.name, dayOfWeek: e.dayOfWeek, period: e.period }
        });
      } else if (shift === 'afternoon' && isMorningPeriod) {
        issues.push({
          type: 'warning',
          category: 'hard_constraint',
          code: 'CLASS_SHIFT_MISMATCH',
          message: `Lớp ${cls.name} (được cấu hình Buổi Chiều) bị xếp tiết vào Buổi Sáng (Thứ ${e.dayOfWeek}, Tiết ${e.period}).`,
          details: { classId: e.classId, className: cls.name, dayOfWeek: e.dayOfWeek, period: e.period }
        });
      }
    }
  });

  // 5. Check Teacher Daily Period Limits & Gaps (Soft Constraints)
  const teacherDailyPeriods = new Map<string, Map<number, number[]>>();

  entries.forEach(e => {
    if (!teacherDailyPeriods.has(e.teacherId)) teacherDailyPeriods.set(e.teacherId, new Map());
    const dayMap = teacherDailyPeriods.get(e.teacherId)!;
    if (!dayMap.has(e.dayOfWeek)) dayMap.set(e.dayOfWeek, []);
    dayMap.get(e.dayOfWeek)!.push(e.period);
  });

  teacherDailyPeriods.forEach((dayMap, teacherId) => {
    const tch = state.teachers.find(t => t.id === teacherId);
    if (!tch) return;

    dayMap.forEach((periods, dayOfWeek) => {
      // Max periods per day
      if (periods.length > tch.maxPeriodsPerDay) {
        issues.push({
          type: 'warning',
          category: 'hard_constraint',
          code: 'TEACHER_MAX_DAILY_EXCEEDED',
          message: `GV ${tch.fullName} dạy ${periods.length} tiết trong Thứ ${dayOfWeek}, vượt hạn mức ${tch.maxPeriodsPerDay} tiết/ngày.`,
          details: { teacherId, teacherName: tch.fullName, dayOfWeek }
        });
      }

      // Check Idle Gaps (tiết trống)
      const sorted = [...periods].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1] - sorted[i] - 1;
        if (gap > 0) {
          issues.push({
            type: 'warning',
            category: 'soft_constraint',
            code: 'TEACHER_IDLE_GAP',
            message: `GV ${tch.fullName} có ${gap} tiết trống giữa Tiết ${sorted[i]} và Tiết ${sorted[i + 1]} ngày Thứ ${dayOfWeek}.`,
            details: { teacherId, teacherName: tch.fullName, dayOfWeek }
          });
        }
      }
    });
  });

  // 6. Check Timetable vs Assignment Teacher Mismatch
  const weeklyAssignments = state.weeklyAssignments[weekId] || state.masterAssignments;
  entries.forEach(e => {
    const matchedAsg = weeklyAssignments.find(a => 
      a.classId === e.classId && 
      a.subjectId === e.subjectId && 
      (a.componentId || '') === (e.componentId || '')
    );
    if (matchedAsg && matchedAsg.teacherId && matchedAsg.teacherId !== e.teacherId) {
      const assignedTch = state.teachers.find(t => t.id === matchedAsg.teacherId);
      const scheduledTch = state.teachers.find(t => t.id === e.teacherId);
      const cls = state.classes.find(c => c.id === e.classId);
      const sbj = state.subjects.find(s => s.id === e.subjectId);
      issues.push({
        type: 'warning',
        category: 'hard_constraint',
        code: 'ASSIGNMENT_TEACHER_MISMATCH',
        message: `Lớp ${cls?.name} môn ${sbj?.name} trong TKB đang xếp GV ${scheduledTch?.fullName} nhưng phân công thực tế là GV ${assignedTch?.fullName}.`,
        details: { classId: e.classId, subjectId: e.subjectId, dayOfWeek: e.dayOfWeek, period: e.period },
        recommendation: 'Bấm nút "Đồng bộ TKB với Phân công" ở báo cáo xung đột để cập nhật tự động.'
      });
    }
  });

  // 7. Check Consecutive Periods of the Same Teacher in the Same Class (Quy tắc So le / Không dạy 2 tiết liền nhau)
  const teacherClassDailyEntries = new Map<string, TimetableEntry[]>();
  entries.forEach(e => {
    if (!e.teacherId) return;
    const key = `${e.classId}_${e.teacherId}_${e.dayOfWeek}`;
    if (!teacherClassDailyEntries.has(key)) teacherClassDailyEntries.set(key, []);
    teacherClassDailyEntries.get(key)!.push(e);
  });

  teacherClassDailyEntries.forEach((groupEntries, key) => {
    if (groupEntries.length > 1) {
      const sorted = [...groupEntries].sort((a, b) => a.period - b.period);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1].period - sorted[i].period === 1) {
          const sample = sorted[i];
          const cls = state.classes.find(c => c.id === sample.classId);
          const tch = state.teachers.find(t => t.id === sample.teacherId);
          const sbj1 = state.subjects.find(s => s.id === sorted[i].subjectId);
          const sbj2 = state.subjects.find(s => s.id === sorted[i + 1].subjectId);

          issues.push({
            type: 'warning',
            category: 'soft_constraint',
            code: 'CONSECUTIVE_TEACHER_CLASS_VIOLATION',
            message: `GV ${tch?.fullName || sample.teacherId} dạy 2 tiết liền nhau (${sbj1?.name} Tiết ${sorted[i].period} và ${sbj2?.name} Tiết ${sorted[i + 1].period}, Thứ ${sample.dayOfWeek}) tại Lớp ${cls?.name}. Cần bố trí dạy so le cách tiết.`,
            details: { classId: sample.classId, teacherId: sample.teacherId, dayOfWeek: sample.dayOfWeek, period: sorted[i].period },
            recommendation: 'Chuyển một trong hai tiết sang tiết khác hoặc ngày khác để đảm bảo nguyên tắc so le.'
          });
        }
      }
    }
  });

  // 8. Check Subject Daily Overload (Không quá 1 tiết/ngày nếu số tiết tuần <= số ngày học)
  const activeDaysCount = state.dayConfigs ? state.dayConfigs.filter(d => d.isActive).length : 6;
  const classSubjectDailyEntries = new Map<string, TimetableEntry[]>();
  entries.forEach(e => {
    const key = `${e.classId}_${e.subjectId}_${e.dayOfWeek}`;
    if (!classSubjectDailyEntries.has(key)) classSubjectDailyEntries.set(key, []);
    classSubjectDailyEntries.get(key)!.push(e);
  });

  classSubjectDailyEntries.forEach((groupEntries, key) => {
    const sample = groupEntries[0];
    const matchedAsg = weeklyAssignments.find(a => a.classId === sample.classId && a.subjectId === sample.subjectId);
    const weeklyPeriods = matchedAsg?.periodsPerWeek || 3;
    const maxAllowedPerDay = weeklyPeriods > activeDaysCount ? Math.ceil(weeklyPeriods / activeDaysCount) : 1;

    if (groupEntries.length > maxAllowedPerDay) {
      const cls = state.classes.find(c => c.id === sample.classId);
      const sbj = state.subjects.find(s => s.id === sample.subjectId);
      issues.push({
        type: 'warning',
        category: 'soft_constraint',
        code: 'SAME_SUBJECT_DAILY_OVERLOAD',
        message: `Lớp ${cls?.name} bị xếp ${groupEntries.length} tiết môn ${sbj?.name} trong cùng ngày Thứ ${sample.dayOfWeek} (Mức tối ưu là ${maxAllowedPerDay} tiết/ngày vì môn này có ${weeklyPeriods} tiết/tuần).`,
        details: { classId: sample.classId, subjectId: sample.subjectId, dayOfWeek: sample.dayOfWeek },
        recommendation: 'Rải đều các tiết môn học sang các ngày khác trong tuần.'
      });
    }
  });

  return issues;
}
