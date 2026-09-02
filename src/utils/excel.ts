import * as XLSX from 'xlsx';
import { DatabaseState, TimetableEntry } from '../types';

export function generateSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Lớp
  const classData = [
    ['Mã lớp', 'Tên lớp', 'Khối', 'Sĩ số', 'Phòng học'],
    ['6A1', 'Lớp 6A1', '6', 38, 'Phòng 101'],
    ['6A2', 'Lớp 6A2', '6', 37, 'Phòng 102'],
    ['7B1', 'Lớp 7B1', '7', 40, 'Phòng 201'],
    ['8C1', 'Lớp 8C1', '8', 41, 'Phòng 301'],
  ];
  const wsClass = XLSX.utils.aoa_to_sheet(classData);
  XLSX.utils.book_append_sheet(wb, wsClass, 'Lớp');

  // Sheet 2: Môn học
  const subjectData = [
    ['Mã môn', 'Tên môn', 'Loại', 'Số tiết mặc định/tuần'],
    ['TOAN', 'Toán', 'Tự nhiên', 4],
    ['VAN', 'Ngữ văn', 'Xã hội', 4],
    ['ENG', 'Tiếng Anh', 'Chung', 3],
    ['KHTN', 'Khoa học tự nhiên', 'Tự nhiên', 4],
    ['KHXH', 'Lịch sử và Địa lí', 'Xã hội', 3],
  ];
  const wsSubject = XLSX.utils.aoa_to_sheet(subjectData);
  XLSX.utils.book_append_sheet(wb, wsSubject, 'Môn');

  // Sheet 3: Phân môn KHTN & KHXH
  const componentData = [
    ['Mã môn chính', 'Tên phân môn', 'Mã phân môn', 'Số tiết/tuần'],
    ['KHTN', 'Vật lí', 'VAT_LI', 1],
    ['KHTN', 'Hóa học', 'HOA_HOC', 1],
    ['KHTN', 'Sinh học', 'SINH_HOC', 2],
    ['KHXH', 'Lịch sử', 'LICH_SU', 1.5],
    ['KHXH', 'Địa lí', 'DIA_LI', 1.5],
  ];
  const wsComponent = XLSX.utils.aoa_to_sheet(componentData);
  XLSX.utils.book_append_sheet(wb, wsComponent, 'Phân môn');

  // Sheet 4: Giáo viên
  const teacherData = [
    ['Mã GV', 'Họ tên', 'Tổ chuyên môn', 'Môn chính', 'Số tiết max/tuần'],
    ['GV01', 'Nguyễn Văn A', 'Tổ Toán - Tin', 'Toán', 20],
    ['GV02', 'Lê Văn Bình', 'Tổ Ngữ văn', 'Ngữ văn', 20],
    ['GV03', 'Hoàng Minh Dung', 'Tổ Ngoại ngữ', 'Tiếng Anh', 18],
    ['GV04', 'Đỗ Đức Hùng', 'Tổ KHTN', 'Vật lí', 16],
  ];
  const wsTeacher = XLSX.utils.aoa_to_sheet(teacherData);
  XLSX.utils.book_append_sheet(wb, wsTeacher, 'Giáo viên');

  // Sheet 5: Phân công
  const assignmentData = [
    ['Mã Lớp', 'Mã Môn', 'Mã Phân môn', 'Mã GV', 'Số tiết/tuần'],
    ['6A1', 'TOAN', '', 'GV01', 4],
    ['6A1', 'VAN', '', 'GV02', 4],
    ['6A1', 'KHTN', 'VAT_LI', 'GV04', 1],
  ];
  const wsAssignment = XLSX.utils.aoa_to_sheet(assignmentData);
  XLSX.utils.book_append_sheet(wb, wsAssignment, 'Phân công');

  XLSX.writeFile(wb, 'Mau_Nhap_Du_Lieu_TKB_THCS_2018.xlsx');
}

export function exportTimetableToExcel(
  state: DatabaseState,
  weekId: string,
  entries: TimetableEntry[],
  title: string
) {
  const wb = XLSX.utils.book_new();

  const days = [2, 3, 4, 5, 6]; // Thu 2 -> Thu 6
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  state.classes.forEach(cls => {
    const tableData: any[][] = [];
    tableData.push([`THỜI KHÓA BIỂU LỚP ${cls.name.toUpperCase()} - ${state.weeks.find(w => w.id === weekId)?.name || weekId}`]);
    tableData.push(['Buổi', 'Tiết', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']);

    periods.forEach(p => {
      const sessionLabel = p <= 4 ? 'Sáng' : 'Chiều';
      const periodInSession = p <= 4 ? p : p - 4;
      const row: any[] = [sessionLabel, `Tiết ${periodInSession}`];

      days.forEach(d => {
        const entry = entries.find(e => e.classId === cls.id && e.dayOfWeek === d && e.period === p);
        if (entry) {
          const sbj = state.subjects.find(s => s.id === entry.subjectId);
          const comp = sbj?.components?.find(c => c.id === entry.componentId);
          const tch = state.teachers.find(t => t.id === entry.teacherId);
          const name = comp ? `${sbj?.code} (${comp.name})` : (sbj?.name || '');
          const lockMark = entry.isLocked ? ' 🔒' : '';
          row.push(`${name}\n(${tch?.fullName || ''})${lockMark}`);
        } else {
          row.push('---');
        }
      });

      tableData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, cls.code);
  });

  XLSX.writeFile(wb, `TKB_THCS_2018_${weekId}_Export.xlsx`);
}
