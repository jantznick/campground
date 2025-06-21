import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import logo from '../logo.png';

const LockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthStore();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      setSuccessMessage('Your password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--prussian-blue)]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/5 rounded-2xl shadow-lg border border-white/10 text-white">
        <div>
          <div className="flex justify-center items-center space-x-3">
            <img className="h-12 w-auto" src={logo} alt="Campground logo" />
            <span className="text-4xl font-extrabold text-[var(--xanthous)]">Campground</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Set Your New Password</h2>
        </div>
        
        {successMessage ? (
          <div className="text-center text-green-400 bg-green-900/50 border border-green-400/50 px-3 py-4 rounded-lg">
            {successMessage}
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="h-5 w-5 text-gray-500" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 bg-black/20 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] focus:z-10 sm:text-sm"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-400 text-sm text-center pt-2">{error}</div>}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !token}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[var(--prussian-blue)] bg-[var(--orange-wheel)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--orange-wheel)] disabled:bg-opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-sm text-center">
                <p>
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
                        Back to Login
                    </Link>
                </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 