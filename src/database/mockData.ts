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
  MasterAssignment,
  DayOff,
  TeacherUnavailability,
  TeacherAvoidSlot,
  SoftConstraintWeight,
  Room,
  FixedPeriodRule
} from '../types';

export const initialAcademicYears: AcademicYear[] = [
  {
    id: 'ay_2026_2027',
    name: 'Năm học 2026-2027',
    startDate: '2026-09-05',
    endDate: '2027-05-31',
    isCurrent: true
  }
];

export const initialWeeks: Week[] = Array.from({ length: 37 }, (_, i) => {
  const weekNum = i + 1;
  const numStr = weekNum < 10 ? `0${weekNum}` : `${weekNum}`;
  return {
    id: `week_${weekNum}`,
    academicYearId: 'ay_2026_2027',
    weekNumber: weekNum,
    name: `Tuần ${numStr}`,
    startDate: `2026-09-${(5 + i * 7).toString().padStart(2, '0')}`,
    endDate: `2026-09-${(11 + i * 7).toString().padStart(2, '0')}`,
    isCurrent: weekNum === 3
  };
});

export const initialDayConfigs: DayConfig[] = [
  { dayOfWeek: 2, name: 'Thứ 2', isActive: true },
  { dayOfWeek: 3, name: 'Thứ 3', isActive: true },
  { dayOfWeek: 4, name: 'Thứ 4', isActive: true },
  { dayOfWeek: 5, name: 'Thứ 5', isActive: true },
  { dayOfWeek: 6, name: 'Thứ 6', isActive: true },
  { dayOfWeek: 7, name: 'Thứ 7', isActive: false },
];

export const initialTimeSlotsConfig: TimeSlotConfig = {
  morningPeriodsCount: 5,
  afternoonPeriodsCount: 4,
  periodTimes: [
    { period: 1, session: 'morning', startTime: '07:15', endTime: '08:00' },
    { period: 2, session: 'morning', startTime: '08:05', endTime: '08:50' },
    { period: 3, session: 'morning', startTime: '09:05', endTime: '09:50' },
    { period: 4, session: 'morning', startTime: '09:55', endTime: '10:40' },
    { period: 5, session: 'morning', startTime: '10:45', endTime: '11:30' },
    { period: 6, session: 'afternoon', startTime: '13:30', endTime: '14:15' },
    { period: 7, session: 'afternoon', startTime: '14:20', endTime: '15:05' },
    { period: 8, session: 'afternoon', startTime: '15:20', endTime: '16:05' },
    { period: 9, session: 'afternoon', startTime: '16:10', endTime: '16:55' },
  ]
};

export const initialGrades: Grade[] = [
  { id: 'grade_6', code: '6', name: 'Khối 6' },
  { id: 'grade_7', code: '7', name: 'Khối 7' },
  { id: 'grade_8', code: '8', name: 'Khối 8' },
  { id: 'grade_9', code: '9', name: 'Khối 9' },
];

export const initialClasses: ClassRoom[] = [
  { id: 'cls_6a1', code: '6A1', name: 'Lớp 6A1', gradeId: 'grade_6', headTeacherId: 'tch_toan_a', studentCount: 38, roomName: 'Phòng 101', shift: 'morning', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_6a2', code: '6A2', name: 'Lớp 6A2', gradeId: 'grade_6', headTeacherId: 'tch_van_b', studentCount: 37, roomName: 'Phòng 102', shift: 'morning', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_7b1', code: '7B1', name: 'Lớp 7B1', gradeId: 'grade_7', headTeacherId: 'tch_anh_c', studentCount: 40, roomName: 'Phòng 201', shift: 'morning', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_7b2', code: '7B2', name: 'Lớp 7B2', gradeId: 'grade_7', headTeacherId: 'tch_khtn_d', studentCount: 39, roomName: 'Phòng 202', shift: 'morning', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_8c1', code: '8C1', name: 'Lớp 8C1', gradeId: 'grade_8', headTeacherId: 'tch_khxh_e', studentCount: 41, roomName: 'Phòng 301', shift: 'afternoon', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_8c2', code: '8C2', name: 'Lớp 8C2', gradeId: 'grade_8', headTeacherId: 'tch_tin_f', studentCount: 40, roomName: 'Phòng 302', shift: 'afternoon', maxPeriodsPerDay: 5, status: 'active' },
  { id: 'cls_9d1', code: '9D1', name: 'Lớp 9D1', gradeId: 'grade_9', headTeacherId: 'tch_gdtc_g', studentCount: 36, roomName: 'Phòng 401', shift: 'both', maxPeriodsPerDay: 8, status: 'active' },
  { id: 'cls_9d2', code: '9D2', name: 'Lớp 9D2', gradeId: 'grade_9', headTeacherId: 'tch_su_h', studentCount: 35, roomName: 'Phòng 402', shift: 'both', maxPeriodsPerDay: 8, status: 'active' },
];

export const initialSubjects: Subject[] = [
  {
    id: 'sbj_toan',
    code: 'TOAN',
    name: 'Toán',
    category: 'natural_science',
    hasComponents: false,
    defaultPeriodsPerWeek: 4
  },
  {
    id: 'sbj_van',
    code: 'VAN',
    name: 'Ngữ văn',
    category: 'social_science',
    hasComponents: false,
    defaultPeriodsPerWeek: 4
  },
  {
    id: 'sbj_anh',
    code: 'ENG',
    name: 'Tiếng Anh',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 3
  },
  {
    id: 'sbj_khtn',
    code: 'KHTN',
    name: 'Khoa học tự nhiên',
    category: 'natural_science',
    hasComponents: true,
    defaultPeriodsPerWeek: 4,
    components: [
      { id: 'cmp_phy', subjectId: 'sbj_khtn', code: 'VAT_LI', name: 'Vật lí', defaultPeriodsPerWeek: 1 },
      { id: 'cmp_chem', subjectId: 'sbj_khtn', code: 'HOA_HOC', name: 'Hóa học', defaultPeriodsPerWeek: 1 },
      { id: 'cmp_bio', subjectId: 'sbj_khtn', code: 'SINH_HOC', name: 'Sinh học', defaultPeriodsPerWeek: 2 },
    ]
  },
  {
    id: 'sbj_khxh',
    code: 'KHXH',
    name: 'Lịch sử và Địa lí',
    category: 'social_science',
    hasComponents: true,
    defaultPeriodsPerWeek: 3,
    components: [
      { id: 'cmp_hist', subjectId: 'sbj_khxh', code: 'LICH_SU', name: 'Lịch sử', defaultPeriodsPerWeek: 1.5 },
      { id: 'cmp_geo', subjectId: 'sbj_khxh', code: 'DIA_LI', name: 'Địa lí', defaultPeriodsPerWeek: 1.5 },
    ]
  },
  {
    id: 'sbj_gdcd',
    code: 'GDCD',
    name: 'Giáo dục công dân',
    category: 'social_science',
    hasComponents: false,
    defaultPeriodsPerWeek: 1
  },
  {
    id: 'sbj_tin',
    code: 'TIN',
    name: 'Tin học',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 1
  },
  {
    id: 'sbj_congnghe',
    code: 'CN',
    name: 'Công nghệ',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 1
  },
  {
    id: 'sbj_gdtc',
    code: 'GDTC',
    name: 'Giáo dục thể chất',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 2
  },
  {
    id: 'sbj_nghethuat',
    code: 'NT',
    name: 'Nghệ thuật',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 2
  },
  {
    id: 'sbj_hdtn',
    code: 'HDTN',
    name: 'HĐTN, HN',
    category: 'general',
    hasComponents: false,
    defaultPeriodsPerWeek: 3
  }
];

export const initialDepartments: Department[] = [
  { id: 'dept_toan_tin', code: 'TOAN_TIN', name: 'Tổ Toán - Tin', description: 'Tổ chuyên môn Toán học và Tin học', headTeacherId: 'tch_toan_a' },
  { id: 'dept_khtn', code: 'KHTN', name: 'Tổ Khoa học tự nhiên', description: 'Tổ chuyên môn Vật lí, Hóa học, Sinh học', headTeacherId: 'tch_khtn_c' },
  { id: 'dept_van', code: 'NGU_VAN', name: 'Tổ Ngữ văn', description: 'Tổ chuyên môn Ngữ văn và Hoạt động trải nghiệm', headTeacherId: 'tch_van_b' },
  { id: 'dept_khxh', code: 'KHXH', name: 'Tổ Khoa học xã hội', description: 'Tổ chuyên môn Lịch sử, Địa lí, Giáo dục công dân', headTeacherId: 'tch_su_h' },
  { id: 'dept_ngoai_ngu', code: 'NGOAI_NGU', name: 'Tổ Ngoại ngữ', description: 'Tổ chuyên môn Tiếng Anh và Tiếng nước ngoài', headTeacherId: 'tch_anh_d' },
  { id: 'dept_nang_khieu', code: 'NANG_KHIEU', name: 'Tổ Nghệ thuật - Thể dục - CN', description: 'Tổ chuyên môn GDTC, Âm nhạc, Mỹ thuật, Công nghệ', headTeacherId: 'tch_gdtc_g' },
  { id: 'dept_bgh', code: 'BGH', name: 'Tổ Ban Giám Hiệu & Quản lý', description: 'Ban Giám Hiệu và Cán bộ chuyên trách' }
];

export const initialRooms: Room[] = [
  { id: 'rm_101', code: 'P101', name: 'Phòng 101', type: 'general', isShared: false },
  { id: 'rm_102', code: 'P102', name: 'Phòng 102', type: 'general', isShared: false },
  { id: 'rm_201', code: 'P201', name: 'Phòng 201', type: 'general', isShared: false },
  { id: 'rm_202', code: 'P202', name: 'Phòng 202', type: 'general', isShared: false },
  { id: 'rm_301', code: 'P301', name: 'Phòng 301', type: 'general', isShared: false },
  { id: 'rm_302', code: 'P302', name: 'Phòng 302', type: 'general', isShared: false },
  { id: 'rm_401', code: 'P401', name: 'Phòng 401', type: 'general', isShared: false },
  { id: 'rm_402', code: 'P402', name: 'Phòng 402', type: 'general', isShared: false },
  { id: 'rm_lab', code: 'LAB', name: 'Phòng Thí nghiệm KHTN', type: 'lab', isShared: true },
  { id: 'rm_comp', code: 'COMP', name: 'Phòng Máy Tin học', type: 'computer', isShared: true },
  { id: 'rm_gym', code: 'GYM', name: 'Sân Tập Thể Dục', type: 'gym', isShared: true },
];

export const initialTeachers: Teacher[] = [
  {
    id: 'tch_toan_a',
    code: 'GV01',
    fullName: 'Nguyễn Văn A',
    department: 'Tổ Toán - Tin',
    mainSubjectId: 'sbj_toan',
    qualifiedSubjectIds: ['sbj_toan'],
    maxPeriodsPerWeek: 20,
    maxPeriodsPerDay: 5,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    note: 'Tổ trưởng Toán',
    status: 'active'
  },
  {
    id: 'tch_toan_b',
    code: 'GV02',
    fullName: 'Trần Thị Mai',
    department: 'Tổ Toán - Tin',
    mainSubjectId: 'sbj_toan',
    qualifiedSubjectIds: ['sbj_toan'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_van_b',
    code: 'GV03',
    fullName: 'Lê Văn Bình',
    department: 'Tổ Ngữ văn',
    mainSubjectId: 'sbj_van',
    qualifiedSubjectIds: ['sbj_van'],
    maxPeriodsPerWeek: 20,
    maxPeriodsPerDay: 5,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_van_c',
    code: 'GV04',
    fullName: 'Phạm Thị Lan',
    department: 'Tổ Ngữ văn',
    mainSubjectId: 'sbj_van',
    qualifiedSubjectIds: ['sbj_van'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_anh_c',
    code: 'GV05',
    fullName: 'Hoàng Minh Dung',
    department: 'Tổ Ngoại ngữ',
    mainSubjectId: 'sbj_anh',
    qualifiedSubjectIds: ['sbj_anh'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_phy_d',
    code: 'GV06',
    fullName: 'Đỗ Đức Hùng',
    department: 'Tổ KHTN',
    mainSubjectId: 'sbj_khtn',
    qualifiedSubjectIds: ['cmp_phy'],
    maxPeriodsPerWeek: 16,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_chem_e',
    code: 'GV07',
    fullName: 'Ngô Thu Hà',
    department: 'Tổ KHTN',
    mainSubjectId: 'sbj_khtn',
    qualifiedSubjectIds: ['cmp_chem'],
    maxPeriodsPerWeek: 16,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_bio_f',
    code: 'GV08',
    fullName: 'Vũ Quốc Tuấn',
    department: 'Tổ KHTN',
    mainSubjectId: 'sbj_khtn',
    qualifiedSubjectIds: ['cmp_bio'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_khxh_e',
    code: 'GV09',
    fullName: 'Đặng Thanh Tâm',
    department: 'Tổ KHXH',
    mainSubjectId: 'sbj_khxh',
    qualifiedSubjectIds: ['cmp_hist', 'cmp_geo', 'sbj_gdcd'],
    maxPeriodsPerWeek: 20,
    maxPeriodsPerDay: 5,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_tin_f',
    code: 'GV10',
    fullName: 'Bùi Anh Khoa',
    department: 'Tổ Toán - Tin',
    mainSubjectId: 'sbj_tin',
    qualifiedSubjectIds: ['sbj_tin', 'sbj_congnghe'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_gdtc_g',
    code: 'GV11',
    fullName: 'Nguyễn Văn Sơn',
    department: 'Tổ Thể dục - Nghệ thuật',
    mainSubjectId: 'sbj_gdtc',
    qualifiedSubjectIds: ['sbj_gdtc', 'sbj_hdtn'],
    maxPeriodsPerWeek: 20,
    maxPeriodsPerDay: 5,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  },
  {
    id: 'tch_su_h',
    code: 'GV12',
    fullName: 'Nguyễn Thị Hoa',
    department: 'Tổ KHXH',
    mainSubjectId: 'sbj_khxh',
    qualifiedSubjectIds: ['cmp_hist', 'sbj_nghethuat', 'sbj_hdtn'],
    maxPeriodsPerWeek: 18,
    maxPeriodsPerDay: 4,
    maxSessionsPerDay: 2,
    maxDaysPerWeek: 5,
    status: 'active'
  }
];

export const initialMasterAssignments: MasterAssignment[] = [
  // 6A1
  { id: 'asg_6a1_toan', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_toan', teacherId: 'tch_toan_a', periodsPerWeek: 4 },
  { id: 'asg_6a1_van', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_van', teacherId: 'tch_van_b', periodsPerWeek: 4 },
  { id: 'asg_6a1_anh', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_anh', teacherId: 'tch_anh_c', periodsPerWeek: 3 },
  { id: 'asg_6a1_phy', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_khtn', componentId: 'cmp_phy', teacherId: 'tch_phy_d', periodsPerWeek: 1 },
  { id: 'asg_6a1_chem', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_khtn', componentId: 'cmp_chem', teacherId: 'tch_chem_e', periodsPerWeek: 1 },
  { id: 'asg_6a1_bio', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_khtn', componentId: 'cmp_bio', teacherId: 'tch_bio_f', periodsPerWeek: 2 },
  { id: 'asg_6a1_hist', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_khxh', componentId: 'cmp_hist', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_6a1_geo', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_khxh', componentId: 'cmp_geo', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_6a1_gdcd', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_gdcd', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_6a1_tin', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_tin', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_6a1_cn', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_congnghe', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_6a1_gdtc', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_gdtc', teacherId: 'tch_gdtc_g', periodsPerWeek: 2 },
  { id: 'asg_6a1_nt', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_nghethuat', teacherId: 'tch_su_h', periodsPerWeek: 2 },
  { id: 'asg_6a1_hdtn', academicYearId: 'ay_2026_2027', classId: 'cls_6a1', subjectId: 'sbj_hdtn', teacherId: 'tch_toan_a', periodsPerWeek: 3 },

  // 6A2
  { id: 'asg_6a2_toan', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_toan', teacherId: 'tch_toan_b', periodsPerWeek: 4 },
  { id: 'asg_6a2_van', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_van', teacherId: 'tch_van_c', periodsPerWeek: 4 },
  { id: 'asg_6a2_anh', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_anh', teacherId: 'tch_anh_c', periodsPerWeek: 3 },
  { id: 'asg_6a2_phy', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_khtn', componentId: 'cmp_phy', teacherId: 'tch_phy_d', periodsPerWeek: 1 },
  { id: 'asg_6a2_chem', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_khtn', componentId: 'cmp_chem', teacherId: 'tch_chem_e', periodsPerWeek: 1 },
  { id: 'asg_6a2_bio', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_khtn', componentId: 'cmp_bio', teacherId: 'tch_bio_f', periodsPerWeek: 2 },
  { id: 'asg_6a2_hist', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_khxh', componentId: 'cmp_hist', teacherId: 'tch_su_h', periodsPerWeek: 1 },
  { id: 'asg_6a2_geo', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_khxh', componentId: 'cmp_geo', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_6a2_gdcd', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_gdcd', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_6a2_tin', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_tin', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_6a2_cn', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_congnghe', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_6a2_gdtc', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_gdtc', teacherId: 'tch_gdtc_g', periodsPerWeek: 2 },
  { id: 'asg_6a2_nt', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_nghethuat', teacherId: 'tch_su_h', periodsPerWeek: 2 },
  { id: 'asg_6a2_hdtn', academicYearId: 'ay_2026_2027', classId: 'cls_6a2', subjectId: 'sbj_hdtn', teacherId: 'tch_van_b', periodsPerWeek: 3 },

  // 7B1
  { id: 'asg_7b1_toan', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_toan', teacherId: 'tch_toan_a', periodsPerWeek: 4 },
  { id: 'asg_7b1_van', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_van', teacherId: 'tch_van_b', periodsPerWeek: 4 },
  { id: 'asg_7b1_anh', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_anh', teacherId: 'tch_anh_c', periodsPerWeek: 3 },
  { id: 'asg_7b1_phy', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_khtn', componentId: 'cmp_phy', teacherId: 'tch_phy_d', periodsPerWeek: 1 },
  { id: 'asg_7b1_chem', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_khtn', componentId: 'cmp_chem', teacherId: 'tch_chem_e', periodsPerWeek: 1 },
  { id: 'asg_7b1_bio', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_khtn', componentId: 'cmp_bio', teacherId: 'tch_bio_f', periodsPerWeek: 2 },
  { id: 'asg_7b1_hist', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_khxh', componentId: 'cmp_hist', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_7b1_geo', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_khxh', componentId: 'cmp_geo', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_7b1_gdcd', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_gdcd', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_7b1_tin', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_tin', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_7b1_cn', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_congnghe', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_7b1_gdtc', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_gdtc', teacherId: 'tch_gdtc_g', periodsPerWeek: 2 },
  { id: 'asg_7b1_nt', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_nghethuat', teacherId: 'tch_su_h', periodsPerWeek: 2 },
  { id: 'asg_7b1_hdtn', academicYearId: 'ay_2026_2027', classId: 'cls_7b1', subjectId: 'sbj_hdtn', teacherId: 'tch_anh_c', periodsPerWeek: 3 },

  // 8C1
  { id: 'asg_8c1_toan', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_toan', teacherId: 'tch_toan_b', periodsPerWeek: 4 },
  { id: 'asg_8c1_van', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_van', teacherId: 'tch_van_c', periodsPerWeek: 4 },
  { id: 'asg_8c1_anh', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_anh', teacherId: 'tch_anh_c', periodsPerWeek: 3 },
  { id: 'asg_8c1_phy', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_khtn', componentId: 'cmp_phy', teacherId: 'tch_phy_d', periodsPerWeek: 2 },
  { id: 'asg_8c1_chem', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_khtn', componentId: 'cmp_chem', teacherId: 'tch_chem_e', periodsPerWeek: 1 },
  { id: 'asg_8c1_bio', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_khtn', componentId: 'cmp_bio', teacherId: 'tch_bio_f', periodsPerWeek: 1 },
  { id: 'asg_8c1_hist', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_khxh', componentId: 'cmp_hist', teacherId: 'tch_su_h', periodsPerWeek: 1 },
  { id: 'asg_8c1_geo', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_khxh', componentId: 'cmp_geo', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_8c1_gdcd', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_gdcd', teacherId: 'tch_khxh_e', periodsPerWeek: 1 },
  { id: 'asg_8c1_tin', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_tin', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_8c1_cn', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_congnghe', teacherId: 'tch_tin_f', periodsPerWeek: 1 },
  { id: 'asg_8c1_gdtc', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_gdtc', teacherId: 'tch_gdtc_g', periodsPerWeek: 2 },
  { id: 'asg_8c1_nt', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_nghethuat', teacherId: 'tch_su_h', periodsPerWeek: 2 },
  { id: 'asg_8c1_hdtn', academicYearId: 'ay_2026_2027', classId: 'cls_8c1', subjectId: 'sbj_hdtn', teacherId: 'tch_khxh_e', periodsPerWeek: 3 },
];

export const initialDayOffs: DayOff[] = [
  {
    id: 'dayoff_1',
    weekId: 'week_3',
    dayOfWeek: 2,
    period: 1, // Thứ 2 Tiết 1 Chào cờ
    targetType: 'school',
    reason: 'Chào cờ đầu tuần (HĐTN)'
  },
  {
    id: 'dayoff_2',
    dayOfWeek: 2,
    session: 'afternoon',
    targetType: 'school',
    reason: 'Nghỉ chiều Thứ 2: Họp chuyên môn tổ & Bồi dưỡng học sinh giỏi'
  },
  {
    id: 'dayoff_3',
    dayOfWeek: 3,
    session: 'afternoon',
    targetType: 'school',
    reason: 'Nghỉ chiều Thứ 3: Sinh hoạt chuyên môn & Ôn luyện HSG'
  }
];

export const initialTeacherUnavailabilities: TeacherUnavailability[] = [
  {
    id: 'tun_1',
    weekId: 'week_3',
    teacherId: 'tch_toan_a',
    dayOfWeek: 3, // Thứ 3
    periods: [1, 2], // Sáng tiết 1, 2 bận họp HĐND
    reason: 'Họp HĐND Phường'
  }
];

export const initialTeacherAvoidSlots: TeacherAvoidSlot[] = [
  {
    id: 'avd_1',
    weekId: 'week_3',
    teacherId: 'tch_van_b',
    dayOfWeek: 6, // Thứ 6
    period: 4,
    level: 'soft',
    reason: 'Muốn nghỉ sớm thứ 6'
  }
];

export const initialFixedPeriodRules: FixedPeriodRule[] = [
  {
    id: 'fpr_chao_co',
    dayOfWeek: 2,
    period: 1,
    subjectId: 'sbj_hdtn',
    reason: 'Chào cờ đầu tuần (HĐTN)'
  }
];

export const initialSoftWeights: SoftConstraintWeight[] = [
  { id: 'sw_gaps', code: 'MIN_GAPS', name: 'Giảm tiết trống giáo viên', weight: 8, description: 'Phạt cao khi giáo viên có tiết trống ở giữa 2 tiết dạy' },
  { id: 'sw_single', code: 'AVOID_SINGLE_PERIOD', name: 'Hạn chế 1 tiết/buổi', weight: 7, description: 'Tránh việc giáo viên đến trường chỉ để dạy đúng 1 tiết' },
  { id: 'sw_spread', code: 'EVEN_SPREAD', name: 'Phân bố đều môn học', weight: 9, description: 'Phân bố các tiết môn học rải đều các ngày trong tuần' },
  { id: 'sw_avoid', code: 'RESPECT_AVOID', name: 'Tối ưu tiết tránh GV', weight: 6, description: 'Hạn chế xếp tiết vào khoảng thời gian giáo viên xin tránh' },
  { id: 'sw_consecutive', code: 'MAX_CONSECUTIVE', name: 'Giới hạn tiết liền kề', weight: 7, description: 'Hạn chế dạy quá 3 tiết liên tiếp cho giáo viên' },
];
