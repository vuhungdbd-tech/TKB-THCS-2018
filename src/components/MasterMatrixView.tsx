import React from 'react';
import { FileSpreadsheet, Download, Printer, Layers, Calendar, Sparkles } from 'lucide-react';
import { store } from '../database/store';
import { exportMasterMatrixToExcel } from '../utils/matrixExport';

export const MasterMatrixView: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const entries = version?.entries || [];
  const classes = state.classes;

  const morningPeriodsCount = state.timeSlotConfig?.morningPeriodsCount || 4;
  const afternoonPeriodsCount = state.timeSlotConfig?.afternoonPeriodsCount || 4;

  const days = [
    { dayOfWeek: 2, name: 'Thứ 2' },
    { dayOfWeek: 3, name: 'Thứ 3' },
    { dayOfWeek: 4, name: 'Thứ 4' },
    { dayOfWeek: 5, name: 'Thứ 5' },
    { dayOfWeek: 6, name: 'Thứ 6' }
  ];

  const getSubjectShortName = (subjectName: string, subjectCode: string, componentName?: string): string => {
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
  };

  const getTeacherShortName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  const renderCellContent = (classId: string, dayOfWeek: number, period: number) => {
    const entry = entries.find(e => e.classId === classId && e.dayOfWeek === dayOfWeek && e.period === period);
    if (!entry) return null;

    const sbj = state.subjects.find(s => s.id === entry.subjectId);
    const comp = sbj?.components?.find(c => c.id === entry.componentId);
    const tch = state.teachers.find(t => t.id === entry.teacherId);

    const sbjShort = getSubjectShortName(sbj?.name || '', sbj?.code || '', comp?.name);
    const tchShort = getTeacherShortName(tch?.fullName || '');

    return (
      <span className="font-semibold text-slate-800 text-[11px] font-sans">
        {sbjShort}{tchShort ? `-${tchShort}` : ''}
      </span>
    );
  };

  const handleExportExcel = () => {
    exportMasterMatrixToExcel(state, currentWeek.id, entries);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              BẢNG TỔNG HỢP THỜI KHÓA BIỂU TOÀN TRƯỜNG (MẪU CHUẨN)
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-medium">
                GDPT 2018
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Hiển thị giao diện ma trận đồng bộ toàn trường theo đúng định dạng mẫu ({currentWeek.name}).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Mẫu Chuẩn (Giống Hình)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-2.5 rounded-xl transition font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>In TKB</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Container matching Excel visual */}
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-2xl text-slate-900">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-center text-xs border border-slate-400 font-sans">
            {/* -------------------------------------------------------------------------- */}
            {/* SECTION I: MORNING */}
            {/* -------------------------------------------------------------------------- */}
            <thead>
              {/* Row Banner Section I */}
              <tr>
                <th
                  colSpan={2 + classes.length}
                  className="bg-[#1F497D] text-white text-left text-xs font-bold px-4 py-2 border border-slate-400 tracking-wide uppercase"
                >
                  I. THỜI KHÓA BIỂU BUỔI SÁNG ({morningPeriodsCount * 5} TIẾT / TUẦN - TỪ THỨ 2 ĐẾN THỨ 6)
                </th>
              </tr>

              {/* Table Header Row */}
              <tr className="bg-[#1F497D] text-white font-bold text-xs border border-slate-400">
                <th className="p-2 border border-slate-400 w-16">Thứ</th>
                <th className="p-2 border border-slate-400 w-12">Tiết</th>
                {classes.map(cls => (
                  <th key={cls.id} className="p-2 border border-slate-400 min-w-[90px] italic">
                    {cls.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map(d => (
                <React.Fragment key={`morning_${d.dayOfWeek}`}>
                  {Array.from({ length: morningPeriodsCount }, (_, i) => i + 1).map(p => (
                    <tr key={`m_${d.dayOfWeek}_${p}`} className="hover:bg-sky-50 transition">
                      {p === 1 && (
                        <td
                          rowSpan={morningPeriodsCount}
                          className="font-bold bg-slate-100 border border-slate-400 text-slate-900 p-2 align-middle"
                        >
                          {d.name}
                        </td>
                      )}
                      <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">
                        {p}
                      </td>
                      {classes.map(cls => (
                        <td key={cls.id} className="border border-slate-300 p-2 text-center align-middle bg-white">
                          {renderCellContent(cls.id, d.dayOfWeek, p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Separator Empty Row */}
              <tr className="h-3 bg-slate-200 border-t-2 border-slate-400">
                <td colSpan={2 + classes.length}></td>
              </tr>

              {/* -------------------------------------------------------------------------- */}
              {/* SECTION II: AFTERNOON */}
              {/* -------------------------------------------------------------------------- */}

              {/* Row Banner Section II */}
              <tr>
                <th
                  colSpan={2 + classes.length}
                  className="bg-[#1F497D] text-white text-left text-xs font-bold px-4 py-2 border border-slate-400 tracking-wide uppercase"
                >
                  II. THỜI KHÓA BIỂU BUỔI CHIỀU (TỪ THỨ 2 ĐẾN THỨ 6)
                </th>
              </tr>

              {/* Table Header Row Afternoon */}
              <tr className="bg-[#1F497D] text-white font-bold text-xs border border-slate-400">
                <th className="p-2 border border-slate-400 w-16">Thứ</th>
                <th className="p-2 border border-slate-400 w-12">Tiết</th>
                {classes.map(cls => (
                  <th key={cls.id} className="p-2 border border-slate-400 min-w-[90px] italic">
                    {cls.name}
                  </th>
                ))}
              </tr>

              {days.map(d => {
                if (d.dayOfWeek === 2) {
                  // Monday Afternoon: Special Peach Block
                  return (
                    <React.Fragment key="aft_2">
                      <tr className="bg-[#FCE4D6] hover:bg-[#fbd3bc] transition">
                        <td rowSpan={3} className="font-bold bg-slate-100 border border-slate-400 text-slate-900 p-2 align-middle">
                          Thứ 2
                        </td>
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">1</td>
                        <td
                          rowSpan={3}
                          colSpan={classes.length}
                          className="font-bold text-[#833C0C] text-sm p-4 border border-slate-400 align-middle text-center"
                        >
                          Họp chuyên môn / Hội đồng / Hoạt động Đoàn - Đội & hoạt động khác
                        </td>
                      </tr>
                      <tr className="bg-[#FCE4D6]">
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">2</td>
                      </tr>
                      <tr className="bg-[#FCE4D6]">
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">3</td>
                      </tr>
                    </React.Fragment>
                  );
                }

                if (d.dayOfWeek === 3) {
                  // Tuesday Afternoon: Special Green HSG Block
                  return (
                    <React.Fragment key="aft_3">
                      <tr className="bg-[#E2EFDA] hover:bg-[#d0e7c2] transition">
                        <td rowSpan={3} className="font-bold bg-slate-100 border border-slate-400 text-slate-900 p-2 align-middle">
                          Thứ 3
                        </td>
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">1</td>
                        <td
                          rowSpan={3}
                          colSpan={classes.length}
                          className="font-bold text-[#375623] text-sm p-4 border border-slate-400 align-middle text-center"
                        >
                          Bồi dưỡng và Ôn thi Học sinh giỏi (HSG)
                        </td>
                      </tr>
                      <tr className="bg-[#E2EFDA]">
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">2</td>
                      </tr>
                      <tr className="bg-[#E2EFDA]">
                        <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">3</td>
                      </tr>
                    </React.Fragment>
                  );
                }

                // Wednesday, Thursday, Friday Afternoon
                return (
                  <React.Fragment key={`aft_${d.dayOfWeek}`}>
                    {Array.from({ length: afternoonPeriodsCount }, (_, i) => i + 1).map(p => {
                      const absolutePeriod = morningPeriodsCount + p;
                      return (
                        <tr key={`a_${d.dayOfWeek}_${p}`} className="hover:bg-sky-50 transition">
                          {p === 1 && (
                            <td
                              rowSpan={afternoonPeriodsCount}
                              className="font-bold bg-slate-100 border border-slate-400 text-slate-900 p-2 align-middle"
                            >
                              {d.name}
                            </td>
                          )}
                          <td className="font-bold border border-slate-400 text-slate-800 p-2 bg-slate-50">
                            {p}
                          </td>
                          {classes.map(cls => (
                            <td key={cls.id} className="border border-slate-300 p-2 text-center align-middle bg-white">
                              {renderCellContent(cls.id, d.dayOfWeek, absolutePeriod)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
