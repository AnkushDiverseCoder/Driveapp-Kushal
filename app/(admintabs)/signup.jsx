import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

export default function SignupScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inputErrors, setInputErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    const { register, error } = useAuth();
    const navigation = useNavigation();

    const validateInputs = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!fullName.trim()) errors.fullName = 'Full name is required';
        if (!email) errors.email = 'Email is required';
        else if (!emailRegex.test(email)) errors.email = 'Invalid email format';
        if (!password) errors.password = 'Password is required';
        else if (password.length < 6) errors.password = 'Password must be at least 6 characters';

        setInputErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateInputs()) return;
        
        const result = await register(fullName, email, password);
        if (result?.success) {
            setShowSuccess(true);
        }
    };

    const handleAlertClose = () => {
        setShowSuccess(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
        });
    };

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

            {(error || inputErrors.fullName || inputErrors.email || inputErrors.password) && (
                <Text style={{ color: 'red', textAlign: 'center', marginBottom: 12 }}>
                    {error || inputErrors.fullName || inputErrors.email || inputErrors.password}
                </Text>
            )}

            <View style={{ gap: 16 }}>
                <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={text => {
                        setFullName(text);
                        setInputErrors(prev => ({ ...prev, fullName: null }));
                    }}
                    style={{
                        borderWidth: 1,
                        borderColor: inputErrors.fullName ? 'red' : '#e5e7eb',
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
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={text => {
                        setEmail(text);
                        setInputErrors(prev => ({ ...prev, email: null }));
                    }}
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

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={password}
                    onChangeText={text => {
                        setPassword(text);
                        setInputErrors(prev => ({ ...prev, password: null }));
                    }}
                    style={{
                        borderWidth: 1,
                        borderColor: inputErrors.password ? 'red' : '#e5e7eb',
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
                    onPress={handleSignup}
                >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={showSuccess}
                title="Registration Successful"
                message="Your account has been created successfully!"
                onClose={handleAlertClose}
            />
        </View>
    );
}
