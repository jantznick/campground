import { create } from 'zustand';

const DEFAULT_WIDTH = 288; // Corresponds to w-72

const useUIStore = create((set) => ({
  isSidebarCollapsed: false,
  sidebarWidth: DEFAULT_WIDTH,
  isResizing: false,
  
  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed,
    sidebarWidth: DEFAULT_WIDTH, 
  })),

  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setIsResizing: (isResizing) => set({ isResizing }),
}));

export default useUIStore; 