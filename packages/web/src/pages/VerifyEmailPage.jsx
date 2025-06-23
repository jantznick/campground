import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerificationCode, isLoading, error: authError, logout } = useAuthStore();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    setError(authError);
  }, [authError]);

  const handleVerify = async () => {
    setError(null);
    setMessage('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    try {
      await verifyEmail(code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage('');
    try {
      const result = await resendVerificationCode();
      setMessage(result.message || 'A new code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const footerContent = (
    <div className="flex justify-between items-center w-full text-sm">
      <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }} className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
        Resend Code
      </a>
      <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="font-medium text-gray-500 hover:text-gray-700">
        Logout
      </a>
    </div>
  );

  return (
    <AuthForm
      formType="verify-email"
      title="Check your email"
      subtitle={`We've sent a 6-digit code to ${user?.email}. The code is valid for 15 minutes.`}
      buttonText="Verify Account"
      onSubmit={handleVerify}
      error={error}
      loading={isLoading}
      message={message}
      verificationCode={code}
      setVerificationCode={setCode}
      footerContent={footerContent}
    />
  );
};

export default VerifyEmailPage; 