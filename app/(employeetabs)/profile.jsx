import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import authService from '../../services/authService';
import dailyEntryFormService from '../../services/dailyEntryFormService';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const ACCENT_COLOR = '#064e3b';

// Helper to check if two dates (JS Date objects) are the same day
function isSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export default function Profile() {
    
    const router = useRouter();
    
    const { user } = useAuth();
    const [dailyEntryDone, setDailyEntryDone] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser?.email) {

                const entryList = await dailyEntryFormService.listDailyEntry();
                console.log('Daily Entries:', entryList);
                console.log('User Details', user.name);
                const today = new Date();

                // entryList.data.documents is expected structure
                const foundTodayEntry = entryList.data.documents.find((entry) => {
                    const entryDate = new Date(entry.$createdAt);
                    return (
                        isSameDay(today, entryDate) &&
                        entry.userEmail === currentUser.email
                    );
                });

                setDailyEntryDone(!!foundTodayEntry);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
                padding: 24,
                backgroundColor: 'white',
                alignItems: 'center',
            }}
        >
            {/* Avatar */}
            {user && (
                <Image
                    source={{ uri: `https://ui-avatars.com/api/?name=${user?.name}&background=random&color=fff` }}
                    style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 24 }}
                />
            )}

            {/* User Info */}
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 4,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: ACCENT_COLOR,
                }}
            >
                <Text style={{ fontSize: 22, fontWeight: '700', color: ACCENT_COLOR, marginBottom: 8 }}>
                    {user?.name}
                </Text>
                <Text style={{ fontSize: 16, color: ACCENT_COLOR, opacity: 0.8 }}>{user?.email}</Text>
            </View>

            {/* Daily Entry */}
            <View
                style={{
                    width: '100%',
                    backgroundColor: '#f0fdf4',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 4,
                    marginBottom: 16,
                    borderLeftWidth: 6,
                    borderLeftColor: dailyEntryDone ? '#16a34a' : '#dc2626',
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: '600', color: ACCENT_COLOR }}>
                    Daily Entry Status
                </Text>
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: dailyEntryDone ? '#16a34a' : '#dc2626',
                        marginTop: 6,
                    }}
                >
                    {dailyEntryDone ? '✔️ Done Today' : '❌ Not Done'}
                </Text>
            </View>

            <TouchableOpacity
                style={{
                    width: '100%',
                    backgroundColor: ACCENT_COLOR,
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                onPress={() => router .push('/(employeetabs)/auth/modifyPassword')}
            >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    Update Login Credentials
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
