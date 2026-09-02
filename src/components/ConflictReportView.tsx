import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { store } from '../database/store';
import { validateTimetable } from '../scheduler/validator';
import { TabType } from './Sidebar';

interface ConflictReportViewProps {
  onNavigate: (tab: TabType) => void;
}

export const ConflictReportView: React.FC<ConflictReportViewProps> = ({ onNavigate }) => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const [syncMsg, setSyncMsg] = React.useState<string | null>(null);

  const handleSync = () => {
    const count = store.syncTimetableWithAssignments(currentWeek.id);
    setSyncMsg(`Đã đồng bộ thành công! Đã cập nhật giáo viên cho ${count} tiết trong TKB theo phân công giảng dạy.`);
    setTimeout(() => setSyncMsg(null), 4000);
  };

  const entries = version?.entries || [];
  const issues = validateTimetable(state, currentWeek.id, entries);

  const hardErrors = issues.filter(i => i.category === 'hard_constraint' || i.type === 'error');
  const softWarnings = issues.filter(i => i.category === 'soft_constraint' || i.type === 'warning');

  // Also calculate unscheduled assignments
  const weeklyAssignments = store.getWeeklyAssignments(currentWeek.id);
  const unassignedList: { classId: string; subjectId: string; missing: number }[] = [];

  weeklyAssignments.forEach(asg => {
    const scheduledCount = entries.filter(
      e => e.classId === asg.classId && e.subjectId === asg.subjectId && e.componentId === asg.componentId
    ).length;

    if (scheduledCount < asg.periodsPerWeek) {
      unassignedList.push({
        classId: asg.classId,
        subjectId: asg.subjectId,
        missing: asg.periodsPerWeek - scheduledCount
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">BÁO CÁO PHÂN TÍCH XUNG ĐỘT THỜI KHÓA BIỂU</h1>
          </div>
          <p className="text-xs text-slate-400">
            Phân tích chi tiết các nguyên nhân dẫn đến tiết chưa xếp hoặc vi phạm ràng buộc cho {currentWeek.name}.
          </p>
        </div>
        <button
          onClick={() => {
            const fixedTch = store.autoFixTeacherLimits(currentWeek.id);
            const res = store.scanAndFixTimetable(currentWeek.id);
            setSyncMsg(`✓ Đã tự động nâng hạn mức cho ${fixedTch} giáo viên quá tải và lấp đầy TKB! (${res.fixedCount} cập nhật)`);
            setTimeout(() => setSyncMsg(null), 5000);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
          title="Tự động nâng hạn mức tiết tối đa cho giáo viên và lấp đầy TKB"
        >
          <RefreshCw className="w-4 h-4" />
          <span>⚡ Tự động khắc phục lỗi quá tải & TKB trống</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Vi phạm Ràng buộc Cứng</span>
          <span className="text-2xl font-bold text-rose-400">{hardErrors.length} lỗi</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Tiết chưa thể xếp lịch</span>
          <span className="text-2xl font-bold text-amber-400">
            {unassignedList.reduce((sum, u) => sum + u.missing, 0)} tiết
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Cảnh báo Tối ưu Mềm</span>
          <span className="text-2xl font-bold text-indigo-400">{softWarnings.length} cảnh báo</span>
        </div>
      </div>

      {/* Unassigned breakdown table */}
      {unassignedList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            DANH SÁCH MÔN CÒN THIẾU TIẾT CHƯA XẾP VÀ NGUYÊN NHÂN
          </h2>

          <div className="space-y-3">
            {unassignedList.map((u, idx) => {
              const cls = state.classes.find(c => c.id === u.classId);
              const sbj = state.subjects.find(s => s.id === u.subjectId);

              return (
                <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Lớp {cls?.name} - Môn {sbj?.name}
                    </span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded font-bold">
                      Thiếu {u.missing} tiết
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Nguyên nhân dự đoán: Khung giờ trống của Giáo viên trùng với lịch học của môn chuyên dùng hoặc lịch xin nghỉ.
                  </p>
                  <div className="pt-1 flex items-center space-x-2 text-xs text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Gợi ý: Mở bớt 1 tiết xin nghỉ hoặc chuyển chiến lược xếp sang "Sâu (Deep Search)".</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hard & Soft Issues List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          CHI TIẾT VI PHẠM RÀNG BUỘC PHÁT HIỆN ĐƯỢC
        </h2>

        {issues.length === 0 ? (
          <div className="p-6 text-center text-emerald-400 text-xs font-semibold">
            ✓ Không có vi phạm ràng buộc nào! Thời khóa biểu hoàn hảo 100%.
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((iss, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  iss.type === 'error'
                    ? 'bg-rose-950/30 border-rose-900/40 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">[{iss.code}] {iss.message}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                    {iss.category}
                  </span>
                </div>
                {iss.recommendation && (
                  <p className="text-slate-400 text-[11px] pt-1">💡 Khuyến nghị: {iss.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {syncMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleSync}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>⚡ Đồng bộ Phân công & TKB (Xử lý lỗi lệch)</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('constraints')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-4 py-2.5 rounded-xl"
          >
            Điều chỉnh Ràng buộc & Ngày nghỉ
          </button>
          <button
            onClick={() => onNavigate('scheduler')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2"
          >
            <span>Chạy lại Solver</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
