import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import 'react-native-reanimated';


export default function WelcomeScreen() {
  const router = useRouter();
  const { loading, error } = useAuth();

  const fadeInText = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeInText, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      delay: 400,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.4,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timeout = setTimeout(async () => {
      try {
        const user = await authService.getCurrentUser();

        if (!loading && !error) {
          const role = user?.labels?.[0]?.toLowerCase() || '';
          if (!user || user.error) return router.replace('/auth/login');

          if (role === 'admin') router.replace('/(admintabs)/home');
          else if (role === 'supervisor') router.replace('/(supervisortabs)/home');
          else if (role === 'employee') router.replace('/(employeetabs)/home');
          else if (role === 'attached') router.replace('/(attachedtabs)/home');
          else router.replace('/auth/login');
        }
      } catch {
        router.replace('/auth/login');
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router, loading, error, dotScale, fadeInText]);

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <LinearGradient
        colors={['#d1fae5', '#f0fdf4']}
        style={styles.container}
      >
        {/* Wavy overlays */}
        <View style={styles.wavyBackground1} />
        <View style={styles.wavyBackground2} />

        {/* Logo block */}
        <Animated.View style={styles.logoWrapper}>
          <Image
            source={require('../assets/driverLogo.png')}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.dot, { transform: [{ scale: dotScale }] }]}
          />
        </Animated.View>

        {/* Tagline badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Trusted. Smart. Efficient.</Text>
        </View>

        {/* Welcome texts */}
        <Animated.Text style={[styles.title, { opacity: fadeInText }]}>
          Welcome to Kushal Partner
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: fadeInText }]}>
          Simplify your workforce like never before.
        </Animated.Text>

        {/* Footer strip */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Empowering logistics for a greener tomorrow</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wavyBackground1: {
    position: 'absolute',
    width: '120%',
    height: '60%',
    backgroundColor: '#34d399',
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ scaleX: 1.8 }],
    top: -50,
    zIndex: -3,
  },
  wavyBackground2: {
    position: 'absolute',
    width: '120%',
    height: '40%',
    backgroundColor: '#10b981',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    transform: [{ scaleX: 1.5 }],
    top: 10,
    zIndex: -2,
  },
  logoWrapper: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 100,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: '#16a34a',
    borderRadius: 6,
    marginLeft: -10,
  },
  badge: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#065f46',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 10,
    color: '#047857',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#065f46',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
