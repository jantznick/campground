import React from 'react';

const SidebarHeader = ({ isCollapsed }) => (
  <div className={`flex items-center py-6 border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'px-4 justify-center' : 'px-6 gap-3'}`}>
    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--orange-wheel)] shadow">
      <svg viewBox="0 0 110 110" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="55" cy="55" r="52" fill="var(--vanilla)" stroke="var(--prussian-blue)" strokeWidth="6" />
        <path d="M56.555 25.349C47.677 26.141 38.688 30.129 32.346 36.09L31.25 37.121 29.676 37.242C20.485 37.95 16.273 46.251 19.337 57.617C19.648 58.768 19.65 58.883 19.388 60.45C19.187 61.648 19.106 63.33 19.082 66.758C19.053 71.002 19.018 71.531 18.7 72.508C15.078 83.633 21.069 94.637 32.5 97.855C33.39 98.105 33.976 98.396 34.535 98.863C43.874 106.675 58.396 109.767 70.661 106.554C71.901 106.229 73.067 105.93 73.25 105.89C73.464 105.844 73.941 106.088 74.583 106.573C82.899 112.855 93.047 106.804 88.669 98.174L88.2 97.25 89.896 95.5C106.446 78.421 105.56 51.175 87.952 35.701L86.379 34.318 86.46 33.188C86.775 28.779 82.408 26.336 78.12 28.524L77.48 28.85 75.828 28.172C70.176 25.855 62.874 24.785 56.555 25.349Z" fill="#fbc354" stroke="#003049" strokeWidth="2.5"/>
      </svg>
    </div>
    <span className={`text-xl font-bold text-[var(--vanilla)] tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>Stagehand</span>
  </div>
);

export default SidebarHeader; 