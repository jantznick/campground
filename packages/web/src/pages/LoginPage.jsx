import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';
import { useDebounce } from '../hooks/useDebounce';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, forgotPassword, requestMagicLink } = useAuthStore();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [message, setMessage] = useState('');

    const [oidcConfig, setOidcConfig] = useState(null);
    const [domainCheckMessage, setDomainCheckMessage] = useState(null);
    const debouncedEmail = useDebounce(email, 500);

    const inviteToken = searchParams.get('invite_token');

    useEffect(() => {
        if (inviteToken) {
            navigate(`/register?invite_token=${inviteToken}`);
        }
    }, [inviteToken, navigate]);

    useEffect(() => {
        if (isResetMode) {
            setOidcConfig(null);
            setDomainCheckMessage(null);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        async function checkOidcStatus() {
            if (emailRegex.test(debouncedEmail)) {
                try {
                    const response = await fetch(`/api/v1/auth/check-oidc?email=${debouncedEmail}`);
                    const data = await response.json();
                    if (data.ssoEnabled) {
                        setOidcConfig(data);
                        setDomainCheckMessage(`SSO is enabled for your organization. You will be redirected to sign in.`);
                    } else {
                        setOidcConfig(null);
                        setDomainCheckMessage(null);
                    }
                } catch (err) {
                    console.error('Failed to check OIDC status:', err);
                    setOidcConfig(null);
                    setDomainCheckMessage(null);
                }
            } else {
                setOidcConfig(null);
                setDomainCheckMessage(null);
            }
        }
        checkOidcStatus();
    }, [debouncedEmail, isResetMode]);

    const handleLogin = async () => {
        if (oidcConfig) {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            window.location.href = `${apiBaseUrl}/api/v1/auth/oidc?organizationId=${oidcConfig.organizationId}`;
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const result = await forgotPassword(email);
            setMessage(result.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const result = await requestMagicLink(email);
            setMessage(result.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleResetMode = (e) => {
        if (e) e.preventDefault();
        setIsResetMode(!isResetMode);
        setError(null);
        setMessage('');
        setPassword('');
    };
    
    const footerContent = isResetMode ? (
        <p>
            Remember your password?{' '}
            <a href="#" onClick={toggleResetMode} className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
                Back to Sign In
            </a>
        </p>
    ) : (
        <div className="flex justify-between items-center w-full">
            <a href="#" onClick={toggleResetMode} className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80 text-sm">
                Forgot password?
            </a>
            <p className="text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
                    Sign up
                </Link>
            </p>
        </div>
    );

    return (
        <AuthForm
            formType={isResetMode ? 'forgot-password' : 'login'}
            title={isResetMode ? 'Reset your password' : 'Sign in to your account'}
            buttonText={isResetMode ? 'Send Reset Link' : (oidcConfig ? oidcConfig.buttonText || 'Continue with SSO' : "Login")}
            onSubmit={isResetMode ? handleForgotPassword : handleLogin}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={isResetMode || oidcConfig ? undefined : password}
            setPassword={isResetMode || oidcConfig ? undefined : setPassword}
            domainCheckMessage={isResetMode ? (message || 'Enter your email to receive a password reset link.') : domainCheckMessage}
            message={message}
            footerContent={footerContent}
            onMagicLinkClick={handleMagicLink}
        />
    );
};

export default LoginPage; 