import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Calendar, UserX, ShieldAlert, Lock, Check, Sun, Moon, Clock, Sparkles, Building, Layers, School } from 'lucide-react';
import { store } from '../database/store';
import { DayOff, TeacherUnavailability, TeacherAvoidSlot, LockedSlot, FixedPeriodRule } from '../types';

export const ConstraintsView: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();

  const [activeTab, setActiveTab] = useState<'holidays' | 'teacher_offs' | 'avoids' | 'locks' | 'stagger_rules' | 'fixed_slots'>('fixed_slots');

  const [dayOffs, setDayOffs] = useState<DayOff[]>(state.dayOffs);
  const [teacherOffs, setTeacherOffs] = useState<TeacherUnavailability[]>(state.teacherUnavailabilities);
  const [avoidSlots, setAvoidSlots] = useState<TeacherAvoidSlot[]>(state.teacherAvoidSlots);
  const [lockedList, setLockedList] = useState<LockedSlot[]>(state.lockedSlots[currentWeek.id] || []);

  const [fixedRules, setFixedRules] = useState<FixedPeriodRule[]>(state.fixedPeriodRules || [
    { id: 'fpr_chao_co', dayOfWeek: 2, period: 1, subjectId: 'sbj_hdtn', reason: 'Chào cờ đầu tuần (HĐTN)' }
  ]);
  const [newFixedDay, setNewFixedDay] = useState<number>(2);
  const [newFixedPeriod, setNewFixedPeriod] = useState<number>(1);
  const [newFixedSubjectId, setNewFixedSubjectId] = useState<string>('sbj_hdtn');
  const [newFixedReason, setNewFixedReason] = useState<string>('Chào cờ đầu tuần (HĐTN)');

  const handleSyncFixedRule = (rule: FixedPeriodRule) => {
    const allWeeks = state.weeks;
    const allClasses = state.classes;

    allWeeks.forEach(w => {
      if (!state.lockedSlots[w.id]) {
        state.lockedSlots[w.id] = [];
      }
      const weekLocks = state.lockedSlots[w.id];

      allClasses.forEach(c => {
        const ma = state.masterAssignments.find(m => m.classId === c.id && m.subjectId === rule.subjectId);
        const teacherId = ma?.teacherId || state.teachers.find(t => t.qualifiedSubjectIds?.includes(rule.subjectId) || t.mainSubjectId === rule.subjectId)?.id || state.teachers[0]?.id || '';

        const existingLockIdx = weekLocks.findIndex(l => l.classId === c.id && l.dayOfWeek === rule.dayOfWeek && l.period === rule.period);
        const lockObj: LockedSlot = {
          id: `lock_fixed_${w.id}_${c.id}_${rule.dayOfWeek}_${rule.period}`,
          weekId: w.id,
          classId: c.id,
          dayOfWeek: rule.dayOfWeek,
          period: rule.period,
          subjectId: rule.subjectId,
          teacherId,
          isLocked: true
        };

        if (existingLockIdx >= 0) {
          weekLocks[existingLockIdx] = lockObj;
        } else {
          weekLocks.push(lockObj);
        }
      });
    });

    state.fixedPeriodRules = fixedRules;
    store.addAuditLog('Đồng bộ Tiết Cố định', `Đã đồng bộ tiết Thứ ${rule.dayOfWeek}, Tiết ${rule.period} (${rule.reason}) cho toàn bộ khối lớp và tất cả các tuần.`);
    store.save();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleSyncAllFixedRules = () => {
    fixedRules.forEach(rule => {
      handleSyncFixedRule(rule);
    });
  };

  const handleAddFixedRule = (e: React.FormEvent) => {
    e.preventDefault();
    const rule: FixedPeriodRule = {
      id: `fpr_${Date.now()}`,
      dayOfWeek: newFixedDay,
      period: newFixedPeriod,
      subjectId: newFixedSubjectId,
      reason: newFixedReason
    };
    const updated = [...fixedRules, rule];
    setFixedRules(updated);
    state.fixedPeriodRules = updated;
    store.save();
    handleSyncFixedRule(rule);
  };

  const handleDeleteFixedRule = (id: string) => {
    const updated = fixedRules.filter(r => r.id !== id);
    setFixedRules(updated);
    state.fixedPeriodRules = updated;
    store.save();
  };

  // Modal forms for quick additions - Teacher Off
  const [showAddTeacherOff, setShowAddTeacherOff] = useState(false);
  const [offTeacherId, setOffTeacherId] = useState(state.teachers[0]?.id || '');
  const [offDay, setOffDay] = useState(3); // Thu 3
  const [offPeriod, setOffPeriod] = useState(1);
  const [offReason, setOffReason] = useState('Bận công tác');

  // Modal form for DayOff (School / Grade / Class)
  const [showAddDayOff, setShowAddDayOff] = useState(false);
  const [newOffTargetType, setNewOffTargetType] = useState<'school' | 'grade' | 'class'>('school');
  const [newOffTargetId, setNewOffTargetId] = useState<string>('');
  const [newOffDay, setNewOffDay] = useState<number>(2); // Thứ 2
  const [newOffSession, setNewOffSession] = useState<'all' | 'morning' | 'afternoon' | 'custom'>('afternoon');
  const [newOffPeriod, setNewOffPeriod] = useState<number>(1);
  const [newOffReason, setNewOffReason] = useState<string>('Họp chuyên môn & Bồi dưỡng HSG');

  const [savedMsg, setSavedMsg] = useState(false);

  const handleAddTeacherOff = (e: React.FormEvent) => {
    e.preventDefault();
    const newOff: TeacherUnavailability = {
      id: `tun_${Date.now()}`,
      weekId: currentWeek.id,
      teacherId: offTeacherId,
      dayOfWeek: offDay,
      periods: [offPeriod],
      reason: offReason
    };

    const updated = [...teacherOffs, newOff];
    setTeacherOffs(updated);
    state.teacherUnavailabilities = updated;
    store.addAuditLog('Giáo viên xin nghỉ', `Đã thêm lịch nghỉ cho GV ID ${offTeacherId}`);
    store.save();

    setShowAddTeacherOff(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleDeleteTeacherOff = (id: string) => {
    const updated = teacherOffs.filter(t => t.id !== id);
    setTeacherOffs(updated);
    state.teacherUnavailabilities = updated;
    store.save();
  };

  // Add Custom Day / Session Off
  const handleAddDayOff = (e: React.FormEvent) => {
    e.preventDefault();

    const newDayOff: DayOff = {
      id: `dayoff_${Date.now()}`,
      weekId: currentWeek.id,
      dayOfWeek: newOffDay,
      session: newOffSession === 'custom' ? undefined : newOffSession,
      period: newOffSession === 'custom' ? newOffPeriod : undefined,
      targetType: newOffTargetType,
      targetId: newOffTargetType !== 'school' ? newOffTargetId : undefined,
      reason: newOffReason || 'Nghỉ cố định theo lịch trường'
    };

    const updated = [...dayOffs, newDayOff];
    setDayOffs(updated);
    state.dayOffs = updated;
    store.addAuditLog('Cấu hình Lịch nghỉ Trường', `Thêm nghỉ Thứ ${newOffDay} (${newOffReason})`);
    store.save();

    setShowAddDayOff(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleDeleteDayOff = (id: string) => {
    const updated = dayOffs.filter(d => d.id !== id);
    setDayOffs(updated);
    state.dayOffs = updated;
    store.addAuditLog('Xóa Lịch nghỉ Trường', `Đã xóa cấu hình nghỉ ID ${id}`);
    store.save();
  };

  // Quick Preset Adders
  const handleAddPresetDayOff = (preset: 'mon_pm' | 'tue_pm' | 'sat_pm' | 'mon_p1') => {
    let presetObj: DayOff;
    if (preset === 'mon_pm') {
      presetObj = {
        id: `dayoff_${Date.now()}`,
        dayOfWeek: 2,
        session: 'afternoon',
        targetType: 'school',
        reason: 'Nghỉ chiều Thứ 2: Họp chuyên môn tổ & Bồi dưỡng học sinh giỏi'
      };
    } else if (preset === 'tue_pm') {
      presetObj = {
        id: `dayoff_${Date.now()}`,
        dayOfWeek: 3,
        session: 'afternoon',
        targetType: 'school',
        reason: 'Nghỉ chiều Thứ 3: Sinh hoạt chuyên môn & Ôn luyện HSG'
      };
    } else if (preset === 'sat_pm') {
      presetObj = {
        id: `dayoff_${Date.now()}`,
        dayOfWeek: 7,
        session: 'afternoon',
        targetType: 'school',
        reason: 'Nghỉ chiều Thứ 7 theo quy định'
      };
    } else {
      presetObj = {
        id: `dayoff_${Date.now()}`,
        dayOfWeek: 2,
        period: 1,
        targetType: 'school',
        reason: 'Chào cờ đầu tuần (HĐTN)'
      };
    }

    const updated = [...dayOffs, presetObj];
    setDayOffs(updated);
    state.dayOffs = updated;
    store.addAuditLog('Cấu hình Lịch nghỉ nhanh', `Đã thêm nhanh: ${presetObj.reason}`);
    store.save();

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">CẤU HÌNH RÀNG BUỘC VÀ LỊCH NGHỈ CỦA TRƯỜNG</h1>
          <p className="text-xs text-slate-400">
            Thiết lập ngày/buổi nghỉ cố định của trường (VD: Chiều T2, T3 nghỉ họp chuyên môn, bồi dưỡng HSG), lịch nghỉ giáo viên và khóa tiết.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nghỉ Trường / Buổi ({dayOffs.length})
          </button>
          <button
            onClick={() => setActiveTab('teacher_offs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'teacher_offs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Giáo viên nghỉ ({teacherOffs.length})
          </button>
          <button
            onClick={() => setActiveTab('avoids')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'avoids' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tiết tránh GV ({avoidSlots.length})
          </button>
          <button
            onClick={() => setActiveTab('locks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'locks' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tiết khóa 🔒 ({lockedList.length})
          </button>
          <button
            onClick={() => setActiveTab('stagger_rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'stagger_rules' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ So le Khối & Gộp môn
          </button>
          <button
            onClick={() => setActiveTab('fixed_slots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              activeTab === 'fixed_slots' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cố định tiết đồng loạt ⚡</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Cập nhật cấu hình thành công! Thuật toán xếp lịch sẽ tự động tuân thủ.</span>
        </div>
      )}

      {/* Tab: Cố định tiết đồng loạt (VD: Chào cờ / HĐTN) */}
      {activeTab === 'fixed_slots' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Cấu hình Tiết Cố định Đồng loạt cho Tất cả Khối Lớp</span>
              </div>
              <button
                onClick={handleSyncAllFixedRules}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>⚡ Đồng bộ tất cả các khối tiết cố định</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Thiết lập các tiết học cố định (như Chào cờ, Hoạt động trải nghiệm) áp dụng đồng loạt vào ngày/tiết chỉ định cho tất cả các lớp trong trường. Thuật toán sẽ khóa chặt vị trí này và tự động trừ đi 1 tiết trong định mức giáo viên phân công.
            </p>

            {/* Add Rule Form */}
            <form onSubmit={handleAddFixedRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Thứ trong tuần</label>
                <select
                  value={newFixedDay}
                  onChange={(e) => setNewFixedDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value={2}>Thứ 2</option>
                  <option value={3}>Thứ 3</option>
                  <option value={4}>Thứ 4</option>
                  <option value={5}>Thứ 5</option>
                  <option value={6}>Thứ 6</option>
                  <option value={7}>Thứ 7</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tiết số</label>
                <select
                  value={newFixedPeriod}
                  onChange={(e) => setNewFixedPeriod(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value={1}>Tiết 1 (Sáng)</option>
                  <option value={2}>Tiết 2 (Sáng)</option>
                  <option value={3}>Tiết 3 (Sáng)</option>
                  <option value={4}>Tiết 4 (Sáng)</option>
                  <option value={5}>Tiết 5 (Sáng)</option>
                  <option value={6}>Tiết 6 (Chiều)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Môn học áp dụng</label>
                <select
                  value={newFixedSubjectId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    setNewFixedSubjectId(sId);
                    const subj = state.subjects.find(s => s.id === sId);
                    if (subj) {
                      setNewFixedReason(`Cố định ${subj.name}`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  {state.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nội dung / Tên tiết</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={newFixedReason}
                    onChange={(e) => setNewFixedReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    placeholder="VD: Chào cờ đầu tuần"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shadow"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List of Fixed Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixedRules.map(rule => {
              const subj = state.subjects.find(s => s.id === rule.subjectId);
              return (
                <div key={rule.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        Thứ {rule.dayOfWeek} - Tiết {rule.period}
                      </span>
                      <span className="text-white font-semibold text-xs">{rule.reason}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Môn: <strong className="text-slate-200">{subj?.name || rule.subjectId}</strong> (Áp dụng đồng loạt tất cả các lớp)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSyncFixedRule(rule)}
                      className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 p-2 rounded-xl text-xs font-medium transition flex items-center space-x-1"
                      title="Đồng bộ ngay quy tắc này"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Đồng bộ</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFixedRule(rule.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-xl transition"
                      title="Xóa quy tắc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Ngày / Buổi nghỉ cố định của Trường */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          {/* Quick Presets Box */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Cấu hình nhanh các lịch nghỉ sinh hoạt chuyên môn & HSG phổ biến</span>
            </div>
            <p className="text-xs text-slate-400">
              Nhấp vào nút mẫu bên dưới để áp dụng ngay lịch nghỉ buổi chiều cho họp chuyên môn tổ hoặc ôn bồi dưỡng học sinh giỏi.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleAddPresetDayOff('mon_pm')}
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Nghỉ Chiều Thứ 2 (Họp CM & HSG)</span>
              </button>

              <button
                onClick={() => handleAddPresetDayOff('tue_pm')}
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Nghỉ Chiều Thứ 3 (Họp tổ & HSG)</span>
              </button>

              <button
                onClick={() => handleAddPresetDayOff('sat_pm')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Moon className="w-3.5 h-3.5 text-slate-400" />
                <span>+ Nghỉ Chiều Thứ 7</span>
              </button>

              <button
                onClick={() => handleAddPresetDayOff('mon_p1')}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Sun className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Chào cờ Tiết 1 Thứ 2</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH LỊCH NGHỈ CỐ ĐỊNH</h2>
              <p className="text-xs text-slate-400">Thuật toán sẽ không bao giờ xếp tiết học vào các khung giờ nghỉ này.</p>
            </div>

            <button
              onClick={() => setShowAddDayOff(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lịch nghỉ / Ca nghỉ mới</span>
            </button>
          </div>

          {/* List of DayOffs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayOffs.map((doff) => {
              const targetObj = doff.targetType === 'grade'
                ? state.grades.find(g => g.id === doff.targetId)?.name
                : doff.targetType === 'class'
                ? state.classes.find(c => c.id === doff.targetId)?.name
                : 'Toàn trường';

              return (
                <div key={doff.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition relative flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Thứ {doff.dayOfWeek || 'Tất cả'}</span>

                      {/* Session Badge */}
                      {doff.session === 'morning' && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <Sun className="w-3 h-3 text-emerald-400" />
                          <span>Nghỉ Buổi Sáng</span>
                        </span>
                      )}
                      {doff.session === 'afternoon' && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <Moon className="w-3 h-3 text-purple-400" />
                          <span>Nghỉ Buổi Chiều</span>
                        </span>
                      )}
                      {(!doff.session || doff.session === 'all') && !doff.period && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>Nghỉ Cả Ngày</span>
                        </span>
                      )}
                      {doff.period && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Nghỉ Tiết {doff.period}</span>
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Áp dụng cho:</span>
                        <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[11px]">
                          {targetObj}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium pt-1 border-t border-slate-800/80">
                        {doff.reason}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleDeleteDayOff(doff.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-xs flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa quy định</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Giáo viên xin nghỉ */}
      {activeTab === 'teacher_offs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">GIÁO VIÊN ĐĂNG KÝ XIN NGHỈ (CHỈ ÁP DỤNG THEO KHUNG)</h2>
              <p className="text-xs text-slate-400">Thuật toán sẽ tự sắp xếp đủ số tiết cho lớp vào thời gian trống khác, không làm giảm tiết của lớp.</p>
            </div>
            <button
              onClick={() => setShowAddTeacherOff(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng ký GV nghỉ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherOffs.map((tu) => {
              const tch = state.teachers.find(t => t.id === tu.teacherId);
              return (
                <div key={tu.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{tch?.fullName}</span>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {tch?.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>Nghỉ: <span className="font-bold text-amber-400">Thứ {tu.dayOfWeek}, Tiết {tu.periods.join(', ')}</span></p>
                      <p className="text-slate-400 italic">Lý do: {tu.reason}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleDeleteTeacherOff(tu.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Tiết tránh GV */}
      {activeTab === 'avoids' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH TIẾT TRÁNH CỦA GIÁO VIÊN</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avoidSlots.map((avd) => {
              const tch = state.teachers.find(t => t.id === avd.teacherId);
              return (
                <div key={avd.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{tch?.fullName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      avd.level === 'hard' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      RÀNG BUỘC {avd.level === 'hard' ? 'CỨNG' : 'MỀM'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Muốn tránh: <span className="font-semibold text-indigo-400">Thứ {avd.dayOfWeek}, Tiết {avd.period}</span>
                  </p>
                  {avd.reason && <p className="text-xs text-slate-400 italic">{avd.reason}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Tiết khóa 🔒 */}
      {activeTab === 'locks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">CÁC TIẾT ĐÃ KHÓA CỐ ĐỊNH 🔒 ({currentWeek.name})</h2>
              <p className="text-xs text-slate-400">Các tiết đã khóa sẽ được giữ nguyên 100% vị trí khi chạy lại thuật toán tự động.</p>
            </div>
          </div>

          {lockedList.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              Chưa có tiết nào bị khóa trong {currentWeek.name}. Bạn có thể bấm biểu tượng 🔒 trực tiếp trên Bảng Thời khóa biểu để khóa tiết.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lockedList.map((lock) => {
                const cls = state.classes.find(c => c.id === lock.classId);
                const sbj = state.subjects.find(s => s.id === lock.subjectId);
                const tch = state.teachers.find(t => t.id === lock.teacherId);
                return (
                  <div key={lock.id} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{cls?.name}</span>
                      <span className="text-xs text-indigo-400 font-bold flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Đã khóa 🔒</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">Thứ {lock.dayOfWeek}, Tiết {lock.period}</p>
                    <p className="text-xs font-semibold text-purple-300">{sbj?.name} ({tch?.fullName})</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Quy tắc So le Khối lớp & Gộp môn (Tiếng Anh, Thể Dục...) */}
      {activeTab === 'stagger_rules' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
                  QUY TẮC SO LE GIỮA CÁC KHỐI & DỒN TIẾT CÙNG KHỐI (DÀNH CHO MÔN NHIỀU TIẾT / ÍT GIÁO VIÊN)
                </h2>
                <p className="text-xs text-indigo-200">
                  Giải pháp tối ưu hóa thời khóa biểu đặc thù khi trường chỉ có 1 GV Tiếng Anh hoặc 1 GV Thể dục dạy toàn trường.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1. Nguyên tắc So le giữa các Khối (Cross-Grade Staggering)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Thuật toán đảm bảo giáo viên dạy đơn môn (như Tiếng Anh, Thể dục) <strong className="text-white">không bao giờ bị trùng giờ giữa các Khối lớp khác nhau</strong> (VD: Khối 6 học Sáng Thứ 2 thì Khối 7 sẽ đẩy sang Sáng Thứ 3/Thứ 4).
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>2. Nguyên tắc Trùng/Gộp tiết Cùng Khối (Same-Grade Parallel)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Với môn nhiều tiết (Tiếng Anh, Thể Dục), thuật toán cho phép <strong className="text-white">xếp trùng tiết hoặc dồn tiết liên tiếp cho các lớp trong CÙNG MỘT KHỐI</strong> (VD: 6A1 học tiết 1, 6A2 học tiết 2), giúp giáo viên xử lý dứt điểm từng khối lớp mà không kẹt lịch.
                </p>
              </div>
            </div>
          </div>

          {/* Table / Summary Analysis of Single Teacher & Heavy Subjects */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              DANH SÁCH MÔN HỌC CÓ MẬT ĐỘ TIẾT CAO & GIÁO VIÊN PHỤ TRÁCH ĐA KHỐI
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="p-3">Môn học</th>
                    <th className="p-3">Mã môn</th>
                    <th className="p-3 text-center">Số tiết/tuần</th>
                    <th className="p-3 text-center">Số GV đảm nhận</th>
                    <th className="p-3">Các khối đảm nhận</th>
                    <th className="p-3 text-right">Trạng thái Tối ưu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.subjects.map(sbj => {
                    const sbjAssignments = state.masterAssignments.filter(a => a.subjectId === sbj.id);
                    const teacherIds = Array.from(new Set(sbjAssignments.map(a => a.teacherId)));
                    const classIds = Array.from(new Set(sbjAssignments.map(a => a.classId)));
                    const gradeNames = Array.from(new Set(
                      classIds.map(cId => {
                        const cls = state.classes.find(c => c.id === cId);
                        return state.grades.find(g => g.id === cls?.gradeId)?.name;
                      }).filter(Boolean)
                    ));

                    const totalPeriods = sbjAssignments.reduce((acc, curr) => acc + curr.periodsPerWeek, 0);
                    const isMultiGrade = gradeNames.length > 1;
                    const isSingleTeacher = teacherIds.length === 1;

                    return (
                      <tr key={sbj.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">{sbj.name}</td>
                        <td className="p-3 font-mono text-indigo-400">{sbj.code}</td>
                        <td className="p-3 text-center font-bold text-amber-300">{totalPeriods} tiết</td>
                        <td className="p-3 text-center font-bold text-slate-200">
                          {teacherIds.length} GV {isSingleTeacher && <span className="text-[10px] text-amber-400 font-normal">(GV Độc quyền)</span>}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {gradeNames.map((gn, idx) => (
                              <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700">
                                {gn}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {isMultiGrade ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              ✓ Đã bật So le Khối
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                              Nội bộ 1 Khối
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add DayOff / Session Off Modal */}
      {showAddDayOff && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddDayOff} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>THÊM QUY ĐỊNH NGHỈ THEO BUỔI / NGÀY</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Đối tượng áp dụng</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOffTargetType('school')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      newOffTargetType === 'school'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Toàn trường
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOffTargetType('grade');
                      if (!newOffTargetId) setNewOffTargetId(state.grades[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      newOffTargetType === 'grade'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Theo Khối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOffTargetType('class');
                      if (!newOffTargetId) setNewOffTargetId(state.classes[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      newOffTargetType === 'class'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Theo Lớp
                  </button>
                </div>
              </div>

              {newOffTargetType === 'grade' && (
                <div>
                  <label className="block text-slate-400 mb-1">Chọn Khối</label>
                  <select
                    value={newOffTargetId}
                    onChange={(e) => setNewOffTargetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {state.grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {newOffTargetType === 'class' && (
                <div>
                  <label className="block text-slate-400 mb-1">Chọn Lớp</label>
                  <select
                    value={newOffTargetId}
                    onChange={(e) => setNewOffTargetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {state.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Thứ trong tuần</label>
                  <select
                    value={newOffDay}
                    onChange={(e) => setNewOffDay(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
                  >
                    <option value={2}>Thứ 2</option>
                    <option value={3}>Thứ 3</option>
                    <option value={4}>Thứ 4</option>
                    <option value={5}>Thứ 5</option>
                    <option value={6}>Thứ 6</option>
                    <option value={7}>Thứ 7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Khung / Buổi nghỉ</label>
                  <select
                    value={newOffSession}
                    onChange={(e) => setNewOffSession(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="afternoon">🌇 Nghỉ Buổi Chiều</option>
                    <option value="morning">🌅 Nghỉ Buổi Sáng</option>
                    <option value="all">☀️🌙 Nghỉ Cả Ngày</option>
                    <option value="custom">⏱️ Nghỉ Tiết Học Cụ Thể</option>
                  </select>
                </div>
              </div>

              {newOffSession === 'custom' && (
                <div>
                  <label className="block text-slate-400 mb-1">Chọn tiết nghỉ</label>
                  <select
                    value={newOffPeriod}
                    onChange={(e) => setNewOffPeriod(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value={1}>Tiết 1 (Sáng)</option>
                    <option value={2}>Tiết 2 (Sáng)</option>
                    <option value={3}>Tiết 3 (Sáng)</option>
                    <option value={4}>Tiết 4 (Sáng)</option>
                    <option value={5}>Tiết 5 (Sáng)</option>
                    <option value={6}>Tiết 6 (Chiều)</option>
                    <option value={7}>Tiết 7 (Chiều)</option>
                    <option value={8}>Tiết 8 (Chiều)</option>
                    <option value={9}>Tiết 9 (Chiều)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Lý do nghỉ / Tên hoạt động</label>
                <input
                  type="text"
                  required
                  placeholder="Họp chuyên môn tổ & Bồi dưỡng HSG..."
                  value={newOffReason}
                  onChange={(e) => setNewOffReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewOffReason('Họp chuyên môn tổ & Bồi dưỡng học sinh giỏi')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded-lg border border-slate-700"
                  >
                    + Họp CM & Bồi dưỡng HSG
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOffReason('Sinh hoạt chuyên môn & Ôn luyện HSG')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded-lg border border-slate-700"
                  >
                    + Sinh hoạt tổ & Ôn HSG
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOffReason('Chào cờ đầu tuần (HĐTN)')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded-lg border border-slate-700"
                  >
                    + Chào cờ đầu tuần
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddDayOff(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Lưu quy định nghỉ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Quick Add Teacher Off Modal */}
      {showAddTeacherOff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddTeacherOff} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Đăng ký Giáo viên nghỉ</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Chọn Giáo viên</label>
                <select
                  value={offTeacherId}
                  onChange={(e) => setOffTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {state.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.code} - {t.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Thứ trong tuần</label>
                  <select
                    value={offDay}
                    onChange={(e) => setOffDay(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value={2}>Thứ 2</option>
                    <option value={3}>Thứ 3</option>
                    <option value={4}>Thứ 4</option>
                    <option value={5}>Thứ 5</option>
                    <option value={6}>Thứ 6</option>
                    <option value={7}>Thứ 7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tiết học</label>
                  <select
                    value={offPeriod}
                    onChange={(e) => setOffPeriod(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value={1}>Tiết 1 (Sáng)</option>
                    <option value={2}>Tiết 2 (Sáng)</option>
                    <option value={3}>Tiết 3 (Sáng)</option>
                    <option value={4}>Tiết 4 (Sáng)</option>
                    <option value={5}>Tiết 5 (Sáng)</option>
                    <option value={6}>Tiết 6 (Chiều)</option>
                    <option value={7}>Tiết 7 (Chiều)</option>
                    <option value={8}>Tiết 8 (Chiều)</option>
                    <option value={9}>Tiết 9 (Chiều)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Lý do nghỉ</label>
                <input
                  type="text"
                  required
                  placeholder="Họp công tác / Việc cá nhân..."
                  value={offReason}
                  onChange={(e) => setOffReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddTeacherOff(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Lưu lịch nghỉ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
