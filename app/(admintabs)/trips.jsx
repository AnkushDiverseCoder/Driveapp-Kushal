import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Animated,
    Easing,
    Pressable,
} from 'react-native';
import TripService from '../../services/tripService';

const cardMargin = 12;

export default function TripDetails() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const animatedWidth = useState(new Animated.Value(280))[0];

    useEffect(() => {
        fetchTrips();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredData(data);
        } else {
            const filtered = data.filter(entry =>
                entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchQuery, data]);

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await TripService.listTrips();
            setData(response.data || []);
        } catch (err) {
            setError('Failed to fetch trip data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleFocus = () => {
        Animated.timing(animatedWidth, {
            toValue: 360,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        Animated.timing(animatedWidth, {
            toValue: 280,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    };

    const renderTable = () => {
        if (loading) {
            return (
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color="#065f46" />
                    <Text style={styles.stateText}>Loading trip data...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={[styles.stateText, { color: 'red' }]}>{error}</Text>
                </View>
            );
        }

        if (filteredData.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>No matching trip records found.</Text>
                </View>
            );
        }

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 24 }}>
                <View style={{ minWidth: 1000 }}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { flex: 2 }]}>Employee Email</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>Location</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>Site</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>Trip Method</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>Start KM</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>End KM</Text>
                        <Text style={[styles.headerText, { flex: 1.5 }]}>Distance</Text>
                        <Text style={[styles.headerText, { flex: 1.5 }]}>Shift</Text>
                        <Text style={[styles.headerText, { flex: 2 }]}>Date</Text>
                    </View>

                    {/* Table Rows */}
                    {filteredData.map((entry) => (
                        <View key={entry.$id} style={styles.tableRow}>
                            <Text style={[styles.cellText, { flex: 2 }]}>{entry.userEmail}</Text>
                            <Text style={[styles.cellText, { flex: 1 }]}>{entry.location}</Text>
                            <Text style={[styles.cellText, { flex: 1 }]}>{entry.siteName}</Text>
                            <Text style={[styles.cellText, { flex: 1 }]}>{entry.tripMethod}</Text>
                            <Text style={[styles.cellText, { flex: 1 }]}>{entry.startKm}</Text>
                            <Text style={[styles.cellText, { flex: 1 }]}>{entry.endKm}</Text>
                            <Text style={[styles.cellText, { flex: 1.5 }]}>{entry.distanceTravelled}</Text>
                            <Text style={[styles.cellText, { flex: 1.5 }]}>{entry.shiftTime}</Text>
                            <Text style={[styles.cellText, { flex: 2 }]}>
                                {new Date(entry.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    return (
        <ScrollView
            contentContainerStyle={{
                padding: cardMargin,
                backgroundColor: '#ecfdf5',
                minHeight: '100%',
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Animated Search Box */}
            <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                <Animated.View style={[styles.searchContainer, { width: animatedWidth }]}>
                    <TextInput
                        placeholder="Search by Email"
                        placeholderTextColor="#6b7280"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={styles.searchInput}
                    />
                </Animated.View>
            </View>

            {/* Table Rendering */}
            {renderTable()}
        </ScrollView>
    );
}

const styles = {
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#065f46',
        paddingVertical: 12,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingHorizontal: 12,
    },
    headerText: {
        color: 'white',
        fontWeight: '600',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    cellText: {
        color: '#065f46',
        textAlign: 'center',
    },
    stateContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    stateText: {
        marginTop: 12,
        fontSize: 16,
        color: '#065f46',
        textAlign: 'center',
    },
    searchContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        paddingHorizontal: 12,
        height: 42,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    searchInput: {
        fontSize: 16,
        color: '#111827',
    },
};
