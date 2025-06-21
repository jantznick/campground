import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';
import useHierarchyStore from './stores/useHierarchyStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/sidebar/Sidebar';

const PrivateRoute = ({ children }) => {
    const { user } = useAuthStore();
    return user ? children : <Navigate to="/login" />;
};

const App = () => {
    const { user, checkAuth } = useAuthStore();
    const { fetchHierarchy, hierarchy, setInitialActiveItems, activeOrganization } = useHierarchyStore();

    useEffect(() => {
        const initializeApp = async () => {
            await checkAuth();
        };
        initializeApp();
    }, [checkAuth]);

  useEffect(() => {
        if (user && hierarchy.length === 0) {
          fetchHierarchy();
        }
    }, [user, fetchHierarchy, hierarchy.length]);
  
    useEffect(() => {
        // When hierarchy data arrives and there's no active org, set the initial one.
        if (user && hierarchy.length > 0 && !activeOrganization) {
            setInitialActiveItems();
        }
    }, [user, hierarchy, activeOrganization, setInitialActiveItems]);

    return (
        <Router>
            <div className="flex h-screen bg-[var(--prussian-blue)] text-white">
                {user && <Sidebar />}
				<main className="flex-1 flex flex-col overflow-y-auto">
					<Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route 
                            path="/dashboard" 
                            element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
                        />
                         <Route 
                            path="/settings/:itemType/:id" 
                            element={<PrivateRoute><SettingsPage /></PrivateRoute>} 
                        />
                        <Route path="/*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
					</Routes>
				</main>
			</div>
        </Router>
    );
};

export default App; 