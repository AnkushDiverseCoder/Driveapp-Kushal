import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCurrentUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const userData = await authService.getCurrentUser();
            if (userData.error) {
                // User is not logged in or no permission, clear user state
                setUser(null);
                setError(null);
            } else {
                setUser(userData);
                return userData; // Return user data for further processing if needed
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch user data. Please try again.');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(email, password);
            if (response.error) {
                setError(response.error);
                return { success: false };
            }
            // After login, fetch user info with labels etc.
            const currentUser = await fetchCurrentUser();
            if (currentUser.error) {
                setError(currentUser.error);
                return { success: false };
            }
            setUser(currentUser);
            return { success: true, user: currentUser }; // <-- return user object with labels
        } catch (err) {
            setError(err.message || 'Login failed. Please check your email and password.');
            return { success: false };
        } finally {
            setLoading(false);
        }
    };


    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.logout();
            if (response.error) {
                setError(response.error);
            } else {
                console.log('Logout successful');
                setUser(null);
            }
        } catch (err) {
            setError(err.message || 'Logout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.register(name, email, password);
            if (response.error) {
                setError(response.error);
                return { success: false };
            }
            // After registration, user might still need to login or fetch user
            await fetchCurrentUser();
            return { success: true };
        } catch (err) {
            setError(err.message || 'Registration failed. Please check your details.');
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
