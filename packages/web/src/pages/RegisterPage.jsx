import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';
import logo from '../logo.png';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register, acceptInvitation } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInviteFlow, setIsInviteFlow] = useState(false);
  
    const inviteToken = searchParams.get('invite_token');

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
        try {
            await register(email, password);
          navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAcceptInvitation = async () => {
        setLoading(true);
        setError(null);
        try {
            await acceptInvitation(inviteToken, password);
            navigate('/dashboard');
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
  
    return (
        <AuthForm
            formType="register"
            title={isInviteFlow ? 'Complete Your Registration' : 'Create an account'}
            buttonText={isInviteFlow ? 'Set Password & Join' : 'Create Account'}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            isEmailDisabled={isInviteFlow}
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