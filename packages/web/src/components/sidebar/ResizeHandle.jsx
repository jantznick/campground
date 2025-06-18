import React, { useEffect, useCallback } from 'react';
import useUIStore from '../../stores/useUIStore';

const MIN_WIDTH = 240;
const MAX_WIDTH = 500;
const COLLAPSE_THRESHOLD = 200;

const ResizeHandle = () => {
  const { 
    setSidebarWidth, 
    setIsResizing, 
    isResizing, 
    toggleSidebar, 
    isSidebarCollapsed,
    setSidebarCollapsed 
  } = useUIStore();

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  const handleMouseMove = useCallback((e) => {
    const newWidth = e.clientX;
    
    if (newWidth < COLLAPSE_THRESHOLD) {
      if (!isSidebarCollapsed) {
        toggleSidebar();
        setIsResizing(false);
      }
    } else if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      if (isSidebarCollapsed) {
        setSidebarCollapsed(false);
      }
      setSidebarWidth(newWidth);
    }
  }, [setSidebarWidth, toggleSidebar, setIsResizing, isSidebarCollapsed, setSidebarCollapsed]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-white/10 opacity-0 hover:opacity-100 transition-opacity"
      onMouseDown={handleMouseDown}
    />
  );
};

export default ResizeHandle; 