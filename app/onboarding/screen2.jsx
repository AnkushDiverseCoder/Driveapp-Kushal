import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Screen2() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
      <Animated.View entering={FadeInDown.duration(800)} style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#065f46', textAlign: 'center' }}>
          Allow Background Tracking
        </Text>
        <Text style={{ marginTop: 8, fontSize: 16, color: '#065f46', opacity: 0.8, textAlign: 'center' }}>
          Let us continue tracking even when the app is minimized, for uninterrupted data.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(800)}>
        <Link href="/onboarding/screen3" asChild>
          <TouchableOpacity style={{
            backgroundColor: '#16a34a',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 14,
          }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Allow Background</Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </View>
  );
}
