import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, AlertTriangle, ShieldCheck, Zap, ArrowRight, Loader2, Sparkles, RefreshCw, Database, Cloud } from 'lucide-react';
import { store } from '../database/store';
import { solveTimetable } from '../scheduler/solver';
import { runPreCheck } from '../scheduler/precheck';
import { SolverResult, PreCheckResult } from '../types';
import { TabType } from './Sidebar';

interface SchedulerViewProps {
  onNavigate: (tab: TabType) => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ onNavigate }) => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();

  const [strategy, setStrategy] = useState<'fast' | 'balanced' | 'deep'>('balanced');
  const [optimizeGradeStaggering, setOptimizeGradeStaggering] = useState(true);
  const [allowSameGradeParallel, setAllowSameGradeParallel] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  const [preCheckResult, setPreCheckResult] = useState<PreCheckResult | null>(() => runPreCheck(state, currentWeek.id));
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);

  const [scanResult, setScanResult] = useState<{ fixedCount: number; messages: string[] } | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);

  const handleRunPreCheck = () => {
    const res = runPreCheck(store.getState(), currentWeek.id);
    setPreCheckResult(res);
  };

  const handleScanAndFix = () => {
    const res = store.scanAndFixTimetable(currentWeek.id);
    setScanResult(res);
    setPreCheckResult(runPreCheck(store.getState(), currentWeek.id));
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseMessage(null);
    try {
      const res = await store.pushToSupabase();
      setSupabaseMessage(res.message);
    } catch (e: any) {
      setSupabaseMessage(`Lỗi đồng bộ Supabase: ${e.message || e}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleExecuteSolver = async () => {
    setIsSolving(true);
    setSolverResult(null);

    // Short timeout to let UI update state
    setTimeout(() => {
      const maxIter = strategy === 'fast' ? 1000 : strategy === 'balanced' ? 5000 : 15000;
      const res = solveTimetable(state, currentWeek.id, {
        strategy,
        maxIterations: maxIter,
        optimizeGradeStaggering,
        allowSameGradeParallel
      });

      if (res.version) {
        store.saveTimetableVersion(currentWeek.id, res.version);
      }

      setSolverResult(res);
      setIsSolving(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">XẾP THỜI KHÓA BIỂU TỰ ĐỘNG (CP-SAT SOLVER)</h1>
          <p className="text-xs text-slate-400">Bộ máy tối ưu hóa thời khóa biểu THCS cho {currentWeek.name} - Năm học 2026-2027.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleScanAndFix}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>🔍 Quét toàn bộ & Khắc phục lỗi TKB</span>
          </button>

          <button
            onClick={handleSyncSupabase}
            disabled={isSyncingSupabase}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Database className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
            <span>{isSyncingSupabase ? 'Đang đồng bộ...' : '⚡ Đồng bộ lên Supabase'}</span>
          </button>

          <button
            onClick={handleRunPreCheck}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2.5 rounded-xl text-xs transition"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Pre-Check</span>
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs space-y-1">
          <div className="font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>KẾT QUẢ QUÉT & KHẮC PHỤC LỖI (Đã xử lý {scanResult.fixedCount} điểm)</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
            {scanResult.messages.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {supabaseMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>{supabaseMessage}</span>
        </div>
      )}

      {/* Step 1: Precheck Diagnostics Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">BUỚC 1: PRE-CHECK DU LIỆU ĐẦU VÀO</h2>
          </div>
          {preCheckResult && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              preCheckResult.isValid
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {preCheckResult.isValid ? '✓ Dữ liệu hợp lệ để xếp' : '⚠ Có cảnh báo dữ liệu'}
            </span>
          )}
        </div>

        {preCheckResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Tổng số tiết cần xếp:</span>
              <span className="text-lg font-bold text-white">{preCheckResult.totalRequiredPeriods} tiết</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Số lớp / Số GV:</span>
              <span className="text-lg font-bold text-white">{preCheckResult.summary.totalClasses} lớp / {preCheckResult.summary.totalTeachers} GV</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Hạn mức khung trống GV:</span>
              <span className="text-lg font-bold text-indigo-400">{preCheckResult.totalAvailableTeacherSlots} slots</span>
            </div>
          </div>
        )}

        {preCheckResult?.issues && preCheckResult.issues.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-300">CÁC CẢNH BÁO PRE-CHECK:</h3>
            <div className="space-y-2">
              {preCheckResult.issues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>[{issue.code}] {issue.message}</span>
                  </div>
                  {issue.recommendation && (
                    <p className="text-slate-400 pl-6 text-[11px]">👉 Gợi ý xử lý: {issue.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Solver Configuration & Execution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">BƯỚC 2: CHỌN CHIẾN LƯỢC VÀ CHẠY CP-SAT SOLVER</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            strategy === 'fast' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}>
            <input type="radio" name="strategy" value="fast" checked={strategy === 'fast'} onChange={() => setStrategy('fast')} className="hidden" />
            <div className="space-y-1">
              <span className="text-sm font-bold block text-indigo-300">Nhanh (Fast)</span>
              <p className="text-[11px] text-slate-400">Tốc độ siêu nhanh (~50ms). Phù hợp kiểm tra nhanh.</p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">Max 1,000 iter</span>
          </label>

          <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            strategy === 'balanced' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}>
            <input type="radio" name="strategy" value="balanced" checked={strategy === 'balanced'} onChange={() => setStrategy('balanced')} className="hidden" />
            <div className="space-y-1">
              <span className="text-sm font-bold block text-indigo-300">Cân bằng (Khuyên dùng)</span>
              <p className="text-[11px] text-slate-400">Tối ưu toàn bộ ràng buộc cứng và giảm tối đa tiết trống.</p>
            </div>
            <span className="text-[10px] text-indigo-400 mt-2 block font-semibold">Max 5,000 iter</span>
          </label>

          <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            strategy === 'deep' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}>
            <input type="radio" name="strategy" value="deep" checked={strategy === 'deep'} onChange={() => setStrategy('deep')} className="hidden" />
            <div className="space-y-1">
              <span className="text-sm font-bold block text-indigo-300">Sâu (Deep Search)</span>
              <p className="text-[11px] text-slate-400">Tìm kiếm nghiệm sâu cho các trường phức tạp có nhiều ràng buộc.</p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">Max 15,000 iter</span>
          </label>
        </div>

        {/* Advanced Optimization Options */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            ⚡ TỐI ƯU HÓA MÔN ĐẶC THÙ (TIẾNG ANH, THỂ DỤC, TIN HỌC...)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start space-x-2.5 cursor-pointer bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition">
              <input
                type="checkbox"
                checked={optimizeGradeStaggering}
                onChange={(e) => setOptimizeGradeStaggering(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <div>
                <span className="font-bold text-white block">Tối ưu So le giữa các Khối & Rải đều ngày</span>
                <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                  Đảm bảo GV không bị trùng lịch giữa các Khối (6, 7, 8, 9) và phân bổ đều môn sang các ngày trong tuần.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <div>
                <span className="font-bold text-emerald-400 block">✓ Khóa Cứng: Chống Trùng Tiết Giáo Viên 100%</span>
                <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                  Tuyệt đối không để xảy ra hiện tượng 1 giáo viên bị xếp trùng tiết cùng lúc ở 2 lớp khác nhau (cả cùng khối lẫn khác khối).
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={handleExecuteSolver}
            disabled={isSolving}
            className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition text-sm disabled:opacity-50"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xếp thời khóa biểu tự động...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>CHẠY BỘ MÁY XẾP TKB NGAY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 3: Solver Results Display */}
      {solverResult && solverResult.version && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase">KẾT QUẢ XẾP THỜI KHÓA BIỂU ({currentWeek.name})</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Thời gian chạy: {solverResult.executionTimeMs} ms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Tỉ lệ xếp thành công</span>
              <span className="text-2xl font-bold text-emerald-400">{solverResult.version.score.completionRate}%</span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Số tiết đã xếp</span>
              <span className="text-2xl font-bold text-white">{solverResult.version.score.scheduledPeriods} / {solverResult.version.score.totalRequiredPeriods}</span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Vi phạm ràng buộc cứng</span>
              <span className="text-2xl font-bold text-emerald-400">{solverResult.version.score.hardViolations} lỗi</span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Điểm phạt ràng buộc mềm</span>
              <span className="text-2xl font-bold text-amber-400">{solverResult.version.score.softPenalty} pts</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            {solverResult.conflictReport && (
              <button
                onClick={() => onNavigate('conflicts')}
                className="flex items-center space-x-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Xem Báo cáo Phân tích xung đột</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('timetable')}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg"
            >
              <span>VÀO XEM THỜI KHÓA BIỂU</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
