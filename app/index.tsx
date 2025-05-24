// app/index.tsx

import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WelcomeScreen() {

  return (
    <LinearGradient
      colors={['#d4fc79', '#96e6a1']} // light green gradient
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
          source={require('../assets/driverLogo.png')} // ✅ Ensure this path is correct
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

      {/* Button */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)}>
        <Link href="/onboarding/screen1" asChild>
          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </LinearGradient>
  );
}
