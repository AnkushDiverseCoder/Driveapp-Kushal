import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { logout } = useAuth(); // Assuming you have an AuthContext for authentication
    const handleLogout = async () => {
        try {
            await logout();          // call logout from your AuthContext
            router.push('/auth/login');  // redirect to login page
        } catch (error) {
            console.error('Logout failed:', error);
            // Optionally show an error message here
        }
    };
    return (
        <View
            style={{
                paddingTop: insets.top - 10,
                paddingBottom: 12,
                paddingHorizontal: 16,
                backgroundColor: '#ffffff',
                borderBottomColor: '#e5e7eb',
                borderBottomWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
            }}
        >
            {/* Logo */}
            <Image
                source={require('../assets/driverLogo.png')}
                style={{ width: 120, height: 40, resizeMode: 'cover' }}
            />

            {/* Logout Button */}
            <TouchableOpacity
                onPress={handleLogout}
                style={{
                    backgroundColor: '#065f46',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 100,
                }}
            >
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                    Logout
                </Text>
            </TouchableOpacity>
        </View>
    );
}
