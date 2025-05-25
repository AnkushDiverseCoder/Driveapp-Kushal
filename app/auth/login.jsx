import { View, Text, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
                    Welcome Back
                </Text>
                <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8 }}>
                    Login to your account
                </Text>
            </Animated.View>

            <View style={{ gap: 16 }}>
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
                <TouchableOpacity>
                    <Text style={{ color: '#064e3b', textAlign: 'right', fontWeight: '500' }}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        backgroundColor: '#064e3b',
                        paddingVertical: 14,
                        borderRadius: 12,
                        marginTop: 8,
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
                        Login
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
