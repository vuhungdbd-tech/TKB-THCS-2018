import React, { useState } from 'react';
import { BookOpen, Users, GraduationCap, Home, Plus, Trash2, Edit2, Layers, Check, Sun, Moon, Clock, Settings, AlertCircle, ShieldAlert, FolderKanban, Award, Star, UserCheck, Briefcase } from 'lucide-react';
import { store } from '../database/store';
import { ClassRoom, Subject, Teacher, Room, Grade, SubjectComponent, Department } from '../types';
import { initialDepartments } from '../database/mockData';

export const CategoriesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'teachers' | 'departments' | 'rooms'>('classes');
  const state = store.getState();

  const [classes, setClasses] = useState<ClassRoom[]>(state.classes);
  const [subjects, setSubjects] = useState<Subject[]>(state.subjects);
  const [teachers, setTeachers] = useState<Teacher[]>(state.teachers);
  const [rooms, setRooms] = useState<Room[]>(state.rooms);
  const [departments, setDepartments] = useState<Department[]>(state.departments && state.departments.length > 0 ? state.departments : initialDepartments);

  // Filter grade for class view
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  // Filter department for teacher view
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Modal states for Department Creation, Editing & Deletion
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptHeadTeacher, setNewDeptHeadTeacher] = useState('');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDeptTarget, setDeletingDeptTarget] = useState<Department | null>(null);
  const [transferTargetDept, setTransferTargetDept] = useState<string>('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [showBatchDeleteDeptModal, setShowBatchDeleteDeptModal] = useState<boolean>(false);

  // Modal states for Class Creation & Editing
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('grade_6');
  const [newClassShift, setNewClassShift] = useState<'morning' | 'afternoon' | 'both'>('morning');
  const [newClassHeadTeacher, setNewClassHeadTeacher] = useState<string>('');
  const [newClassRoom, setNewClassRoom] = useState<string>('');
  const [newClassStudents, setNewClassStudents] = useState<number>(40);
  const [newClassMaxPeriods, setNewClassMaxPeriods] = useState<number>(5);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Modal states for Teacher Creation & Editing
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('Tổ KHTN');
  const [newTeacherMainSubject, setNewTeacherMainSubject] = useState(subjects[0]?.id || 'sbj_toan');
  const [newTeacherExtraSubjects, setNewTeacherExtraSubjects] = useState<string[]>([]);
  const [newTeacherMaxWeek, setNewTeacherMaxWeek] = useState<number>(18);
  const [newTeacherMaxDay, setNewTeacherMaxDay] = useState<number>(6);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const toggleExtraSubjectInAdd = (subjectId: string) => {
    setNewTeacherExtraSubjects(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const toggleExtraSubjectInEdit = (subjectId: string) => {
    if (!editingTeacher) return;
    const current = editingTeacher.qualifiedSubjectIds || [editingTeacher.mainSubjectId];
    const updated = current.includes(subjectId)
      ? current.filter(id => id !== subjectId)
      : [...current, subjectId];
    // Always include mainSubjectId
    const finalQualified = Array.from(new Set([editingTeacher.mainSubjectId, ...updated]));
    setEditingTeacher({ ...editingTeacher, qualifiedSubjectIds: finalQualified });
  };

  // Modal states for Subject Creation & Editing
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<'natural_science' | 'social_science' | 'general' | 'elective'>('general');
  const [newSubjectDefaultPeriods, setNewSubjectDefaultPeriods] = useState<number>(3);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // ================= DEPARTMENTS LOGIC =================
  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode || !newDeptName) return;

    const newDept: Department = {
      id: `dept_${Date.now()}`,
      code: newDeptCode.trim().toUpperCase(),
      name: newDeptName.trim(),
      description: newDeptDesc.trim() || undefined,
      headTeacherId: newDeptHeadTeacher || undefined
    };

    const updated = [...departments, newDept];
    setDepartments(updated);
    state.departments = updated;
    store.addAuditLog('Tạo tổ chuyên môn', `Đã thêm tổ chuyên môn mới: ${newDept.name}`);
    store.save();

    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptDesc('');
    setNewDeptHeadTeacher('');
    setShowAddDept(false);
  };

  const handleUpdateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    const oldDept = departments.find(d => d.id === editingDept.id);
    const updated = departments.map(d => d.id === editingDept.id ? editingDept : d);
    setDepartments(updated);
    state.departments = updated;

    if (oldDept && oldDept.name !== editingDept.name) {
      const updatedTeachers = teachers.map(t => t.department === oldDept.name ? { ...t, department: editingDept.name } : t);
      setTeachers(updatedTeachers);
      state.teachers = updatedTeachers;
    }

    store.addAuditLog('Cập nhật tổ chuyên môn', `Đã cập nhật tổ chuyên môn: ${editingDept.name}`);
    store.save();
    setEditingDept(null);
  };

  const handleOpenDeleteDeptModal = (dept: Department) => {
    const otherDepts = departments.filter(d => d.id !== dept.id);
    const defaultTransfer = otherDepts[0]?.name || 'Chưa phân tổ';
    setDeletingDeptTarget(dept);
    setTransferTargetDept(defaultTransfer);
  };

  const handleConfirmDeleteDept = () => {
    if (!deletingDeptTarget) return;

    const deptId = deletingDeptTarget.id;
    const deptName = deletingDeptTarget.name;
    const updatedDepts = departments.filter(d => d.id !== deptId);
    setDepartments(updatedDepts);
    state.departments = updatedDepts;

    // Transfer teachers in deleted department
    const teachersInDept = teachers.filter(t => t.department === deptName);
    if (teachersInDept.length > 0) {
      const fallbackDeptName = transferTargetDept || updatedDepts[0]?.name || 'Chưa phân tổ';
      const updatedTeachers = teachers.map(t => t.department === deptName ? { ...t, department: fallbackDeptName } : t);
      setTeachers(updatedTeachers);
      state.teachers = updatedTeachers;
    }

    // Also remove from selectedDeptIds if present
    setSelectedDeptIds(prev => prev.filter(id => id !== deptId));

    store.addAuditLog('Xóa tổ chuyên môn', `Đã xóa tổ chuyên môn ${deptName} (Chuyển ${teachersInDept.length} GV sang ${transferTargetDept || 'Chưa phân tổ'})`);
    store.save();
    setDeletingDeptTarget(null);
  };

  const toggleSelectDeptForDelete = (deptId: string) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleToggleSelectAllDepts = () => {
    if (selectedDeptIds.length === departments.length) {
      setSelectedDeptIds([]);
    } else {
      setSelectedDeptIds(departments.map(d => d.id));
    }
  };

  const handleConfirmBatchDeleteDepts = () => {
    if (selectedDeptIds.length === 0) return;

    const deptsToDelete = departments.filter(d => selectedDeptIds.includes(d.id));
    const deletedDeptNames = deptsToDelete.map(d => d.name);

    const remainingDepts = departments.filter(d => !selectedDeptIds.includes(d.id));
    setDepartments(remainingDepts);
    state.departments = remainingDepts;

    // Fallback department for teachers whose department was deleted
    const fallbackDeptName = transferTargetDept || remainingDepts[0]?.name || 'Chưa phân tổ';
    const updatedTeachers = teachers.map(t =>
      deletedDeptNames.includes(t.department) ? { ...t, department: fallbackDeptName } : t
    );
    setTeachers(updatedTeachers);
    state.teachers = updatedTeachers;

    store.addAuditLog('Xóa hàng loạt tổ chuyên môn', `Đã xóa ${selectedDeptIds.length} tổ chuyên môn: ${deletedDeptNames.join(', ')}`);
    store.save();

    setSelectedDeptIds([]);
    setShowBatchDeleteDeptModal(false);
  };

  // ================= CLASSES LOGIC =================
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassCode || !newClassName) return;

    const newCls: ClassRoom = {
      id: `cls_${Date.now()}`,
      code: newClassCode,
      name: newClassName,
      gradeId: newClassGrade,
      shift: newClassShift,
      headTeacherId: newClassHeadTeacher || undefined,
      roomName: newClassRoom || undefined,
      studentCount: newClassStudents || 40,
      maxPeriodsPerDay: newClassMaxPeriods || (newClassShift === 'both' ? 8 : 5),
      status: 'active'
    };

    const updated = [...classes, newCls];
    setClasses(updated);
    state.classes = updated;
    store.addAuditLog('Tạo lớp mới', `Đã thêm lớp ${newClassName}`);
    store.save();

    setNewClassCode('');
    setNewClassName('');
    setShowAddClass(false);
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const updated = classes.map(c => c.id === editingClass.id ? editingClass : c);
    setClasses(updated);
    state.classes = updated;
    store.addAuditLog('Cập nhật lớp', `Đã cập nhật cấu hình lớp ${editingClass.name}`);
    store.save();
    setEditingClass(null);
  };

  const handleDeleteClass = (classId: string, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp ${className}?`)) return;
    const updated = classes.filter(c => c.id !== classId);
    setClasses(updated);
    state.classes = updated;
    store.addAuditLog('Xóa lớp học', `Đã xóa lớp ${className}`);
    store.save();
  };

  const handleBatchSetGradeShift = (gradeId: string, shift: 'morning' | 'afternoon' | 'both') => {
    const defaultMaxPeriods = shift === 'both' ? 8 : 5;
    const updated = classes.map(c => {
      if (c.gradeId === gradeId) {
        return {
          ...c,
          shift,
          maxPeriodsPerDay: defaultMaxPeriods
        };
      }
      return c;
    });

    setClasses(updated);
    state.classes = updated;
    const gradeObj = state.grades.find(g => g.id === gradeId);
    const shiftLabel = shift === 'morning' ? 'Buổi Sáng' : shift === 'afternoon' ? 'Buổi Chiều' : 'Cả 2 Buổi';
    store.addAuditLog('Cấu hình ca học Khối', `Đã chuyển toàn bộ ${gradeObj?.name || gradeId} sang ${shiftLabel}`);
    store.save();
  };

  // ================= TEACHERS LOGIC =================
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherCode || !newTeacherName) return;

    const combinedQualified = Array.from(new Set([newTeacherMainSubject, ...newTeacherExtraSubjects]));

    const newTch: Teacher = {
      id: `tch_${Date.now()}`,
      code: newTeacherCode,
      fullName: newTeacherName,
      department: newTeacherDept,
      mainSubjectId: newTeacherMainSubject,
      qualifiedSubjectIds: combinedQualified,
      maxPeriodsPerWeek: newTeacherMaxWeek || 18,
      maxPeriodsPerDay: newTeacherMaxDay || 6,
      maxSessionsPerDay: 2,
      maxDaysPerWeek: 5,
      status: 'active'
    };

    const updated = [...teachers, newTch];
    setTeachers(updated);
    state.teachers = updated;
    store.addAuditLog('Tạo giáo viên mới', `Đã thêm GV ${newTeacherName} (Dạy ${combinedQualified.length} môn)`);
    store.save();

    setNewTeacherCode('');
    setNewTeacherName('');
    setNewTeacherExtraSubjects([]);
    setShowAddTeacher(false);
  };

  const handleUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const qualified = Array.from(new Set([editingTeacher.mainSubjectId, ...(editingTeacher.qualifiedSubjectIds || [])]));
    const updatedTch = { ...editingTeacher, qualifiedSubjectIds: qualified };

    const updated = teachers.map(t => t.id === updatedTch.id ? updatedTch : t);
    setTeachers(updated);
    state.teachers = updated;
    store.addAuditLog('Cập nhật Giáo viên', `Đã cập nhật GV ${editingTeacher.fullName} (Dạy ${qualified.length} môn)`);
    store.save();
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (teacherId: string, teacherName: string, teacherCode: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giáo viên ${teacherName} (${teacherCode}) khỏi hệ thống?\nLưu ý: Thao tác này sẽ bỏ phân công chủ nhiệm và dạy học của giáo viên này.`)) return;

    // Filter out teacher
    const updatedTeachers = teachers.filter(t => t.id !== teacherId);
    setTeachers(updatedTeachers);
    state.teachers = updatedTeachers;

    // Remove from head teacher assignments in classes
    const updatedClasses = classes.map(c => c.headTeacherId === teacherId ? { ...c, headTeacherId: undefined } : c);
    setClasses(updatedClasses);
    state.classes = updatedClasses;

    store.addAuditLog('Xóa Giáo viên', `Đã xóa GV ${teacherName} (${teacherCode})`);
    store.save();
  };

  const handleQuickUpdateTeacherMaxWeek = (teacherId: string, newMaxWeek: number) => {
    const updated = teachers.map(t => t.id === teacherId ? { ...t, maxPeriodsPerWeek: Math.max(1, newMaxWeek) } : t);
    setTeachers(updated);
    state.teachers = updated;
    store.save();
  };

  const handleQuickUpdateTeacherMaxDay = (teacherId: string, newMaxDay: number) => {
    const updated = teachers.map(t => t.id === teacherId ? { ...t, maxPeriodsPerDay: Math.max(1, newMaxDay) } : t);
    setTeachers(updated);
    state.teachers = updated;
    store.save();
  };

  // ================= SUBJECTS LOGIC =================
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode || !newSubjectName) return;

    const newSbj: Subject = {
      id: `sbj_${Date.now()}`,
      code: newSubjectCode,
      name: newSubjectName,
      category: newSubjectCategory,
      hasComponents: false,
      defaultPeriodsPerWeek: newSubjectDefaultPeriods || 3
    };

    const updated = [...subjects, newSbj];
    setSubjects(updated);
    state.subjects = updated;
    store.syncSubjectsToMasterAssignments();
    store.addAuditLog('Tạo môn học mới', `Đã thêm môn ${newSubjectName} (${newSubjectDefaultPeriods} tiết/tuần)`);
    store.save();

    setNewSubjectCode('');
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    const updated = subjects.map(s => s.id === editingSubject.id ? editingSubject : s);
    setSubjects(updated);
    state.subjects = updated;
    store.syncSubjectsToMasterAssignments();
    store.addAuditLog('Cập nhật môn học', `Đã cập nhật môn ${editingSubject.name} (${editingSubject.defaultPeriodsPerWeek} tiết/tuần)`);
    store.save();
    setEditingSubject(null);
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa môn học ${subjectName}?`)) return;

    const updated = subjects.filter(s => s.id !== subjectId);
    setSubjects(updated);
    state.subjects = updated;
    store.addAuditLog('Xóa môn học', `Đã xóa môn ${subjectName}`);
    store.save();
  };

  const handleQuickUpdateSubjectPeriods = (subjectId: string, periods: number) => {
    const updated = subjects.map(s => s.id === subjectId ? { ...s, defaultPeriodsPerWeek: Math.max(0.5, periods) } : s);
    setSubjects(updated);
    state.subjects = updated;
    store.save();
  };

  const handleQuickUpdateComponentPeriods = (subjectId: string, componentId: string, periods: number) => {
    const newPeriods = Math.max(0.5, periods);
    const updated = subjects.map(s => {
      if (s.id === subjectId && s.components) {
        const updatedComps = s.components.map(c => c.id === componentId ? { ...c, defaultPeriodsPerWeek: newPeriods } : c);
        const totalPeriods = updatedComps.reduce((sum, c) => sum + (c.defaultPeriodsPerWeek || 0), 0);
        return {
          ...s,
          components: updatedComps,
          defaultPeriodsPerWeek: totalPeriods
        };
      }
      return s;
    });

    setSubjects(updated);
    state.subjects = updated;
    const sbjObj = subjects.find(s => s.id === subjectId);
    const compObj = sbjObj?.components?.find(c => c.id === componentId);
    store.addAuditLog('Cập nhật tiết phân môn', `Đã cập nhật phân môn ${compObj?.name || componentId}: ${newPeriods} tiết/tuần`);
    store.save();
  };

  const filteredClasses = selectedGradeFilter === 'all'
    ? classes
    : classes.filter(c => c.gradeId === selectedGradeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">QUẢN LÝ DANH MỤC & ĐỊNH MỨC GIẢNG DẠY</h1>
          <p className="text-xs text-slate-400">Thiết lập linh hoạt định mức tiết học, thêm/sửa/xóa giáo viên và cấu hình ca học lớp.</p>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lớp học ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'subjects' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Môn & Phân môn ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Giáo viên ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'departments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tổ chuyên môn ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Phòng học ({rooms.length})
          </button>
        </div>
      </div>

      {/* TAB 1: LỚP HỌC */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Batch Grade Shift Setup */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>Cấu hình nhanh ca học theo Khối (Sáng / Chiều / 2 Buổi)</span>
            </div>
            <p className="text-xs text-slate-400">
              Chỉ định buổi học chính cho toàn bộ các lớp trong Khối với 1 cú nhấp chuột.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {state.grades.map((grd) => {
                const gradeClasses = classes.filter(c => c.gradeId === grd.id);
                const morningCount = gradeClasses.filter(c => (c.shift || 'morning') === 'morning').length;
                const afternoonCount = gradeClasses.filter(c => c.shift === 'afternoon').length;
                const bothCount = gradeClasses.filter(c => c.shift === 'both').length;

                return (
                  <div key={grd.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">{grd.name} ({gradeClasses.length} lớp)</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {morningCount > 0 ? `${morningCount} Sáng` : ''}
                        {afternoonCount > 0 ? ` ${afternoonCount} Chiều` : ''}
                        {bothCount > 0 ? ` ${bothCount} 2-Buổi` : ''}
                      </span>
                    </div>

                    <div className="flex gap-1 text-[11px]">
                      <button
                        onClick={() => handleBatchSetGradeShift(grd.id, 'morning')}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-1 rounded-lg text-center transition"
                        title="Đặt toàn bộ khối học Buổi Sáng"
                      >
                        🌅 Sáng
                      </button>
                      <button
                        onClick={() => handleBatchSetGradeShift(grd.id, 'afternoon')}
                        className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 py-1 rounded-lg text-center transition"
                        title="Đặt toàn bộ khối học Buổi Chiều"
                      >
                        🌇 Chiều
                      </button>
                      <button
                        onClick={() => handleBatchSetGradeShift(grd.id, 'both')}
                        className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 py-1 rounded-lg text-center transition"
                        title="Đặt toàn bộ khối học Cả 2 Buổi"
                      >
                        ☀️🌙 2 Buổi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH LỚP HỌC THCS</h2>
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">Toàn bộ các khối ({classes.length} lớp)</option>
                {state.grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddClass(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp học mới</span>
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredClasses.map((cls) => {
              const headTch = teachers.find(t => t.id === cls.headTeacherId);
              const shift = cls.shift || 'morning';

              return (
                <div key={cls.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition relative group shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-extrabold text-white">{cls.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {cls.code}
                      </span>
                    </div>

                    {shift === 'morning' && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <Sun className="w-3 h-3 text-emerald-400" />
                        <span>Sáng</span>
                      </span>
                    )}
                    {shift === 'afternoon' && (
                      <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <Moon className="w-3 h-3 text-purple-400" />
                        <span>Chiều</span>
                      </span>
                    )}
                    {shift === 'both' && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>2 Buổi</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <p className="flex justify-between">
                      <span className="text-slate-500">GV Chủ nhiệm:</span>
                      <span className="text-slate-200 font-semibold">{headTch?.fullName || 'Chưa phân công'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Phòng học cố định:</span>
                      <span className="text-slate-200 font-medium">{cls.roomName || 'Phòng học thường'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Sĩ số học sinh:</span>
                      <span className="text-slate-200 font-medium">{cls.studentCount} HS</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Max tiết / ngày:</span>
                      <span className="text-indigo-400 font-bold">{cls.maxPeriodsPerDay || (shift === 'both' ? 8 : 5)} tiết</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${cls.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {cls.status === 'active' ? '● Đang học' : '○ Ngừng'}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingClass(cls)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="Chỉnh sửa cấu hình lớp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MÔN & PHÂN MÔN */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH MÔN HỌC & ĐỊNH MỨC TIẾT KHUNG GDPT 2018</h2>
              <p className="text-xs text-slate-400">Điều chỉnh số tiết định mức mặc định cho từng môn học hoặc phân môn (Vật lí, Hóa học, Sinh học của KHTN & Lịch sử, Địa lí của KHXH).</p>
            </div>

            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Môn học mới</span>
            </button>
          </div>

          {/* Dedicated Component Quota Panel for KHTN & KHXH */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4.5 h-4.5 text-indigo-400" />
                <span>CẤU HÌNH SỐ TIẾT CÁC PHÂN MÔN GDPT 2018 (KHTN: Lí, Hóa, Sinh & KHXH: Sử, Địa)</span>
              </div>
              <span className="text-[11px] text-slate-400">Hỗ trợ số tiết chẵn hoặc lẻ (.5)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {/* KHTN Card */}
              {(() => {
                const khtnSubject = subjects.find(s => s.code === 'KHTN' || s.id === 'sbj_khtn');
                if (!khtnSubject || !khtnSubject.components) return null;

                return (
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="text-sm">🔬</span>
                        <span>{khtnSubject.name} (Phân môn: Hóa, Lí, Sinh)</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Tổng môn: {khtnSubject.defaultPeriodsPerWeek} tiết/tuần
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {khtnSubject.components.map(comp => (
                        <div key={comp.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center space-y-1.5 hover:border-emerald-500/40 transition">
                          <span className="text-xs font-bold text-white block">{comp.name}</span>
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={comp.defaultPeriodsPerWeek}
                              onChange={(e) => handleQuickUpdateComponentPeriods(khtnSubject.id, comp.id, parseFloat(e.target.value) || 0.5)}
                              className="w-14 bg-slate-950 border border-slate-700 text-center text-xs font-bold text-emerald-400 rounded-lg p-1 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-[10px] text-slate-400 font-medium">tiết</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* KHXH Card */}
              {(() => {
                const khxhSubject = subjects.find(s => s.code === 'KHXH' || s.id === 'sbj_khxh');
                if (!khxhSubject || !khxhSubject.components) return null;

                return (
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="text-sm">📜</span>
                        <span>{khxhSubject.name} (Phân môn: Sử, Địa)</span>
                      </span>
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                        Tổng môn: {khxhSubject.defaultPeriodsPerWeek} tiết/tuần
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {khxhSubject.components.map(comp => (
                        <div key={comp.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center space-y-1.5 hover:border-purple-500/40 transition">
                          <span className="text-xs font-bold text-white block">{comp.name}</span>
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={comp.defaultPeriodsPerWeek}
                              onChange={(e) => handleQuickUpdateComponentPeriods(khxhSubject.id, comp.id, parseFloat(e.target.value) || 0.5)}
                              className="w-14 bg-slate-950 border border-slate-700 text-center text-xs font-bold text-purple-400 rounded-lg p-1 focus:outline-none focus:border-purple-500"
                            />
                            <span className="text-[10px] text-slate-400 font-medium">tiết</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sbj) => (
              <div key={sbj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-white">{sbj.name}</span>
                    <span className="ml-2 text-xs font-mono text-indigo-400">[{sbj.code}]</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl">
                      <span className="text-xs text-slate-400">Tổng tiết:</span>
                      <input
                        type="number"
                        min={0.5}
                        max={15}
                        step="0.5"
                        value={sbj.defaultPeriodsPerWeek}
                        onChange={(e) => handleQuickUpdateSubjectPeriods(sbj.id, parseFloat(e.target.value) || 1)}
                        className="w-14 bg-slate-900 border border-slate-700 text-center text-xs font-bold text-indigo-400 rounded p-0.5 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400">tiết/tuần</span>
                    </div>

                    <button
                      onClick={() => setEditingSubject(sbj)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="Sửa môn học"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sbj.id, sbj.name)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                      title="Xóa môn học"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {sbj.hasComponents && sbj.components && sbj.components.length > 0 && (
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase block">ĐỊNH MỨC THEO PHÂN MÔN:</span>
                    <div className={`grid ${sbj.components.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                      {sbj.components.map((comp) => (
                        <div key={comp.id} className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center space-y-1">
                          <span className="text-xs font-bold text-white block">{comp.name}</span>
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={comp.defaultPeriodsPerWeek}
                              onChange={(e) => handleQuickUpdateComponentPeriods(sbj.id, comp.id, parseFloat(e.target.value) || 0.5)}
                              className="w-12 bg-slate-950 border border-slate-700 text-center text-[11px] font-bold text-indigo-400 rounded p-0.5 focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400">tiết</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GIÁO VIÊN */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH GIÁO VIÊN & ĐỊNH MỨC TIẾT DẠY</h2>
              <p className="text-xs text-slate-400">Thêm mới, chỉnh sửa thông tin hoặc xóa giáo viên không còn giảng dạy. Có thể chỉnh trực tiếp định mức tiết.</p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">Tất cả Tổ CM ({teachers.length})</option>
                {departments.map(d => {
                  const cnt = teachers.filter(t => t.department === d.name).length;
                  return (
                    <option key={d.id} value={d.name}>{d.name} ({cnt})</option>
                  );
                })}
              </select>

              <button
                onClick={() => setShowAddTeacher(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Giáo viên mới</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Mã GV</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Tổ chuyên môn</th>
                  <th className="p-3">Môn giảng dạy (Chính & Kiêm nhiệm)</th>
                  <th className="p-3 text-center">Định mức tiết/tuần</th>
                  <th className="p-3 text-center">Max tiết/ngày</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(selectedDeptFilter === 'all' ? teachers : teachers.filter(t => t.department === selectedDeptFilter)).map((tch) => {
                  const mainSbj = subjects.find(s => s.id === tch.mainSubjectId);
                  const extraIds = (tch.qualifiedSubjectIds || []).filter(id => id !== tch.mainSubjectId);
                  const extraNames = extraIds.map(id => {
                    const sbj = subjects.find(s => s.id === id);
                    if (sbj) return sbj.name;
                    for (const s of subjects) {
                      const comp = s.components?.find(c => c.id === id);
                      if (comp) return `${s.name} (${comp.name})`;
                    }
                    return id;
                  });

                  return (
                    <tr key={tch.id} className="hover:bg-slate-850 transition">
                      <td className="p-3 font-mono font-bold text-indigo-400">{tch.code}</td>
                      <td className="p-3 font-bold text-white">{tch.fullName}</td>
                      <td className="p-3 text-slate-400">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                          {tch.department}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                              ⭐️ {mainSbj?.name || 'Môn chung'} (Chính)
                            </span>
                          </div>
                          {extraNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {extraNames.map((name, idx) => (
                                <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Môn dạy thêm / kiêm nhiệm">
                                  ⚡ {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="number"
                            min={0}
                            value={tch.maxPeriodsPerWeek}
                            onChange={(e) => handleQuickUpdateTeacherMaxWeek(tch.id, parseInt(e.target.value, 10) || 0)}
                            className="w-14 bg-slate-950 border border-slate-800 text-center font-bold text-indigo-400 rounded-lg p-1 text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-slate-500 text-[11px]">tiết</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="number"
                            min={1}
                            value={tch.maxPeriodsPerDay || 6}
                            onChange={(e) => handleQuickUpdateTeacherMaxDay(tch.id, parseInt(e.target.value, 10) || 6)}
                            className="w-14 bg-slate-950 border border-slate-800 text-center font-bold text-amber-400 rounded-lg p-1 text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-slate-500 text-[11px]">tiết</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tch.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {tch.status === 'active' ? 'Hoạt động' : 'Tạm nghỉ'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setEditingTeacher(tch)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          title="Chỉnh sửa giáo viên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(tch.id, tch.fullName, tch.code)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="Xóa giáo viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TỔ CHUYÊN MÔN */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH TỔ CHUYÊN MÔN THCS ({departments.length})</h2>
              <p className="text-xs text-slate-400">Cấu hình tên các Tổ chuyên môn, mô tả chức năng, chọn/xóa tổ chuyên môn và bổ nhiệm Tổ trưởng.</p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {departments.length > 0 && (
                <button
                  onClick={handleToggleSelectAllDepts}
                  className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                >
                  {selectedDeptIds.length === departments.length ? 'Bỏ chọn tất cả' : `Chọn tất cả (${departments.length})`}
                </button>
              )}

              {selectedDeptIds.length > 0 && (
                <button
                  onClick={() => {
                    const remaining = departments.filter(d => !selectedDeptIds.includes(d.id));
                    setTransferTargetDept(remaining[0]?.name || 'Chưa phân tổ');
                    setShowBatchDeleteDeptModal(true);
                  }}
                  className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-rose-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa {selectedDeptIds.length} tổ đã chọn</span>
                </button>
              )}

              <button
                onClick={() => {
                  setNewDeptCode(`TO_${departments.length + 1}`);
                  setNewDeptName('');
                  setNewDeptDesc('');
                  setNewDeptHeadTeacher('');
                  setShowAddDept(true);
                }}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tổ chuyên môn mới</span>
              </button>
            </div>
          </div>

          {departments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Chưa có tổ chuyên môn nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hiện tại danh sách tổ chuyên môn đang trống. Vui lòng bấm "Thêm Tổ chuyên môn mới" để khởi tạo.
              </p>
              <button
                onClick={() => {
                  setNewDeptCode('TO_1');
                  setNewDeptName('');
                  setNewDeptDesc('');
                  setNewDeptHeadTeacher('');
                  setShowAddDept(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Tổ chuyên môn đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const deptTeachers = teachers.filter(t => t.department === dept.name);
                const headTch = teachers.find(t => t.id === dept.headTeacherId);
                const isSelected = selectedDeptIds.includes(dept.id);

                return (
                  <div
                    key={dept.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-4 hover:border-indigo-500/40 transition shadow-xl relative flex flex-col justify-between ${
                      isSelected ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500' : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectDeptForDelete(dept.id)}
                            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            <FolderKanban className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-white">{dept.name}</h3>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {dept.code}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingDept(dept)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Sửa tên / Cấu hình tổ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteDeptModal(dept)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                            title="Xóa tổ chuyên môn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    {dept.description && (
                      <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        {dept.description}
                      </p>
                    )}

                    <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center space-x-1.5 text-slate-400">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tổ trưởng CM:</span>
                        </span>
                        <span className="font-bold text-amber-300">
                          {headTch ? headTch.fullName : 'Chưa phân công'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center space-x-1.5 text-slate-400">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Số lượng GV:</span>
                        </span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full text-[11px]">
                          {deptTeachers.length} Giáo viên
                        </span>
                      </div>
                    </div>

                    {deptTeachers.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thành viên trong tổ:</span>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {deptTeachers.map(t => (
                            <span key={t.id} className="text-[11px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800 flex items-center space-x-1">
                              {t.id === dept.headTeacherId && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                              <span>{t.fullName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* TAB 4: PHÒNG HỌC */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">DANH SÁCH PHÒNG HỌC & PHÒNG CHUYÊN DÙNG</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((rm) => (
              <div key={rm.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{rm.name}</span>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {rm.code}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Loại: <span className="text-slate-200">{rm.type === 'general' ? 'Phòng học thường' : rm.type === 'lab' ? 'Thí nghiệm KHTN' : 'Tin học'}</span></p>
                  <p>Sử dụng: <span className={rm.isShared ? 'text-amber-400' : 'text-emerald-400'}>{rm.isShared ? 'Dùng chung giữa các lớp' : 'Dùng riêng'}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CLASS: Add */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateClass} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>THÊM LỚP HỌC THCS MỚI</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Khối lớp</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {state.grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Buổi / Ca học</label>
                <select
                  value={newClassShift}
                  onChange={(e) => {
                    const shiftVal = e.target.value as 'morning' | 'afternoon' | 'both';
                    setNewClassShift(shiftVal);
                    if (shiftVal === 'both') setNewClassMaxPeriods(8);
                    else setNewClassMaxPeriods(5);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
                >
                  <option value="morning">🌅 Buổi Sáng</option>
                  <option value="afternoon">🌇 Buổi Chiều</option>
                  <option value="both">☀️🌙 Học Cả 2 Buổi / Ngày</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mã lớp (VD: 6A3)</label>
                <input
                  type="text"
                  required
                  placeholder="6A3"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên lớp (VD: Lớp 6A3)</label>
                <input
                  type="text"
                  required
                  placeholder="Lớp 6A3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">GV Chủ nhiệm</label>
                <select
                  value={newClassHeadTeacher}
                  onChange={(e) => setNewClassHeadTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Chưa chọn --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phòng học cố định</label>
                <input
                  type="text"
                  placeholder="Phòng 103"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sĩ số học sinh</label>
                <input
                  type="number"
                  min={10}
                  max={60}
                  value={newClassStudents}
                  onChange={(e) => setNewClassStudents(parseInt(e.target.value, 10) || 40)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max tiết học / ngày</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newClassMaxPeriods}
                  onChange={(e) => setNewClassMaxPeriods(parseInt(e.target.value, 10) || 6)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddClass(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Tạo Lớp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CLASS: Edit */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateClass} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>CHỈNH SỬA CẤU HÌNH LỚP: {editingClass.name}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Khối lớp</label>
                <select
                  value={editingClass.gradeId}
                  onChange={(e) => setEditingClass({ ...editingClass, gradeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {state.grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ca / Buổi học chính</label>
                <select
                  value={editingClass.shift || 'morning'}
                  onChange={(e) => {
                    const shiftVal = e.target.value as 'morning' | 'afternoon' | 'both';
                    setEditingClass({
                      ...editingClass,
                      shift: shiftVal,
                      maxPeriodsPerDay: shiftVal === 'both' ? 8 : 5
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="morning">🌅 Buổi Sáng</option>
                  <option value="afternoon">🌇 Buổi Chiều</option>
                  <option value="both">☀️🌙 Học Cả 2 Buổi / Ngày</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mã lớp</label>
                <input
                  type="text"
                  required
                  value={editingClass.code}
                  onChange={(e) => setEditingClass({ ...editingClass, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên hiển thị lớp</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">GV Chủ nhiệm</label>
                <select
                  value={editingClass.headTeacherId || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, headTeacherId: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Chưa chọn --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phòng học cố định</label>
                <input
                  type="text"
                  value={editingClass.roomName || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, roomName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sĩ số học sinh</label>
                <input
                  type="number"
                  min={1}
                  value={editingClass.studentCount}
                  onChange={(e) => setEditingClass({ ...editingClass, studentCount: parseInt(e.target.value, 10) || 40 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max tiết học / ngày</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={editingClass.maxPeriodsPerDay || 6}
                  onChange={(e) => setEditingClass({ ...editingClass, maxPeriodsPerDay: parseInt(e.target.value, 10) || 6 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingClass.status === 'active'}
                  onChange={(e) => setEditingClass({ ...editingClass, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Đang hoạt động trong năm học</span>
              </label>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TEACHER: Add */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTeacher} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>THÊM GIÁO VIÊN MỚI</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã giáo viên (VD: GV15)</label>
                <input
                  type="text"
                  required
                  placeholder="GV15"
                  value={newTeacherCode}
                  onChange={(e) => setNewTeacherCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn X"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tổ chuyên môn</label>
                <select
                  value={newTeacherDept}
                  onChange={(e) => setNewTeacherDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Môn dạy chính</label>
                <select
                  value={newTeacherMainSubject}
                  onChange={(e) => setNewTeacherMainSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Định mức tiết / tuần</label>
                <input
                  type="number"
                  min={0}
                  value={newTeacherMaxWeek}
                  onChange={(e) => setNewTeacherMaxWeek(parseInt(e.target.value, 10) || 0)}
                  placeholder="Nhập số tiết (VD: 39)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max tiết / ngày</label>
                <input
                  type="number"
                  min={1}
                  value={newTeacherMaxDay}
                  onChange={(e) => setNewTeacherMaxDay(parseInt(e.target.value, 10) || 6)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Extra Teaching Subjects Configuration */}
              <div className="col-span-2 space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    ⚡ CẤU HÌNH MÔN DẠY THÊM / KIÊM NHIỆM
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Chọn thêm môn giáo viên có thể dạy (VD: Toán dạy thêm Tin học)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1 pr-1">
                  {subjects.map(s => {
                    const isMain = s.id === newTeacherMainSubject;
                    const isExtra = newTeacherExtraSubjects.includes(s.id);

                    if (isMain) {
                      return (
                        <span
                          key={s.id}
                          className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-default"
                        >
                          <span>⭐️ {s.name} (Chính)</span>
                        </span>
                      );
                    }

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleExtraSubjectInAdd(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1 border ${
                          isExtra
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{isExtra ? '✓ ' : '+ '} {s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddTeacher(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Thêm Giáo viên
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TEACHER: Edit */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateTeacher} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>CHỈNH SỬA THÔNG TIN GIÁO VIÊN: {editingTeacher.fullName}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã giáo viên</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.code}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.fullName}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tổ chuyên môn</label>
                <select
                  value={editingTeacher.department}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Môn dạy chính</label>
                <select
                  value={editingTeacher.mainSubjectId}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, mainSubjectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Định mức tiết / tuần</label>
                <input
                  type="number"
                  min={0}
                  value={editingTeacher.maxPeriodsPerWeek}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, maxPeriodsPerWeek: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Nhập số tiết (VD: 39)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max tiết / ngày</label>
                <input
                  type="number"
                  min={1}
                  value={editingTeacher.maxPeriodsPerDay}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, maxPeriodsPerDay: parseInt(e.target.value, 10) || 6 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Extra Teaching Subjects Configuration */}
              <div className="col-span-2 space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    ⚡ CẤU HÌNH MÔN DẠY THÊM / KIÊM NHIỆM
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Bấm chọn để bật/tắt khả năng dạy môn khác
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1 pr-1">
                  {subjects.map(s => {
                    const isMain = s.id === editingTeacher.mainSubjectId;
                    const isQualified = (editingTeacher.qualifiedSubjectIds || []).includes(s.id);

                    if (isMain) {
                      return (
                        <span
                          key={s.id}
                          className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-default"
                        >
                          <span>⭐️ {s.name} (Chính)</span>
                        </span>
                      );
                    }

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleExtraSubjectInEdit(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1 border ${
                          isQualified
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{isQualified ? '✓ ' : '+ '} {s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingTeacher.status === 'active'}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Đang công tác tại trường</span>
              </label>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Cập nhật Giáo viên
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SUBJECT: Add */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubject} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>THÊM MÔN HỌC MỚI</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã môn học (VD: TIN_HOC)</label>
                <input
                  type="text"
                  required
                  placeholder="TIN_HOC"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên môn học (VD: Tin học)</label>
                <input
                  type="text"
                  required
                  placeholder="Tin học"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nhóm môn</label>
                <select
                  value={newSubjectCategory}
                  onChange={(e) => setNewSubjectCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="general">Môn học bắt buộc chung</option>
                  <option value="natural_science">Khoa học tự nhiên</option>
                  <option value="social_science">Khoa học xã hội</option>
                  <option value="elective">Môn tự chọn</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Định mức số tiết / tuần mặc định</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={newSubjectDefaultPeriods}
                  onChange={(e) => setNewSubjectDefaultPeriods(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddSubject(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Thêm Môn học
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SUBJECT: Edit */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateSubject} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>CHỈNH SỬA MÔN HỌC: {editingSubject.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã môn</label>
                <input
                  type="text"
                  required
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên môn học</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nhóm môn</label>
                <select
                  value={editingSubject.category}
                  onChange={(e) => setEditingSubject({ ...editingSubject, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="general">Môn học bắt buộc chung</option>
                  <option value="natural_science">Khoa học tự nhiên</option>
                  <option value="social_science">Khoa học xã hội</option>
                  <option value="elective">Môn tự chọn</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Định mức tiết / tuần mặc định</label>
                <input
                  type="number"
                  min={0.5}
                  max={15}
                  step="0.5"
                  value={editingSubject.defaultPeriodsPerWeek}
                  onChange={(e) => setEditingSubject({ ...editingSubject, defaultPeriodsPerWeek: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-bold"
                />
              </div>

              {/* Sub-components management */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold">Cấu hình các phân môn</label>
                  <button
                    type="button"
                    onClick={() => {
                      const comps = editingSubject.components || [];
                      const newComp: SubjectComponent = {
                        id: `cmp_${Date.now()}`,
                        subjectId: editingSubject.id,
                        code: `PM_${comps.length + 1}`,
                        name: `Phân môn ${comps.length + 1}`,
                        defaultPeriodsPerWeek: 1
                      };
                      const updatedComps = [...comps, newComp];
                      const totalP = updatedComps.reduce((s, c) => s + c.defaultPeriodsPerWeek, 0);
                      setEditingSubject({
                        ...editingSubject,
                        hasComponents: true,
                        components: updatedComps,
                        defaultPeriodsPerWeek: totalP
                      });
                    }}
                    className="text-[11px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/30 transition"
                  >
                    + Thêm phân môn
                  </button>
                </div>

                {editingSubject.components && editingSubject.components.map((comp, idx) => (
                  <div key={comp.id || idx} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      value={comp.name}
                      placeholder="Tên phân môn"
                      onChange={(e) => {
                        const updatedComps = [...(editingSubject.components || [])];
                        updatedComps[idx] = { ...comp, name: e.target.value };
                        setEditingSubject({ ...editingSubject, components: updatedComps });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={comp.defaultPeriodsPerWeek}
                      onChange={(e) => {
                        const newP = parseFloat(e.target.value) || 0.5;
                        const updatedComps = [...(editingSubject.components || [])];
                        updatedComps[idx] = { ...comp, defaultPeriodsPerWeek: newP };
                        const totalP = updatedComps.reduce((s, c) => s + c.defaultPeriodsPerWeek, 0);
                        setEditingSubject({
                          ...editingSubject,
                          components: updatedComps,
                          defaultPeriodsPerWeek: totalP
                        });
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 text-center rounded-lg p-1.5 text-xs text-indigo-400 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">tiết</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedComps = (editingSubject.components || []).filter((_, i) => i !== idx);
                        const totalP = updatedComps.reduce((s, c) => s + c.defaultPeriodsPerWeek, 0);
                        setEditingSubject({
                          ...editingSubject,
                          components: updatedComps,
                          hasComponents: updatedComps.length > 0,
                          defaultPeriodsPerWeek: updatedComps.length > 0 ? totalP : editingSubject.defaultPeriodsPerWeek
                        });
                      }}
                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Cập nhật Môn
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DEPARTMENT: Add */}
      {showAddDept && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDept} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>THÊM TỔ CHUYÊN MÔN MỚI</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã Tổ chuyên môn (VD: TOAN_TIN)</label>
                <input
                  type="text"
                  required
                  placeholder="TOAN_TIN"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên Tổ chuyên môn (VD: Tổ Toán - Tin)</label>
                <input
                  type="text"
                  required
                  placeholder="Tổ Toán - Tin"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tổ trưởng chuyên môn</label>
                <select
                  value={newDeptHeadTeacher}
                  onChange={(e) => setNewDeptHeadTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mô tả / Ghi chú</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả các môn học và phân môn trực thuộc tổ..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddDept(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Tạo Tổ CM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DEPARTMENT: Edit */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateDept} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>CHỈNH SỬA TỔ CHUYÊN MÔN: {editingDept.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mã Tổ chuyên môn</label>
                <input
                  type="text"
                  required
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên Tổ chuyên môn</label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tổ trưởng chuyên môn</label>
                <select
                  value={editingDept.headTeacherId || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, headTeacherId: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mô tả / Ghi chú</label>
                <textarea
                  rows={3}
                  value={editingDept.description || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Cập nhật Tổ CM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DEPARTMENT: Delete Single Confirmation */}
      {deletingDeptTarget && (() => {
        const affectedTeachers = teachers.filter(t => t.department === deletingDeptTarget.name);
        const remainingDepts = departments.filter(d => d.id !== deletingDeptTarget.id);

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center space-x-2.5 text-rose-400 border-b border-slate-800 pb-3">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wide">XÁC NHẬN XÓA TỔ CHUYÊN MÔN</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start space-x-2 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Bạn có chắc chắn muốn xóa tổ chuyên môn <strong className="text-white">{deletingDeptTarget.name}</strong> ({deletingDeptTarget.code})?
                  </p>
                </div>

                {affectedTeachers.length > 0 ? (
                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <label className="block text-slate-300 font-semibold">
                      Tổ này hiện có <span className="text-amber-400 font-bold">{affectedTeachers.length} giáo viên</span>. Vui lòng chọn tổ chuyên môn mới để chuyển giao:
                    </label>
                    <select
                      value={transferTargetDept}
                      onChange={(e) => setTransferTargetDept(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-indigo-500"
                    >
                      {remainingDepts.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="Chưa phân tổ">-- Chưa phân tổ --</option>
                    </select>
                    <p className="text-[11px] text-slate-400 italic">
                      Tất cả giáo viên thuộc tổ "{deletingDeptTarget.name}" sẽ tự động chuyển sang tổ đã chọn ở trên.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    Tổ này hiện không có giáo viên nào trực thuộc. Thao tác xóa sẽ loại bỏ hoàn toàn danh mục tổ này.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingDeptTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteDept}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  Xác nhận xóa Tổ CM
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DEPARTMENT: Batch Delete Confirmation */}
      {showBatchDeleteDeptModal && (() => {
        const selectedDepts = departments.filter(d => selectedDeptIds.includes(d.id));
        const selectedNames = selectedDepts.map(d => d.name);
        const affectedTeachers = teachers.filter(t => selectedNames.includes(t.department));
        const remainingDepts = departments.filter(d => !selectedDeptIds.includes(d.id));

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center space-x-2.5 text-rose-400 border-b border-slate-800 pb-3">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  XÓA {selectedDeptIds.length} TỔ CHUYÊN MÔN ĐÃ CHỌN
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl space-y-1 text-rose-300">
                  <p className="font-bold text-white">Danh sách các tổ sẽ bị xóa:</p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-300 max-h-24 overflow-y-auto pl-1">
                    {selectedNames.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>

                {affectedTeachers.length > 0 ? (
                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <label className="block text-slate-300 font-semibold">
                      Tổng cộng có <span className="text-amber-400 font-bold">{affectedTeachers.length} giáo viên</span> bị ảnh hưởng. Chọn tổ tiếp nhận:
                    </label>
                    <select
                      value={transferTargetDept}
                      onChange={(e) => setTransferTargetDept(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-indigo-500"
                    >
                      {remainingDepts.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="Chưa phân tổ">-- Chưa phân tổ --</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    Các tổ được chọn không có giáo viên trực thuộc.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteDeptModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDeleteDepts}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  Xác nhận xóa {selectedDeptIds.length} Tổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
