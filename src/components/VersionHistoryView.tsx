import React, { useState } from 'react';
import { History, Check, RotateCcw, Clock, Award, Layers } from 'lucide-react';
import { store } from '../database/store';

export const VersionHistoryView: React.FC = () => {
  const currentWeek = store.getCurrentWeek();
  const versions = store.getWeekVersions(currentWeek.id);
  const currentVer = store.getTimetableVersion(currentWeek.id);

  const [activeVerId, setActiveVerId] = useState<string>(currentVer?.id || '');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleRestoreVersion = (versionId: string) => {
    store.setCurrentTimetableVersion(currentWeek.id, versionId);
    setActiveVerId(versionId);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">QUẢN LÝ LỊCH SỬ PHIÊN BẢN TKB ({currentWeek.name})</h1>
        </div>
        <p className="text-xs text-slate-400">
          Xem lại danh sách các phiên bản Thời khóa biểu đã được xếp và khôi phục lại phiên bản mong muốn.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Đã kích hoạt phiên bản Thời khóa biểu mới thành công!</span>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Chưa có phiên bản nào được tạo cho {currentWeek.name}. Hãy vào mục "Xếp TKB tự động" để chạy xếp TKB.
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((v) => {
            const isCurrent = v.id === currentVer?.id;
            return (
              <div
                key={v.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrent ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-bold text-white">{v.name}</span>
                    {isCurrent && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        Đang áp dụng
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(v.createdAt).toLocaleString('vi-VN')}</span>
                    </span>
                    <span>Tạo bởi: {v.createdBy}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="bg-slate-950 text-emerald-400 border border-slate-800 text-[11px] px-2.5 py-1 rounded-lg font-bold">
                      Hoàn thành: {v.score.completionRate}% ({v.score.scheduledPeriods}/{v.score.totalRequiredPeriods} tiết)
                    </span>
                    <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[11px] px-2.5 py-1 rounded-lg">
                      Lỗi cứng: {v.score.hardViolations}
                    </span>
                    <span className="bg-slate-950 text-amber-400 border border-slate-800 text-[11px] px-2.5 py-1 rounded-lg">
                      Điểm mềm: {v.score.softPenalty} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isCurrent && (
                    <button
                      onClick={() => handleRestoreVersion(v.id)}
                      className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Sử dụng phiên bản này</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
