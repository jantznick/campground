import { useState, useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Sidebar from './components/sidebar/Sidebar';
import SettingsPage from './pages/SettingsPage';
import logo from './logo.png';

function App() {
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(true);
  const { user, setUser, logout } = useAuthStore();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/v1/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // If the /me endpoint fails (e.g., 401), ensure user is logged out
          logout();
        }
      } catch (error) {
        console.error("Could not fetch user", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [setUser, logout]);

  if (loading) {
      return <div className="main-container"><h1>Loading...</h1></div>
  }

  // If there's a user, show the main app view
  if (user) {
    return (
        <Router>
			<div className="flex h-screen bg-[var(--prussian-blue)]">
				<Sidebar />
				<main className="flex-1 flex flex-col overflow-y-auto">
					<Routes>
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/settings/:itemType/:id" element={<SettingsPage />} />
							<Route path="/*" element={<Navigate to="/dashboard" />} />
					</Routes>
				</main>
			</div>
        </Router>
    );
  }

  // Otherwise, show the login or register page
  return (
    <div className="main-container">
      <img src={logo} alt="Stagehand" className="w-80 mb-8" />
      {view === 'login' ? (
        <>
          <LoginPage onLoginSuccess={() => { /* No need to change view here */ }} />
          <p className="page-toggle" onClick={() => setView('register')}>
            Don't have an account? Register
          </p>
        </>
      ) : (
        <>
          <RegisterPage onLoginSuccess={() => { /* No need to change view here */ }} />
          <p className="page-toggle" onClick={() => setView('login')}>
            Already have an account? Login
          </p>
        </>
      )}
    </div>
  );
}

export default App; 