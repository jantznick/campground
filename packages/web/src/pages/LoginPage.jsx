import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import { useAuthStore } from '../stores/useAuthStore';

function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState(null);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async ({ email, password }) => {
    setError(null);
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

      setUser(data);
      onLoginSuccess();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthForm
      onSubmit={handleLogin}
      buttonText="Login"
      errorMessage={error}
    />
  );
}

export default LoginPage; 