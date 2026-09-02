import React, { useState } from 'react';
import { Copy, Check, ArrowRight, Layers } from 'lucide-react';
import { store } from '../database/store';

export const CopyWeekModal: React.FC = () => {
  const state = store.getState();
  const weeks = state.weeks;

  const [sourceWeekId, setSourceWeekId] = useState(weeks[0]?.id || 'week_1');
  const [targetWeekId, setTargetWeekId] = useState(weeks[1]?.id || 'week_2');

  const [copyAssignments, setCopyAssignments] = useState(true);
  const [copyEntries, setCopyEntries] = useState(true);
  const [copyLocks, setCopyLocks] = useState(true);
  const [copyOffs, setCopyOffs] = useState(true);

  const [successMsg, setSuccessMsg] = useState(false);

  const handleCopy = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceWeekId === targetWeekId) return;

    store.copyWeekData(sourceWeekId, targetWeekId, {
      assignments: copyAssignments,
      timetable: copyEntries,
      lockedSlots: copyLocks,
      dayOffs: copyOffs,
      teacherUnavailability: copyOffs,
      teacherAvoidSlots: copyOffs
    });

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const sourceWeekName = weeks.find(w => w.id === sourceWeekId)?.name || sourceWeekId;
  const targetWeekName = weeks.find(w => w.id === targetWeekId)?.name || targetWeekId;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Copy className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">SAO CHÉP DỮ LIỆU VÀ TKB GIỮA CÁC TUẦN HỌC</h1>
        </div>
        <p className="text-xs text-slate-400">
          Sao chép phân công giảng dạy, thời khóa biểu và lịch nghỉ từ tuần gốc sang tuần mục tiêu nhanh chóng.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Đã sao chép dữ liệu từ {sourceWeekName} sang {targetWeekName} thành công!</span>
        </div>
      )}

      <form onSubmit={handleCopy} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">1. Chọn Tuần Nguồn (Source)</label>
            <select
              value={sourceWeekId}
              onChange={(e) => setSourceWeekId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-bold"
            >
              {weeks.map(w => (
                <option key={w.id} value={w.id}>{w.name} {w.isCurrent ? '(Tuần hiện tại)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">2. Chọn Tuần Mục Tiêu (Target)</label>
            <select
              value={targetWeekId}
              onChange={(e) => setTargetWeekId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-bold"
            >
              {weeks.map(w => (
                <option key={w.id} value={w.id} disabled={w.id === sourceWeekId}>
                  {w.name} {w.id === sourceWeekId ? '(Trùng tuần nguồn)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-400 uppercase">3. Chọn các mục dữ liệu cần sao chép:</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={copyAssignments}
                onChange={(e) => setCopyAssignments(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-slate-200">Phân công giảng dạy theo tuần</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={copyEntries}
                onChange={(e) => setCopyEntries(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-slate-200">Bảng Thời khóa biểu đã xếp</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={copyLocks}
                onChange={(e) => setCopyLocks(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-slate-200">Danh sách các Tiết khóa 🔒</span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={copyOffs}
                onChange={(e) => setCopyOffs(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-slate-200">Lịch GV xin nghỉ & Ngày nghỉ</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={sourceWeekId === targetWeekId}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 disabled:opacity-40"
          >
            <span>Thực hiện Sao Chép</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
