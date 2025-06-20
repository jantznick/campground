import React, { useState } from 'react';
import { X } from 'lucide-react';
import useTeamStore from '../stores/useTeamStore';
import useProjectStore from '../stores/useProjectStore';
import useOrganizationStore from '../stores/useOrganizationStore';
import useHierarchyStore from '../stores/useHierarchyStore';

const ITEM_TYPES = {
  ORGANIZATION: 'organization',
  TEAM: 'team',
  PROJECT: 'project'
};

export default function CreateItemModal({ isOpen, onClose, type, parentId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addItem: addItemToHierarchy, refreshActiveCompany, getDisplayName } = useHierarchyStore();
  
  const { createTeam, isLoading: teamLoading, error: teamError } = useTeamStore();
  const { createProject, isLoading: projectLoading, error: projectError } = useProjectStore();
  const { createOrganization, isLoading: orgLoading, error: orgError } = useOrganizationStore();
  
  const loading = teamLoading || projectLoading || orgLoading;
  const error = teamError || projectError || orgError;
  
  const resetErrors = () => {
    useTeamStore.setState({ error: null });
    useProjectStore.setState({ error: null });
    useOrganizationStore.setState({ error: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    try {
      const payload = {
        name,
        description: description || undefined
      };

      let newItem;
      let parentType = null;

      switch (type) {
        case ITEM_TYPES.ORGANIZATION:
          newItem = await createOrganization(payload);
          break;
        case ITEM_TYPES.TEAM:
          payload.companyId = parentId;
          parentType = 'company';
          newItem = await createTeam(payload);
          break;
        case ITEM_TYPES.PROJECT:
          payload.teamId = parentId;
          parentType = 'team';
          newItem = await createProject(payload);
          break;
        default:
          throw new Error(`Unsupported item type: ${type}`);
      }

      addItemToHierarchy({ ...newItem, type }, parentId, parentType);
      
      // If a team or project was created, the active company needs to be refreshed
      if (type === ITEM_TYPES.TEAM || type === ITEM_TYPES.PROJECT) {
          refreshActiveCompany();
      }

      onClose();
    } catch (err) {
       console.error(err.message);
    }
  };

  if (!isOpen) return null;

  const singularDisplayName = getDisplayName(type, 'singular');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Create New {singularDisplayName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--vanilla)] mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vanilla)] placeholder-[var(--vanilla)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
              placeholder={`Enter ${singularDisplayName} name`}
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--vanilla)] mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vanilla)] placeholder-[var(--vanilla)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
              placeholder={`Enter ${singularDisplayName} description`}
              rows={3}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{typeof error === 'string' ? error : error.message}</div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--vanilla)] hover:text-[var(--xanthous)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-[var(--orange-wheel)] text-[var(--prussian-blue)] rounded-lg hover:bg-[var(--orange-wheel)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 