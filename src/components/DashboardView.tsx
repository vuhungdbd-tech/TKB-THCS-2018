import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Calendar,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { store } from '../database/store';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
  onRunQuickSolve: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onRunQuickSolve
}) => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const totalClasses = state.classes.length;
  const totalTeachers = state.teachers.length;
  const totalSubjects = state.subjects.length;

  const weeklyAssignments = store.getWeeklyAssignments(currentWeek.id);
  const totalRequiredPeriods = weeklyAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);

  const scheduledPeriods = version?.score.scheduledPeriods || 0;
  const unscheduledPeriods = Math.max(0, totalRequiredPeriods - scheduledPeriods);
  const completionRate = version?.score.completionRate || 0;
  const hardViolations = version?.score.hardViolations || 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-900/40 via-purple-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chương trình GDPT 2018 - THCS & TH-THCS</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              TKB THCS 2018 – HỆ THỐNG XÂY DỰNG VÀ XẾP THỜI KHÓA BIỂU
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Hệ thống sử dụng thuật toán tối ưu ràng buộc CP-SAT kết hợp Trợ lý AI, hỗ trợ đặc biệt cho môn KHTN (Lý-Hóa-Sinh) & KHXH (Sử-Địa) theo tuần học.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunQuickSolve}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>XẾP TKB TỰ ĐỘNG</span>
            </button>
            <button
              onClick={() => onNavigate('timetable')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2.5 rounded-xl transition text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Xem Thời khóa biểu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Lớp học */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TỔNG SỐ LỚP HỌC</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{totalClasses}</span>
            <span className="text-xs text-slate-400">lớp (Khối 6, 7, 8, 9)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
            <span>Mã: 6A1..9D2</span>
            <button onClick={() => onNavigate('categories')} className="text-indigo-400 hover:underline">Chi tiết &rarr;</button>
          </div>
        </div>

        {/* Metric 2: Giáo viên */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TỔNG SỐ GIÁO VIÊN</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{totalTeachers}</span>
            <span className="text-xs text-slate-400">giáo viên bộ môn</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
            <span>Tổ KHTN, KHXH, Toán...</span>
            <button onClick={() => onNavigate('categories')} className="text-indigo-400 hover:underline">Chi tiết &rarr;</button>
          </div>
        </div>

        {/* Metric 3: Số tiết phân công */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TỔNG TIẾT PHÂN CÔNG</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{totalRequiredPeriods}</span>
            <span className="text-xs text-slate-400">tiết/{currentWeek.name}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
            <span>Bao gồm KHTN & KHXH</span>
            <button onClick={() => onNavigate('assignments')} className="text-indigo-400 hover:underline">Xem PC &rarr;</button>
          </div>
        </div>

        {/* Metric 4: Tỉ lệ đã xếp */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TIẾN ĐỘ XẾP TKB</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${completionRate === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{completionRate}%</span>
            <span className="text-xs text-slate-400">({scheduledPeriods}/{totalRequiredPeriods})</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
            {unscheduledPeriods > 0 ? (
              <span className="text-amber-400">⚠ Còn {unscheduledPeriods} tiết chưa xếp</span>
            ) : (
              <span className="text-emerald-400">✓ Đã xếp đủ 100% tiết</span>
            )}
            <button onClick={() => onNavigate('scheduler')} className="text-indigo-400 hover:underline">Tối ưu &rarr;</button>
          </div>
        </div>
      </div>

      {/* Detail Timetable Card sample UI format */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">TRẠNG THÁI TKB - TUẦN HIỆN TẠI ({currentWeek.name})</h2>
              <p className="text-xs text-slate-400">Năm học 2026-2027 • Áp dụng Phân công gốc & Ràng buộc riêng của tuần</p>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-mono border border-slate-700">
              {version?.name || 'Chưa xếp'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Số tiết đã xếp</span>
              </div>
              <p className="text-2xl font-bold text-white">{scheduledPeriods} tiết</p>
              <p className="text-xs text-slate-400 mt-1">Đã kiểm tra 0 trùng GV/lớp</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Số tiết chưa xếp</span>
              </div>
              <p className="text-2xl font-bold text-white">{unscheduledPeriods} tiết</p>
              <p className="text-xs text-slate-400 mt-1">Cần điều chỉnh ràng buộc</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-2 text-rose-400 text-sm font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Số lỗi xung đột</span>
              </div>
              <p className="text-2xl font-bold text-white">{hardViolations} lỗi</p>
              <p className="text-xs text-slate-400 mt-1">Ràng buộc cứng vi phạm</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('conflicts')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-lg border border-slate-700 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Phân tích nguyên nhân xung đột</span>
            </button>
            <button
              onClick={() => onNavigate('copy_week')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-lg border border-slate-700 transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sao chép sang Tuần tiếp theo</span>
            </button>
          </div>
        </div>

        {/* Right Col: Quick Feature Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mô đun GDPT 2018 Nổi bật</h3>

            <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Môn KHTN (Lý - Hóa - Sinh)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Phân môn riêng</span>
              </div>
              <p className="text-xs text-slate-400">
                Lớp 8C1: 4 tiết/tuần (Vật lí = 2, Hóa = 1, Sinh = 1). Mỗi phân môn có giáo viên riêng.
              </p>
            </div>

            <div className="p-3.5 bg-purple-950/40 border border-purple-900/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">Môn KHXH (Sử - Địa)</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Tự chọn & Bắt buộc</span>
              </div>
              <p className="text-xs text-slate-400">
                Lớp 7B1: Lịch sử = 1.5 tiết, Địa lí = 1.5 tiết. Đảm bảo đúng số tiết từng phân môn.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('timetable')}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl shadow-lg transition text-xs"
            >
              <span>Vào trang Thời khóa biểu toàn trường</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
