import React from 'react';
import { Calendar, Bot, RefreshCw, Zap, Award, Sparkles, BookOpen } from 'lucide-react';
import { store } from '../database/store';
import { Week } from '../types';

interface NavbarProps {
  currentWeek: Week;
  onSelectWeek: (weekId: string) => void;
  onToggleAIAssistant: () => void;
  onRunQuickSolve: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWeek,
  onSelectWeek,
  onToggleAIAssistant,
  onRunQuickSolve,
  onResetData
}) => {
  const state = store.getState();
  const weeks = state.weeks;
  const currentVer = store.getTimetableVersion(currentWeek.id);
  const rate = currentVer?.score.completionRate ?? 0;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">TKB THCS 2018</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                GDPT 2018
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Hệ thống xây dựng & xếp thời khóa biểu tự động</p>
          </div>
        </div>

        {/* Center: Week Picker & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <select
              value={currentWeek.id}
              onChange={(e) => onSelectWeek(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                  {w.name} {w.isCurrent ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
            <span className="text-slate-400">Tiến độ:</span>
            <span className={`font-bold ${rate === 100 ? 'text-emerald-400' : rate > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {rate}% đã xếp
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRunQuickSolve}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm shadow-indigo-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xếp TKB tự động</span>
          </button>

          <button
            onClick={onToggleAIAssistant}
            className="flex items-center space-x-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Trợ lý AI</span>
          </button>

          <button
            onClick={onResetData}
            title="Khôi phục dữ liệu mẫu gốc"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
