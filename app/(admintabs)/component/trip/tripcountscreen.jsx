import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, Switch, TouchableOpacity,
    FlatList, ActivityIndicator, Alert
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

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
        .filter(([email, data]) => {
            if (!data || data.count === 0) return false;
            
            const user = users.find(u => u.email === email);
            const displayName = user?.displayName || email;
            
            if (tripSearch.trim() === '') return true;
            return displayName.toLowerCase().includes(tripSearch.toLowerCase());
        })
        .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0));

    const fetchTripData = async (mode = 'today', customDate = null) => {
        setLoading(true);
        try {
            // ✅ Pass the date as ISO string or null
            const dateToPass = customDate ? customDate.toISOString().split('T')[0] : null;
            
            console.log('📅 Fetching trip data:', {
                mode,
                customDate: customDate ? customDate.toISOString() : 'null (using today)',
                dateToPass
            });
            
            const [userRes, tripRes] = await Promise.all([
                authService.fetchAllUsers(),
                tripService.fetchUserTripCounts(mode, dateToPass)
            ]);

            console.log('📊 Trip response received:', {
                success: !tripRes.error,
                userCount: Object.keys(tripRes.data || {}).length,
                error: tripRes.error
            });

            if (userRes.error || tripRes.error) {
                Alert.alert('Error', userRes.error || tripRes.error);
                return;
            }

            const uniqueUsers = Array.from(
                new Map(userRes.data.map(u => [u.email.toLowerCase(), u])).values()
            );
            
            setUsers(uniqueUsers);
            setTripCounts(tripRes.data || {});
            
            console.log('✅ Data loaded:', {
                usersCount: uniqueUsers.length,
                tripsCount: Object.keys(tripRes.data || {}).length,
                sampleData: Object.entries(tripRes.data || {}).slice(0, 2)
            });
        } catch (err) {
            console.error('❌ Error fetching trip data:', err);
            Alert.alert('Error', 'Failed to load trip data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🚀 Component mounted, fetching initial data');
        fetchTripData('today', null);
    }, []);

    const handleDateConfirm = (date) => {
        console.log('📅 Date selected:', date);
        setTripDate(date);
        fetchTripData(activeTab, date);
        setShowDatePicker(false);
    };

    const formatDate = (date) => date.toISOString().split('T')[0];

    const exportToExcel = async (filtered = false) => {
        try {
            const exportData = (filtered 
                ? filteredTripEntries.filter(([_, c]) => c.count >= 5) 
                : Object.entries(tripCounts)
            ).map(([email, data]) => {
                const user = users.find(u => u.email === email);
                return {
                    Name: user?.displayName || email,
                    Email: email,
                    Trips: data.count,
                    Required: data.reqTripCount || 0,
                };
            });

            if (filtered && exportData.length === 0) {
                Alert.alert('No Data', 'No users with 5 or more trips.');
                return;
            }

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Trip Summary');
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            const filename = `${activeTab}_trip_report_${formatDate(tripDate || new Date())}.xlsx`;
            const fileUri = FileSystem.documentDirectory + filename;

            await FileSystem.writeAsStringAsync(fileUri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Trip Report',
                UTI: 'com.microsoft.excel.xlsx',
            });
        } catch (err) {
            Alert.alert('Export Failed', err.message || 'Failed to export.');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-4 py-6">
            <View className="flex-row justify-around mb-4">
                <TouchableOpacity onPress={() => {
                    console.log('🔄 Switching to Today tab');
                    setActiveTab('today');
                    setTripDate(null);
                    setCustomDateEnabled(false);
                    fetchTripData('today', null);
                }}>
                    <Text className={`text-base font-semibold ${activeTab === 'today' ? 'text-[#064e3b]' : 'text-gray-500'}`}>
                        Today
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    console.log('🔄 Switching to Monthly tab');
                    setActiveTab('month');
                    setTripDate(null);
                    setCustomDateEnabled(false);
                    fetchTripData('month', null);
                }}>
                    <Text className={`text-base font-semibold ${activeTab === 'month' ? 'text-[#064e3b]' : 'text-gray-500'}`}>
                        Monthly
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-4">
                <Text className="text-base font-semibold text-[#064e3b] mr-2">
                    Enable Custom {activeTab === 'today' ? 'Date' : 'Month'}:
                </Text>
                <Switch
                    value={customDateEnabled}
                    onValueChange={(val) => {
                        setCustomDateEnabled(val);
                        if (!val) {
                            setTripDate(null);
                            fetchTripData(activeTab, null);
                        } else {
                            setShowDatePicker(true);
                        }
                    }}
                />
            </View>

            {customDateEnabled && (
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)} 
                    className="bg-gray-100 px-4 py-3 rounded-xl mb-4"
                >
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
                placeholder="Search by name or email..."
                className="bg-white border border-[#064e3b] rounded-xl px-4 py-3 text-[#064e3b] mb-4"
            />

            <View className="flex-row justify-between gap-2 mb-4">
                {activeTab === 'today' && (
                    <TouchableOpacity 
                        onPress={() => exportToExcel(true)} 
                        className="bg-[#064e3b] px-4 py-2 rounded-xl flex-1"
                    >
                        <Text className="text-white text-center font-semibold text-sm">
                            Export ≥5 Trips
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    onPress={() => exportToExcel(false)} 
                    className="bg-[#064e3b] px-4 py-2 rounded-xl flex-1"
                >
                    <Text className="text-white text-center font-semibold text-sm">
                        Export All
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#064e3b" />
            ) : filteredTripEntries.length === 0 ? (
                <View className="mt-6">
                    <Text className="text-center text-gray-500 mb-2">No trips found.</Text>
                    <Text className="text-center text-gray-400 text-sm">
                        Total users with trip data: {Object.keys(tripCounts).length}
                    </Text>
                    <Text className="text-center text-gray-400 text-xs mt-2">
                        Mode: {activeTab} | Date: {tripDate ? tripDate.toDateString() : 'Current'}
                    </Text>
                </View>
            ) : (
                <>
                    <View className="flex-row justify-between items-center px-4 pb-2">
                        <Text className="text-[#064e3b] font-bold flex-1">Employee</Text>
                        <Text className="text-[#064e3b] font-bold w-60 text-right">
                            Completed / Required
                        </Text>
                    </View>

                    <FlatList
                        data={filteredTripEntries}
                        keyExtractor={([email]) => email}
                        renderItem={({ item: [email, data], index }) => {
                            const user = users.find(u => u.email === email);
                            const displayName = user?.displayName || email;
                            const { count, reqTripCount } = data;
                            const isMet = reqTripCount > 0 && count >= reqTripCount;

                            return (
                                <View className={`flex-row justify-between items-center py-3 px-4 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                                } rounded-lg mb-2`}>
                                    <View className="flex-1">
                                        <Text className="text-[#064e3b] font-medium">
                                            {displayName}
                                        </Text>
                                        {!user && (
                                            <Text className="text-xs text-gray-500">
                                                (User not found in system)
                                            </Text>
                                        )}
                                    </View>
                                    <Text className={`text-right font-bold w-40 ${
                                        isMet ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {count} / {reqTripCount || '—'}
                                    </Text>
                                </View>
                            );
                        }}
                    />
                </>
            )}
        </SafeAreaView>
    );
}