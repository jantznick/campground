import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuthStore();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const inviteToken = searchParams.get('invite_token');

    useEffect(() => {
        if (inviteToken) {
            navigate(`/register?invite_token=${inviteToken}`);
        }
    }, [inviteToken, navigate]);

    const handleLogin = async () => {
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
            buttonText="Login"
            onSubmit={handleLogin}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
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