import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DailyEntryFormService from '../../services/dailyEntryFormService';

const employees = [
    { $id: 1, name: 'Alice Johnson', trips: 24, km: 1230, revenue: '$4800' },
    { $id: 2, name: 'Bob Smith', trips: 18, km: 980, revenue: '$3600' },
];

const screenWidth = Dimensions.get('window').width;
const numColumns = 2;
const cardMargin = 12;
const cardWidth = (screenWidth - (numColumns + 1) * cardMargin) / numColumns;

export default function AdminDashboard() {
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
            const response = await DailyEntryFormService.listDailyEntry();
            setData(response.data || []);
        } catch (err) {
            console.log(err.message);
            setError('Failed to fetch data. Please try again later.');
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
                    <Text style={styles.stateText}>No trip data available.</Text>
                </View>
            );
        }

        // Actual Table Rendering
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 24 }}>
                <View style={{ minWidth: 800 }}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { flex: 2 }]}>Employee Email</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Vehicle</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Meter</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Fuel (L)</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Mileage</Text>
                        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'center' }]}>Distance</Text>
                        <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>Date</Text>
                    </View>

                    {/* Table Rows */}
                    {data.map((entry) => (
                        <View key={entry.$id} style={styles.tableRow}>
                            <Text style={[styles.cellText, { flex: 2 }]}>{entry.userEmail}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.vehicleType}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.meterReading}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.fuelQuantity}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.mileage}</Text>
                            <Text style={[styles.cellText, { flex: 1.5, textAlign: 'center' }]}>{entry.totalDistance}</Text>
                            <Text style={[styles.cellText, { flex: 2, textAlign: 'center' }]}>
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
            {/* Employee Animated Cards */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {employees.map((emp, i) => (
                    <Animated.View
                        key={emp.$id}
                        entering={FadeInDown.delay(i * 100).duration(400)}
                        style={{
                            width: cardWidth,
                            marginBottom: cardMargin,
                            borderRadius: 16,
                            backgroundColor: 'white',
                            elevation: 4,
                        }}
                    >
                        <View style={{ padding: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#065f46', marginBottom: 8 }}>
                                {emp.name}
                            </Text>
                            <Text style={{ color: '#065f46', marginBottom: 4 }}>
                                Trips Completed: {emp.trips}
                            </Text>
                            <Text style={{ color: '#065f46', marginBottom: 4 }}>
                                Km Covered: {emp.km} km
                            </Text>
                            <Text style={{ color: '#16a34a', fontWeight: '700' }}>{emp.revenue}</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>

            {/* Table or States */}
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
