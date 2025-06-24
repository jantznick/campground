import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';
import { useDebounce } from '../hooks/useDebounce';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register, acceptInvitation } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInviteFlow, setIsInviteFlow] = useState(false);
    const [useMagicLink, setUseMagicLink] = useState(false);
    const [message, setMessage] = useState('');
    const [domainCheckResult, setDomainCheckResult] = useState(null);
    const debouncedEmail = useDebounce(email, 500);
  
    const inviteToken = searchParams.get('invite_token');

    // Debounced domain check logic
    const checkDomain = useCallback(async (domain) => {
        try {
            const response = await fetch(`/api/v1/auth/check-domain?domain=${domain}`);
            if (response.ok) {
                const data = await response.json();
                if (data.willJoin) {
                    setDomainCheckResult(`✓ This domain is registered. You will automatically join the ${data.entityName} ${data.entityType}.`);
                } else {
                    setDomainCheckResult(null);
                }
            }
        } catch (err) {
            // Do not show network errors to the user, just fail silently.
            console.error(err);
            setDomainCheckResult(null);
        }
    }, []);

    useEffect(() => {
        if (isInviteFlow) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(debouncedEmail)) {
            const domain = debouncedEmail.split('@')[1];
            checkDomain(domain);
        } else {
            setDomainCheckResult(null);
        }
    }, [debouncedEmail, isInviteFlow, checkDomain]);

    useEffect(() => {
        if (inviteToken) {
            const verifyToken = async () => {
                setLoading(true);
      setError(null);
      try {
                    const response = await fetch(`/api/v1/auth/invitation/${inviteToken}`);
                    if (!response.ok) {
                        setError('This invitation is invalid or has expired (links are valid for 24 hours). Please request a new link or continue with regular registration.');
                        navigate('/register', { replace: true });
                        setIsInviteFlow(false);
                        return;
                    }
        const data = await response.json();
                    setEmail(data.email);
                    setIsInviteFlow(true);
                } catch (err) {
                    setError(err.message);
                    navigate('/register', { replace: true });
                } finally {
                    setLoading(false);
                }
            };
            verifyToken();
        }
    }, [inviteToken, navigate]);

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const result = await register(email, useMagicLink ? undefined : password, { useMagicLink });
            if (useMagicLink) {
                setMessage(result.message);
                // Maybe clear the form or show a persistent success state
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAcceptInvitation = async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const result = await acceptInvitation(inviteToken, useMagicLink ? undefined : password, { useMagicLink });
            if (useMagicLink) {
                setMessage(result.message);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (isInviteFlow) {
            handleAcceptInvitation();
        } else {
            handleRegister();
      }
    };

    const getButtonText = () => {
        if (isInviteFlow) {
            return useMagicLink ? 'Activate & Send Login Link' : 'Set Password & Join';
        }
        return useMagicLink ? 'Sign Up & Send Login Link' : 'Create Account';
    };
  
    return (
        <AuthForm
            formType="register"
            title={isInviteFlow ? 'Complete Your Registration' : 'Create an account'}
            buttonText={getButtonText()}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={useMagicLink ? undefined : password}
            setPassword={useMagicLink ? undefined : setPassword}
            isEmailDisabled={isInviteFlow}
            domainCheckMessage={domainCheckResult}
            useMagicLink={useMagicLink}
            setUseMagicLink={setUseMagicLink}
            message={message}
            footerContent={
                !isInviteFlow && (
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-[var(--orange-wheel)] hover:text-opacity-80">
                            Sign in
                        </Link>
                    </p>
                )
            }
        />
    );
};
  
export default RegisterPage; 