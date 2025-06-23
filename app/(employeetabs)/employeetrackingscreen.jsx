import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import employeeGlobalService from '../../services/employeeGlobalService';
import authService from '../../services/authService';

const EmployeeTrackingScreen = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUserAndData();
    }, []);

    const loadUserAndData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            const email = currentUser?.email || '';
            setUser(currentUser);

            const res = await employeeGlobalService.listEntries([]);
            const sorted = res.data.data
                .filter(entry => entry.userEmail.toLowerCase() === email.toLowerCase())
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            console.log(sorted)
            setAllEntries(sorted);
        } catch (err) {
            console.error('Error fetching tracking data:', err);
            setAllEntries([]);
            Alert.alert('Error', 'Failed to fetch tracking data');
        }
    };

    const renderItem = ({ item, index }) => (
        <View className="flex-row border-b border-gray-300 py-2 px-2">
            <Text className="w-[10%] text-xs text-center">{user.displayName}</Text>
            <Text className="w-[15%] text-xs text-center">{item.vehicleNumber}</Text>
            <Text className="w-[10%] text-xs text-center">{item.mileage}</Text>
            <Text className="w-[15%] text-xs text-center">{item.previousMeterReading}</Text>
            <Text className="w-[10%] text-xs text-center">{item.fuelFilled}</Text>
            <Text className="w-[15%] text-xs text-center">{item.meterReading}</Text>
            <Text
                className={`w-[10%] text-xs text-center font-semibold ${item.remainingDistance < 30 ? 'text-red-600' : 'text-green-700'}`}
            >
                {item.remainingDistance}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-3 pt-4">
            <Text className="text-2xl font-bold text-[#064e3b] mb-4">My Vehicle Diesel History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="min-w-[800px]">
                    <View className="flex-row bg-[#064e3b] rounded-t-lg py-2 px-2">
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Display Name</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Vehicle No</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Mileage</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Prev KM</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Fuel</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Today Meter Reading</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Remaining</Text>
                    </View>

                    <FlatList
                        data={allEntries}
                        keyExtractor={(item, index) => `${item.$id}-${index}`}
                        renderItem={renderItem}
                        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No tracking entries found</Text>}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EmployeeTrackingScreen;
