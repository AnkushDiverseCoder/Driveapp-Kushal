import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SignupScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
                    Create Account
                </Text>
                <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
                    Sign up to get started
                </Text>
            </Animated.View>

            <View style={{ gap: 16 }}>
                <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="#9ca3af"
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f9fafb',
                        fontSize: 16,
                    }}
                />
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#9ca3af"
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f9fafb',
                        fontSize: 16,
                    }}
                />
                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f9fafb',
                        fontSize: 16,
                    }}
                />

                <TouchableOpacity
                    style={{
                        backgroundColor: '#064e3b',
                        paddingVertical: 14,
                        borderRadius: 12,
                        marginTop: 8,
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
