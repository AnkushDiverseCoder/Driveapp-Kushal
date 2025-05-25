import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Screen3() {
    return (
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <Animated.View entering={FadeInDown.duration(800)} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#065f46', textAlign: 'center' }}>
                    Enable Notifications
                </Text>
                <Text style={{ marginTop: 8, fontSize: 16, color: '#065f46', opacity: 0.8, textAlign: 'center' }}>
                    Get real-time updates and alerts on your trips and drivers.
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                <Link href="/(tabs)/home" asChild>
                    <TouchableOpacity style={{
                        backgroundColor: '#16a34a',
                        paddingVertical: 14,
                        paddingHorizontal: 32,
                        borderRadius: 14,
                    }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Enable & Continue</Text>
                    </TouchableOpacity>
                </Link>
            </Animated.View>
        </View>
    );
}
