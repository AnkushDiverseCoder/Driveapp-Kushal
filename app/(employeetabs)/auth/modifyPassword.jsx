import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import authService from '../../../services/authService';

const UserProfileScreen = () => {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async () => {
        setLoading(true);
        setMessage('');
        const result = await authService.changePassword(newPassword, currentPassword);
        if (result?.error) {
            setMessage(result.error);
        } else {
            setMessage('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
        }
        setLoading(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
                    My Profile
                </Text>
                <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
                    View your account info and update your password
                </Text>

            {message ? (
                <Text
                    style={{
                        color: message.includes('success') ? 'green' : 'red',
                        textAlign: 'center',
                        marginBottom: 16,
                    }}
                >
                    {message}
                </Text>
            ) : null}

            <View style={{ gap: 16 }}>
                <TextInput
                    value={user?.name || ''}
                    editable={false}
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f3f4f6',
                        fontSize: 16,
                        color: '#6b7280',
                    }}
                />

                <TextInput
                    value={user?.email || ''}
                    editable={false}
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#f3f4f6',
                        fontSize: 16,
                        color: '#6b7280',
                    }}
                />

                <TextInput
                    placeholder="Current Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
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

                <View style={{ position: 'relative' }}>
                    <TextInput
                        placeholder="New Password"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={{
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
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
                    onPress={handleChangePassword}
                    style={{
                        backgroundColor: '#064e3b',
                        paddingVertical: 14,
                        borderRadius: 12,
                        marginTop: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                            Update Password
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default UserProfileScreen;
