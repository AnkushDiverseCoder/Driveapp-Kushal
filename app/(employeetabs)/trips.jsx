import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const monthlySummary = [
    { label: 'Monthly Trips', value: 128 },
    { label: 'Total Expense', value: '$5,420' },
    { label: 'Trips Completed', value: 110 },
    { label: 'Trips Remaining', value: 18 },
];

// Dummy employee trip data
const employeeTrips = [
    { id: '1', name: 'Alice Johnson', tripsCompleted: 35, expense: '$1,200', kmCovered: 420 },
    { id: '2', name: 'Bob Smith', tripsCompleted: 27, expense: '$900', kmCovered: 350 },
    { id: '3', name: 'Carol Lee', tripsCompleted: 48, expense: '$1,700', kmCovered: 600 },
    { id: '4', name: 'David Kim', tripsCompleted: 15, expense: '$620', kmCovered: 210 },
    // Add more as needed
];

export default function Trips() {
    return (
        <ScrollView
            contentContainerStyle={{
                padding: 24,
                backgroundColor: '#f0fdf4',
                flexGrow: 1,
            }}
        >
            {/* Monthly Summary Grid */}
            <View
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                }}
            >
                {monthlySummary.map((item) => (
                    <View
                        key={item.label}
                        style={{
                            backgroundColor: 'white',
                            width: '48%',
                            borderRadius: 16,
                            padding: 20,
                            marginBottom: 16,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 4,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#065f46',
                                marginBottom: 6,
                            }}
                        >
                            {item.label}
                        </Text>
                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: 'bold',
                                color: '#16a34a',
                            }}
                        >
                            {item.value}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Employee Trip Details Table Header */}
            <View
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#065f46',
                    paddingVertical: 12,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    paddingHorizontal: 12,
                    marginBottom: 0,
                }}
            >
                <Text style={{ flex: 2, color: 'white', fontWeight: '600' }}>Employee</Text>
                <Text style={{ flex: 1, color: 'white', fontWeight: '600', textAlign: 'center' }}>
                    Trips Completed
                </Text>
                <Text style={{ flex: 1, color: 'white', fontWeight: '600', textAlign: 'center' }}>
                    Expense
                </Text>
                <Text style={{ flex: 1, color: 'white', fontWeight: '600', textAlign: 'center' }}>
                    Km Covered
                </Text>
            </View>

            {/* Employee Trip Details Rows */}
            {employeeTrips.map((emp) => (
                <View
                    key={emp.id}
                    style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderBottomWidth: 1,
                        borderColor: '#e5e7eb',
                    }}
                >
                    <Text style={{ flex: 2, color: '#065f46', fontWeight: '600' }}>{emp.name}</Text>
                    <Text style={{ flex: 1, color: '#065f46', textAlign: 'center' }}>
                        {emp.tripsCompleted}
                    </Text>
                    <Text style={{ flex: 1, color: '#065f46', textAlign: 'center' }}>{emp.expense}</Text>
                    <Text style={{ flex: 1, color: '#065f46', textAlign: 'center' }}>{emp.kmCovered}</Text>
                </View>
            ))}
        </ScrollView>
    );
}
