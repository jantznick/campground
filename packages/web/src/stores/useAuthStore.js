import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      login: async (email, password) => {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Login failed');
        }
        const data = await response.json();
        set({ user: data });
        return data;
      },

      register: async (email, password) => {
        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
         if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Registration failed');
        }
        const data = await response.json();
        set({ user: data });
        return data;
      },

      logout: async () => {
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            set({ user: null });
        }
      },
      acceptInvitation: async (token, password) => {
        const response = await fetch('/api/v1/auth/accept-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to accept invitation');
        }
        const data = await response.json();
        set({ user: data });
        return data;
      },
    }),
    {
      name: 'user-storage', 
    }
  )
);

export default useAuthStore; 