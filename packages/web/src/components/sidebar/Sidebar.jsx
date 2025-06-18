import React from 'react';
import SidebarHeader from './SidebarHeader';
import HierarchySection from './HierarchySection';
import UserProfile from './UserProfile';
import useUIStore from '../../stores/useUIStore';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import ResizeHandle from './ResizeHandle';

export default function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar, sidebarWidth, isResizing } = useUIStore();

  const sidebarStyle = {
    width: isSidebarCollapsed ? '80px' : `${sidebarWidth}px`,
  };

  return (
    <aside
      style={sidebarStyle}
      className={`
        relative h-screen flex flex-col shadow-xl border-r border-white/10 bg-[var(--prussian-blue)]
        ${!isResizing ? 'transition-all duration-300 ease-in-out' : ''}
    `}>
      <SidebarHeader isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        <HierarchySection isCollapsed={isSidebarCollapsed} />
      </div>
      <UserProfile isCollapsed={isSidebarCollapsed} />
      
      {/* Collapse Toggle Button */}
      <div className="px-6 py-3 border-t border-white/10">
        <button
          onClick={toggleSidebar}
          className="p-2 w-full flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--vanilla)] transition-colors"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? <PanelRightClose size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <ResizeHandle />
    </aside>
  );
} 