import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';
import { useDebounce } from '../hooks/useDebounce';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuthStore();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        async function checkOidcStatus() {
            if (emailRegex.test(debouncedEmail)) {
                try {
                    const response = await fetch(`/api/v1/auth/oidc-status?email=${debouncedEmail}`);
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
    }, [debouncedEmail]);

    const handleLogin = async () => {
        if (oidcConfig) {
            window.location.href = `/api/v1/auth/oidc?organizationId=${oidcConfig.organizationId}`;
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

    return (
        <AuthForm
            formType="login"
            title="Sign in to your account"
            buttonText={oidcConfig ? oidcConfig.buttonText || 'Continue with SSO' : "Login"}
            onSubmit={handleLogin}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={oidcConfig ? undefined : password}
            setPassword={oidcConfig ? undefined : setPassword}
            domainCheckMessage={domainCheckMessage}
            footerContent={
                <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
                        Sign up
                    </Link>
                </p>
            }
        />
    );
};

export default LoginPage; 