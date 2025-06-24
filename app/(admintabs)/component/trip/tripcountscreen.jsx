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
        .filter(([email]) => {
            const user = users.find(u => u.email === email);
            return user?.displayName?.toLowerCase().includes(tripSearch.toLowerCase());
        })
        .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0)); // ✅ sort by count


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
        if (activeTab === 'today') fetchTripData('today', date);
        else fetchTripData('month', date);
        setShowDatePicker(false);
    };

    const formatDate = (date) => date.toISOString().split('T')[0];

    const exportToExcel = async (filtered = false) => {
        try {
            const exportData = (filtered ? filteredTripEntries.filter(([_, c]) => c.count >= 5) : Object.entries(tripCounts)).map(([email, data]) => {

                const user = users.find(u => u.email === email);
                return {
                    Name: user?.displayName || 'Unknown',
                    Email: user?.email || 'N/A',
                    Trips: data.count,
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
                mode={activeTab === 'month' ? 'date' : 'date'}
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
            />

            <TextInput
                value={tripSearch}
                onChangeText={setTripSearch}
                placeholder="Search by name..."
                className="bg-white border border-[#064e3b] rounded-xl px-4 py-3 text-[#064e3b] mb-4"
            />

            <View className="flex-row justify-between gap-2 mb-4">
                {activeTab === 'today' && (
                    <TouchableOpacity onPress={() => exportToExcel(true)} className="bg-[#064e3b] px-4 py-2 rounded-xl flex-1">
                        <Text className="text-white text-center font-semibold text-sm">Export ≥5 Trips</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => exportToExcel(false)} className="bg-[#064e3b] px-4 py-2 rounded-xl flex-1">
                    <Text className="text-white text-center font-semibold text-sm">Export All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#064e3b" />
            ) : filteredTripEntries.length === 0 ? (
                <Text className="text-center text-gray-500 mt-6">No trips found.</Text>
            ) : (
                <>
                    <View className="flex-row justify-between items-center px-4 pb-2">
                        <Text className="text-[#064e3b] font-bold flex-1">Employee</Text>
                        <Text className="text-[#064e3b] font-bold w-60 text-right">Completed / Required</Text>
                    </View>


                    <FlatList
                        data={filteredTripEntries}
                        keyExtractor={([email]) => email}
                        renderItem={({ item: [email, data], index }) => {
                            const user = users.find(u => u.email === email);
                            const { count, reqTripCount } = data;
                            const isMet = reqTripCount > 0 && count >= reqTripCount;

                            return (
                                <View className={`flex-row justify-between items-center py-3 px-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} rounded-lg mb-2`}>
                                    <Text className="text-[#064e3b] font-medium flex-1">{user?.displayName || 'Unknown'}</Text>
                                    <Text className={`text-right font-bold w-40 ${isMet ? 'text-green-600' : 'text-red-600'}`}>
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
