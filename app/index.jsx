import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import authService from '../services/authService';

export default function WelcomeScreen() {
  const router = useRouter();
  const { loading, error } = useAuth();
  
  useEffect(() => {
    let timeout;

    const checkUserAndRedirect = async () => {
        try {
            const user = await authService.getCurrentUser();

            if (!loading && !error) {
                if (!user || user.error) {
                    timeout = setTimeout(() => {
                        router.replace('/auth/login');
                    }, 2000);
                    return;
                }

                const role = user.labels?.[0]?.toLowerCase() || '';
                timeout = setTimeout(() => {
                    if (role === 'admin') {
                        router.replace('/(admintabs)/home');
                    } else if (role === 'supervisor') {
                        router.replace('/(supervisortabs)/home');
                    }else if (role === 'employee') {
                        router.replace('/(employeetabs)/home');
                    } else {
                        router.replace('/auth/login');
                    }
                }, 2000);
            }
        } catch (e) {
            timeout = setTimeout(() => {
                router.replace('/auth/login');
            }, 2000);
            console.log(e)
        }
    };

    checkUserAndRedirect();

    return () => clearTimeout(timeout); // ✅ Cleanup timeout
}, [router, error, loading]);

  return (
    <LinearGradient
      colors={['#d4fc79', '#96e6a1']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
    >
      {/* Floating decorative circle */}
      <View style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 160,
        height: 160,
        backgroundColor: '#4ade80',
        borderRadius: 80,
        opacity: 0.25,
      }} />

      {/* Logo */}
        <Image
          source={require('../assets/driverLogo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />

      {/* Text */}
        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#065f46',
          textAlign: 'center',
        }}>
          Welcome to DrivePro
        </Text>
        <Text style={{
          marginTop: 8,
          color: '#065f46',
          textAlign: 'center',
          fontSize: 16,
          opacity: 0.8,
        }}>
          Manage your drivers with ease and efficiency.
        </Text>

    </LinearGradient>
  );
}
