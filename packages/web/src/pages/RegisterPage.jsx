import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import { useAuthStore } from '../stores/useAuthStore';

function RegisterPage({ onLoginSuccess }) {
  const [error, setError] = useState(null);
  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async ({ email, password }) => {
    setError(null);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const userData = await response.json();

      if (!response.ok) {
        throw new Error(userData.error || 'Registration failed');
      }

      // After successful registration, a cookie is already set by the server.
      // The response body contains the user data.
      setUser(userData);
      onLoginSuccess();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthForm
      onSubmit={handleRegister}
      buttonText="Register"
      errorMessage={error}
    />
  );
}

export default RegisterPage; 