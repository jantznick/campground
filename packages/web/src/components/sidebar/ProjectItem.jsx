import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Folder, Settings, LockIcon } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';

function ProjectItem({ project, isCollapsed }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { getDisplayName } = useHierarchyStore();
    
    const isActive = location.pathname.startsWith(`/projects/${project.id}`);

    const projectButtonClasses = `group flex items-center w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
        isActive
          ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
          : 'hover:bg-white/10 text-[var(--vanilla)]'
      } ${isCollapsed ? 'justify-center' : ''}`;

    return (
        <li className="space-y-1">
            <div className="flex items-center gap-2" title={isCollapsed ? project.name : ''}>
                <button
                    className={projectButtonClasses}
                    onClick={() => navigate(`/projects/${project.id}`)}
                >
                    <Folder size={18} className={`flex-shrink-0 ${isActive ? 'text-[var(--prussian-blue)]' : 'text-[var(--xanthous)]'} opacity-70`} />
                    {!isCollapsed && (
                        <>
                            <span className="truncate flex-1 text-left ml-2">{project.name}</span>
                            {!project.isMember && <LockIcon className="w-4 h-4 text-gray-400 ml-2" />}
                            <Link to={`/settings/project/${project.id}`} className="hidden group-hover:block ml-auto" onClick={(e) => e.stopPropagation()}>
                                <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
                            </Link>
                        </>
                    )}
                </button>
            </div>
        </li>
    );
}

export default ProjectItem; 