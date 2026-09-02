import XLSX from 'xlsx-js-style';
import { DatabaseState, TimetableEntry, ClassRoom, Subject, Teacher, MasterAssignment } from '../types';

// Standard style definitions for Excel sheets
const headerStyle = {
  fill: { fgColor: { rgb: '1F497D' } },
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: 'FFFFFF' } },
    bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
    left: { style: 'thin', color: { rgb: 'FFFFFF' } },
    right: { style: 'thin', color: { rgb: 'FFFFFF' } }
  }
};

const cellStyle = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } }
  }
};

const cellCenterStyle = {
  ...cellStyle,
  alignment: { horizontal: 'center', vertical: 'center' }
};

function applySheetStyling(ws: any, colWidths: number[]) {
  ws['!cols'] = colWidths.map(wch => ({ wch }));
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;
      if (R === 0) {
        ws[cellRef].s = headerStyle;
      } else {
        // If numeric or code column, center it
        if (typeof ws[cellRef].v === 'number' || C === 0 || C === 2) {
          ws[cellRef].s = cellCenterStyle;
        } else {
          ws[cellRef].s = cellStyle;
        }
      }
    }
  }
}

/**
 * Tạo Mẫu Excel Chuẩn GDPT 2018 (Đầy đủ và Sạch sẽ)
 */
export function generateSampleExcelTemplate(isCleanBlank: boolean = false) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Lớp
  const classHeaders = ['Mã lớp', 'Tên lớp', 'Khối', 'Sĩ số', 'Phòng học', 'Buổi học (morning/afternoon/both)'];
  const classRows = isCleanBlank
    ? []
    : [
        ['6A1', 'Lớp 6A1', '6', 38, 'Phòng 101', 'morning'],
        ['6A2', 'Lớp 6A2', '6', 37, 'Phòng 102', 'morning'],
        ['7B1', 'Lớp 7B1', '7', 40, 'Phòng 201', 'morning'],
        ['7B2', 'Lớp 7B2', '7', 39, 'Phòng 202', 'morning'],
        ['8C1', 'Lớp 8C1', '8', 41, 'Phòng 301', 'afternoon'],
        ['8C2', 'Lớp 8C2', '8', 40, 'Phòng 302', 'afternoon'],
        ['9D1', 'Lớp 9D1', '9', 36, 'Phòng 401', 'both'],
        ['9D2', 'Lớp 9D2', '9', 35, 'Phòng 402', 'both'],
      ];
  const wsClass = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
  applySheetStyling(wsClass, [12, 16, 10, 10, 16, 25]);
  XLSX.utils.book_append_sheet(wb, wsClass, 'Lớp');

  // Sheet 2: Môn học
  const subjectHeaders = ['Mã môn', 'Tên môn', 'Loại môn (natural_science/social_science/general)', 'Số tiết mặc định/tuần'];
  const subjectRows = isCleanBlank
    ? []
    : [
        ['TOAN', 'Toán', 'natural_science', 4],
        ['VAN', 'Ngữ văn', 'social_science', 4],
        ['ENG', 'Tiếng Anh', 'general', 3],
        ['KHTN', 'Khoa học tự nhiên', 'natural_science', 4],
        ['KHXH', 'Lịch sử và Địa lí', 'social_science', 3],
        ['GDCD', 'Giáo dục công dân', 'social_science', 1],
        ['TIN', 'Tin học', 'general', 1],
        ['CN', 'Công nghệ', 'general', 1],
        ['GDTC', 'Giáo dục thể chất', 'general', 2],
        ['NT', 'Nghệ thuật', 'general', 2],
        ['HDTN', 'HĐTN, HN', 'general', 3],
      ];
  const wsSubject = XLSX.utils.aoa_to_sheet([subjectHeaders, ...subjectRows]);
  applySheetStyling(wsSubject, [12, 24, 30, 20]);
  XLSX.utils.book_append_sheet(wb, wsSubject, 'Môn');

  // Sheet 3: Phân môn KHTN & KHXH
  const compHeaders = ['Mã môn chính', 'Tên phân môn', 'Mã phân môn', 'Số tiết mặc định/tuần'];
  const compRows = isCleanBlank
    ? []
    : [
        ['KHTN', 'Vật lí', 'VAT_LI', 1],
        ['KHTN', 'Hóa học', 'HOA_HOC', 1],
        ['KHTN', 'Sinh học', 'SINH_HOC', 2],
        ['KHXH', 'Lịch sử', 'LICH_SU', 1.5],
        ['KHXH', 'Địa lí', 'DIA_LI', 1.5],
      ];
  const wsComp = XLSX.utils.aoa_to_sheet([compHeaders, ...compRows]);
  applySheetStyling(wsComp, [16, 20, 16, 22]);
  XLSX.utils.book_append_sheet(wb, wsComp, 'Phân môn');

  // Sheet 4: Giáo viên
  const teacherHeaders = ['Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Môn chính (Mã môn)', 'Số tiết tối đa/tuần', 'Cho phép dạy trùng khối (co_the/khong)'];
  const teacherRows = isCleanBlank
    ? []
    : [
        ['GV01', 'Nguyễn Văn A', 'Tổ Toán - Tin', 'TOAN', 20, 'khong'],
        ['GV02', 'Trần Thị Mai', 'Tổ Toán - Tin', 'TOAN', 18, 'khong'],
        ['GV03', 'Lê Văn Bình', 'Tổ Ngữ văn', 'VAN', 20, 'khong'],
        ['GV04', 'Phạm Thị Lan', 'Tổ Ngữ văn', 'VAN', 18, 'khong'],
        ['GV05', 'Hoàng Minh Dung', 'Tổ Ngoại ngữ', 'ENG', 18, 'khong'],
        ['GV06', 'Đỗ Đức Hùng', 'Tổ KHTN', 'VAT_LI', 16, 'khong'],
        ['GV07', 'Ngô Thu Hà', 'Tổ KHTN', 'HOA_HOC', 16, 'khong'],
        ['GV08', 'Vũ Quốc Tuấn', 'Tổ KHTN', 'SINH_HOC', 18, 'khong'],
        ['GV09', 'Đặng Thanh Tâm', 'Tổ KHXH', 'KHXH', 20, 'khong'],
        ['GV10', 'Bùi Anh Khoa', 'Tổ Toán - Tin', 'TIN', 18, 'khong'],
        ['GV11', 'Nguyễn Văn Sơn', 'Tổ Thể dục - Nghệ thuật', 'GDTC', 20, 'co_the'],
        ['GV12', 'Nguyễn Thị Hoa', 'Tổ KHXH', 'KHXH', 18, 'khong'],
      ];
  const wsTeacher = XLSX.utils.aoa_to_sheet([teacherHeaders, ...teacherRows]);
  applySheetStyling(wsTeacher, [12, 22, 24, 20, 20, 30]);
  XLSX.utils.book_append_sheet(wb, wsTeacher, 'Giáo viên');

  // Sheet 5: Phân công
  const asgHeaders = ['Mã Lớp', 'Mã Môn', 'Mã Phân môn (nếu có)', 'Mã GV phụ trách', 'Số tiết/tuần'];
  const asgRows = isCleanBlank
    ? []
    : [
        ['6A1', 'TOAN', '', 'GV01', 4],
        ['6A1', 'VAN', '', 'GV03', 4],
        ['6A1', 'ENG', '', 'GV05', 3],
        ['6A1', 'KHTN', 'VAT_LI', 'GV06', 1],
        ['6A1', 'KHTN', 'HOA_HOC', 'GV07', 1],
        ['6A1', 'KHTN', 'SINH_HOC', 'GV08', 2],
        ['6A1', 'KHXH', 'LICH_SU', 'GV09', 1],
        ['6A1', 'KHXH', 'DIA_LI', 'GV09', 1],
        ['6A1', 'GDCD', '', 'GV09', 1],
        ['6A1', 'TIN', '', 'GV10', 1],
        ['6A1', 'CN', '', 'GV10', 1],
        ['6A1', 'GDTC', '', 'GV11', 2],
        ['6A1', 'NT', '', 'GV12', 2],
        ['6A1', 'HDTN', '', 'GV01', 3],

        ['6A2', 'TOAN', '', 'GV02', 4],
        ['6A2', 'VAN', '', 'GV04', 4],
        ['6A2', 'ENG', '', 'GV05', 3],
        ['6A2', 'KHTN', 'VAT_LI', 'GV06', 1],
        ['6A2', 'KHTN', 'HOA_HOC', 'GV07', 1],
        ['6A2', 'KHTN', 'SINH_HOC', 'GV08', 2],
        ['6A2', 'KHXH', 'LICH_SU', 'GV12', 1],
        ['6A2', 'KHXH', 'DIA_LI', 'GV09', 1],
        ['6A2', 'GDCD', '', 'GV09', 1],
        ['6A2', 'TIN', '', 'GV10', 1],
        ['6A2', 'CN', '', 'GV10', 1],
        ['6A2', 'GDTC', '', 'GV11', 2],
        ['6A2', 'NT', '', 'GV12', 2],
        ['6A2', 'HDTN', '', 'GV03', 3],

        ['7B1', 'TOAN', '', 'GV01', 4],
        ['7B1', 'VAN', '', 'GV03', 4],
        ['7B1', 'ENG', '', 'GV05', 3],
        ['7B1', 'KHTN', 'VAT_LI', 'GV06', 1],
        ['7B1', 'KHTN', 'HOA_HOC', 'GV07', 1],
        ['7B1', 'KHTN', 'SINH_HOC', 'GV08', 2],
        ['7B1', 'KHXH', 'LICH_SU', 'GV09', 1],
        ['7B1', 'KHXH', 'DIA_LI', 'GV09', 1],
        ['7B1', 'GDCD', '', 'GV09', 1],
        ['7B1', 'TIN', '', 'GV10', 1],
        ['7B1', 'CN', '', 'GV10', 1],
        ['7B1', 'GDTC', '', 'GV11', 2],
        ['7B1', 'NT', '', 'GV12', 2],
        ['7B1', 'HDTN', '', 'GV05', 3],

        ['8C1', 'TOAN', '', 'GV02', 4],
        ['8C1', 'VAN', '', 'GV04', 4],
        ['8C1', 'ENG', '', 'GV05', 3],
        ['8C1', 'KHTN', 'VAT_LI', 'GV06', 2],
        ['8C1', 'KHTN', 'HOA_HOC', 'GV07', 1],
        ['8C1', 'KHTN', 'SINH_HOC', 'GV08', 1],
        ['8C1', 'KHXH', 'LICH_SU', 'GV12', 1],
        ['8C1', 'KHXH', 'DIA_LI', 'GV09', 1],
        ['8C1', 'GDCD', '', 'GV09', 1],
        ['8C1', 'TIN', '', 'GV10', 1],
        ['8C1', 'CN', '', 'GV10', 1],
        ['8C1', 'GDTC', '', 'GV11', 2],
        ['8C1', 'NT', '', 'GV12', 2],
        ['8C1', 'HDTN', '', 'GV09', 3],
      ];
  const wsAsg = XLSX.utils.aoa_to_sheet([asgHeaders, ...asgRows]);
  applySheetStyling(wsAsg, [12, 12, 20, 18, 16]);
  XLSX.utils.book_append_sheet(wb, wsAsg, 'Phân công');

  const fileName = isCleanBlank
    ? 'Mau_Trang_Nhap_TKB_THCS_2018.xlsx'
    : 'Mau_Nhap_Du_Lieu_TKB_THCS_2018_Chuan.xlsx';
  XLSX.writeFile(wb, fileName);
}

/**
 * Xuất toàn bộ CSDL hiện tại ra file Excel để sao lưu & chỉnh sửa
 */
export function exportCurrentDatabaseToExcel(state: DatabaseState) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Lớp
  const classHeaders = ['Mã lớp', 'Tên lớp', 'Khối', 'Sĩ số', 'Phòng học', 'Buổi học'];
  const classRows = state.classes.map(c => [
    c.code,
    c.name,
    c.gradeId.replace('grade_', ''),
    c.studentCount || 40,
    c.roomName || '',
    c.shift || 'morning'
  ]);
  const wsClass = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
  applySheetStyling(wsClass, [12, 16, 10, 10, 16, 25]);
  XLSX.utils.book_append_sheet(wb, wsClass, 'Lớp');

  // Sheet 2: Môn
  const subjectHeaders = ['Mã môn', 'Tên môn', 'Loại môn', 'Số tiết mặc định/tuần'];
  const subjectRows = state.subjects.map(s => [
    s.code,
    s.name,
    s.category || 'general',
    s.defaultPeriodsPerWeek || 2
  ]);
  const wsSubject = XLSX.utils.aoa_to_sheet([subjectHeaders, ...subjectRows]);
  applySheetStyling(wsSubject, [12, 24, 30, 20]);
  XLSX.utils.book_append_sheet(wb, wsSubject, 'Môn');

  // Sheet 3: Phân môn
  const compHeaders = ['Mã môn chính', 'Tên phân môn', 'Mã phân môn', 'Số tiết mặc định/tuần'];
  const compRows: any[][] = [];
  state.subjects.forEach(s => {
    if (s.hasComponents && s.components) {
      s.components.forEach(c => {
        compRows.push([s.code, c.name, c.code, c.defaultPeriodsPerWeek || 1]);
      });
    }
  });
  const wsComp = XLSX.utils.aoa_to_sheet([compHeaders, ...compRows]);
  applySheetStyling(wsComp, [16, 20, 16, 22]);
  XLSX.utils.book_append_sheet(wb, wsComp, 'Phân môn');

  // Sheet 4: Giáo viên
  const teacherHeaders = ['Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Môn chính (Mã môn)', 'Số tiết tối đa/tuần', 'Cho phép dạy trùng khối (co_the/khong)'];
  const teacherRows = state.teachers.map(t => {
    const mainSbj = state.subjects.find(s => s.id === t.mainSubjectId);
    return [
      t.code,
      t.fullName,
      t.department || '',
      mainSbj?.code || '',
      t.maxPeriodsPerWeek || 18,
      t.allowDoubleBooking ? 'co_the' : 'khong'
    ];
  });
  const wsTeacher = XLSX.utils.aoa_to_sheet([teacherHeaders, ...teacherRows]);
  applySheetStyling(wsTeacher, [12, 22, 24, 20, 20, 30]);
  XLSX.utils.book_append_sheet(wb, wsTeacher, 'Giáo viên');

  // Sheet 5: Phân công
  const asgHeaders = ['Mã Lớp', 'Mã Môn', 'Mã Phân môn (nếu có)', 'Mã GV phụ trách', 'Số tiết/tuần'];
  const asgRows = state.masterAssignments.map(a => {
    const cls = state.classes.find(c => c.id === a.classId);
    const sbj = state.subjects.find(s => s.id === a.subjectId);
    const comp = sbj?.components?.find(c => c.id === a.componentId);
    const tch = state.teachers.find(t => t.id === a.teacherId);
    return [
      cls?.code || '',
      sbj?.code || '',
      comp?.code || '',
      tch?.code || '',
      a.periodsPerWeek
    ];
  });
  const wsAsg = XLSX.utils.aoa_to_sheet([asgHeaders, ...asgRows]);
  applySheetStyling(wsAsg, [12, 12, 20, 18, 16]);
  XLSX.utils.book_append_sheet(wb, wsAsg, 'Phân công');

  XLSX.writeFile(wb, `CSDL_TKB_THCS_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Trình đọc và làm sạch dữ liệu từ file Excel tải lên
 */
export function importDataFromExcel(
  workbook: any,
  state: DatabaseState
): {
  success: boolean;
  message: string;
  stats: { classes: number; subjects: number; teachers: number; assignments: number };
  importedData?: {
    classes?: ClassRoom[];
    subjects?: Subject[];
    teachers?: Teacher[];
    masterAssignments?: MasterAssignment[];
  };
} {
  try {
    const sheetNames = workbook.SheetNames || [];
    const findSheet = (keywords: string[]) => {
      return sheetNames.find((name: string) => {
        const cleanName = name.trim().toLowerCase();
        return keywords.some(k => cleanName.includes(k.toLowerCase()));
      });
    };

    const sheetClass = findSheet(['Lớp', 'Lop', 'Classes']);
    const sheetSubject = findSheet(['Môn', 'Mon', 'Subjects']);
    const sheetComponent = findSheet(['Phân môn', 'Phan mon', 'Components']);
    const sheetTeacher = findSheet(['Giáo viên', 'Giao vien', 'GV', 'Teachers']);
    const sheetAssignment = findSheet(['Phân công', 'Phan cong', 'Assignments']);

    let parsedClasses: ClassRoom[] = [...state.classes];
    let parsedSubjects: Subject[] = [...state.subjects];
    let parsedTeachers: Teacher[] = [...state.teachers];
    let parsedAssignments: MasterAssignment[] = [];

    let countClasses = 0;
    let countSubjects = 0;
    let countTeachers = 0;
    let countAssignments = 0;

    // 1. Đọc sheet Lớp
    if (sheetClass) {
      const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetClass], { header: 1 });
      if (rows.length > 1) {
        const classList: ClassRoom[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const code = String(row[0]).trim();
          const name = row[1] ? String(row[1]).trim() : `Lớp ${code}`;
          const gradeNum = row[2] ? String(row[2]).trim() : code.replace(/\D/g, '').slice(0, 1) || '6';
          const gradeId = `grade_${gradeNum}`;
          const studentCount = parseInt(row[3], 10) || 40;
          const roomName = row[4] ? String(row[4]).trim() : `Phòng ${code}`;
          const shift = row[5] ? (String(row[5]).trim().toLowerCase() as any) : (parseInt(gradeNum, 10) >= 8 ? 'afternoon' : 'morning');

          const classId = `cls_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          classList.push({
            id: classId,
            code,
            name,
            gradeId,
            studentCount,
            roomName,
            shift: shift === 'afternoon' || shift === 'both' ? shift : 'morning',
            maxPeriodsPerDay: shift === 'both' ? 8 : 5,
            status: 'active'
          });
          countClasses++;
        }
        if (classList.length > 0) parsedClasses = classList;
      }
    }

    // 2. Đọc sheet Môn
    if (sheetSubject) {
      const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetSubject], { header: 1 });
      if (rows.length > 1) {
        const subjectList: Subject[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const code = String(row[0]).trim().toUpperCase();
          const name = row[1] ? String(row[1]).trim() : code;
          const category = row[2] ? (String(row[2]).trim().toLowerCase() as any) : 'general';
          const defaultPeriods = parseFloat(row[3]) || 2;

          const isKHTN = code === 'KHTN' || name.includes('Khoa học tự nhiên');
          const isKHXH = code === 'KHXH' || (name.includes('Lịch sử') && name.includes('Địa'));

          const subjectId = `sbj_${code.toLowerCase()}`;
          subjectList.push({
            id: subjectId,
            code,
            name,
            category: category === 'natural_science' || category === 'social_science' ? category : 'general',
            hasComponents: isKHTN || isKHXH,
            defaultPeriodsPerWeek: defaultPeriods,
            components: isKHTN
              ? [
                  { id: 'cmp_phy', subjectId, code: 'VAT_LI', name: 'Vật lí', defaultPeriodsPerWeek: 1 },
                  { id: 'cmp_chem', subjectId, code: 'HOA_HOC', name: 'Hóa học', defaultPeriodsPerWeek: 1 },
                  { id: 'cmp_bio', subjectId, code: 'SINH_HOC', name: 'Sinh học', defaultPeriodsPerWeek: 2 },
                ]
              : isKHXH
              ? [
                  { id: 'cmp_hist', subjectId, code: 'LICH_SU', name: 'Lịch sử', defaultPeriodsPerWeek: 1.5 },
                  { id: 'cmp_geo', subjectId, code: 'DIA_LI', name: 'Địa lí', defaultPeriodsPerWeek: 1.5 },
                ]
              : undefined
          });
          countSubjects++;
        }
        if (subjectList.length > 0) parsedSubjects = subjectList;
      }
    }

    // 3. Đọc sheet Phân môn bổ sung
    if (sheetComponent) {
      const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetComponent], { header: 1 });
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const mainCode = String(row[0]).trim().toUpperCase();
          const compName = row[1] ? String(row[1]).trim() : '';
          const compCode = row[2] ? String(row[2]).trim().toUpperCase() : compName;
          const compPeriods = parseFloat(row[3]) || 1;

          const sbj = parsedSubjects.find(s => s.code.toUpperCase() === mainCode);
          if (sbj) {
            sbj.hasComponents = true;
            if (!sbj.components) sbj.components = [];
            const compId = `cmp_${compCode.toLowerCase()}`;
            const existingComp = sbj.components.find(c => c.code === compCode || c.name === compName);
            if (!existingComp) {
              sbj.components.push({
                id: compId,
                subjectId: sbj.id,
                code: compCode,
                name: compName,
                defaultPeriodsPerWeek: compPeriods
              });
            }
          }
        }
      }
    }

    // 4. Đọc sheet Giáo viên
    if (sheetTeacher) {
      const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetTeacher], { header: 1 });
      if (rows.length > 1) {
        const teacherList: Teacher[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const code = String(row[0]).trim();
          const fullName = row[1] ? String(row[1]).trim() : `GV ${code}`;
          const department = row[2] ? String(row[2]).trim() : 'Tổ Bộ môn';
          const mainSubjectCode = row[3] ? String(row[3]).trim().toUpperCase() : '';
          const maxPeriods = parseInt(row[4], 10) || 18;
          const allowDouble = row[5] ? String(row[5]).trim().toLowerCase().includes('co') : false;

          const matchedSbj = parsedSubjects.find(s => s.code.toUpperCase() === mainSubjectCode || s.name.toLowerCase().includes(mainSubjectCode.toLowerCase()));
          const teacherId = `tch_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

          teacherList.push({
            id: teacherId,
            code,
            fullName,
            department,
            mainSubjectId: matchedSbj?.id || parsedSubjects[0]?.id || 'sbj_toan',
            qualifiedSubjectIds: matchedSbj ? [matchedSbj.id] : [],
            maxPeriodsPerWeek: maxPeriods,
            maxPeriodsPerDay: 5,
            maxSessionsPerDay: 2,
            maxDaysPerWeek: 5,
            allowDoubleBooking: allowDouble,
            status: 'active'
          });
          countTeachers++;
        }
        if (teacherList.length > 0) parsedTeachers = teacherList;
      }
    }

    // 5. Đọc sheet Phân công
    if (sheetAssignment) {
      const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetAssignment], { header: 1 });
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0] || !row[1]) continue;
          const classCode = String(row[0]).trim();
          const subjectCode = String(row[1]).trim().toUpperCase();
          const componentCode = row[2] ? String(row[2]).trim().toUpperCase() : '';
          const teacherCode = row[3] ? String(row[3]).trim() : '';
          const periods = parseFloat(row[4]) || 1;

          const cls = parsedClasses.find(c => c.code.toLowerCase() === classCode.toLowerCase() || c.name.toLowerCase().includes(classCode.toLowerCase()));
          const sbj = parsedSubjects.find(s => s.code.toUpperCase() === subjectCode || s.name.toLowerCase().includes(subjectCode.toLowerCase()));
          const tch = parsedTeachers.find(t => t.code.toLowerCase() === teacherCode.toLowerCase() || t.fullName.toLowerCase().includes(teacherCode.toLowerCase()));

          let compId: string | undefined = undefined;
          if (sbj && componentCode) {
            const comp = sbj.components?.find(c => c.code.toUpperCase() === componentCode || c.name.toLowerCase().includes(componentCode.toLowerCase()));
            if (comp) compId = comp.id;
          }

          if (cls && sbj) {
            parsedAssignments.push({
              id: `masg_${cls.id}_${sbj.id}_${compId || 'main'}`,
              academicYearId: state.academicYears[0]?.id || 'ay_2026_2027',
              classId: cls.id,
              subjectId: sbj.id,
              componentId: compId,
              teacherId: tch ? tch.id : '',
              periodsPerWeek: periods
            });
            countAssignments++;
          }
        }
      }
    }

    return {
      success: true,
      message: `Đã nhập và làm sạch thành công dữ liệu Excel! (${countClasses} lớp, ${countSubjects} môn học, ${countTeachers} giáo viên, ${countAssignments} phân công).`,
      stats: {
        classes: countClasses,
        subjects: countSubjects,
        teachers: countTeachers,
        assignments: countAssignments
      },
      importedData: {
        classes: parsedClasses,
        subjects: parsedSubjects,
        teachers: parsedTeachers,
        masterAssignments: parsedAssignments.length > 0 ? parsedAssignments : undefined
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi xử lý file Excel: ${error.message || 'Không thể phân tích dữ liệu'}`,
      stats: { classes: 0, subjects: 0, teachers: 0, assignments: 0 }
    };
  }
}

/**
 * Xuất Thời khóa biểu theo từng Sheet Lớp (Được định dạng đẹp mắt)
 */
export function exportTimetableToExcel(
  state: DatabaseState,
  weekId: string,
  entries: TimetableEntry[],
  title: string
) {
  const wb = XLSX.utils.book_new();
  const days = [
    { day: 2, name: 'Thứ 2' },
    { day: 3, name: 'Thứ 3' },
    { day: 4, name: 'Thứ 4' },
    { day: 5, name: 'Thứ 5' },
    { day: 6, name: 'Thứ 6' }
  ];
  const morningCount = state.timeSlotConfig?.morningPeriodsCount || 5;
  const afternoonCount = state.timeSlotConfig?.afternoonPeriodsCount || 4;

  const styleTitleBanner = {
    fill: { fgColor: { rgb: '1F497D' } },
    font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const styleTh = {
    fill: { fgColor: { rgb: '203764' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
      left: { style: 'thin', color: { rgb: 'FFFFFF' } },
      right: { style: 'thin', color: { rgb: 'FFFFFF' } }
    }
  };

  const styleSlot = {
    font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  state.classes.forEach(cls => {
    const wsData: any[][] = [];
    const merges: any[] = [];

    // Title row
    wsData.push([`THỜI KHÓA BIỂU ${cls.name.toUpperCase()} - ${state.weeks.find(w => w.id === weekId)?.name || weekId}`]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });

    // Header row
    wsData.push(['Buổi', 'Tiết', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']);

    // Morning rows
    for (let p = 1; p <= morningCount; p++) {
      const row: any[] = [p === 1 ? 'Sáng' : '', `Tiết ${p}`];
      days.forEach(d => {
        const entry = entries.find(e => e.classId === cls.id && e.dayOfWeek === d.day && e.period === p);
        if (entry) {
          const sbj = state.subjects.find(s => s.id === entry.subjectId);
          const comp = sbj?.components?.find(c => c.id === entry.componentId);
          const tch = state.teachers.find(t => t.id === entry.teacherId);
          const sbjName = comp ? comp.name : (sbj?.name || '');
          const tchName = tch ? ` (${tch.fullName.split(' ').pop()})` : '';
          row.push(`${sbjName}${tchName}`);
        } else {
          row.push('');
        }
      });
      wsData.push(row);
    }
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2 + morningCount - 1, c: 0 } });

    // Afternoon rows
    for (let p = 1; p <= afternoonCount; p++) {
      const absP = morningCount + p;
      const row: any[] = [p === 1 ? 'Chiều' : '', `Tiết ${p}`];
      days.forEach(d => {
        const entry = entries.find(e => e.classId === cls.id && e.dayOfWeek === d.day && e.period === absP);
        if (entry) {
          const sbj = state.subjects.find(s => s.id === entry.subjectId);
          const comp = sbj?.components?.find(c => c.id === entry.componentId);
          const tch = state.teachers.find(t => t.id === entry.teacherId);
          const sbjName = comp ? comp.name : (sbj?.name || '');
          const tchName = tch ? ` (${tch.fullName.split(' ').pop()})` : '';
          row.push(`${sbjName}${tchName}`);
        } else {
          row.push('');
        }
      });
      wsData.push(row);
    }
    merges.push({ s: { r: 2 + morningCount, c: 0 }, e: { r: 2 + morningCount + afternoonCount - 1, c: 0 } });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
        if (R === 0) ws[cellRef].s = styleTitleBanner;
        else if (R === 1) ws[cellRef].s = styleTh;
        else ws[cellRef].s = styleSlot;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, cls.code);
  });

  XLSX.writeFile(wb, `TKB_Tung_Lop_${weekId}.xlsx`);
}
