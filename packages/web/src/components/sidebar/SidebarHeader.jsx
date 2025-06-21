import React from 'react';
import logo from '../../logo.png';

const SidebarHeader = ({ isCollapsed }) => (
  <div className={`flex items-center py-6 border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'px-4 justify-center' : 'px-6 gap-3'}`}>
    <img src={logo} alt="Campground Logo" className="h-10 w-auto flex-shrink-0" />
    <span className={`text-xl font-extrabold text-[var(--xanthous)] tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-2'}`}>
      Campground
    </span>
  </div>
);

export default SidebarHeader; 