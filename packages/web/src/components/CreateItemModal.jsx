import React, { useState } from 'react';
import { X } from 'lucide-react';

const ITEM_TYPES = {
  ORGANIZATION: 'organization',
  COMPANY: 'company',
  TEAM: 'team',
  PROJECT: 'project'
};

const API_ENDPOINTS = {
  [ITEM_TYPES.ORGANIZATION]: '/api/v1/organizations',
  [ITEM_TYPES.COMPANY]: '/api/v1/companies',
  [ITEM_TYPES.TEAM]: '/api/v1/teams',
  [ITEM_TYPES.PROJECT]: '/api/v1/projects'
};

export default function CreateItemModal({ isOpen, onClose, type, parentId, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        description: description || undefined
      };

      // Add the appropriate parent ID based on the type
      if (type === ITEM_TYPES.COMPANY) {
        payload.organizationId = parentId;
      } else if (type === ITEM_TYPES.TEAM) {
        payload.companyId = parentId;
      } else if (type === ITEM_TYPES.PROJECT) {
        payload.teamId = parentId;
      }

      const response = await fetch(API_ENDPOINTS[type], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }

      const newItem = await response.json();
      onSuccess(newItem);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Create New {type.charAt(0).toUpperCase() + type.slice(1)}
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
              placeholder={`Enter ${type} name`}
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
              placeholder={`Enter ${type} description`}
              rows={3}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
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