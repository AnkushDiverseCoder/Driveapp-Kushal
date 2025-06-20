import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import employeeGlobalService from '../../services/employeeGlobalService';
import authService from '../../services/authService';

const threshold = 30;

const EmployeeTrackingScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allEntries, setAllEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
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
            const sorted = res.data.documents
                .filter(entry => entry.userEmail.toLowerCase() === email.toLowerCase())
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllEntries(sorted);
            setFilteredEntries(sorted);
        } catch (err) {
            console.error('Error fetching tracking data:', err);
            setAllEntries([]);
            setFilteredEntries([]);
            setSearchQuery('');
            Alert.alert('Error', 'Failed to fetch tracking data');
        }
    };

    useEffect(() => {
        if (!searchQuery) return setFilteredEntries(allEntries);
        const lower = searchQuery.toLowerCase();
        const filtered = allEntries.filter((entry) =>
            entry.userEmail.toLowerCase().includes(lower) ||
            entry.vehicleNumber.toLowerCase().includes(lower)
        );
        setFilteredEntries(filtered);
    }, [searchQuery, allEntries]);

    const renderItem = ({ item }) => (
        <View className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <Text className="text-base font-semibold text-[#064e3b]">Employee: {user.displayName}</Text>
            <Text className="text-sm text-gray-600">Vehicle: {item.vehicleNumber}</Text>
            <Text className="text-sm text-gray-600">Meter Reading: {item.meterReading} km</Text>
            <Text className="text-sm text-gray-600">Previous Reading: {item.previousMeterReading} km</Text>
            <Text className="text-sm text-gray-600">Fuel Filled: {item.fuelFilled} L</Text>
            <Text className="text-sm text-gray-600">Distance Covered: {item.totalDistance} km</Text>
            <Text className={`text-sm font-semibold ${item.remainingDistance < threshold ? 'text-red-600' : 'text-green-700'}`}>Remaining Distance: {item.remainingDistance} km</Text>
            <Text className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-4">
            <Text className="text-2xl font-bold text-[#064e3b] mb-4">My Tracking History</Text>

            <TextInput
                placeholder="Search by email or vehicle number"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-white px-4 py-3 border border-gray-300 rounded-xl mb-4"
            />

            <FlatList
                data={filteredEntries}
                keyExtractor={(item) => item.$id}
                renderItem={renderItem}
                ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No tracking entries found</Text>}
                contentContainerStyle={{ paddingBottom: 30 }}
            />
        </SafeAreaView>
    );
};

export default EmployeeTrackingScreen;
