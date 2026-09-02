import { jsPDF } from 'jspdf';
import { DatabaseState, TimetableEntry } from '../types';

export function exportTimetableToPDF(
  state: DatabaseState,
  weekId: string,
  entries: TimetableEntry[],
  viewType: 'class' | 'teacher' | 'school',
  targetId?: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const week = state.weeks.find(w => w.id === weekId);

  doc.setFontSize(16);
  doc.text('THỜI KHÓA BIỂU TRƯỜNG THCS - CHƯƠNG TRÌNH GDPT 2018', 14, 15);
  doc.setFontSize(11);
  doc.text(`${week?.name || 'Tuần học'} - Năm học 2026-2027`, 14, 22);

  let y = 30;

  if (viewType === 'class') {
    const classesToExport = targetId ? state.classes.filter(c => c.id === targetId) : state.classes;

    classesToExport.forEach((cls, idx) => {
      if (idx > 0) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(13);
      doc.text(`THỜI KHÓA BIỂU LỚP ${cls.name}`, 14, y);
      y += 8;

      // Draw table header
      const cols = ['Buổi', 'Tiết', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
      const colWidths = [20, 18, 48, 48, 48, 48, 48];
      let startX = 14;

      doc.setFontSize(10);
      cols.forEach((col, cIdx) => {
        doc.rect(startX, y, colWidths[cIdx], 8);
        doc.text(col, startX + 2, y + 5.5);
        startX += colWidths[cIdx];
      });

      y += 8;

      for (let p = 1; p <= 8; p++) {
        startX = 14;
        const sessionLabel = p <= 4 ? 'Sáng' : 'Chiều';
        const periodLabel = `Tiết ${p <= 4 ? p : p - 4}`;

        const rowValues = [sessionLabel, periodLabel];

        [2, 3, 4, 5, 6].forEach(d => {
          const entry = entries.find(e => e.classId === cls.id && e.dayOfWeek === d && e.period === p);
          if (entry) {
            const sbj = state.subjects.find(s => s.id === entry.subjectId);
            const comp = sbj?.components?.find(c => c.id === entry.componentId);
            const tch = state.teachers.find(t => t.id === entry.teacherId);
            const title = comp ? `${comp.name}` : (sbj?.name || '');
            rowValues.push(`${title} (${tch?.code || ''})`);
          } else {
            rowValues.push('---');
          }
        });

        rowValues.forEach((val, cIdx) => {
          doc.rect(startX, y, colWidths[cIdx], 10);
          doc.text(val.substring(0, 22), startX + 2, y + 6.5);
          startX += colWidths[cIdx];
        });

        y += 10;
      }
    });
  } else {
    doc.setFontSize(12);
    doc.text(`Thời khóa biểu dạng bảng tổng hợp`, 14, 35);
  }

  doc.save(`Timetable_${viewType}_${weekId}.pdf`);
}
