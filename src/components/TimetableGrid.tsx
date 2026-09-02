import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Check,
  Smartphone,
  Monitor,
  Users,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { store } from '../database/store';
import { TimetableEntry, ClassRoom, Teacher, Subject } from '../types';
import { exportTimetableToExcel } from '../utils/excel';
import { exportTimetableToPDF } from '../utils/pdf';
import { exportMasterMatrixToExcel } from '../utils/matrixExport';
import { MasterMatrixView } from './MasterMatrixView';
import { validateTimetable } from '../scheduler/validator';

export const TimetableGrid: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const [viewType, setViewType] = useState<'class' | 'teacher' | 'matrix' | 'mobile_day'>('class');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(state.teachers[0]?.id || '');
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(2); // Thứ 2

  // Drag & Drop / Interactive Selection State
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const entries = version?.entries || [];

  const days = [
    { dayOfWeek: 2, name: 'Thứ 2' },
    { dayOfWeek: 3, name: 'Thứ 3' },
    { dayOfWeek: 4, name: 'Thứ 4' },
    { dayOfWeek: 5, name: 'Thứ 5' },
    { dayOfWeek: 6, name: 'Thứ 6' }
  ];

  const morningPeriods = Array.from({ length: state.timeSlotConfig.morningPeriodsCount }, (_, i) => i + 1);
  const afternoonPeriods = Array.from({ length: state.timeSlotConfig.afternoonPeriodsCount }, (_, i) => i + 1 + state.timeSlotConfig.morningPeriodsCount);
  const allPeriods = [...morningPeriods, ...afternoonPeriods];

  const periods = sessionFilter === 'morning'
    ? morningPeriods
    : sessionFilter === 'afternoon'
    ? afternoonPeriods
    : allPeriods;

  // Helper find entry for class & slot
  const getEntryForClassSlot = (classId: string, day: number, period: number): TimetableEntry | undefined => {
    return entries.find(e => e.classId === classId && e.dayOfWeek === day && e.period === period);
  };

  // Helper find entries for teacher & slot
  const getEntriesForTeacherSlot = (teacherId: string, day: number, period: number): TimetableEntry[] => {
    return entries.filter(e => e.teacherId === teacherId && e.dayOfWeek === day && e.period === period);
  };

  // Toggle Lock Slot
  const handleToggleLock = (entry: TimetableEntry) => {
    const updated = entries.map(e => e.id === entry.id ? { ...e, isLocked: !e.isLocked } : e);
    if (version) {
      store.updateTimetableEntries(currentWeek.id, version.id, updated);
      store.addAuditLog('Khóa tiết TKB', `${!entry.isLocked ? 'Khóa' : 'Mở khóa'} tiết Lớp ${entry.classId} Thứ ${entry.dayOfWeek} Tiết ${entry.period}`);
    }
  };

  // Interactive Click to Move / Swap
  const handleSlotClick = (day: number, period: number) => {
    if (viewType !== 'class') return;

    if (!selectedSlot) {
      // First click: select source slot
      setSelectedSlot({ day, period });
      setValidationError(null);
    } else {
      // Second click: attempt swap / move from selectedSlot to (day, period)
      if (selectedSlot.day === day && selectedSlot.period === period) {
        setSelectedSlot(null);
        return;
      }

      const sourceEntry = getEntryForClassSlot(selectedClassId, selectedSlot.day, selectedSlot.period);
      const targetEntry = getEntryForClassSlot(selectedClassId, day, period);

      // Create proposed updated entries array
      let updatedEntries = [...entries];

      if (sourceEntry && targetEntry) {
        // Swap slots
        updatedEntries = updatedEntries.map(e => {
          if (e.id === sourceEntry.id) return { ...e, dayOfWeek: day, period };
          if (e.id === targetEntry.id) return { ...e, dayOfWeek: selectedSlot.day, period: selectedSlot.period };
          return e;
        });
      } else if (sourceEntry && !targetEntry) {
        // Move slot
        updatedEntries = updatedEntries.map(e => {
          if (e.id === sourceEntry.id) return { ...e, dayOfWeek: day, period };
          return e;
        });
      }

      // Run instant validation check
      const issues = validateTimetable(state, currentWeek.id, updatedEntries);
      const hardErrors = issues.filter(i => i.category === 'hard_constraint' || i.type === 'error');

      if (hardErrors.length > 0) {
        // INVALID MOVE: block and display explicit reason
        const reason = hardErrors[0].message;
        setValidationError(`❌ Không thể di chuyển: ${reason}`);
        setSelectedSlot(null);
      } else {
        // VALID MOVE: apply swap
        if (version) {
          store.updateTimetableEntries(currentWeek.id, version.id, updatedEntries);
          store.addAuditLog('Chỉnh sửa TKB', `Đã chuyển tiết Lớp ${selectedClassId} sang Thứ ${day} Tiết ${period}`);
        }
        setSuccessMsg(`✓ Di chuyển tiết thành công!`);
        setTimeout(() => setSuccessMsg(null), 3000);
        setSelectedSlot(null);
        setValidationError(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">THỜI KHÓA BIỂU TOÀN TRƯỜNG ({currentWeek.name})</h1>
          <p className="text-xs text-slate-400">Xem theo Lớp, Giáo viên, Toàn trường hoặc Chế độ Điện thoại (Xem theo ngày).</p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const res = store.scanAndFixTimetable(currentWeek.id);
              setSuccessMsg(`✓ Đã lấp đầy toàn bộ TKB trống! (${res.fixedCount} cập nhật)`);
              setTimeout(() => setSuccessMsg(null), 4000);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
            title="Tự động lấp đầy các tiết trống cho toàn bộ các lớp"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>⚡ Khắc phục TKB trống</span>
          </button>
          <button
            onClick={() => exportMasterMatrixToExcel(state, currentWeek.id, entries)}
            className="flex items-center space-x-1.5 bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Mẫu Chuẩn (Giống Hình)</span>
          </button>
          <button
            onClick={() => exportTimetableToExcel(state, currentWeek.id, entries, 'TKB')}
            className="flex items-center space-x-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-lg transition font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel theo lớp</span>
          </button>
          <button
            onClick={() => exportTimetableToPDF(state, currentWeek.id, entries, viewType === 'class' ? 'class' : 'school', selectedClassId)}
            className="flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs px-3 py-1.5 rounded-lg transition font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xuất PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg transition font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In TKB</span>
          </button>
        </div>
      </div>

      {/* Toast Messages */}
      {validationError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => { setViewType('matrix'); setSelectedSlot(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewType === 'matrix' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ma Trận Chuẩn (Giống Hình)</span>
          </button>
          <button
            onClick={() => { setViewType('class'); setSelectedSlot(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewType === 'class' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Theo Lớp</span>
          </button>
          <button
            onClick={() => { setViewType('teacher'); setSelectedSlot(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewType === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Theo Giáo viên</span>
          </button>
          <button
            onClick={() => { setViewType('mobile_day'); setSelectedSlot(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewType === 'mobile_day' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Xem theo ngày (Mobile)</span>
          </button>
        </div>

        {/* Select Target Filter & Session Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Session Filter */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sessionFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cả Ngày
            </button>
            <button
              onClick={() => setSessionFilter('morning')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sessionFilter === 'morning' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌅 Sáng ({morningPeriods.length} tiết)
            </button>
            <button
              onClick={() => setSessionFilter('afternoon')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sessionFilter === 'afternoon' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ob Chiều ({afternoonPeriods.length} tiết)
            </button>
          </div>

          {viewType === 'class' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Chọn lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSlot(null); }}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5"
              >
                {state.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewType === 'teacher' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Chọn giáo viên:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5"
              >
                {state.teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.code} - {t.department})</option>
                ))}
              </select>
            </div>
          )}

          {viewType === 'mobile_day' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Chọn Thứ:</span>
              <select
                value={selectedMobileDay}
                onChange={(e) => setSelectedMobileDay(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5"
              >
                <option value={2}>Thứ 2</option>
                <option value={3}>Thứ 3</option>
                <option value={4}>Thứ 4</option>
                <option value={5}>Thứ 5</option>
                <option value={6}>Thứ 6</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* MATRIX VIEW */}
      {viewType === 'matrix' && <MasterMatrixView />}

      {/* Main Timetable Table View (CLASS VIEW) */}
      {viewType === 'class' && (() => {
        const currentCls = state.classes.find(c => c.id === selectedClassId);
        const clsShift = currentCls?.shift || 'morning';

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                  BẢNG THỜI KHÓA BIỂU - {currentCls?.name}
                </h2>
                {clsShift === 'morning' && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    🌅 Ca Sáng (Tiết 1-{state.timeSlotConfig.morningPeriodsCount})
                  </span>
                )}
                {clsShift === 'afternoon' && (
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    ob Ca Chiều (Tiết 1-{state.timeSlotConfig.afternoonPeriodsCount})
                  </span>
                )}
                {clsShift === 'both' && (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    ☀️🌙 Học Cả 2 Buổi
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                💡 Bấm vào một ô để chọn, sau đó bấm ô mục tiêu để <span className="text-indigo-400 font-bold">kéo-thả/chuyển tiết</span>.
              </span>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold text-[11px] uppercase">
                  <th className="p-3 w-16 border-r border-slate-800">Buổi</th>
                  <th className="p-3 w-16 border-r border-slate-800">Tiết</th>
                  {days.map(d => (
                    <th key={d.dayOfWeek} className="p-3 border-r border-slate-800 text-center">
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {periods.map(p => {
                  const isMorning = p <= state.timeSlotConfig.morningPeriodsCount;
                  const periodInSession = isMorning ? p : p - state.timeSlotConfig.morningPeriodsCount;

                  return (
                    <tr key={p} className="hover:bg-slate-850/50">
                      {p === 1 && (
                        <td rowSpan={state.timeSlotConfig.morningPeriodsCount} className="p-3 font-bold text-center bg-slate-950/40 border-r border-slate-800 text-indigo-300">
                          SÁNG
                        </td>
                      )}
                      {p === state.timeSlotConfig.morningPeriodsCount + 1 && (
                        <td rowSpan={state.timeSlotConfig.afternoonPeriodsCount} className="p-3 font-bold text-center bg-slate-950/40 border-r border-slate-800 text-purple-300">
                          CHIỀU
                        </td>
                      )}
                      <td className="p-3 font-mono font-bold text-center border-r border-slate-800 text-slate-400">
                        Tiết {periodInSession}
                      </td>

                      {days.map(d => {
                        const entry = getEntryForClassSlot(selectedClassId, d.dayOfWeek, p);
                        const isSelected = selectedSlot?.day === d.dayOfWeek && selectedSlot?.period === p;

                        const sbj = state.subjects.find(s => s.id === entry?.subjectId);
                        const comp = sbj?.components?.find(c => c.id === entry?.componentId);
                        const tch = state.teachers.find(t => t.id === entry?.teacherId);

                        return (
                          <td
                            key={d.dayOfWeek}
                            onClick={() => handleSlotClick(d.dayOfWeek, p)}
                            className={`p-2.5 border-r border-slate-800 transition cursor-pointer relative min-h-[64px] ${
                              isSelected
                                ? 'bg-indigo-600/30 border-2 border-indigo-500 shadow-inner'
                                : entry
                                ? 'hover:bg-slate-800/80 bg-slate-900/60'
                                : 'hover:bg-slate-800/40 bg-slate-950/20'
                            }`}
                          >
                            {entry ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">
                                    {comp ? comp.name : sbj?.name}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleLock(entry); }}
                                    className="p-1 hover:text-white transition"
                                    title={entry.isLocked ? "Đã khóa tiết 🔒" : "Khóa tiết này"}
                                  >
                                    {entry.isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                                    ) : (
                                      <Unlock className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span>{tch?.fullName}</span>
                                  <span className="font-mono text-[10px] text-indigo-400">{tch?.code}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 italic block text-center py-2">---</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    })()}

      {/* TEACHER VIEW */}
      {viewType === 'teacher' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase">
              LỊCH DẠY GIÁO VIÊN - {state.teachers.find(t => t.id === selectedTeacherId)?.fullName}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold text-[11px] uppercase">
                  <th className="p-3 w-16 border-r border-slate-800">Tiết</th>
                  {days.map(d => (
                    <th key={d.dayOfWeek} className="p-3 border-r border-slate-800 text-center">{d.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {periods.map(p => (
                  <tr key={p} className="hover:bg-slate-850">
                    <td className="p-3 font-mono font-bold text-center border-r border-slate-800 text-slate-400">
                      Tiết {p}
                    </td>
                    {days.map(d => {
                      const tEntries = getEntriesForTeacherSlot(selectedTeacherId, d.dayOfWeek, p);
                      return (
                        <td key={d.dayOfWeek} className="p-3 border-r border-slate-800">
                          {tEntries.length > 0 ? (
                            tEntries.map(e => {
                              const cls = state.classes.find(c => c.id === e.classId);
                              const sbj = state.subjects.find(s => s.id === e.subjectId);
                              return (
                                <div key={e.id} className="bg-slate-950 p-2 rounded border border-slate-800">
                                  <span className="font-bold text-indigo-300 block">{cls?.name}</span>
                                  <span className="text-[11px] text-slate-400">{sbj?.name}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-slate-600 italic">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOBILE DAY VIEW */}
      {viewType === 'mobile_day' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase">
            XEM THEO NGÀY (THỨ {selectedMobileDay}) - TOÀN BỘ CÁC LỚP
          </h2>

          <div className="space-y-3">
            {state.classes.map(cls => (
              <div key={cls.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-base font-bold text-white block border-b border-slate-800 pb-2">{cls.name}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {periods.map(p => {
                    const entry = getEntryForClassSlot(cls.id, selectedMobileDay, p);
                    const sbj = state.subjects.find(s => s.id === entry?.subjectId);
                    const tch = state.teachers.find(t => t.id === entry?.teacherId);

                    return (
                      <div key={p} className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-500 block">Tiết {p}</span>
                        {entry ? (
                          <>
                            <span className="font-bold text-indigo-300 block">{sbj?.name}</span>
                            <span className="text-[11px] text-slate-400">{tch?.fullName}</span>
                          </>
                        ) : (
                          <span className="text-slate-600 italic">Trống</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
