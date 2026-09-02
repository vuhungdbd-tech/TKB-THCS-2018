import React from 'react';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Users,
  Sliders,
  PlayCircle,
  Calendar,
  AlertTriangle,
  Copy,
  History,
  FileSpreadsheet,
  Database
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'time_config'
  | 'categories'
  | 'assignments'
  | 'constraints'
  | 'scheduler'
  | 'timetable'
  | 'conflicts'
  | 'copy_week'
  | 'versions'
  | 'import_export'
  | 'supabase';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unresolvedConflictsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unresolvedConflictsCount = 0
}) => {
  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'CẤU HÌNH & DANH MỤC',
      items: [
        { id: 'time_config' as TabType, label: 'Cấu hình thời gian', icon: Clock },
        { id: 'categories' as TabType, label: 'Danh mục trường', icon: BookOpen },
        { id: 'assignments' as TabType, label: 'Phân công giảng dạy', icon: Users },
        { id: 'constraints' as TabType, label: 'Ràng buộc & Ngày nghỉ', icon: Sliders },
      ]
    },
    {
      title: 'THỰC THI THỜI KHÓA BIỂU',
      items: [
        { id: 'scheduler' as TabType, label: 'Xếp TKB tự động', icon: PlayCircle },
        { id: 'timetable' as TabType, label: 'Thời khóa biểu', icon: Calendar },
        {
          id: 'conflicts' as TabType,
          label: 'Phân tích xung đột',
          icon: AlertTriangle,
          badge: unresolvedConflictsCount > 0 ? unresolvedConflictsCount : undefined
        },
      ]
    },
    {
      title: 'QUẢN LÝ & TIỆN ÍCH',
      items: [
        { id: 'supabase' as TabType, label: 'Kết nối Supabase', icon: Database },
        { id: 'copy_week' as TabType, label: 'Sao chép tuần', icon: Copy },
        { id: 'versions' as TabType, label: 'Lịch sử phiên bản', icon: History },
        { id: 'import_export' as TabType, label: 'Nhập / Xuất dữ liệu', icon: FileSpreadsheet },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 min-h-[calc(100vh-4rem)] p-4 text-slate-300">
      <nav className="space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
