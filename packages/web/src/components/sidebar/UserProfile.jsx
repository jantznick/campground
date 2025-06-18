import React from 'react';
import { LogOut, Star } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import useHierarchyStore from '../../stores/useHierarchyStore';
import Avatar from '../Avatar';

const UserProfile = ({ isCollapsed }) => {
    const { user, logout } = useAuthStore();
    const { accountType, hierarchy, fetchHierarchy } = useHierarchyStore();

    const handleUpgrade = async () => {
        if (hierarchy.length === 0) {
            console.error("No organization found to upgrade.");
            return;
        }
        const organizationId = hierarchy[0].id;

        try {
            const response = await fetch(`/api/v1/organizations/${organizationId}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to upgrade account');
            }
            
            await fetchHierarchy();

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="border-t border-white/10 px-4 py-4">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <Avatar username={user?.email} />
                
                {!isCollapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-white/60 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/80"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfile; 