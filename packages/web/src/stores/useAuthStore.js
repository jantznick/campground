import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetAllStores } from './reset';
import useHierarchyStore from './useHierarchyStore';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            set({ user: data, isLoading: false });
            if (data.emailVerified) {
                useHierarchyStore.getState().fetchHierarchy();
            }
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
      },

      register: async (email, password, { useMagicLink = false } = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, useMagicLink }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            // If using magic link, don't set user, just return the message
            if (useMagicLink) {
                set({ isLoading: false });
                return data;
            }
            set({ user: data, isLoading: false });
            // Don't fetch hierarchy here, user needs to verify first
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            resetAllStores();
            set({ user: null, isLoading: false, error: null });
        }
      },
      acceptInvitation: async (token, password, { useMagicLink = false } = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/auth/accept-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, useMagicLink }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }
            // If using magic link, don't log in, just return the success message
            if (useMagicLink) {
                set({ isLoading: false });
                return data;
            }
            // Otherwise, log the user in
            set({ user: data, isLoading: false });
            useHierarchyStore.getState().fetchHierarchy();
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
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
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
        }
      },
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Email verification failed.');
          }
          set({ user: data, isLoading: false });
          // Now that user is verified, fetch their hierarchy data
          useHierarchyStore.getState().fetchHierarchy();
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      resendVerificationCode: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/resend-verification', {
            method: 'POST',
          });
          const data = await response.json();
           if (!response.ok) {
            throw new Error(data.error || 'Failed to resend code.');
          }
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
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
      requestMagicLink: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to send magic link.');
          }
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      verifyMagicLink: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/magic-link/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Magic link login failed.');
          }
          set({ user: data, isLoading: false });
          if (data.emailVerified) {
              useHierarchyStore.getState().fetchHierarchy();
          }
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
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