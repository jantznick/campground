import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetAllStores } from './reset';
import useHierarchyStore from './useHierarchyStore';

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
        useHierarchyStore.getState().fetchHierarchy();
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
        useHierarchyStore.getState().fetchHierarchy();
        return data;
      },

      logout: async () => {
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            resetAllStores();
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
        useHierarchyStore.getState().fetchHierarchy();
        return data;
      },
      checkAuth: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch('/api/v1/auth/me');
            if (response.ok) {
                const user = await response.json();
                set({ user, isAuthenticated: true, isLoading: false });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            console.log("Error checking auth", error);
        }
      },
      forgotPassword: async (email) => {
        const response = await fetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to send password reset link.');
        }
        return response.json();
      },
      resetPassword: async ({ token, password }) => {
        const response = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to reset password.');
        }
        return response.json();
      },
    }),
    {
      name: 'user-storage', 
    }
  )
); 

export default useAuthStore; 