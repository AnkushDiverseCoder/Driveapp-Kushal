// components/RoleGuard.js
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { router, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

const RoleGuard = ({ children }) => {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (loading || !user) return;

        const role = user.labels?.[0];

        // Check current route and only redirect if needed
        if (!user) {
            router.replace('/auth/login');
        } else if (role === '') {
            router.replace('/auth/login');
        }
    }, [user, loading, pathname]);


    if (loading || !user) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#064e3b" />
            </View>
        );
    }

    return children;
};

export default RoleGuard;
