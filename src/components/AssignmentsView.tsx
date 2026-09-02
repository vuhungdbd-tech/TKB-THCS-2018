import React, { useState } from 'react';
import { Users, Save, Check, AlertCircle, Layers, Filter, Plus, Trash2, UserCheck, School, Edit } from 'lucide-react';
import { store } from '../database/store';
import { MasterAssignment, WeeklyAssignment, Teacher } from '../types';

export const AssignmentsView: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();

  const [mode, setMode] = useState<'master' | 'weekly'>('master');
  const [filterMode, setFilterMode] = useState<'class' | 'teacher'>('class');

  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(state.teachers[0]?.id || '');

  const [masterList, setMasterList] = useState<MasterAssignment[]>(state.masterAssignments);
  const [weeklyList, setWeeklyList] = useState<WeeklyAssignment[]>(
    store.getWeeklyAssignments(currentWeek.id)
  );

  const [savedMsg, setSavedMsg] = useState(false);

  // Edit Teacher Info Modal state
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState<{
    id: string;
    code: string;
    fullName: string;
    department: string;
    mainSubjectId: string;
    maxPeriodsPerWeek: number;
    maxPeriodsPerDay: number;
  } | null>(null);

  const handleUpdateTeacherInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherData) return;
    const tch = state.teachers.find(t => t.id === editTeacherData.id);
    if (tch) {
      const updated: Teacher = {
        ...tch,
        code: editTeacherData.code,
        fullName: editTeacherData.fullName,
        department: editTeacherData.department,
        mainSubjectId: editTeacherData.mainSubjectId,
        maxPeriodsPerWeek: editTeacherData.maxPeriodsPerWeek,
        maxPeriodsPerDay: editTeacherData.maxPeriodsPerDay
      };
      store.updateTeacher(updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      setShowEditTeacherModal(false);
    }
  };

  // New assignment modal state - TEACHER -> SUBJECT -> MULTI-CLASS WORKFLOW
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [addTeacherId, setAddTeacherId] = useState<string>(state.teachers[0]?.id || '');
  const [addSubjectId, setAddSubjectId] = useState<string>('');
  const [addComponentId, setAddComponentId] = useState<string>('');
  const [addClassIds, setAddClassIds] = useState<string[]>([]);
  const [addPeriods, setAddPeriods] = useState<number>(3);

  // KHTN / KHXH Alternating Weekly Periods Modal state
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [activeRotationTab, setActiveRotationTab] = useState<'khtn' | 'khxh'>('khtn');
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<{
    subjectId: string;
    componentId?: string;
    subjectName: string;
    componentName?: string;
  } | null>(null);

  const [rotationKhtn, setRotationKhtn] = useState<Record<string, {
    odd: { phy: number; chem: number; bio: number };
    even: { phy: number; chem: number; bio: number };
  }>>({
    grade_6: { odd: { phy: 2, chem: 0, bio: 2 }, even: { phy: 1, chem: 2, bio: 1 } },
    grade_7: { odd: { phy: 1, chem: 2, bio: 1 }, even: { phy: 2, chem: 0, bio: 2 } },
    grade_8: { odd: { phy: 2, chem: 1, bio: 1 }, even: { phy: 1, chem: 2, bio: 1 } },
    grade_9: { odd: { phy: 1, chem: 1, bio: 2 }, even: { phy: 2, chem: 1, bio: 1 } },
  });

  const [rotationKhxh, setRotationKhxh] = useState<Record<string, {
    odd: { hist: number; geo: number };
    even: { hist: number; geo: number };
  }>>({
    grade_6: { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } },
    grade_7: { odd: { hist: 1, geo: 2 }, even: { hist: 2, geo: 1 } },
    grade_8: { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } },
    grade_9: { odd: { hist: 1, geo: 2 }, even: { hist: 2, geo: 1 } },
  });

  // Helper sync functions to guarantee immediate persistence, zero data loss & instant TKB synchronization
  const syncMaster = (newList: MasterAssignment[]) => {
    setMasterList(newList);
    state.masterAssignments = newList;
    store.save();
    store.syncTimetableWithAssignments(currentWeek.id);
  };

  const syncWeekly = (newList: WeeklyAssignment[]) => {
    setWeeklyList(newList);
    store.saveWeeklyAssignments(currentWeek.id, newList);
    store.syncTimetableWithAssignments(currentWeek.id);
  };

  // Handle open add assignment modal with prefilled teacher & class
  const handleOpenAddModal = () => {
    const defaultTeacherId = filterMode === 'teacher' && selectedTeacherId ? selectedTeacherId : (state.teachers[0]?.id || '');
    const defaultClassId = filterMode === 'class' && selectedClassId ? selectedClassId : (state.classes[0]?.id || '');
    
    setAddTeacherId(defaultTeacherId);
    setAddClassIds(defaultClassId ? [defaultClassId] : [state.classes[0]?.id || '']);

    const teacherObj = state.teachers.find(t => t.id === defaultTeacherId);
    const initialSubjectId = teacherObj?.mainSubjectId || state.subjects[0]?.id || '';
    setAddSubjectId(initialSubjectId);

    const initialSubjObj = state.subjects.find(s => s.id === initialSubjectId);
    setAddPeriods(initialSubjObj?.defaultPeriodsPerWeek || 3);
    setAddComponentId('');

    setShowAddAssignment(true);
  };

  const handleTeacherChangeInAdd = (newTchId: string) => {
    setAddTeacherId(newTchId);
    const tch = state.teachers.find(t => t.id === newTchId);
    if (tch && tch.mainSubjectId) {
      setAddSubjectId(tch.mainSubjectId);
      const sbjObj = state.subjects.find(s => s.id === tch.mainSubjectId);
      if (sbjObj) {
        setAddPeriods(sbjObj.defaultPeriodsPerWeek || 3);
      }
      setAddComponentId('');
    }
  };

  const handleSubjectChangeInAdd = (newSbjId: string) => {
    setAddSubjectId(newSbjId);
    setAddComponentId('');
    const sbj = state.subjects.find(s => s.id === newSbjId);
    if (sbj) {
      setAddPeriods(sbj.defaultPeriodsPerWeek || 3);
    }
  };

  const toggleClassSelectionInAdd = (clsId: string) => {
    setAddClassIds(prev => 
      prev.includes(clsId) ? prev.filter(id => id !== clsId) : [...prev, clsId]
    );
  };

  const selectGradeClassesInAdd = (gradeId: string) => {
    const gradeClasses = state.classes.filter(c => c.gradeId === gradeId).map(c => c.id);
    const allSelected = gradeClasses.every(id => addClassIds.includes(id));
    if (allSelected) {
      setAddClassIds(prev => prev.filter(id => !gradeClasses.includes(id)));
    } else {
      setAddClassIds(prev => Array.from(new Set([...prev, ...gradeClasses])));
    }
  };

  const selectAllClassesInAdd = () => {
    if (addClassIds.length === state.classes.length) {
      setAddClassIds([]);
    } else {
      setAddClassIds(state.classes.map(c => c.id));
    }
  };

  const handleUpdateMasterTeacher = (asgId: string, newTeacherId: string) => {
    const updated = masterList.map(a => a.id === asgId ? { ...a, teacherId: newTeacherId } : a);
    syncMaster(updated);
  };

  const handleUpdateMasterPeriods = (asgId: string, newPeriods: number) => {
    const updated = masterList.map(a => a.id === asgId ? { ...a, periodsPerWeek: Math.max(0.5, newPeriods) } : a);
    syncMaster(updated);
  };

  const handleUpdateWeeklyTeacher = (asgId: string, newTeacherId: string) => {
    const updated = weeklyList.map(a => a.id === asgId ? { ...a, teacherId: newTeacherId, isCustomized: true } : a);
    syncWeekly(updated);
  };

  const handleUpdateWeeklyPeriods = (asgId: string, newPeriods: number) => {
    const updated = weeklyList.map(a => a.id === asgId ? { ...a, periodsPerWeek: Math.max(0.5, newPeriods), isCustomized: true } : a);
    syncWeekly(updated);
  };

  const handleDeleteMasterAssignment = (asgId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phân công môn học này?')) return;
    const updated = masterList.filter(a => a.id !== asgId);
    syncMaster(updated);
  };

  const handleDeleteWeeklyAssignment = (asgId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phân công môn học này trong tuần này?')) return;
    const updated = weeklyList.filter(a => a.id !== asgId);
    syncWeekly(updated);
  };

  const handleCreateAssignment = (e: React.FormEvent, keepOpen: boolean = false) => {
    e.preventDefault();
    if (!addTeacherId || !addSubjectId || addClassIds.length === 0) return;

    if (mode === 'master') {
      let updatedMaster = [...masterList];
      addClassIds.forEach(clsId => {
        const existingIdx = updatedMaster.findIndex(
          a => a.classId === clsId && a.subjectId === addSubjectId && (a.componentId || '') === (addComponentId || '')
        );

        if (existingIdx >= 0) {
          updatedMaster[existingIdx] = {
            ...updatedMaster[existingIdx],
            teacherId: addTeacherId,
            periodsPerWeek: addPeriods || 3
          };
        } else {
          updatedMaster.push({
            id: `masg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            academicYearId: 'ay_2026_2027',
            classId: clsId,
            subjectId: addSubjectId,
            componentId: addComponentId || undefined,
            teacherId: addTeacherId,
            periodsPerWeek: addPeriods || 3
          });
        }
      });
      syncMaster(updatedMaster);
    } else {
      let updatedWeekly = [...weeklyList];
      addClassIds.forEach(clsId => {
        const existingIdx = updatedWeekly.findIndex(
          a => a.classId === clsId && a.subjectId === addSubjectId && (a.componentId || '') === (addComponentId || '')
        );

        if (existingIdx >= 0) {
          updatedWeekly[existingIdx] = {
            ...updatedWeekly[existingIdx],
            teacherId: addTeacherId,
            periodsPerWeek: addPeriods || 3,
            isCustomized: true
          };
        } else {
          updatedWeekly.push({
            id: `wasg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            weekId: currentWeek.id,
            classId: clsId,
            subjectId: addSubjectId,
            componentId: addComponentId || undefined,
            teacherId: addTeacherId,
            periodsPerWeek: addPeriods || 3,
            isCustomized: true
          });
        }
      });
      syncWeekly(updatedWeekly);
    }

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);

    if (!keepOpen) {
      setShowAddAssignment(false);
    }
  };

  const handleManualSaveAll = () => {
    if (mode === 'master') {
      syncMaster(masterList);
      store.addAuditLog('Phân công gốc', 'Lưu và đồng bộ phân công giảng dạy toàn trường');
    } else {
      syncWeekly(weeklyList);
    }
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleApplyWeeklyRotation = (applyBoth: boolean = true) => {
    const allWeeks = state.weeks;
    
    const getQualifiedTeacherId = (subjectId: string, componentId?: string) => {
      if (componentId) {
        const tComp = state.teachers.find(t => t.qualifiedSubjectIds?.includes(componentId));
        if (tComp) return tComp.id;
      }
      const tSbj = state.teachers.find(t => t.qualifiedSubjectIds?.includes(subjectId) || t.mainSubjectId === subjectId);
      if (tSbj) return tSbj.id;
      return '';
    };

    // 1. Update Master Assignments (Phân công gốc) using odd week configuration as base
    let newMasterList = [...state.masterAssignments];
    state.classes.forEach(c => {
      const gradeId = c.gradeId;
      if (applyBoth || activeRotationTab === 'khtn') {
        const cfg = rotationKhtn[gradeId] || rotationKhtn['grade_6'];
        const pMap = [
          { compId: 'cmp_phy', p: cfg.odd.phy },
          { compId: 'cmp_chem', p: cfg.odd.chem },
          { compId: 'cmp_bio', p: cfg.odd.bio }
        ];
        pMap.forEach(({ compId, p }) => {
          const mIdx = newMasterList.findIndex(
            m => m.classId === c.id && m.subjectId === 'sbj_khtn' && m.componentId === compId
          );
          if (mIdx >= 0) {
            newMasterList[mIdx] = { ...newMasterList[mIdx], periodsPerWeek: p };
          } else if (p > 0) {
            newMasterList.push({
              id: `masg_rot_${c.id}_${compId}`,
              academicYearId: currentWeek.academicYearId,
              classId: c.id,
              subjectId: 'sbj_khtn',
              componentId: compId,
              teacherId: '',
              periodsPerWeek: p
            });
          }
        });
      }

      if (applyBoth || activeRotationTab === 'khxh') {
        const cfg = rotationKhxh[gradeId] || rotationKhxh['grade_6'];
        const pMap = [
          { compId: 'cmp_hist', p: cfg.odd.hist },
          { compId: 'cmp_geo', p: cfg.odd.geo }
        ];
        pMap.forEach(({ compId, p }) => {
          const mIdx = newMasterList.findIndex(
            m => m.classId === c.id && m.subjectId === 'sbj_khxh' && m.componentId === compId
          );
          if (mIdx >= 0) {
            newMasterList[mIdx] = { ...newMasterList[mIdx], periodsPerWeek: p };
          } else if (p > 0) {
            newMasterList.push({
              id: `masg_rot_${c.id}_${compId}`,
              academicYearId: currentWeek.academicYearId,
              classId: c.id,
              subjectId: 'sbj_khxh',
              componentId: compId,
              teacherId: '',
              periodsPerWeek: p
            });
          }
        });
      }
    });
    syncMaster(newMasterList);

    // 2. Update Weekly Assignments across all 37 weeks
    allWeeks.forEach((w, idx) => {
      const weekNum = w.weekNumber || (idx + 1);
      const isOdd = weekNum % 2 !== 0;

      let weekAssignments = store.getWeeklyAssignments(w.id);

      state.classes.forEach(c => {
        const gradeId = c.gradeId;
        
        // Process KHTN if applying both or active tab is khtn
        if (applyBoth || activeRotationTab === 'khtn') {
          const cfg = rotationKhtn[gradeId] || rotationKhtn['grade_6'];
          const periods = isOdd ? cfg.odd : cfg.even;

          const compMapping = [
            { compId: 'cmp_phy', p: periods.phy },
            { compId: 'cmp_chem', p: periods.chem },
            { compId: 'cmp_bio', p: periods.bio }
          ];

          compMapping.forEach(({ compId, p }) => {
            const idxInWeek = weekAssignments.findIndex(
              a => a.classId === c.id && a.subjectId === 'sbj_khtn' && a.componentId === compId
            );

            if (idxInWeek >= 0) {
              weekAssignments[idxInWeek] = {
                ...weekAssignments[idxInWeek],
                periodsPerWeek: p,
                isCustomized: true
              };
            } else if (p > 0) {
              const masterMatch = state.masterAssignments.find(
                m => m.classId === c.id && m.subjectId === 'sbj_khtn' && m.componentId === compId
              );
              const teacherId = masterMatch?.teacherId || '';
              weekAssignments.push({
                id: `wasg_rot_${w.id}_${c.id}_${compId}`,
                weekId: w.id,
                classId: c.id,
                subjectId: 'sbj_khtn',
                componentId: compId,
                teacherId,
                periodsPerWeek: p,
                isCustomized: true
              });
            }
          });
        }

        // Process KHXH if applying both or active tab is khxh
        if (applyBoth || activeRotationTab === 'khxh') {
          const cfg = rotationKhxh[gradeId] || rotationKhxh['grade_6'];
          const periods = isOdd ? cfg.odd : cfg.even;

          const compMapping = [
            { compId: 'cmp_hist', p: periods.hist },
            { compId: 'cmp_geo', p: periods.geo }
          ];

          compMapping.forEach(({ compId, p }) => {
            const idxInWeek = weekAssignments.findIndex(
              a => a.classId === c.id && a.subjectId === 'sbj_khxh' && a.componentId === compId
            );

            if (idxInWeek >= 0) {
              weekAssignments[idxInWeek] = {
                ...weekAssignments[idxInWeek],
                periodsPerWeek: p,
                isCustomized: true
              };
            } else if (p > 0) {
              const masterMatch = state.masterAssignments.find(
                m => m.classId === c.id && m.subjectId === 'sbj_khxh' && m.componentId === compId
              );
              const teacherId = masterMatch?.teacherId || '';
              weekAssignments.push({
                id: `wasg_rot_${w.id}_${c.id}_${compId}`,
                weekId: w.id,
                classId: c.id,
                subjectId: 'sbj_khxh',
                componentId: compId,
                teacherId,
                periodsPerWeek: p,
                isCustomized: true
              });
            }
          });
        }
      });

      store.saveWeeklyAssignments(w.id, weekAssignments);
    });

    setWeeklyList(store.getWeeklyAssignments(currentWeek.id));
    setShowRotationModal(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3500);
  };

  // Filter list by selected class or teacher
  const activeMasterList = masterList.filter(a =>
    filterMode === 'class' ? a.classId === selectedClassId : a.teacherId === selectedTeacherId
  );
  const activeWeeklyList = weeklyList.filter(a =>
    filterMode === 'class' ? a.classId === selectedClassId : a.teacherId === selectedTeacherId
  );

  const selectedTeacherInAdd = state.teachers.find(t => t.id === addTeacherId);
  const selectedSubjectObjInAdd = state.subjects.find(s => s.id === addSubjectId);

  // Sorted subjects for selected teacher in add modal (main & extra qualified subjects first)
  const sortedSubjectsForAdd = [...state.subjects].sort((a, b) => {
    if (!selectedTeacherInAdd) return 0;
    const aIsMain = selectedTeacherInAdd.mainSubjectId === a.id;
    const bIsMain = selectedTeacherInAdd.mainSubjectId === b.id;
    if (aIsMain) return -1;
    if (bIsMain) return 1;

    const aIsExtra = selectedTeacherInAdd.qualifiedSubjectIds?.includes(a.id);
    const bIsExtra = selectedTeacherInAdd.qualifiedSubjectIds?.includes(b.id);
    if (aIsExtra && !bIsExtra) return -1;
    if (!aIsExtra && bIsExtra) return 1;
    return 0;
  });

  const selectedClassObj = state.classes.find(c => c.id === selectedClassId);
  const selectedTeacherObj = state.teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">PHÂN CÔNG GIẢNG DẠY THCS</h1>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-medium">
              GDPT 2018
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Tự động lưu đồng bộ</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'master'
              ? 'Phân công gốc áp dụng cho tất cả các tuần. Dữ liệu thay đổi được tự động lưu & đồng bộ tức thì toàn hệ thống.'
              : `Phân công riêng cho ${currentWeek.name}. Thay đổi tại đây không làm ảnh hưởng phân công gốc.`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode toggle */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setMode('master')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'master' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              PHÂN CÔNG GỐC
            </button>
            <button
              onClick={() => setMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'weekly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              PHÂN CÔNG {currentWeek.name.toUpperCase()}
            </button>
          </div>

          {mode === 'weekly' && (
            <button
              onClick={() => {
                if (confirm(`Bạn có chắc muốn xóa và đặt lại phân công cho ${currentWeek.name} để khôi phục về Phân công gốc không?`)) {
                  store.resetWeeklyAssignments(currentWeek.id);
                  setWeeklyList(store.getWeeklyAssignments(currentWeek.id));
                  setSavedMsg(true);
                  setTimeout(() => setSavedMsg(false), 3000);
                }
              }}
              className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Xóa phân công riêng của tuần này và khôi phục về Phân công gốc"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Xóa phân công {currentWeek.name} (Về gốc)</span>
            </button>
          )}

          <button
            onClick={handleManualSaveAll}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Đồng bộ</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2 shadow-sm animate-pulse">
          <Check className="w-4 h-4" />
          <span>Đã lưu & đồng bộ dữ liệu phân công giảng dạy toàn hệ thống thành công!</span>
        </div>
      )}

      {/* Filter Mode Selector: View By Class vs View By Teacher */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">Chế độ hiển thị & Phân công:</span>
          </div>

          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode('class')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                filterMode === 'class'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Xem theo Lớp học</span>
            </button>
            <button
              onClick={() => setFilterMode('teacher')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                filterMode === 'teacher'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Xem theo Giáo viên</span>
            </button>
          </div>
        </div>

        {/* Filter List Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {filterMode === 'class' ? (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 flex-shrink-0">Chọn Lớp:</span>
              <div className="flex flex-wrap gap-1.5">
                {state.classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
                      selectedClassId === cls.id
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <span className="text-xs text-slate-400 flex-shrink-0">Chọn Giáo viên:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white font-semibold text-xs rounded-xl px-3 py-2 min-w-[280px] focus:outline-none focus:border-indigo-500"
              >
                {state.teachers.map(t => {
                  const mainSbj = state.subjects.find(s => s.id === t.mainSubjectId);
                  return (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 {t.fullName} ({t.code}) - Tổ {t.department} - Môn chính: {mainSbj?.name || 'Môn chung'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowRotationModal(true)}
              className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Cấu hình số tiết thay đổi luân phiên theo tuần cho phân môn KHTN & KHXH"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>⚡ Luân phiên tiết KHTN / KHXH</span>
            </button>

            <button
              onClick={() => {
                const count = store.syncTimetableWithAssignments(currentWeek.id);
                setSavedMsg(true);
                setTimeout(() => setSavedMsg(false), 3000);
                alert(`Đã đồng bộ và làm sạch giáo viên cho ${count} tiết trên Thời khóa biểu ${currentWeek.name}!`);
              }}
              className="flex items-center space-x-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Đồng bộ ngay giáo viên từ Phân công vào tất cả các tiết trên Thời khóa biểu"
            >
              <span>⚡ Đồng bộ sang TKB</span>
            </button>

            <button
              onClick={() => {
                const count = store.syncSubjectsToMasterAssignments();
                setMasterList([...state.masterAssignments]);
                alert(`Đã đồng bộ thành công! Đã tự động bổ sung ${count} phân công môn học mới cho các lớp.`);
              }}
              className="flex items-center space-x-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Đồng bộ tất cả môn học mới từ danh mục vào bảng phân công"
            >
              <span>⚡ Đồng bộ môn mới</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm phân công môn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignments Content Area: Table for Class Mode vs Reference Card Layout for Teacher Mode */}
      {filterMode === 'class' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
              <span>🏫 BẢNG PHÂN CÔNG GIẢNG DẠY LỚP {selectedClassObj?.name}</span>
            </h2>
            <span className="text-xs text-slate-400">
              Tổng số tiết phân công: <span className="font-bold text-indigo-400 text-sm">
                {mode === 'master'
                  ? activeMasterList.reduce((sum, a) => sum + a.periodsPerWeek, 0)
                  : activeWeeklyList.reduce((sum, a) => sum + a.periodsPerWeek, 0)} tiết/tuần
              </span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Phân môn (KHTN/KHXH)</th>
                  <th className="p-3">Giáo viên phụ trách</th>
                  <th className="p-3 text-center">Số tiết / tuần</th>
                  <th className="p-3">Ghi chú / Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mode === 'master' ? (
                  activeMasterList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                        Chưa có phân công môn học nào. Hãy bấm "+ Thêm phân công môn" để phân công.
                      </td>
                    </tr>
                  ) : (
                    activeMasterList.map(asg => {
                      const sbj = state.subjects.find(s => s.id === asg.subjectId);
                      const comp = sbj?.components?.find(c => c.id === asg.componentId);

                      return (
                        <tr key={asg.id} className="hover:bg-slate-850">
                          <td className="p-3 font-semibold text-white">
                            {sbj?.name} <span className="text-slate-500 font-mono text-[11px]">[{sbj?.code}]</span>
                          </td>
                          <td className="p-3">
                            {comp ? (
                              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                                {comp.name} ({comp.code})
                              </span>
                            ) : (
                              <span className="text-slate-500">Môn chung</span>
                            )}
                          </td>
                          <td className="p-3">
                            <select
                              value={asg.teacherId}
                              onChange={(e) => handleUpdateMasterTeacher(asg.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              {state.teachers.map(t => {
                                const isMain = t.mainSubjectId === asg.subjectId;
                                const isExtra = !isMain && (t.qualifiedSubjectIds?.includes(asg.subjectId) || (asg.componentId && t.qualifiedSubjectIds?.includes(asg.componentId)));
                                const tag = isMain ? '⭐️ ' : isExtra ? '⚡ ' : '';
                                const roleText = isMain ? ' (Môn chính)' : isExtra ? ' (Kiêm nhiệm)' : '';

                                return (
                                  <option key={t.id} value={t.id}>
                                    {tag}{t.fullName} ({t.code} - {t.department}){roleText}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              step="0.5"
                              value={asg.periodsPerWeek}
                              onChange={(e) => handleUpdateMasterPeriods(asg.id, e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="p-3 text-slate-400">
                            <span className="text-[11px] text-slate-500">Gốc cố định</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteMasterAssignment(asg.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                              title="Xóa phân công môn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  activeWeeklyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                        Chưa có phân công môn học nào cho tuần này.
                      </td>
                    </tr>
                  ) : (
                    activeWeeklyList.map(asg => {
                      const sbj = state.subjects.find(s => s.id === asg.subjectId);
                      const comp = sbj?.components?.find(c => c.id === asg.componentId);

                      return (
                        <tr key={asg.id} className="hover:bg-slate-850">
                          <td className="p-3 font-semibold text-white">
                            {sbj?.name} <span className="text-slate-500 font-mono text-[11px]">[{sbj?.code}]</span>
                          </td>
                          <td className="p-3">
                            {comp ? (
                              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                                {comp.name}
                              </span>
                            ) : (
                              <span className="text-slate-500">Môn chung</span>
                            )}
                          </td>
                          <td className="p-3">
                            <select
                              value={asg.teacherId}
                              onChange={(e) => handleUpdateWeeklyTeacher(asg.id, e.target.value)}
                              className={`bg-slate-950 border rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none ${
                                asg.isCustomized ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'
                              }`}
                            >
                              {state.teachers.map(t => {
                                const isMain = t.mainSubjectId === asg.subjectId;
                                const isExtra = !isMain && (t.qualifiedSubjectIds?.includes(asg.subjectId) || (asg.componentId && t.qualifiedSubjectIds?.includes(asg.componentId)));
                                const tag = isMain ? '⭐️ ' : isExtra ? '⚡ ' : '';
                                const roleText = isMain ? ' (Môn chính)' : isExtra ? ' (Kiêm nhiệm)' : '';

                                return (
                                  <option key={t.id} value={t.id}>
                                    {tag}{t.fullName} ({t.code} - {t.department}){roleText}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-400">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              step="0.5"
                              value={asg.periodsPerWeek}
                              onChange={(e) => handleUpdateWeeklyPeriods(asg.id, e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="p-3">
                            {asg.isCustomized ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                                Đã đổi cho riêng {currentWeek.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Theo phân công gốc</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteWeeklyAssignment(asg.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                              title="Xóa phân công môn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TEACHER CARD LAYOUT (MATCHING REFERENCE IMAGE) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Teacher Profile & Workload Summary Card */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {selectedTeacherObj?.fullName ? selectedTeacherObj.fullName.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTeacherObj?.fullName}</h3>
                  <p className="text-xs text-indigo-400 font-mono font-semibold">
                    {state.subjects.find(s => s.id === selectedTeacherObj?.mainSubjectId)?.name || selectedTeacherObj?.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (selectedTeacherObj) {
                      setEditTeacherData({
                        id: selectedTeacherObj.id,
                        code: selectedTeacherObj.code,
                        fullName: selectedTeacherObj.fullName,
                        department: selectedTeacherObj.department,
                        mainSubjectId: selectedTeacherObj.mainSubjectId,
                        maxPeriodsPerWeek: selectedTeacherObj.maxPeriodsPerWeek || 25,
                        maxPeriodsPerDay: selectedTeacherObj.maxPeriodsPerDay || 5
                      });
                      setShowEditTeacherModal(true);
                    }
                  }}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition"
                  title="Chỉnh sửa thông tin giáo viên"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (selectedTeacherObj && confirm(`Bạn có chắc muốn xóa giáo viên ${selectedTeacherObj.fullName}?`)) {
                      store.deleteTeacher(selectedTeacherObj.id);
                      setSelectedTeacherId(state.teachers[0]?.id || '');
                    }
                  }}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
                  title="Xóa giáo viên"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teaching Load Badge */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Tải dạy hiện tại:</span>
              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold px-3 py-1 rounded-lg">
                {activeMasterList.filter(a => a.teacherId === selectedTeacherId).reduce((sum, a) => sum + a.periodsPerWeek, 0)} tiết phân công
              </span>
            </div>

            {/* Normal & Supplementary Period Boxes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] text-slate-400 font-semibold uppercase leading-tight">
                  TIẾT BÌNH THƯỜNG <span className="text-[10px] text-slate-500 block font-normal">(Thực dạy: {activeMasterList.filter(a => a.teacherId === selectedTeacherId).reduce((sum, a) => sum + a.periodsPerWeek, 0)})</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white font-bold text-sm">
                  {activeMasterList.filter(a => a.teacherId === selectedTeacherId).reduce((sum, a) => sum + a.periodsPerWeek, 0)}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] text-slate-400 font-semibold uppercase leading-tight">
                  TIẾT BỔ SUNG <span className="text-[10px] text-slate-500 block font-normal">(Thực dạy: 0)</span>
                </div>
                <input
                  type="number" min="0" max="20"
                  defaultValue={0}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-indigo-400 font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Max limits per week / session */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">MAX TIẾT/TUẦN</span>
                <div className="text-white font-bold text-sm font-mono">
                  {selectedTeacherObj?.maxPeriodsPerWeek || 25}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">MAX TIẾT/BUỔI</span>
                <div className="text-white font-bold text-sm font-mono">
                  {selectedTeacherObj?.maxPeriodsPerDay || 5}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Teaching Assignments & Class Toggles */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                  <span className="text-indigo-400">🎓</span>
                  <span>PHÂN CÔNG GIẢNG DẠY</span>
                </h3>
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm môn</span>
                </button>
              </div>

              {/* Subject Assignment Cards with interactive class pills */}
              <div className="space-y-4">
                {(() => {
                  const teacherAssignments = (mode === 'master' ? masterList : weeklyList).filter(a => a.teacherId === selectedTeacherId);
                  
                  // Extract unique subjects/components assigned to this teacher
                  const assignedSubjects = new Map<string, { subjectId: string; componentId?: string; classIds: string[] }>();
                  teacherAssignments.forEach(a => {
                    const key = `${a.subjectId}_${a.componentId || 'none'}`;
                    if (!assignedSubjects.has(key)) {
                      assignedSubjects.set(key, { subjectId: a.subjectId, componentId: a.componentId, classIds: [] });
                    }
                    assignedSubjects.get(key)?.classIds.push(a.classId);
                  });

                  // If teacher has no assignments yet, show main subject
                  if (assignedSubjects.size === 0 && selectedTeacherObj?.mainSubjectId) {
                    assignedSubjects.set(`${selectedTeacherObj.mainSubjectId}_none`, {
                      subjectId: selectedTeacherObj.mainSubjectId,
                      classIds: []
                    });
                  }

                  if (assignedSubjects.size === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500 italic bg-slate-950 border border-slate-800 rounded-xl">
                        Giáo viên chưa được phân công môn học nào. Hãy bấm "+ Thêm môn" ở góc trên để phân công.
                      </div>
                    );
                  }

                  return Array.from(assignedSubjects.entries()).map(([key, item]) => {
                    const sbj = state.subjects.find(s => s.id === item.subjectId);
                    const comp = sbj?.components?.find(c => c.id === item.componentId);

                    return (
                      <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs bg-indigo-600/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                              {sbj?.name} {comp ? `- ${comp.name}` : ''}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.classIds.length} lớp phụ trách)
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubjectDetail({
                                subjectId: item.subjectId,
                                componentId: item.componentId,
                                subjectName: sbj?.name || '',
                                componentName: comp?.name
                              });
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition"
                          >
                            <span>⌖ Chi tiết tiết/phân môn</span>
                          </button>
                        </div>

                        {/* Class Pills Grid */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-slate-400 font-medium block">Lớp phụ trách (bấm để chọn/bỏ chọn lớp):</span>
                          <div className="flex flex-wrap gap-2">
                            {state.classes.map(cls => {
                              const isAssigned = item.classIds.includes(cls.id);

                              return (
                                <button
                                  key={cls.id}
                                   onClick={() => {
                                    const currentList = mode === 'master' ? masterList : weeklyList;
                                    const existingIndex = currentList.findIndex(
                                      a => a.classId === cls.id && a.subjectId === item.subjectId && (item.componentId ? a.componentId === item.componentId : !a.componentId)
                                    );

                                    if (existingIndex >= 0) {
                                      const existing = currentList[existingIndex];
                                      if (existing.teacherId === selectedTeacherId) {
                                        // Remove assignment
                                        if (mode === 'master') {
                                          const newList = masterList.filter((_, idx) => idx !== existingIndex);
                                          syncMaster(newList);
                                        } else {
                                          const newList = weeklyList.filter((_, idx) => idx !== existingIndex);
                                          syncWeekly(newList);
                                        }
                                      } else {
                                        // Reassign to selected teacher
                                        if (mode === 'master') {
                                          const newList = [...masterList];
                                          newList[existingIndex] = { ...existing, teacherId: selectedTeacherId };
                                          syncMaster(newList);
                                        } else {
                                          const newList = [...weeklyList];
                                          newList[existingIndex] = { ...existing, teacherId: selectedTeacherId };
                                          syncWeekly(newList);
                                        }
                                      }
                                    } else {
                                      // Create new assignment
                                      const defaultP = comp?.defaultPeriodsPerWeek || sbj?.defaultPeriodsPerWeek || 2;
                                      const newAsg = {
                                        id: `asg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                        academicYearId: currentWeek.academicYearId,
                                        weekId: currentWeek.id,
                                        classId: cls.id,
                                        subjectId: item.subjectId,
                                        componentId: item.componentId,
                                        teacherId: selectedTeacherId,
                                        periodsPerWeek: defaultP,
                                        isCustomized: true
                                      };

                                      if (mode === 'master') {
                                        const newList = [...masterList, newAsg];
                                        syncMaster(newList);
                                      } else {
                                        const newList = [...weeklyList, newAsg];
                                        syncWeekly(newList);
                                      }
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                                    isAssigned
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  {cls.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Leave / Time off section matching image */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                  <span className="text-amber-400">⏱️</span>
                  <span>LỊCH XIN NGHỈ</span>
                </h3>
                <button
                  onClick={() => alert('Tính năng thêm lịch xin nghỉ cá nhân giáo viên.')}
                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm lịch nghỉ</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 italic">Không có lịch nghỉ</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Assignment - TEACHER -> SUBJECT -> MULTI-CLASS WORKFLOW */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => handleCreateAssignment(e, false)} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>PHÂN CÔNG THEO GIÁO VIÊN</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn Giáo viên ➔ Chọn Môn học ➔ Chọn các Lớp được phân công giảng dạy
                </p>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold">
                Đồng bộ tự động
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* BƯỚC 1: CHỌN GIÁO VIÊN */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-1.5">
                <label className="block text-indigo-300 font-bold flex items-center justify-between text-xs">
                  <span>1. CHỌN GIÁO VIÊN GIẢNG DẠY <span className="text-rose-400">*</span></span>
                  {selectedTeacherInAdd && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      Tổ chuyên môn: <strong className="text-slate-200">{selectedTeacherInAdd.department}</strong>
                    </span>
                  )}
                </label>
                <select
                  value={addTeacherId}
                  onChange={(e) => handleTeacherChangeInAdd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {state.teachers.map(t => {
                    const mainSbj = state.subjects.find(s => s.id === t.mainSubjectId);
                    return (
                      <option key={t.id} value={t.id}>
                        👨‍🏫 {t.fullName} ({t.code} - Tổ {t.department}) - Môn chính: {mainSbj?.name || 'Môn chung'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* BƯỚC 2: CHỌN MÔN HỌC */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-300 font-bold text-xs">
                  2. CHỌN MÔN HỌC PHÂN CÔNG <span className="text-rose-400">*</span>
                </label>
                <select
                  value={addSubjectId}
                  onChange={(e) => handleSubjectChangeInAdd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  {sortedSubjectsForAdd.map(s => {
                    const isMain = selectedTeacherInAdd?.mainSubjectId === s.id;
                    const isExtra = !isMain && selectedTeacherInAdd?.qualifiedSubjectIds?.includes(s.id);
                    const tag = isMain ? '⭐️ [Môn chính] ' : isExtra ? '⚡ [Kiêm nhiệm] ' : '';

                    return (
                      <option key={s.id} value={s.id}>
                        {tag}{s.name} ({s.code}) - Mặc định {s.defaultPeriodsPerWeek || 3} tiết/tuần
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* PHÂN MÔN CỤ THỂ (NẾU MÔN CÓ PHÂN MÔN) */}
              {selectedSubjectObjInAdd?.hasComponents && selectedSubjectObjInAdd.components && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-slate-300 font-bold text-xs">
                    PHÂN MÔN CỤ THỂ (KHTN / KHXH)
                  </label>
                  <select
                    value={addComponentId}
                    onChange={(e) => setAddComponentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Môn chung</option>
                    {selectedSubjectObjInAdd.components.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* BƯỚC 3: CHỌN CÁC LỚP HỌC ĐƯỢC GIẢNG DẠY */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-slate-300 font-bold text-xs">
                    3. CHỌN (CÁC) LỚP HỌC ĐƯỢC GIẢNG DẠY <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Đã chọn: {addClassIds.length} lớp
                  </span>
                </div>

                {/* Quick select buttons */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllClassesInAdd}
                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium transition"
                  >
                    {addClassIds.length === state.classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả lớp'}
                  </button>
                  {state.grades.map(g => {
                    const gradeClasses = state.classes.filter(c => c.gradeId === g.id);
                    const isAllGradeSelected = gradeClasses.length > 0 && gradeClasses.every(c => addClassIds.includes(c.id));
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => selectGradeClassesInAdd(g.id)}
                        className={`px-2.5 py-1 border rounded-lg font-medium transition ${
                          isAllGradeSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {g.name || `Khối ${g.code}`} ({gradeClasses.length})
                      </button>
                    );
                  })}
                </div>

                {/* Class grid checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                  {state.classes.map(c => {
                    const isSelected = addClassIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleClassSelectionInAdd(c.id)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold shadow-sm'
                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${
                            isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="text-xs">{c.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-normal">
                          {c.shift === 'morning' ? 'Sáng' : c.shift === 'afternoon' ? 'Chiều' : 'Cả 2'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BƯỚC 4: SỐ TIẾT PHÂN CÔNG / TUẦN */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-300 font-bold text-xs">
                  4. SỐ TIẾT PHÂN CÔNG / TUẦN / LỚP
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step="0.5"
                    value={addPeriods}
                    onChange={(e) => setAddPeriods(e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                    className="w-32 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-bold text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 text-xs">tiết/tuần cho mỗi lớp được chọn</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddAssignment(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Hủy
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={addClassIds.length === 0}
                  onClick={(e) => handleCreateAssignment(e, true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
                >
                  + Thêm & Tiếp tục
                </button>
                <button
                  type="submit"
                  disabled={addClassIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  Thêm cho {addClassIds.length} lớp & Đóng
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* MODAL: KHTN / KHXH ALTERNATING WEEKLY PERIODS CONFIGURATOR */}
      {showRotationModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>CẤU HÌNH LUÂN PHIÊN TIẾT MÔN KHTN & KHXH THEO TUẦN</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tự động luân phiên số tiết các phân môn (Lí, Hóa, Sinh / Sử, Địa) giữa Tuần Lẻ và Tuần Chẵn cho từng khối lớp
                </p>
              </div>
              <button
                onClick={() => setShowRotationModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Subject Selector Tabs */}
            <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRotationTab('khtn')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  activeRotationTab === 'khtn'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🧪 Môn Khoa học tự nhiên (KHTN)</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                  Lí - Hóa - Sinh
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRotationTab('khxh')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  activeRotationTab === 'khxh'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📜 Môn Lịch sử và Địa lí (KHXH)</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                  Lịch sử - Địa lí
                </span>
              </button>
            </div>

            {/* Config Instructions */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-200 flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-amber-300 font-bold block text-xs uppercase tracking-wide">
                  ✨ LUÂN PHIÊN TỰ ĐỘNG THEO KHỐI LỚP (Khối 6, Khối 7, Khối 8, Khối 9)
                </strong>
                <p className="text-amber-200/90 text-[11px] leading-relaxed">
                  Quý thầy cô cấu hình số tiết theo <strong>Khối lớp</strong>. Hệ thống sẽ <strong>tự động áp dụng đồng bộ cho TẤT CẢ LỚP HỌC trong khối</strong> (ví dụ: tất cả các lớp 6A1, 6A2, 6A3...) qua 37 tuần học giữa Tuần Lẻ (Tuần 1, 3, 5...) và Tuần Chẵn (Tuần 2, 4, 6...), <strong>KHÔNG CẦN CHỌN VÀ CẤU HÌNH THỦ CÔNG TỪNG LỚP!</strong>
                </p>
              </div>
            </div>

            {/* Matrix of Grades */}
            <div className="space-y-4">
              {state.grades.map(grade => {
                const gradeId = grade.id;
                const isKhtn = activeRotationTab === 'khtn';

                if (isKhtn) {
                  const cfg = rotationKhtn[gradeId] || { odd: { phy: 2, chem: 0, bio: 2 }, even: { phy: 1, chem: 2, bio: 1 } };
                  const oddTotal = cfg.odd.phy + cfg.odd.chem + cfg.odd.bio;
                  const evenTotal = cfg.even.phy + cfg.even.chem + cfg.even.bio;

                  return (
                    <div key={gradeId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-bold text-white text-sm flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                          <span>{(grade.name || `KHỐI ${grade.code}`).toUpperCase()} (KHTN)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Tổng tiết / tuần: <strong className="text-indigo-400">{oddTotal}t</strong> (Lẻ) / <strong className="text-indigo-400">{evenTotal}t</strong> (Chẵn)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Odd Week Config */}
                        <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center text-indigo-300 font-bold border-b border-slate-800 pb-1.5 text-[11px]">
                            <span>📅 TUẦN LẺ (Tuần 1, 3, 5, 7...)</span>
                            <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono">
                              Tổng: {oddTotal} tiết
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Vật lí</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.odd.phy}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], odd: { ...prev[gradeId]?.odd, phy: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-amber-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Hóa học</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.odd.chem}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], odd: { ...prev[gradeId]?.odd, chem: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-amber-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Sinh học</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.odd.bio}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], odd: { ...prev[gradeId]?.odd, bio: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-amber-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Even Week Config */}
                        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center text-emerald-300 font-bold border-b border-slate-800 pb-1.5 text-[11px]">
                            <span>📅 TUẦN CHẮN (Tuần 2, 4, 6, 8...)</span>
                            <span className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
                              Tổng: {evenTotal} tiết
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Vật lí</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.even.phy}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], even: { ...prev[gradeId]?.even, phy: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Hóa học</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.even.chem}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], even: { ...prev[gradeId]?.even, chem: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Sinh học</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.even.bio}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhtn(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], even: { ...prev[gradeId]?.even, bio: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-emerald-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const cfg = rotationKhxh[gradeId] || { odd: { hist: 2, geo: 1 }, even: { hist: 1, geo: 2 } };
                  const oddTotal = cfg.odd.hist + cfg.odd.geo;
                  const evenTotal = cfg.even.hist + cfg.even.geo;

                  return (
                    <div key={gradeId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-bold text-white text-sm flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                          <span>{(grade.name || `KHỐI ${grade.code}`).toUpperCase()} (KHXH)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Tổng tiết / tuần: <strong className="text-indigo-400">{oddTotal}t</strong> (Lẻ) / <strong className="text-indigo-400">{evenTotal}t</strong> (Chẵn)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Odd Week Config */}
                        <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center text-indigo-300 font-bold border-b border-slate-800 pb-1.5 text-[11px]">
                            <span>📅 TUẦN LẺ (Tuần 1, 3, 5, 7...)</span>
                            <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono">
                              Tổng: {oddTotal} tiết
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Lịch sử</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.odd.hist}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhxh(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], odd: { ...prev[gradeId]?.odd, hist: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-amber-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Địa lí</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.odd.geo}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhxh(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], odd: { ...prev[gradeId]?.odd, geo: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-amber-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Even Week Config */}
                        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center text-emerald-300 font-bold border-b border-slate-800 pb-1.5 text-[11px]">
                            <span>📅 TUẦN CHẮN (Tuần 2, 4, 6, 8...)</span>
                            <span className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
                              Tổng: {evenTotal} tiết
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Lịch sử</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.even.hist}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhxh(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], even: { ...prev[gradeId]?.even, hist: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Địa lí</label>
                              <input
                                type="number" min="0" max="10" step="0.5"
                                value={cfg.even.geo}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRotationKhxh(prev => ({
                                    ...prev,
                                    [gradeId]: { ...prev[gradeId], even: { ...prev[gradeId]?.even, geo: val } }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center font-bold text-emerald-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRotationModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Hủy bỏ
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleApplyWeeklyRotation(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
                >
                  Áp dụng Khối cho {activeRotationTab === 'khtn' ? 'môn KHTN' : 'môn KHXH'}
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWeeklyRotation(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>⚡ Áp dụng cho TẤT CẢ KHỐI (Cả KHTN & KHXH)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Subject Detail & Conflict/Assignment Error Handling */}
      {selectedSubjectDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span className="text-indigo-400">⌖</span>
                  <span>CHI TIẾT PHÂN MÔN & XỬ LÝ LỖI: {selectedSubjectDetail.subjectName} {selectedSubjectDetail.componentName ? `- ${selectedSubjectDetail.componentName}` : ''}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kiểm tra định mức tiết, phân công giáo viên và xử lý các xung đột phân công / thời khóa biểu
                </p>
              </div>
              <button
                onClick={() => setSelectedSubjectDetail(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh sách lớp & Giáo viên phụ trách</h4>
                <div className="space-y-2">
                  {state.classes.map(cls => {
                    const currentList = mode === 'master' ? masterList : weeklyList;
                    const asg = currentList.find(a => 
                      a.classId === cls.id && 
                      a.subjectId === selectedSubjectDetail.subjectId && 
                      (selectedSubjectDetail.componentId ? a.componentId === selectedSubjectDetail.componentId : !a.componentId)
                    );
                    const tch = state.teachers.find(t => t.id === asg?.teacherId);

                    return (
                      <div key={cls.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">{cls.name}</span>
                          <span className="text-slate-300">
                            GV: <strong className={tch ? 'text-indigo-400' : 'text-red-400'}>{tch ? tch.fullName : '⚠️ Chưa phân công GV'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-mono text-[11px]">{asg ? `${asg.periodsPerWeek} tiết/tuần` : 'Chưa gán'}</span>
                          <input
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={asg?.periodsPerWeek || 2}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 2;
                              if (asg) {
                                if (mode === 'master') {
                                  const newList = masterList.map(m => m.id === asg.id ? { ...m, periodsPerWeek: p } : m);
                                  syncMaster(newList);
                                } else {
                                  const newList = weeklyList.map(w => w.id === asg.id ? { ...w, periodsPerWeek: p, isCustomized: true } : w);
                                  store.saveWeeklyAssignments(currentWeek.id, newList);
                                  setWeeklyList(newList);
                                }
                              }
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center font-bold text-white text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Xử lý lỗi phân công & TKB</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nếu phát hiện giáo viên bị lệch số tiết hoặc TKB chưa đồng bộ với phân công, bạn có thể chạy đồng bộ tự động hoặc chạy lại thuật toán xếp lịch (Solver).
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => {
                      const count = store.syncTimetableWithAssignments(currentWeek.id);
                      const res = store.scanAndFixTimetable(currentWeek.id);
                      alert(`Đã đồng bộ thành công cho ${count} tiết môn này và lấp đầy ${res.fixedCount} tiết TKB!`);
                      setSelectedSubjectDetail(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow"
                  >
                    ⚡ Đồng bộ & Xếp lại TKB môn này
                  </button>
                  <button
                    onClick={() => setSelectedSubjectDetail(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER INFO */}
      {showEditTeacherModal && editTeacherData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateTeacherInfo} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <span>CHỈNH SỬA THÔNG TIN GIÁO VIÊN</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditTeacherModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Họ và tên giáo viên <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={editTeacherData.fullName}
                  onChange={(e) => setEditTeacherData({ ...editTeacherData, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mã GV</label>
                  <input
                    type="text"
                    required
                    value={editTeacherData.code}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tổ chuyên môn</label>
                  <input
                    type="text"
                    required
                    value={editTeacherData.department}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Môn chuyên môn chính</label>
                <select
                  value={editTeacherData.mainSubjectId}
                  onChange={(e) => setEditTeacherData({ ...editTeacherData, mainSubjectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {state.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max Tiết/Tuần</label>
                  <input
                    type="number"
                    min="0"
                    value={editTeacherData.maxPeriodsPerWeek}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, maxPeriodsPerWeek: parseInt(e.target.value) || 0 })}
                    placeholder="VD: 39"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max Tiết/Buổi</label>
                  <input
                    type="number"
                    min="1"
                    value={editTeacherData.maxPeriodsPerDay}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, maxPeriodsPerDay: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditTeacherModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

