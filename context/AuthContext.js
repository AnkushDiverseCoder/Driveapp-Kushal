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
            console.log('Current user data:', userData);
            if (!userData || userData.error) {
                setUser(null);
                setError(null);
                return null;
            } else {
                setUser(userData);
                return userData;
            }
        } catch (err) {
            setUser(null);
            setError(err.message || 'Failed to fetch user data. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(username, password);
            console.log('Login response:', response);
            if (response.error) {
                setError(response.error);
                return { success: false };
            }

            const currentUser = await fetchCurrentUser();
            if (!currentUser || currentUser.error) {
                setError(currentUser?.error || 'Failed to fetch user after login.');
                return { success: false };
            }

            setUser(currentUser);
            return { success: true, user: currentUser };
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

    const register = async (username, email, password, label) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.register(username, email, password, label);
            if (response.error) {
                setError(response.error);
                return { success: false };
            }
            // Optional: Automatically login after registration?
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
