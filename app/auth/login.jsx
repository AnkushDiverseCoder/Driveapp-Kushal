import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [inputErrors, setInputErrors] = useState({});
    const { login, error, loading, user } = useAuth();
    const router = useRouter();

    const validateInputs = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            errors.email = 'Enter a valid email address';
        }

        if (!password) {
            errors.password = 'Password is required';
        }

        setInputErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        if (!loading && !error && user) {
            console.log(user)
            if (user.labels[0] === 'admin') {
                router.replace('/(admintabs)/home'); // 👈 Navigate automatically after 2 seconds
            } else {
                router.replace('/(employeetabs)/home'); // 👈 Navigate automatically after 2 seconds
            }
        }

        return () => clearTimeout(); // Cleanup on unmount
    }, [router, error, loading, user]);

    const handleLogin = async () => {
        if (!validateInputs()) return;
        try {
            const result = await login(email, password);
            if (result?.success) {
                const user = result.user;
                if (user.labels?.[0] === 'admin') {
                    router.replace('/(admintabs)/home');
                } else {
                    router.replace('/(employeetabs)/home');
                }
            }
        } catch (error) {
            console.error('Login failed:', error.message);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
                    Login to Your Account
                </Text>
                <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
                    Welcome back! Please enter your details.
                </Text>
            </Animated.View>

            {/* {(error || inputErrors.email || inputErrors.password) && (
                <Text style={{ color: 'red', textAlign: 'center', marginBottom: 12 }}>
                    {error || inputErrors.email || inputErrors.password}
                </Text>
            )} */}

            <View style={{ gap: 16 }}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setInputErrors((prev) => ({ ...prev, email: null }));
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                        borderWidth: 1,
                        borderColor: inputErrors.email ? 'red' : '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f9fafb',
                        fontSize: 16,
                    }}
                />

                <View style={{ position: 'relative' }}>
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setInputErrors((prev) => ({ ...prev, password: null }));
                        }}
                        style={{
                            borderWidth: 1,
                            borderColor: inputErrors.password ? 'red' : '#e5e7eb',
                            borderRadius: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            backgroundColor: '#f9fafb',
                            fontSize: 16,
                            paddingRight: 48,
                        }}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: 16,
                            top: 12,
                        }}
                    >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={{
                        backgroundColor: '#064e3b',
                        paddingVertical: 14,
                        borderRadius: 12,
                        marginTop: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                    }}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                            Log In
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
