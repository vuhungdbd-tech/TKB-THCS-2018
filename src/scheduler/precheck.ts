import {
  DatabaseState,
  PreCheckResult,
  ValidationIssue,
  WeeklyAssignment
} from '../types';

export function runPreCheck(state: DatabaseState, weekId: string): PreCheckResult {
  const issues: ValidationIssue[] = [];

  const week = state.weeks.find(w => w.id === weekId) || state.weeks[0];
  const activeDays = state.dayConfigs.filter(d => d.isActive);
  const totalDaysCount = activeDays.length;
  const morningCount = state.timeSlotConfig.morningPeriodsCount;
  const afternoonCount = state.timeSlotConfig.afternoonPeriodsCount;
  const totalPeriodsPerDay = morningCount + afternoonCount;
  const maxWeeklyClassSlots = totalDaysCount * totalPeriodsPerDay;

  // Get weekly assignments for weekId
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

  let totalRequiredPeriods = 0;

  // 1. Verify assignments exist
  if (assignments.length === 0) {
    issues.push({
      type: 'error',
      category: 'precheck',
      code: 'NO_ASSIGNMENTS',
      message: `Chưa có dữ liệu phân công giảng dạy cho ${week.name}.`,
      recommendation: 'Hãy vào trang Phân công giảng dạy để thiết lập giáo viên phụ trách cho các lớp.'
    });
  }

  // Group assignments by class
  const classPeriodCounts: Record<string, number> = {};
  const teacherPeriodCounts: Record<string, number> = {};

  assignments.forEach(asg => {
    totalRequiredPeriods += asg.periodsPerWeek;

    // Check class existence
    const cls = state.classes.find(c => c.id === asg.classId);
    if (!cls) {
      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'INVALID_CLASS_REF',
        message: `Phân công tham chiếu tới lớp không tồn tại (ID: ${asg.classId}).`,
        details: { classId: asg.classId }
      });
    }

    // Check subject / component existence
    const subject = state.subjects.find(s => s.id === asg.subjectId);
    const component = subject?.components?.find(c => c.id === asg.componentId);
    const subjectLabel = component ? `${subject?.name || asg.subjectId} (${component.name})` : (subject?.name || asg.subjectId);

    if (!subject) {
      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'INVALID_SUBJECT_REF',
        message: `Phân công tham chiếu tới môn học không tồn tại (Mã môn: ${asg.subjectId}).`,
        details: { subjectId: asg.subjectId },
        recommendation: 'Kiểm tra lại danh mục môn học hoặc xóa phân công thừa.'
      });
    }

    // Check teacher existence
    if (!asg.teacherId || asg.teacherId.trim() === '') {
      issues.push({
        type: 'warning',
        category: 'precheck',
        code: 'UNASSIGNED_TEACHER',
        message: `Lớp ${cls?.name || asg.classId} môn ${subjectLabel} (${asg.periodsPerWeek} tiết) chưa được gán giáo viên.`,
        details: { classId: asg.classId, subjectId: asg.subjectId, componentId: asg.componentId },
        recommendation: 'Nhấn "⚡ Tự động sửa & Gán GV" để hệ thống tự phân công theo chuyên môn, hoặc gán thủ công tại trang Phân công.'
      });
    } else {
      const teacher = state.teachers.find(t => t.id === asg.teacherId);
      if (!teacher) {
        issues.push({
          type: 'error',
          category: 'precheck',
          code: 'INVALID_TEACHER_REF',
          message: `Phân công lớp ${cls?.name || asg.classId} môn ${subjectLabel} tham chiếu tới giáo viên không tồn tại (Mã GV: ${asg.teacherId}).`,
          details: { teacherId: asg.teacherId },
          recommendation: 'Nhấn "⚡ Tự động sửa & Gán GV" để tự động thay thế bằng giáo viên hợp lệ.'
        });
      }
    }

    classPeriodCounts[asg.classId] = (classPeriodCounts[asg.classId] || 0) + asg.periodsPerWeek;
    if (asg.teacherId) {
      teacherPeriodCounts[asg.teacherId] = (teacherPeriodCounts[asg.teacherId] || 0) + asg.periodsPerWeek;
    }
  });

  // 1.1 Check for Duplicate Class-Subject Assignments (Trùng môn / Trùng lớp)
  const assignmentKeyMap = new Map<string, WeeklyAssignment[]>();
  assignments.forEach(asg => {
    const key = `${asg.classId}_${asg.subjectId}_${asg.componentId || 'none'}`;
    if (!assignmentKeyMap.has(key)) assignmentKeyMap.set(key, []);
    assignmentKeyMap.get(key)!.push(asg);
  });

  assignmentKeyMap.forEach((duplicates, key) => {
    if (duplicates.length > 1) {
      const sample = duplicates[0];
      const cls = state.classes.find(c => c.id === sample.classId);
      const sbj = state.subjects.find(s => s.id === sample.subjectId);
      const comp = sbj?.components?.find(c => c.id === sample.componentId);
      const teacherNames = duplicates.map(a => {
        const t = state.teachers.find(tch => tch.id === a.teacherId);
        return t ? `${t.fullName} (${a.periodsPerWeek}t)` : 'Chưa gán GV';
      }).join(', ');

      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'DUPLICATE_ASSIGNMENT_COLLISION',
        message: `Lỗi trùng phân công: Lớp ${cls?.name || sample.classId} môn ${sbj?.name || sample.subjectId}${comp ? ` (${comp.name})` : ''} bị phân công ${duplicates.length} lần (${teacherNames}). Trùng môn cùng một lớp!`,
        details: { classId: sample.classId, subjectId: sample.subjectId, componentId: sample.componentId },
        recommendation: `Vào Phân công giảng dạy để xóa bớt bản ghi trùng hoặc gộp thành một giáo viên duy nhất phụ trách môn này cho lớp ${cls?.name}.`
      });
    }
  });

  // 2. Check Class Total Capacity vs Demand
  Object.entries(classPeriodCounts).forEach(([classId, count]) => {
    const cls = state.classes.find(c => c.id === classId);
    const className = cls?.name || classId;
    const shift = cls?.shift || 'morning';

    let classAvailableSlots = maxWeeklyClassSlots;
    if (shift === 'morning') {
      classAvailableSlots = totalDaysCount * morningCount;
    } else if (shift === 'afternoon') {
      classAvailableSlots = totalDaysCount * afternoonCount;
    }

    if (count > classAvailableSlots) {
      const shiftName = shift === 'morning' ? 'Buổi Sáng' : shift === 'afternoon' ? 'Buổi Chiều' : 'Cả 2 Buổi';
      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'CLASS_OVERLOAD',
        message: `${className} (${shiftName}) được phân công ${count} tiết/tuần, vượt quá khả năng xếp của ca học (${classAvailableSlots} tiết).`,
        details: { classId, className, missingPeriods: count - classAvailableSlots },
        recommendation: `Đổi ca học của ${className} sang "Học Cả 2 Buổi" hoặc điều chỉnh giảm số tiết phân công.`
      });
    }
  });

  // 3. Check Teacher Workload limits & Unavailability Conflicts
  Object.entries(teacherPeriodCounts).forEach(([teacherId, count]) => {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    if (count > teacher.maxPeriodsPerWeek) {
      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'TEACHER_OVERLOAD',
        message: `Giáo viên ${teacher.fullName} (${teacher.code}) được phân công ${count} tiết/tuần, vượt mức tối đa cho phép (${teacher.maxPeriodsPerWeek} tiết/tuần).`,
        details: { teacherId, teacherName: teacher.fullName },
        recommendation: `Điều chỉnh phân công bớt lớp cho GV ${teacher.fullName} hoặc tăng hạn mức tiết tối đa.`
      });
    }

    // Calculate teacher's total unavailable slots
    const unavailabilities = state.teacherUnavailabilities.filter(tu => tu.teacherId === teacherId && (!tu.weekId || tu.weekId === weekId));
    let blockedSlotCount = 0;
    unavailabilities.forEach(u => {
      blockedSlotCount += u.periods.length;
    });

    const availableSlots = maxWeeklyClassSlots - blockedSlotCount;
    if (count > availableSlots) {
      issues.push({
        type: 'error',
        category: 'precheck',
        code: 'TEACHER_UNAVAILABILITY_CLASH',
        message: `GV ${teacher.fullName} được phân công ${count} tiết nhưng có ${blockedSlotCount} tiết xin nghỉ, chỉ còn ${availableSlots} tiết trống. Không đủ slot để xếp!`,
        details: { teacherId, teacherName: teacher.fullName, missingPeriods: count - availableSlots },
        recommendation: `Giảm các tiết xin nghỉ của GV ${teacher.fullName} hoặc điều chuyển phân công giảng dạy.`
      });
    }
  });

  // Calculate total available teacher slots across system
  const totalAvailableTeacherSlots = state.teachers.reduce((acc, t) => acc + (t.maxPeriodsPerWeek || 20), 0);

  const hasFatalErrors = issues.some(i => i.type === 'error');

  return {
    isValid: !hasFatalErrors,
    issues,
    totalRequiredPeriods,
    totalAvailableTeacherSlots,
    summary: {
      totalClasses: state.classes.length,
      totalTeachers: state.teachers.length,
      totalAssignments: assignments.length
    }
  };
}
