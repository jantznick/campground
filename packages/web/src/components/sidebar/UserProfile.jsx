import React from 'react';
import {useAuthStore} from '../../stores/useAuthStore';
import Avatar from '../Avatar';
import { LogOut, Settings } from 'lucide-react';

const UserProfile = ({ isCollapsed }) => {
    const { user, logout } = useAuthStore();

    if (!user) return null;

    return (
        <div className={`px-6 py-5 border-t border-white/10 flex items-center bg-[var(--prussian-blue)] transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex-shrink-0">
                <Avatar username={user?.email} />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 flex items-center gap-2 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <div className="flex-1 min-w-0">
                    <div className="text-[var(--vanilla)] font-semibold truncate">{user?.email}</div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--vanilla)] transition-colors"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--vanilla)] transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 