import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Animated,
    Easing,
    Modal,
    TouchableOpacity,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TripService from '../../services/tripService';
import authService from '../../services/authService';

const COLORS = {
    accent: '#065f46',
    darkAccent: '#064e3b',
    bgLight: '#f0f4f8',
    cardBg: '#ffffff',
    textPrimary: '#374151',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
};

const PAGE_SIZE = 20;

export default function TripDetails() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [date, setDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const animatedWidth = useState(new Animated.Value(180))[0];

    const fetchTrips = useCallback(async (pageNumber = 1, reset = false) => {
        setLoading(true);
        setError(null);

        try {
            const res = await TripService.listTripsPagination(pageNumber, PAGE_SIZE, date);
            const rawTrips = res.data || [];

            const emails = [...new Set(rawTrips.map(t => t.userEmail))];
            const userMap = await authService.getUsersByEmails(emails);

            const enriched = rawTrips.map(trip => ({
                ...trip,
                username: userMap[trip.userEmail]?.username || 'Unknown',
            }));

            if (reset) {
                setData(enriched);
            } else {
                setData(prev => [...prev, ...enriched]);
            }

            setHasMore(rawTrips.length === PAGE_SIZE);
            setPage(pageNumber);
        } catch (err) {
            setError('Failed to fetch trips.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [date]);

    const applyFilters = useCallback(() => {
        let temp = [...data];
        const q = search.trim().toLowerCase();
        const f = filter.trim().toLowerCase();

        temp = temp.filter(d => {
            const matchesSearch =
                d.username?.toLowerCase().includes(q) ||
                d.userEmail?.toLowerCase().includes(q) ||
                d.siteName?.toLowerCase().includes(q) ||
                d.tripMethod?.toLowerCase().includes(q) ||
                String(d.startKm).includes(q) ||
                String(d.endKm).includes(q) ||
                String(d.distanceTravelled).includes(q);

            const matchesFilter = f ? d.tripMethod?.toLowerCase().includes(f) : true;

            const matchesDate = date
                ? new Date(d.$createdAt).toDateString() === new Date(date).toDateString()
                : true;

            return matchesSearch && matchesFilter && matchesDate;
        });

        switch (sortOption) {
            case 'createdAt_desc':
                temp.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
                break;
            case 'createdAt_asc':
                temp.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
                break;
            case 'tripMethod_asc':
                temp.sort((a, b) => a.tripMethod.localeCompare(b.tripMethod));
                break;
            case 'tripMethod_desc':
                temp.sort((a, b) => b.tripMethod.localeCompare(a.tripMethod));
                break;
            case 'distance_high':
                temp.sort((a, b) => b.distanceTravelled - a.distanceTravelled);
                break;
            case 'distance_low':
                temp.sort((a, b) => a.distanceTravelled - b.distanceTravelled);
                break;
            case 'username_asc':
                temp.sort((a, b) => a.username.localeCompare(b.username));
                break;
            case 'username_desc':
                temp.sort((a, b) => b.username.localeCompare(a.username));
                break;
        }

        setFilteredData(temp);
    }, [data, search, filter, sortOption, date]);

    useEffect(() => {
        fetchTrips(1, true);
    }, [fetchTrips]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const loadMore = () => {
        if (!loading && hasMore) fetchTrips(page + 1);
    };

    const resetAll = () => {
        setSearch('');
        setFilter('');
        setDate(null);
        setSortOption(null);
        fetchTrips(1, true);
    };

    const animateWidth = (to) =>
        Animated.timing(animatedWidth, {
            toValue: to,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

    const formatDate = (iso) =>
        new Date(iso).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    const renderCard = (entry) => (
        <View key={entry.$id} style={styles.card}>
            <View style={styles.topBar}>
                <Text style={styles.bold}>{entry.username}</Text>
                <Text style={styles.badge}>{entry.tripMethod}</Text>
            </View>
            <View style={styles.row}><Text>Site</Text><Text>{entry.siteName}</Text></View>
            <View style={styles.row}><Text>Trip ID</Text><Text>{entry.tripId}</Text></View>
            <View style={styles.row}><Text>Vehicle Number</Text><Text>{entry.vehicleNumber}</Text></View>
            <View style={styles.row}><Text>Start KM</Text><Text>{entry.startKm}</Text></View>
            <View style={styles.row}><Text>End KM</Text><Text>{entry.endKm}</Text></View>
            <View style={styles.row}><Text>Distance</Text><Text>{entry.distanceTravelled} KM</Text></View>
            <Text style={styles.footer}>{formatDate(entry.$createdAt)}</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.filterContainer}>
                <Animated.View style={[styles.inputWrapper, { width: animatedWidth }]}>
                    <TextInput
                        placeholder="Search..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => animateWidth(300)}
                        onBlur={() => animateWidth(180)}
                        style={styles.input}
                    />
                </Animated.View>
                <View style={[styles.inputWrapper, { width: 120 }]}>
                    <TextInput
                        placeholder="Method"
                        placeholderTextColor={COLORS.textSecondary}
                        value={filter}
                        onChangeText={setFilter}
                        style={styles.input}
                    />
                </View>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.inputWrapper, { width: 160, justifyContent: 'center' }]}
                >
                    <Text style={styles.input}>
                        {date ? new Date(date).toLocaleDateString('en-IN') : 'Select Date'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { width: 70 }]} onPress={() => setSortModalVisible(true)}>
                    <Text style={styles.buttonText}>Sort</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resetButton, { width: 70 }]} onPress={resetAll}>
                    <Text style={{ color: 'red', textAlign: 'center' }}>Reset</Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={date ? new Date(date) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}

            {loading && page === 1 && <ActivityIndicator size="large" color={COLORS.accent} />}
            {error && <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>}
            {!loading && !error && (
                filteredData.length
                    ? filteredData.map(renderCard)
                    : <Text style={styles.footer}>No trips found.</Text>
            )}

            {hasMore && !loading && (
                <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                    <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
            )}

            {loading && page > 1 && <ActivityIndicator size="small" color={COLORS.accent} />}

            <Modal visible={sortModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Sort By</Text>
                        {[
                            { key: 'createdAt_desc', label: 'Date: Newest First' },
                            { key: 'createdAt_asc', label: 'Date: Oldest First' },
                            { key: 'tripMethod_asc', label: 'Trip Method A-Z' },
                            { key: 'tripMethod_desc', label: 'Trip Method Z-A' },
                            { key: 'distance_high', label: 'Distance High → Low' },
                            { key: 'distance_low', label: 'Distance Low → High' },
                            { key: 'username_asc', label: 'Username A-Z' },
                            { key: 'username_desc', label: 'Username Z-A' },
                        ].map(opt => (
                            <TouchableOpacity key={opt.key} onPress={() => {
                                setSortOption(opt.key);
                                setSortModalVisible(false);
                            }}>
                                <Text style={styles.modalOption}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                            <Text style={{ color: COLORS.accent, marginTop: 12 }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = {
    container: {
        padding: 12,
        backgroundColor: COLORS.bgLight,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputWrapper: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        justifyContent: 'center',
    },
    input: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    button: {
        backgroundColor: '#e0f2f1',
        height: 40,
        justifyContent: 'center',
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.accent,
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#ffe4e6',
        height: 40,
        justifyContent: 'center',
        borderRadius: 8,
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: COLORS.accent,
        color: 'white',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 12,
        overflow: 'hidden',
    },
    bold: {
        fontWeight: '700',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    footer: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    loadMoreButton: {
        backgroundColor: COLORS.darkAccent,
        paddingVertical: 10,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 40,
        alignItems: 'center',
    },
    loadMoreText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 12,
        color: COLORS.textPrimary,
    },
    modalOption: {
        fontSize: 14,
        paddingVertical: 8,
        color: COLORS.textPrimary,
    },
};
