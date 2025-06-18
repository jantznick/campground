import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
            // Call the logout endpoint on the server
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            // Always clear user data from the store
            set({ user: null });
        }
      },
    }),
    {
      name: 'user-storage', // name of the item in the storage (must be unique)
    }
  )
); 