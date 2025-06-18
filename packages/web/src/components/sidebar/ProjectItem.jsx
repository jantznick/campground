import React from 'react';
import { Folder, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Link, useNavigate } from 'react-router-dom';

const ProjectItem = ({ project, isCollapsed }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const navigate = useNavigate();

  const handleSelect = () => {
    setSelectedItem({ ...project, type: 'project' });
    if (isCollapsed) {
        navigate('/dashboard'); 
    }
  }

  const projectButtonClasses = `group flex items-center w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
    selectedItem?.id === project.id && selectedItem.type === 'project'
      ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
      : 'hover:bg-white/10 text-[var(--vanilla)]'
    } ${isCollapsed ? 'justify-center' : ''}`;

  return (
    <li className="space-y-1">
       <div className="flex items-center gap-2" title={isCollapsed ? project.name : ''}>
            <button
                className={projectButtonClasses}
                onClick={handleSelect}
            >
                <Folder size={18} className="flex-shrink-0 text-[var(--xanthous)] opacity-70" />
                {!isCollapsed && (
                    <>
                        <span className="truncate flex-1 text-left ml-2">{project.name}</span>
                        <Link to={`/settings/project/${project.id}`} className="hidden group-hover:block ml-auto" onClick={(e) => e.stopPropagation()}>
                            <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
                        </Link>
                    </>
                )}
            </button>
        </div>
    </li>
  );
};

export default ProjectItem; 