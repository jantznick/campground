import { create } from 'zustand';

const useOIDCStore = create((set) => {
  const initialState = {
    oidcConfig: null,
    loading: false,
    error: null,
  };

  return {
    ...initialState,

    fetchOIDCConfig: async (orgId) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`/api/v1/organizations/${orgId}/oidc`);

        if (response.status === 404) {
          set({ oidcConfig: null, loading: false });
          return;
        }

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch OIDC configuration.');
        }

        const config = await response.json();
        set({ oidcConfig: config, loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    saveOIDCConfig: async (orgId, configData) => {
      set({ loading: true, error: null });
      const { oidcConfig } = useOIDCStore.getState();
      const isUpdating = !!oidcConfig;

      try {
        const response = await fetch(`/api/v1/organizations/${orgId}/oidc`, {
          method: isUpdating ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configData),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to save OIDC configuration.');
        }

        const savedConfig = await response.json();
        set({ oidcConfig: savedConfig, loading: false });
        return savedConfig;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteOIDCConfig: async (orgId) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`/api/v1/organizations/${orgId}/oidc`, {
          method: 'DELETE',
        });

        if (!response.ok && response.status !== 204) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to delete OIDC configuration.');
        }

        set({ oidcConfig: null, loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    reset: () => set(initialState),
  };
});

export default useOIDCStore; 