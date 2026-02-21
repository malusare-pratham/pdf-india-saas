/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMyProfile, loginUser, registerUser } from '../service/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const normalizeUser = (payload) => {
        if (!payload) return null;
        if (payload.user) return payload.user;

        return {
            _id: payload._id,
            full_name: payload.full_name,
            email: payload.email,
            role: payload.role || 'user',
            plan_type: payload.plan_type || 'free',
        };
    };

    const updateUser = (nextUser) => {
        if (!nextUser) return;
        const normalized = normalizeUser(nextUser);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
    };

    // Check if user is already logged in on page load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        const boot = async () => {
            if (!storedUser || !token) {
                setLoading(false);
                return;
            }

            try {
                setUser(JSON.parse(storedUser));
                const res = await getMyProfile();
                const profile = res.data?.data;
                if (profile) {
                    updateUser(profile);
                }
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, []);

    // Login Function
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await loginUser({ email, password });
            const token = res.data?.token;
            const userData = normalizeUser(res.data);

            if (!token || !userData) {
                throw new Error('Invalid login response');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (fullName, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await registerUser({ full_name: fullName, email, password });
            const token = res.data?.token;
            const userData = normalizeUser(res.data);

            if (!token || !userData) {
                throw new Error('Invalid registration response');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Registration failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Logout Function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context easily
export const useAuth = () => useContext(AuthContext);
