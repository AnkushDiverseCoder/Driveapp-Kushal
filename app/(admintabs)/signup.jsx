import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform,
    Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

export default function RegisterScreen() {
    const [form, setForm] = useState({
        username: '',
        displayName: '',
        email: '',
        password: '',
        label: 'employee',
    });

    const [resetLoading, setResetLoading] = useState(false);
    const [resetPassword, setResetPassword] = useState('');


    const [inputErrors, setInputErrors] = useState({});
    const auth = useAuth();
    const register = auth?.register;
    const loading = auth?.loading;

    const validateInputs = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^(?![._])[a-zA-Z0-9._]{3,20}(?<![._])$/;

        if (!form.username) {
            errors.username = 'Username is required';
        } else if (/\s/.test(form.username)) {
            errors.username = 'Username cannot contain spaces';
        } else if (!usernameRegex.test(form.username)) {
            errors.username = 'Must be 3–20 characters (letters, numbers, ".", "_")';
        }

        if (!form.displayName) {
            errors.displayName = 'Display Name is required';
        }

        if (!form.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(form.email)) {
            errors.email = 'Invalid email format';
        }

        if (!form.password) {
            errors.password = 'Password is required';
        } else if (form.password.length < 6) {
            errors.password = 'Must be at least 6 characters';
        }

        setInputErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateInputs()) return;
        if (!register) {
            alert('Register function not available');
            return;
        }

        try {
            const result = await register(
                form.username,
                form.email,
                form.password,
                [form.label],
                form.displayName // ✅ pass displayName
            );

            console.log("Register result:", result);

            if (result?.success) {
                alert('Registration successful!');
            } else {
                alert(result?.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Unhandled error during registration:', err);
            alert('Something went wrong. Please try again.');
        }
    };

    const router = useRouter();

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#ffffff' }}>
                    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
                        Register
                    </Text>
                    <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
                        Fill in your details to create an account
                    </Text>

                    <View style={{ gap: 16, marginTop: 24 }}>
                        {/* Username */}
                        <TextInput
                            placeholder="Username"
                            value={form.username}
                            onChangeText={(text) => {
                                setForm({ ...form, username: text });
                                setInputErrors((prev) => ({ ...prev, username: null }));
                            }}
                            style={{
                                borderWidth: 1,
                                borderColor: inputErrors.username ? 'red' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 12,
                                backgroundColor: '#f9fafb',
                                fontSize: 16,
                            }}
                        />
                        {inputErrors.username && (
                            <Text style={{ color: 'red', marginTop: -12 }}>{inputErrors.username}</Text>
                        )}

                        {/* Display Name */}
                        <TextInput
                            placeholder="Display Name"
                            value={form.displayName}
                            onChangeText={(text) => {
                                setForm({ ...form, displayName: text });
                                setInputErrors((prev) => ({ ...prev, displayName: null }));
                            }}
                            style={{
                                borderWidth: 1,
                                borderColor: inputErrors.displayName ? 'red' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 12,
                                backgroundColor: '#f9fafb',
                                fontSize: 16,
                            }}
                        />
                        {inputErrors.displayName && (
                            <Text style={{ color: 'red', marginTop: -12 }}>{inputErrors.displayName}</Text>
                        )}

                        {/* Email */}
                        <TextInput
                            placeholder="Email"
                            value={form.email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={(text) => {
                                setForm({ ...form, email: text });
                                setInputErrors((prev) => ({ ...prev, email: null }));
                            }}
                            style={{
                                borderWidth: 1,
                                borderColor: inputErrors.email ? 'red' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 12,
                                backgroundColor: '#f9fafb',
                                fontSize: 16,
                            }}
                        />
                        {inputErrors.email && (
                            <Text style={{ color: 'red', marginTop: -12 }}>{inputErrors.email}</Text>
                        )}

                        {/* Password */}
                        <TextInput
                            placeholder="Password"
                            value={form.password}
                            secureTextEntry
                            onChangeText={(text) => {
                                setForm({ ...form, password: text });
                                setInputErrors((prev) => ({ ...prev, password: null }));
                            }}
                            style={{
                                borderWidth: 1,
                                borderColor: inputErrors.password ? 'red' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 12,
                                backgroundColor: '#f9fafb',
                                fontSize: 16,
                            }}
                        />
                        {inputErrors.password && (
                            <Text style={{ color: 'red', marginTop: -12 }}>{inputErrors.password}</Text>
                        )}

                        {/* Role Selector */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' }}>
                            {['employee', 'admin', 'supervisor', 'attached'].map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    onPress={() => setForm({ ...form, label: role })}
                                    style={{
                                        flexGrow: 1,
                                        margin: 4,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: form.label === role ? '#064e3b' : '#f3f4f6',
                                        borderWidth: 1,
                                        borderColor: '#e5e7eb',
                                        alignItems: 'center',
                                        minWidth: '30%',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: form.label === role ? 'white' : '#374151',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-2">
                            {/* Submit Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#064e3b',
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                }}
                                className="w-1/2"
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                                        Register
                                    </Text>
                                )}
                            </TouchableOpacity>
                            {/* Submit Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#064e3b',
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                }}
                                className="w-1/2"
                                onPress={() => router.replace('/(admintabs)/auth/modifyUser')}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                                        Modify
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {
                            <View style={{ marginTop: 16 }}>
                                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Reset All Passwords</Text>

                                <TextInput
                                    placeholder="Enter new password (min 6 characters)"
                                    secureTextEntry
                                    value={resetPassword}
                                    onChangeText={(text) => setResetPassword(text)}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#e5e7eb',
                                        borderRadius: 12,
                                        padding: 12,
                                        backgroundColor: '#f9fafb',
                                        fontSize: 16,
                                        marginBottom: 12,
                                    }}
                                />

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#b91c1c',
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                    onPress={() => {
                                        if (resetPassword.length < 6) {
                                            Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
                                            return;
                                        }

                                        Alert.alert(
                                            'Confirm Reset',
                                            `This will set *every* user's password to "${resetPassword}". Proceed?`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Confirm',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        setResetLoading(true);
                                                        const result = await authService.resetAllUserPasswords(resetPassword);
                                                        setResetLoading(false);

                                                        if (result.success) {
                                                            Alert.alert('Success', 'All passwords have been reset.');
                                                            setResetPassword('');
                                                        } else {
                                                            Alert.alert('Error', result.error || 'Failed to reset passwords.');
                                                        }
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                                            Reset Passwords
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
