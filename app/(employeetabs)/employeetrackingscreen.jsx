import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Alert, ScrollView, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import employeeGlobalService from '../../services/employeeGlobalService';
import authService from '../../services/authService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Query } from 'react-native-appwrite';

const EmployeeTrackingScreen = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [user, setUser] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    const formatMonthYear = (date) => {
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    };

    const loadUserAndData = async (date = new Date()) => {
        try {
            const currentUser = await authService.getCurrentUser();
            const email = currentUser?.email || '';
            setUser(currentUser);

            const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const res = await employeeGlobalService.listEntries([
                // filter by user and selected month
                Query.equal('userEmail', [email]),
                Query.greaterThanEqual('createdAt', start),
                Query.lessThanEqual('createdAt', end),
            ]);

            const sorted = res.data.data
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setAllEntries(sorted);
        } catch (err) {
            console.error('Error fetching tracking data:', err);
            setAllEntries([]);
            Alert.alert('Error', 'Failed to fetch tracking data');
        }
    };

    useEffect(() => {
        loadUserAndData(selectedMonth);
    }, [selectedMonth]);

    const getRemainingSummary = () => {
        if (allEntries.length === 0) return 0;
        return allEntries[0].remainingDistance || 0;
    };

    const renderItem = ({ item }) => (
        <View className="flex-row border-b border-gray-300 py-2 px-2">
            <Text className="w-[10%] text-xs text-center">{user?.displayName}</Text>
            <Text className="w-[15%] text-xs text-center text-gray-500">{formatDate(new Date(item.createdAt))}</Text>
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

            <View className="flex-row justify-between items-center mb-2">
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-[#064e3b] px-4 py-2 rounded-xl"
                >
                    <Text className="text-white font-medium">{formatMonthYear(selectedMonth)}</Text>
                </TouchableOpacity>

                <Text className="text-base font-semibold text-[#064e3b]">
                    Remaining Balance:{" "}
                    <Text className={`font-bold ${getRemainingSummary() < 30 ? 'text-red-600' : 'text-green-700'}`}>
                        {getRemainingSummary()}
                    </Text>
                </Text>
            </View>

            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={(date) => {
                    setShowDatePicker(false);
                    setSelectedMonth(date);
                }}
                onCancel={() => setShowDatePicker(false)}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="min-w-[1000px]">
                    <View className="flex-row bg-[#064e3b] rounded-t-lg py-2 px-2">
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Display Name</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Entry Date</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Vehicle No</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Mileage</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Prev KM</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Fuel</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Today Meter</Text>
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
