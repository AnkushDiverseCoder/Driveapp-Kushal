import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator,
    TextInput, Animated, Easing
} from 'react-native';
import TripService from '../../services/tripService';

const COLORS = {
    accent: '#065f46',
    bgLight: '#f0f4f8',
    cardBg: '#ffffff',
    textPrimary: '#374151',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    badgeYellow: '#facc15',
    badgeGray: '#9ca3af',
    badgePink: '#f87171',
};

export default function TripDetails() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const animatedWidth = useState(new Animated.Value(260))[0];

    useEffect(() => { fetchTrips(); }, []);
    useEffect(() => {
        setFilteredData(
            search.trim()
                ? data.filter(d => d.userEmail.toLowerCase().includes(search.toLowerCase()))
                : data
        );
    }, [search, data]);

    const fetchTrips = async () => {
        setLoading(true); setError(null);
        try {
            const res = await TripService.listTrips();
            setData(res.data.documents || []);
        } catch {
            setError('Failed to fetch trip data.');
        } finally {
            setLoading(false);
        }
    };

    const animateWidth = toVal => Animated.timing(animatedWidth, {
        toValue: toVal, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: false
    }).start();

    const formatDate = iso => {
        const dt = new Date(iso);
        return dt.toLocaleString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).replace(',', ' ·');
    };

    const renderCard = entry => (
        <View key={entry.$id} style={styles.card}>
            {/* Header */}
            <View style={styles.topBar}>
                <Text style={styles.amount}>{entry.userEmail}</Text>
                <View style={styles.topBarRight}>
                    <View style={[styles.badge, { backgroundColor: COLORS.accent, marginLeft: 6 }]}>
                        <Text style={styles.badgeText}>{entry.tripMethod}</Text>
                    </View>
                </View>
            </View>

            {/* Rows */}
            <View style={styles.row}><Text style={styles.label}>Site</Text><Text style={styles.value}>{entry.siteName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Start KM</Text><Text style={styles.value}>{entry.startKm}</Text></View>
            <View style={styles.row}><Text style={styles.label}>End KM</Text><Text style={styles.value}>{entry.endKm}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Distance</Text><Text style={styles.value}>{entry.distanceTravelled} KM</Text></View>

            {/* Footer */}
            <Text style={styles.footerText}>{formatDate(entry.createdAt)}</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Animated.View style={[styles.searchBox, { width: animatedWidth }]}>
                <TextInput
                    placeholder="Search by Email"
                    placeholderTextColor={COLORS.textSecondary}
                    value={search} onChangeText={setSearch}
                    onFocus={() => animateWidth(340)}
                    onBlur={() => animateWidth(260)}
                    style={styles.searchInput}
                />
            </Animated.View>

            {loading && <ActivityIndicator size="large" color={COLORS.accent} style={styles.loader} />}
            {error && <Text style={[styles.loader, { color: 'red' }]}>{error}</Text>}
            {!loading && !error && (filteredData.length
                ? filteredData.map(renderCard)
                : <Text style={styles.loader}>No trips found.</Text>
            )}
        </ScrollView>
    );
}

const styles = {
    container: { padding: 12, backgroundColor: COLORS.bgLight },
    searchBox: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 8,
        borderColor: COLORS.border,
        borderWidth: 1,
        height: 40,
        marginBottom: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    searchInput: { fontSize: 15, color: COLORS.textPrimary },
    loader: { marginTop: 20, textAlign: 'center', fontSize: 15, color: COLORS.accent },

    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    topBar: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amount: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    badge: {
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
    },
    badgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: COLORS.bgLight,
    },
    label: { fontSize: 13, color: COLORS.textSecondary },
    value: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

    footerText: {
        marginTop: 10,
        marginBottom: 12,
        textAlign: 'right',
        fontSize: 12,
        color: COLORS.textSecondary,
        paddingHorizontal: 12,
        fontStyle: 'italic',
    },
};
