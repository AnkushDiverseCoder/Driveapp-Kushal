import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputErrors, setInputErrors] = useState({});
  const [loginError, setLoginError] = useState(null);

  const { login, loading, error } = useAuth();
  const router = useRouter();

  const validateInputs = () => {
    const errors = {};
    if (!username) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    try {
      setLoginError(null);
      setInputErrors({});
      const result = await login(username, password);

      if (result?.success) {
        const role = result.user.labels?.[0] || '';
        switch (role.toLowerCase()) {
          case 'admin':
            router.replace('/(admintabs)/home');
            break;
          case 'employee':
            router.replace('/(employeetabs)/home');
            break;
          case 'supervisor':
            router.replace('/(supervisortabs)/home');
            break;
          case 'attached':
            router.replace('/(attachedtabs)/home');
            break;
          default:
            router.replace('/auth/login');
            break;
        }
      } else {
        setLoginError(result?.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError(err.message || 'An unexpected error occurred.');
      console.error('Login failed:', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Image
              source={require('../../assets/driverLogo.png')}
              style={{
                width: 150,
                height: 150,
                resizeMode: 'contain',
                borderRadius: 75,
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 5,
              }}
            />
          </View>

          {/* Welcome Text */}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#064e3b', textAlign: 'center' }}>
            Login to Your Account
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            Welcome back! Please enter your username and password.
          </Text>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <TextInput
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setInputErrors((prev) => ({ ...prev, username: null }));
              }}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: inputErrors.username ? 'red' : '#e5e7eb',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#f9fafb',
                fontSize: 16,
              }}
            />

            <View style={{ position: 'relative' }}>
              <TextInput
                key={showPassword ? 'text' : 'password'} // Forces re-render
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setInputErrors((prev) => ({ ...prev, password: null }));
                }}
                autoCapitalize="none"
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
                onPress={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: [{ translateY: -11 }],
                  padding: 4,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Log In</Text>
              )}
            </TouchableOpacity>

            {loginError && (
              <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
                {error || loginError}
              </Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
