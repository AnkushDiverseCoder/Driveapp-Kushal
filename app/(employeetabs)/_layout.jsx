import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import Header from '../../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context'; // Use this SafeAreaView for better results

export default function TabsLayout() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Only apply safe area to top to protect status bar */}
            <Header />
            <View style={styles.container}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: '#16a34a',
                        tabBarInactiveTintColor: '#6b7280',
                        tabBarStyle: { backgroundColor: '#f9fafb' },
                        sceneContainerStyle: {
                            paddingTop: 60, // Leave space below custom header
                            backgroundColor: '#f9fafb',
                        },
                    }}
                >
                    <Tabs.Screen name="home" options={{ title: 'Home' }} />
                    <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
                    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
                    <Tabs.Screen name="travelForm" options={{ title: 'Travel Form' }} />
                </Tabs>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { flex: 1 },
});
