import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(admintabs)/home'); // 👈 Navigate automatically after 2 seconds
    }, 2000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [router]);

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
      <Animated.View entering={FadeInDown.duration(800)} style={{ marginBottom: 32 }}>
        <Image
          source={require('../assets/driverLogo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} style={{ marginBottom: 24 }}>
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
      </Animated.View>

    </LinearGradient>
  );
}
