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
      const [classId, dayStr, periodStr] = key.split('_');
      const cls = state.classes.find(c => c.id === classId);
      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'CLASS_COLLISION',
        message: `Lớp ${cls?.name || classId} bị trùng ${list.length} tiết tại Thứ ${dayStr}, Tiết ${periodStr}.`,
        details: {
          classId,
          className: cls?.name,
          dayOfWeek: parseInt(dayStr, 10),
          period: parseInt(periodStr, 10)
        },
        recommendation: 'Kéo thả một trong hai môn sang khung giờ khác.'
      });
    }
  });

  // Verify Teacher Collisions
  teacherSlotMap.forEach((list, key) => {
    if (list.length > 1) {
      const [teacherId, dayStr, periodStr] = key.split('_');
      const tch = state.teachers.find(t => t.id === teacherId);
      const classNames = list.map(e => state.classes.find(c => c.id === e.classId)?.name || e.classId).join(', ');
      issues.push({
        type: 'error',
        category: 'hard_constraint',
        code: 'TEACHER_COLLISION',
        message: `Giáo viên ${tch?.fullName || teacherId} bị trùng lịch dạy cùng lúc cho các lớp (${classNames}) tại Thứ ${dayStr}, Tiết ${periodStr}.`,
        details: {
          teacherId,
          teacherName: tch?.fullName,
          dayOfWeek: parseInt(dayStr, 10),
          period: parseInt(periodStr, 10)
        },
        recommendation: 'Di chuyển một trong các tiết dạy của giáo viên này.'
      });
    }
  });

  // Verify Room Collisions
  roomSlotMap.forEach((list, key) => {
    if (list.length > 1) {
      const [roomId, dayStr, periodStr] = key.split('_');
      const rm = state.rooms.find(r => r.id === roomId);
      if (rm?.isShared) {
        issues.push({
          type: 'error',
          category: 'hard_constraint',
          code: 'ROOM_COLLISION',
          message: `Phòng học dùng chung ${rm.name} bị trùng ${list.length} lớp tại Thứ ${dayStr}, Tiết ${periodStr}.`,
          details: { dayOfWeek: parseInt(dayStr, 10), period: parseInt(periodStr, 10) }
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
      (!a.componentId || !e.componentId || a.componentId === e.componentId)
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

  return issues;
}
