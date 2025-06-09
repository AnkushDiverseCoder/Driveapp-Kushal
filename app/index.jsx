import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading, error } = useAuth();
  
  useEffect(() => {
    if (!loading && !error && !user) {
      setTimeout(() => {
        router.replace('auth/login'); // 👈 Navigate automatically after 2 seconds
      }, 2000);
    }
    if (!loading && !error && user) {
      if(user.labels[0] === 'admin') {
        setTimeout(() => {
          router.replace('/(admintabs)/home'); // 👈 Navigate automatically after 2 seconds
        }, 2000);
      }
      setTimeout(() => {
        router.replace('/(employeetabs)/home'); // 👈 Navigate automatically after 2 seconds
      }, 2000);
    }

    return () => clearTimeout(); // Cleanup on unmount
  }, [router, error, loading, user]);

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
