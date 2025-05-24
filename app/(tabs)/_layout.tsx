import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import Header from '../../components/Header';

export default function TabsLayout() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <View style={styles.container}>
                <Tabs
                    screenOptions={{
                        headerShown: false, // disable default header since we use custom one
                        tabBarActiveTintColor: '#16a34a',
                        tabBarInactiveTintColor: '#6b7280',
                        tabBarStyle: { backgroundColor: '#f9fafb' },
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
