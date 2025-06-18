import React from 'react';
import { Folder, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Link, useNavigate } from 'react-router-dom';

const ProjectItem = ({ project }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const navigate = useNavigate();

  return (
    <li className="ml-4">
      <button
        className={`group flex items-center w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
          selectedItem?.id === project.id && selectedItem.type === 'project'
            ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
            : 'hover:bg-white/10 text-[var(--vanilla)]'
        }`}
        onClick={() => {
          setSelectedItem({ ...project, type: 'project' });
          navigate('/dashboard');
        }}
      >
        <Folder size={18} className="mr-2 text-[var(--xanthous)] opacity-70" />
        <span className="truncate flex-1 text-left">{project.name}</span>
        <Link to={`/settings/project/${project.id}`} className="hidden group-hover:block ml-auto" onClick={(e) => e.stopPropagation()}>
            <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
        </Link>
      </button>
    </li>
  );
};

export default ProjectItem; 