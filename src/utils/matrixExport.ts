import XLSX from 'xlsx-js-style';
import { DatabaseState, TimetableEntry } from '../types';

function getSubjectShortName(subjectName: string, subjectCode: string, componentName?: string): string {
  if (componentName) {
    if (componentName.includes('Vật lí')) return 'Vật lí';
    if (componentName.includes('Hóa')) return 'Hóa';
    if (componentName.includes('Sinh')) return 'Sinh';
    if (componentName.includes('Sử')) return 'Sử';
    if (componentName.includes('Địa')) return 'Địa';
    return componentName;
  }
  const name = subjectName.trim();
  if (name.includes('Toán')) return 'Toán';
  if (name.includes('Văn')) return 'Văn';
  if (name.includes('Anh') || name.includes('Ngoại ngữ')) return 'TA';
  if (name.includes('Khoa học tự nhiên') || subjectCode === 'KHTN') return 'KHTN';
  if (name.includes('Lịch sử') && name.includes('Địa')) return 'KHXH';
  if (name.includes('Lịch sử')) return 'Sử';
  if (name.includes('Địa')) return 'Địa';
  if (name.includes('trải nghiệm') || name.includes('HĐTN')) return 'HĐTNHN';
  if (name.includes('địa phương') || name.includes('GDĐP')) return 'GDĐP';
  if (name.includes('thể chất') || name.includes('GDTC')) return 'GDTC';
  if (name.includes('công dân') || name.includes('GDCD')) return 'GDCD';
  if (name.includes('Công nghệ')) return 'CN';
  if (name.includes('Tin')) return 'Tin';
  if (name.includes('Âm nhạc')) return 'AN';
  if (name.includes('Mĩ thuật') || name.includes('Mỹ thuật')) return 'MT';
  return name.length > 8 ? subjectCode : name;
}

function getTeacherShortName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1]; // E.g. "Long", "Hương", "An", "Hoa"
}

export function exportMasterMatrixToExcel(
  state: DatabaseState,
  weekId: string,
  entries: TimetableEntry[]
) {
  const wb = XLSX.utils.book_new();

  const classes = state.classes;
  const days = [
    { dayOfWeek: 2, name: 'Thứ 2' },
    { dayOfWeek: 3, name: 'Thứ 3' },
    { dayOfWeek: 4, name: 'Thứ 4' },
    { dayOfWeek: 5, name: 'Thứ 5' },
    { dayOfWeek: 6, name: 'Thứ 6' }
  ];

  const morningPeriodsCount = state.timeSlotConfig?.morningPeriodsCount || 4;
  const afternoonPeriodsCount = state.timeSlotConfig?.afternoonPeriodsCount || 4;

  const totalCols = 2 + classes.length; // Col 0: Thứ, Col 1: Tiết, Col 2..N: Classes

  // Style Definitions
  const styleHeaderBanner = {
    fill: { fgColor: { rgb: '1F497D' } },
    font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '1F497D' } },
      bottom: { style: 'thin', color: { rgb: '1F497D' } },
      left: { style: 'thin', color: { rgb: '1F497D' } },
      right: { style: 'thin', color: { rgb: '1F497D' } }
    }
  };

  const styleTableHeader = {
    fill: { fgColor: { rgb: '1F497D' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
      left: { style: 'thin', color: { rgb: 'FFFFFF' } },
      right: { style: 'thin', color: { rgb: 'FFFFFF' } }
    }
  };

  const styleTableHeaderClass = {
    fill: { fgColor: { rgb: '1F497D' } },
    font: { name: 'Arial', sz: 10, bold: true, italic: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
      left: { style: 'thin', color: { rgb: 'FFFFFF' } },
      right: { style: 'thin', color: { rgb: 'FFFFFF' } }
    }
  };

  const styleDayCell = {
    fill: { fgColor: { rgb: 'FAFAFA' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  const stylePeriodCell = {
    fill: { fgColor: { rgb: 'FAFAFA' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  const styleDataCell = {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { name: 'Arial', sz: 9, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  const styleMeetingPeachCell = {
    fill: { fgColor: { rgb: 'FCE4D6' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '833C0C' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  const styleHsgGreenCell = {
    fill: { fgColor: { rgb: 'E2EFDA' } },
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '375623' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  };

  // Worksheet rows array
  const wsData: any[][] = [];
  const merges: any[] = [];
  let currentRow = 0;

  // --------------------------------------------------------------------------
  // SECTION I: MORNING
  // --------------------------------------------------------------------------

  // Row 0: Banner Section I
  const rowMorningBanner: any[] = [`I. THỜI KHÓA BIỂU BUỔI SÁNG (${morningPeriodsCount * 5} TIẾT / TUẦN - TỪ THỨ 2 ĐẾN THỨ 6)`];
  for (let c = 1; c < totalCols; c++) rowMorningBanner.push('');
  wsData.push(rowMorningBanner);
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalCols - 1 } });
  currentRow++;

  // Row 1: Header Row Morning
  const rowMorningHeader: any[] = ['Thứ', 'Tiết'];
  classes.forEach(cls => rowMorningHeader.push(cls.name));
  wsData.push(rowMorningHeader);
  currentRow++;

  // Morning Data Rows (Thứ 2 -> Thứ 6)
  days.forEach(d => {
    const dayStartRow = currentRow;

    for (let p = 1; p <= morningPeriodsCount; p++) {
      const row: any[] = [d.name, p];

      classes.forEach(cls => {
        const entry = entries.find(
          e => e.classId === cls.id && e.dayOfWeek === d.dayOfWeek && e.period === p
        );

        if (entry) {
          const sbj = state.subjects.find(s => s.id === entry.subjectId);
          const comp = sbj?.components?.find(c => c.id === entry.componentId);
          const tch = state.teachers.find(t => t.id === entry.teacherId);

          const sbjShort = getSubjectShortName(sbj?.name || '', sbj?.code || '', comp?.name);
          const tchShort = getTeacherShortName(tch?.fullName || '');

          const cellText = tchShort ? `${sbjShort}-${tchShort}` : sbjShort;
          row.push(cellText);
        } else {
          row.push('');
        }
      });

      wsData.push(row);
      currentRow++;
    }

    // Merge 'Thứ' cell for morning periods
    merges.push({ s: { r: dayStartRow, c: 0 }, e: { r: dayStartRow + morningPeriodsCount - 1, c: 0 } });
  });

  // Empty separator row
  wsData.push(Array(totalCols).fill(''));
  currentRow++;

  // --------------------------------------------------------------------------
  // SECTION II: AFTERNOON
  // --------------------------------------------------------------------------

  // Row Banner Section II
  const rowAfternoonBanner: any[] = ['II. THỜI KHÓA BIỂU BUỔI CHIỀU (TỪ THỨ 2 ĐẾN THỨ 6)'];
  for (let c = 1; c < totalCols; c++) rowAfternoonBanner.push('');
  wsData.push(rowAfternoonBanner);
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalCols - 1 } });
  currentRow++;

  // Header Row Afternoon
  const rowAfternoonHeader: any[] = ['Thứ', 'Tiết'];
  classes.forEach(cls => rowAfternoonHeader.push(cls.name));
  wsData.push(rowAfternoonHeader);
  currentRow++;

  // Afternoon Data Rows
  days.forEach(d => {
    const dayStartRow = currentRow;

    if (d.dayOfWeek === 2) {
      // Thứ 2 Afternoon: Special merged meeting block for Tiết 1, 2, 3
      for (let p = 1; p <= 3; p++) {
        const row: any[] = [
          d.name,
          p,
          p === 1 ? 'Họp chuyên môn / Hội đồng / Hoạt động Đoàn - Đội & hoạt động khác' : ''
        ];
        for (let c = 3; c < totalCols; c++) row.push('');
        wsData.push(row);
        currentRow++;
      }

      // Merge Thứ 2 column
      merges.push({ s: { r: dayStartRow, c: 0 }, e: { r: dayStartRow + 2, c: 0 } });
      // Merge meeting block across Tiết 1-3 & all class columns
      merges.push({ s: { r: dayStartRow, c: 2 }, e: { r: dayStartRow + 2, c: totalCols - 1 } });

    } else if (d.dayOfWeek === 3) {
      // Thứ 3 Afternoon: Special merged HSG block for Tiết 1, 2, 3
      for (let p = 1; p <= 3; p++) {
        const row: any[] = [
          d.name,
          p,
          p === 1 ? 'Bồi dưỡng và Ôn thi Học sinh giỏi (HSG)' : ''
        ];
        for (let c = 3; c < totalCols; c++) row.push('');
        wsData.push(row);
        currentRow++;
      }

      // Merge Thứ 3 column
      merges.push({ s: { r: dayStartRow, c: 0 }, e: { r: dayStartRow + 2, c: 0 } });
      // Merge HSG block across Tiết 1-3 & all class columns
      merges.push({ s: { r: dayStartRow, c: 2 }, e: { r: dayStartRow + 2, c: totalCols - 1 } });

    } else {
      // Thứ 4, 5, 6 Afternoon: Normal timetable entries
      for (let p = 1; p <= afternoonPeriodsCount; p++) {
        const absolutePeriod = morningPeriodsCount + p;
        const row: any[] = [d.name, p];

        classes.forEach(cls => {
          const entry = entries.find(
            e => e.classId === cls.id && e.dayOfWeek === d.dayOfWeek && e.period === absolutePeriod
          );

          if (entry) {
            const sbj = state.subjects.find(s => s.id === entry.subjectId);
            const comp = sbj?.components?.find(c => c.id === entry.componentId);
            const tch = state.teachers.find(t => t.id === entry.teacherId);

            const sbjShort = getSubjectShortName(sbj?.name || '', sbj?.code || '', comp?.name);
            const tchShort = getTeacherShortName(tch?.fullName || '');

            const cellText = tchShort ? `${sbjShort}-${tchShort}` : sbjShort;
            row.push(cellText);
          } else {
            row.push('');
          }
        });

        wsData.push(row);
        currentRow++;
      }

      // Merge 'Thứ' cell for afternoon periods
      merges.push({ s: { r: dayStartRow, c: 0 }, e: { r: dayStartRow + afternoonPeriodsCount - 1, c: 0 } });
    }
  });

  // Convert array of arrays to sheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = merges;

  // Set Column Widths
  const colWidths: any[] = [{ wch: 10 }, { wch: 6 }];
  classes.forEach(() => colWidths.push({ wch: 14 }));
  ws['!cols'] = colWidths;

  // Apply Cell Styling across sheet
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      const cell = ws[cellRef];

      // Determine styling rule based on row & col
      if (R === 0 || R === 2 + (morningPeriodsCount * 5) + 1) {
        // Banner rows
        cell.s = styleHeaderBanner;
      } else if (R === 1 || R === 2 + (morningPeriodsCount * 5) + 2) {
        // Table Header rows
        if (C >= 2) cell.s = styleTableHeaderClass;
        else cell.s = styleTableHeader;
      } else if (C === 0) {
        // Day Column
        cell.s = styleDayCell;
      } else if (C === 1) {
        // Period Column
        cell.s = stylePeriodCell;
      } else {
        // Data Cells
        // Check special afternoon rows
        const aftHeaderRow = 2 + (morningPeriodsCount * 5) + 2;
        if (R >= aftHeaderRow + 1 && R <= aftHeaderRow + 3) {
          // Monday afternoon meeting row
          cell.s = styleMeetingPeachCell;
        } else if (R >= aftHeaderRow + 4 && R <= aftHeaderRow + 6) {
          // Tuesday afternoon HSG row
          cell.s = styleHsgGreenCell;
        } else {
          cell.s = styleDataCell;
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'TKB_Tong_Hop');

  const fileName = `TKB_THCS_2018_Tong_Hop_${weekId}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
