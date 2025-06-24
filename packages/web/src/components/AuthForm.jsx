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
    subtitle,
    message,
    buttonText,
    footerContent,
    domainCheckMessage,
    onMagicLinkClick,
    verificationCode,
    setVerificationCode,
    useMagicLink,
    setUseMagicLink,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formType === 'verify-email') {
      onSubmit({ code: verificationCode });
    } else {
      onSubmit({ email, password });
    }
  };

  return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--prussian-blue)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white/5 rounded-2xl shadow-lg border border-white/10 text-white">
                <div>
                    <div className="flex justify-center items-center space-x-3">
                        <img className="h-12 w-auto" src={logo} alt="Campground logo" />
                        <span className="text-4xl font-extrabold text-[var(--xanthous)]">Campground</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold">{title}</h2>
                    {subtitle && (
                        <p className="mt-2 text-center text-sm text-gray-400">{subtitle}</p>
                    )}
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {email !== undefined && setEmail !== undefined && (
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
                                    disabled={isEmailDisabled || formType === 'verify-email'}
                                />
                            </div>
                        )}
                        {domainCheckMessage && (
                            <div className="text-center text-sm text-cyan-300 bg-cyan-900/50 border border-cyan-400/50 px-3 py-2 rounded-lg">
                                {domainCheckMessage}
                            </div>
                        )}
                        {password !== undefined && setPassword !== undefined && (!useMagicLink) && (
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
                        )}
                        {formType === 'register' && (
                            <div className="flex items-center justify-center">
                                <div className="flex items-center">
                                    <input
                                        id="use-magic-link"
                                        name="use-magic-link"
                                        type="checkbox"
                                        checked={useMagicLink}
                                        onChange={(e) => setUseMagicLink(e.target.checked)}
                                        className="h-4 w-4 text-[var(--orange-wheel)] bg-gray-700 border-gray-600 rounded focus:ring-[var(--orange-wheel)]"
                                    />
                                    <label htmlFor="use-magic-link" className="ml-2 block text-sm text-gray-300">
                                        Sign up with a login link instead of a password
                                    </label>
                                </div>
                            </div>
                        )}
                        {formType === 'login' && password !== undefined && (
                            <>
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-600" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-[var(--prussian-blue)] text-gray-400">or</span>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={onMagicLinkClick}
                                        disabled={loading}
                                        className="w-full flex justify-center py-2 px-4 border border-gray-500 text-sm font-medium rounded-md text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white disabled:opacity-50"
                                    >
                                        Email me a login link
                                    </button>
                                </div>
                            </>
                        )}
                        {formType === 'verify-email' && (
                            <div className="relative">
                                <input
                                    id="verification-code"
                                    name="verification-code"
                                    type="text"
                                    maxLength="6"
                                    required
                                    className="appearance-none relative block w-full text-center tracking-[1em] py-3 border border-gray-600 bg-black/20 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] focus:z-10 sm:text-lg"
                                    placeholder="------"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                            </div>
                        )}
                    </div>

                    {error && <div className="text-red-400 text-sm text-center pt-2">{error}</div>}
                    {message && <div className="text-green-400 text-sm text-center pt-2">{message}</div>}

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