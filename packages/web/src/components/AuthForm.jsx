import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo.png';

const MailIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockIcon = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const AuthForm = ({
    formType,
    onSubmit,
    error,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    isEmailDisabled = false,
    title,
    buttonText,
    footerContent,
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ email, password });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--prussian-blue)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white/5 rounded-2xl shadow-lg border border-white/10 text-white">
                <div>
                    <img className="mx-auto h-12 w-auto" src={logo} alt="Stagehand" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold">{title}</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <MailIcon className="h-5 w-5 text-gray-500" />
                            </span>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 bg-black/20 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] focus:z-10 sm:text-sm disabled:bg-black/30 disabled:text-gray-400"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isEmailDisabled}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockIcon className="h-5 w-5 text-gray-500" />
                            </span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={formType === 'login' ? 'current-password' : 'new-password'}
                                required
                                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 bg-black/20 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-sm text-center pt-2">{error}</div>}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[var(--prussian-blue)] bg-[var(--orange-wheel)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--orange-wheel)] disabled:bg-opacity-50 disabled:cursor-not-allowed"
                        >
                             {loading ? 'Processing...' : buttonText}
                        </button>
                    </div>

                    {footerContent && (
                         <div className="text-sm text-center">
                            {footerContent}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AuthForm; 