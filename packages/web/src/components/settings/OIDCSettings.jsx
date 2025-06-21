import { useEffect, useState, useMemo } from 'react';
import useOIDCStore from '../../stores/useOIDCStore';
import useCompanyStore from '../../stores/useCompanyStore';

export default function OIDCSettings() {
  const { selectedCompany } = useCompanyStore();
  const { oidcConfig, fetchOIDCConfig, saveOIDCConfig, deleteOIDCConfig, loading, error } = useOIDCStore();
  
  const [formData, setFormData] = useState({
    issuer: '',
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    defaultRole: 'READER',
  });

  const orgId = selectedCompany?.organizationId;

  const callbackUrl = useMemo(() => {
    // Construct the callback URL based on the current window's origin.
    // This is more reliable than environment variables on the frontend.
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/v1/auth/oidc/callback`;
    }
    return '';
  }, []);

  useEffect(() => {
    if (orgId) {
      fetchOIDCConfig(orgId);
    }
  }, [orgId, fetchOIDCConfig]);

  useEffect(() => {
    if (oidcConfig) {
      setFormData({
        issuer: oidcConfig.issuer || '',
        clientId: oidcConfig.clientId || '',
        clientSecret: '', // Always leave secret blank for security
        authorizationUrl: oidcConfig.authorizationUrl || '',
        tokenUrl: oidcConfig.tokenUrl || '',
        userInfoUrl: oidcConfig.userInfoUrl || '',
        defaultRole: oidcConfig.defaultRole || 'READER',
      });
    } else {
      // Reset form if there's no config
      setFormData({
        issuer: '',
        clientId: '',
        clientSecret: '',
        authorizationUrl: '',
        tokenUrl: '',
        userInfoUrl: '',
        defaultRole: 'READER',
      });
    }
  }, [oidcConfig]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!dataToSave.clientSecret) {
      delete dataToSave.clientSecret;
    }
    await saveOIDCConfig(orgId, dataToSave);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete the OIDC configuration? This action cannot be undone.')) {
      await deleteOIDCConfig(orgId);
    }
  };

  return (
    <div>
      <h2 className="text-base font-semibold leading-7 text-gray-900">Single Sign-On (OIDC)</h2>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        Allow users to sign in using your organization's identity provider.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div className="sm:col-span-6">
            <label htmlFor="callbackUrl" className="block text-sm font-medium leading-6 text-gray-900">
              Callback / Redirect URL
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="callbackUrl"
                id="callbackUrl"
                value={callbackUrl}
                readOnly
                className="block w-full rounded-md border-0 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50 cursor-not-allowed"
              />
               <p className="mt-2 text-xs text-gray-500">Provide this URL to your identity provider.</p>
            </div>
          </div>
        
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-4">
          <div className="sm:col-span-6">
            <label htmlFor="issuer" className="block text-sm font-medium leading-6 text-gray-900">
              Issuer URL
            </label>
            <div className="mt-2">
              <input
                type="url"
                name="issuer"
                id="issuer"
                value={formData.issuer}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="https://your-provider.com"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="clientId" className="block text-sm font-medium leading-6 text-gray-900">
              Client ID
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="clientId"
                id="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="clientSecret" className="block text-sm font-medium leading-6 text-gray-900">
              Client Secret
            </label>
            <div className="mt-2">
              <input
                type="password"
                name="clientSecret"
                id="clientSecret"
                value={formData.clientSecret}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Leave blank to keep existing secret"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="authorizationUrl" className="block text-sm font-medium leading-6 text-gray-900">
              Authorization URL
            </label>
            <div className="mt-2">
              <input type="url" name="authorizationUrl" id="authorizationUrl" value={formData.authorizationUrl} onChange={handleChange} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="tokenUrl" className="block text-sm font-medium leading-6 text-gray-900">
              Token URL
            </label>
            <div className="mt-2">
              <input type="url" name="tokenUrl" id="tokenUrl" value={formData.tokenUrl} onChange={handleChange} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="userInfoUrl" className="block text-sm font-medium leading-6 text-gray-900">
              User Info URL
            </label>
            <div className="mt-2">
              <input type="url" name="userInfoUrl" id="userInfoUrl" value={formData.userInfoUrl} onChange={handleChange} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="defaultRole" className="block text-sm font-medium leading-6 text-gray-900">
              Default Role for New Users
            </label>
            <div className="mt-2">
              <select
                id="defaultRole"
                name="defaultRole"
                value={formData.defaultRole}
                onChange={handleChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              >
                <option>READER</option>
                <option>EDITOR</option>
                <option>ADMIN</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-x-4 border-t border-gray-900/10 pt-6">
          {oidcConfig && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="text-sm font-semibold leading-6 text-red-600 disabled:opacity-50"
            >
              Delete Configuration
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
} 