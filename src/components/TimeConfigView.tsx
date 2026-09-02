import React, { useState } from 'react';
import { Clock, Check, Save, Sliders, AlertCircle } from 'lucide-react';
import { store } from '../database/store';
import { DayConfig, TimeSlotConfig, SoftConstraintWeight } from '../types';

export const TimeConfigView: React.FC = () => {
  const state = store.getState();

  const [days, setDays] = useState<DayConfig[]>(state.dayConfigs);
  const [timeConfig, setTimeConfig] = useState<TimeSlotConfig>(state.timeSlotConfig);
  const [softWeights, setSoftWeights] = useState<SoftConstraintWeight[]>(state.softWeights);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleToggleDay = (dayOfWeek: number) => {
    setDays(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, isActive: !d.isActive } : d));
  };

  const handleChangeMorningCount = (count: number) => {
    setTimeConfig(prev => ({ ...prev, morningPeriodsCount: Math.max(1, Math.min(6, count)) }));
  };

  const handleChangeAfternoonCount = (count: number) => {
    setTimeConfig(prev => ({ ...prev, afternoonPeriodsCount: Math.max(0, Math.min(6, count)) }));
  };

  const handleChangeWeight = (id: string, weight: number) => {
    setSoftWeights(prev => prev.map(w => w.id === id ? { ...w, weight } : w));
  };

  const handleSave = () => {
    state.dayConfigs = days;
    state.timeSlotConfig = timeConfig;
    state.softWeights = softWeights;
    store.addAuditLog('Cấu hình thời gian', 'Cập nhật ngày học, buổi học và trọng số ràng buộc mềm');
    store.save();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">CẤU HÌNH THỜI GIAN VÀ RÀNG BUỘC MỀM</h1>
          <p className="text-xs text-slate-400">Thiết lập ngày học trong tuần, số tiết buổi sáng / chiều và trọng số tối ưu.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
        >
          <Save className="w-4 h-4" />
          <span>Lưu thay đổi</span>
        </button>
      </div>

      {savedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Đã lưu cấu hình thời gian thành công!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Cấu hình Ngày học */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">CẤU HÌNH NGÀY HỌC TRONG TUẦN</h2>
          </div>

          <p className="text-xs text-slate-400">Tích chọn các ngày học chính thức của nhà trường. Không hard-code.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {days.map((d) => (
              <label
                key={d.dayOfWeek}
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                  d.isActive
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={d.isActive}
                  onChange={() => handleToggleDay(d.dayOfWeek)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-xs font-semibold">{d.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Cấu hình Buổi & Tiết học */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">CẤU HÌNH BUỔI & SỐ TIẾT HỌC</h2>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">BUỔI SÁNG (Mặc định: 4 tiết)</span>
                <span className="text-[11px] text-slate-400">Tiết 1 đến Tiết {timeConfig.morningPeriodsCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleChangeMorningCount(timeConfig.morningPeriodsCount - 1)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <span className="text-sm font-bold text-indigo-400 w-6 text-center">{timeConfig.morningPeriodsCount}</span>
                <button
                  onClick={() => handleChangeMorningCount(timeConfig.morningPeriodsCount + 1)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">BUỔI CHIỀU (Độc lập: 0 - 6 tiết)</span>
                <span className="text-[11px] text-slate-400">
                  {timeConfig.afternoonPeriodsCount === 0 ? 'Không có tiết buổi chiều' : `Tiết ${timeConfig.morningPeriodsCount + 1} đến Tiết ${timeConfig.morningPeriodsCount + timeConfig.afternoonPeriodsCount}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleChangeAfternoonCount(timeConfig.afternoonPeriodsCount - 1)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <span className="text-sm font-bold text-purple-400 w-6 text-center">{timeConfig.afternoonPeriodsCount}</span>
                <button
                  onClick={() => handleChangeAfternoonCount(timeConfig.afternoonPeriodsCount + 1)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Trọng số Ràng buộc Mềm */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">CẤU HÌNH TRỌNG SỐ RÀNG BUỘC MỀM (1 - 10)</h2>
        </div>
        <p className="text-xs text-slate-400">
          Sau khi thỏa mãn toàn bộ 100% ràng buộc cứng, thuật toán CP-SAT sẽ tối ưu theo trọng số các ràng buộc mềm bên dưới.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {softWeights.map((sw) => (
            <div key={sw.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{sw.name}</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Mức {sw.weight}/10
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{sw.description}</p>
              <input
                type="range"
                min="1"
                max="10"
                value={sw.weight}
                onChange={(e) => handleChangeWeight(sw.id, parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
