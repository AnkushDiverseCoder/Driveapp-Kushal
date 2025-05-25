import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const employees = [
    { id: 1, name: 'Alice Johnson', trips: 24, km: 1230, revenue: '$4800' },
    { id: 2, name: 'Bob Smith', trips: 18, km: 980, revenue: '$3600' },
    { id: 3, name: 'Charlie Lee', trips: 30, km: 1500, revenue: '$6000' },
    { id: 4, name: 'Diana Ross', trips: 22, km: 1100, revenue: '$4400' },
    { id: 5, name: 'Ethan Hunt', trips: 15, km: 800, revenue: '$3200' },
    { id: 6, name: 'Fiona Gallagher', trips: 27, km: 1350, revenue: '$5400' },
    // Add more dummy employees as needed
];

const screenWidth = Dimensions.get('window').width;
const numColumns = 2;
const cardMargin = 12;
const cardWidth = (screenWidth - (numColumns + 1) * cardMargin) / numColumns;

export default function AdminDashboard() {
    return (
        <ScrollView
            contentContainerStyle={{
                padding: cardMargin,
                backgroundColor: '#ecfdf5', // light green background
                minHeight: '100%',
            }}
            showsVerticalScrollIndicator={false}
        >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {employees.map((emp, i) => (
                    <Animated.View
                        key={emp.id}
                        entering={FadeInDown.delay(i * 100).duration(400)}
                        style={{
                            width: cardWidth,
                            marginBottom: cardMargin,
                            borderRadius: 16,
                            backgroundColor: 'white',
                            // React Native Web compatible shadow using boxShadow:
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            // Android shadow
                            elevation: 4,
                        }}
                    >
                        <View style={{ padding: 16 }}>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: '#065f46',
                                    marginBottom: 8,
                                }}
                            >
                                {emp.name}
                            </Text>
                            <Text style={{ color: '#065f46', marginBottom: 4 }}>
                                Trips Completed: {emp.trips}
                            </Text>
                            <Text style={{ color: '#065f46', marginBottom: 4 }}>
                                Km Covered: {emp.km} km
                            </Text>
                            <Text style={{ color: '#16a34a', fontWeight: '700' }}>
                                Revenue: {emp.revenue}
                            </Text>
                        </View>
                    </Animated.View>
                ))}
            </View>
        </ScrollView>
    );
}
