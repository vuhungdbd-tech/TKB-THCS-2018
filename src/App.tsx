import React, { useState, useEffect } from 'react';
import { store } from './database/store';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TimeConfigView } from './components/TimeConfigView';
import { CategoriesView } from './components/CategoriesView';
import { AssignmentsView } from './components/AssignmentsView';
import { ConstraintsView } from './components/ConstraintsView';
import { SchedulerView } from './components/SchedulerView';
import { TimetableGrid } from './components/TimetableGrid';
import { ConflictReportView } from './components/ConflictReportView';
import { CopyWeekModal } from './components/CopyWeekModal';
import { VersionHistoryView } from './components/VersionHistoryView';
import { ImportExportView } from './components/ImportExportView';
import { SupabaseConfigView } from './components/SupabaseConfigView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { Week } from './types';
import { solveTimetable } from './scheduler/solver';
import { validateTimetable } from './scheduler/validator';

export function App() {
  const [currentWeek, setCurrentWeek] = useState<Week>(() => store.getCurrentWeek());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Auto-solve initial timetable if empty on startup
  useEffect(() => {
    const ver = store.getTimetableVersion(currentWeek.id);
    if (!ver || ver.entries.length === 0) {
      const state = store.getState();
      const res = solveTimetable(state, currentWeek.id, { strategy: 'fast', maxIterations: 1000 });
      if (res.version) {
        store.saveTimetableVersion(currentWeek.id, res.version);
      }
    }
  }, []);

  const handleSelectWeek = (weekId: string) => {
    store.setCurrentWeek(weekId);
    const updatedWeek = store.getCurrentWeek();
    setCurrentWeek(updatedWeek);
  };

  const handleRunQuickSolve = () => {
    const state = store.getState();
    const res = solveTimetable(state, currentWeek.id, { strategy: 'balanced', maxIterations: 5000 });
    if (res.version) {
      store.saveTimetableVersion(currentWeek.id, res.version);
    }
    setActiveTab('timetable');
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục lại dữ liệu khởi tạo mặc định cho trường THCS?')) {
      store.resetToDefaults();
      const updatedWeek = store.getCurrentWeek();
      setCurrentWeek(updatedWeek);
      handleRunQuickSolve();
    }
  };

  // Calculate conflicts badge
  const version = store.getTimetableVersion(currentWeek.id);
  const issues = validateTimetable(store.getState(), currentWeek.id, version?.entries || []);
  const hardViolationsCount = issues.filter(i => i.category === 'hard_constraint' || i.type === 'error').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentWeek={currentWeek}
        onSelectWeek={handleSelectWeek}
        onToggleAIAssistant={() => setShowAIAssistant(!showAIAssistant)}
        onRunQuickSolve={handleRunQuickSolve}
        onResetData={handleResetData}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedConflictsCount={hardViolationsCount}
        />

        {/* Right Main Content View */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onRunQuickSolve={handleRunQuickSolve}
            />
          )}

          {activeTab === 'time_config' && <TimeConfigView />}

          {activeTab === 'categories' && <CategoriesView />}

          {activeTab === 'assignments' && <AssignmentsView />}

          {activeTab === 'constraints' && <ConstraintsView />}

          {activeTab === 'scheduler' && <SchedulerView onNavigate={setActiveTab} />}

          {activeTab === 'timetable' && <TimetableGrid />}

          {activeTab === 'conflicts' && <ConflictReportView onNavigate={setActiveTab} />}

          {activeTab === 'copy_week' && <CopyWeekModal />}

          {activeTab === 'versions' && <VersionHistoryView />}

          {activeTab === 'import_export' && <ImportExportView />}

          {activeTab === 'supabase' && <SupabaseConfigView />}
        </main>
      </div>

      {/* AI Assistant Side Drawer */}
      <AIAssistantDrawer
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onRunSolver={handleRunQuickSolve}
      />
    </div>
  );
}

export default App;
