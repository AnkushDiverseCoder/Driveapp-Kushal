import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, Switch, TouchableOpacity,
    FlatList, ActivityIndicator
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import tripService from '../../../../services/tripService';
import authService from '../../../../services/authService';

export default function TripCountScreen() {
    const [tripCounts, setTripCounts] = useState({});
    const [users, setUsers] = useState([]);
    const [tripSearch, setTripSearch] = useState('');
    const [tripDate, setTripDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customDateEnabled, setCustomDateEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today');

    const filteredTripEntries = Object.entries(tripCounts)
        .filter(([email]) => {
            const user = users.find(u => u.email === email);
            return user?.displayName?.toLowerCase().includes(tripSearch.toLowerCase());
        })
        .sort((a, b) => b[1] - a[1]);

    const fetchTripData = async (mode = 'today', date = null) => {
        setLoading(true);
        try {
            const userRes = await authService.fetchAllUsers();
            const tripRes = await tripService.fetchUserTripCounts(mode, date);
            const uniqueUsers = Array.from(new Map(userRes.data.map(u => [u.email, u])).values());
            setUsers(uniqueUsers);
            setTripCounts(tripRes.data || {});
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTripData('today');
    }, []);

    const handleDateConfirm = (date) => {
        setTripDate(date);
        fetchTripData(activeTab, date);
        setShowDatePicker(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-4 py-6">
            <View className="flex-row justify-around mb-4">
                <TouchableOpacity onPress={() => {
                    setActiveTab('today');
                    setTripDate(null);
                    fetchTripData('today');
                }}>
                    <Text className={`text-base font-semibold ${activeTab === 'today' ? 'text-[#064e3b]' : 'text-gray-500'}`}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    setActiveTab('month');
                    setTripDate(null);
                    fetchTripData('month');
                }}>
                    <Text className={`text-base font-semibold ${activeTab === 'month' ? 'text-[#064e3b]' : 'text-gray-500'}`}>Monthly</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-4">
                <Text className="text-base font-semibold text-[#064e3b] mr-2">Enable Custom {activeTab === 'today' ? 'Date' : 'Month'}:</Text>
                <Switch
                    value={customDateEnabled}
                    onValueChange={(val) => {
                        setCustomDateEnabled(val);
                        if (!val) {
                            setTripDate(null);
                            fetchTripData(activeTab);
                        } else {
                            setShowDatePicker(true);
                        }
                    }}
                />
            </View>

            {customDateEnabled && (
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-gray-100 px-4 py-3 rounded-xl mb-4">
                    <Text className="text-[#064e3b] font-medium">
                        {tripDate ? tripDate.toDateString() : `Select ${activeTab === 'month' ? 'Month' : 'Date'}`}
                    </Text>
                </TouchableOpacity>
            )}

            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
            />

            <TextInput
                value={tripSearch}
                onChangeText={setTripSearch}
                placeholder="Search by name..."
                className="bg-white border border-[#064e3b] rounded-xl px-4 py-3 text-[#064e3b] mb-4"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#064e3b" />
            ) : filteredTripEntries.length === 0 ? (
                <Text className="text-center text-gray-500 mt-6">No trips found.</Text>
            ) : (
                <FlatList
                    data={filteredTripEntries}
                    keyExtractor={([email]) => email}
                    renderItem={({ item: [email, count], index }) => {
                        const user = users.find(u => u.email === email);
                        return (
                            <View className={`flex-row justify-between items-center py-3 px-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} rounded-lg mb-2`}>
                                <Text className="text-[#064e3b] font-medium flex-1">{user?.displayName || 'Unknown'}</Text>
                                <Text className="text-right text-[#064e3b] font-bold w-12">{count}</Text>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
