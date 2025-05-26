import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import TripService from '../../services/tripService';

const cardMargin = 12;

export default function TripDetails() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await TripService.listTrips();
            console.log('Fetched trips:', response.data);
            setData(response.data || []);
        } catch (err) {
            setError('Failed to fetch trip data. Please try again later.'+ err.message);
        } finally {
            setLoading(false);
        }
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

        if (data.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>No trip records found.</Text>
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
                    {data.map((entry) => (
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
};
