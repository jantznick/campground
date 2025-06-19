import { create } from 'zustand';

const DEFAULT_WIDTH = 288; // Corresponds to w-72

const useUIStore = create((set) => {
    const initialState = {
        isSidebarCollapsed: false,
        sidebarWidth: DEFAULT_WIDTH,
        isResizing: false,
    };
    return {
        ...initialState,
  
  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed,
    sidebarWidth: DEFAULT_WIDTH, 
  })),

  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setIsResizing: (isResizing) => set({ isResizing }),
  reset: () => set(initialState),
}});

export default useUIStore; 