import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import logo from '../logo.png';

const MagicLinkVerifyPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyMagicLink } = useAuthStore();

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('No verification token found. Please try again.');
            setLoading(false);
            return;
        }

        const verify = async () => {
            try {
                await verifyMagicLink(token);
                navigate('/dashboard');
            } catch (err) {
                setError(err.message || 'An unknown error occurred.');
                setLoading(false);
            }
        };

        verify();
    }, [searchParams, verifyMagicLink, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--prussian-blue)] text-white">
            <div className="w-full max-w-md p-8 space-y-8 bg-white/5 rounded-2xl shadow-lg border border-white/10 text-center">
                <div className="flex justify-center items-center space-x-3">
                    <img className="h-12 w-auto" src={logo} alt="Campground logo" />
                    <span className="text-4xl font-extrabold text-[var(--xanthous)]">Campground</span>
                </div>
                
                <div className="pt-4">
                    {loading && (
                        <div>
                            <h2 className="text-2xl font-bold">Verifying your link...</h2>
                            <p className="mt-2 text-gray-400">Please wait while we log you in.</p>
                        </div>
                    )}
                    {error && (
                        <div>
                            <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
                            <p className="mt-2 text-gray-300">{error}</p>
                            <Link 
                                to="/login" 
                                className="mt-6 inline-block font-medium text-[var(--orange-wheel)] hover:text-opacity-80"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MagicLinkVerifyPage; 