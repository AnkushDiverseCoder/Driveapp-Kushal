import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import * as XLSX from 'xlsx';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import authService from '../../services/authService';
import dailyEntryFormService from '../../services/dailyEntryFormService';
import tripService from '../../services/tripService';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [exportingDaily, setExportingDaily] = useState(false);
    const [exportingTrip, setExportingTrip] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);

    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [allDailyEntries, setAllDailyEntries] = useState([]);
    const [allTrips, setAllTrips] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const current = await authService.getCurrentUser();
            const allUsers = await authService.fetchAllUsers();
            const uniqueUsers = Array.from(new Map(allUsers.data.map(u => [u.email, u])).values());
            setCurrentUser(current);
            setUsers(uniqueUsers);

            const dailyRes = await dailyEntryFormService.listDailyEntry();
            const tripRes = await tripService.listTrips();
            setAllDailyEntries(dailyRes?.data?.documents || []);
            setAllTrips(tripRes?.data?.documents || []);
        } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async (jsonData, fileName) => {
        try {
            const data = jsonData.length ? jsonData : [{ "No Data": "No records found" }];
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const uri = FileSystem.cacheDirectory + `${fileName}.xlsx`;
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `Export ${fileName}`,
                UTI: 'com.microsoft.excel.xlsx',
            });
        } catch (e) {
            Alert.alert('Export Failed', e?.message || 'Unknown error occurred');
        }
    };

    const exportDailyEntry = async () => {
        setExportingDaily(true);
        try {
            let result = [];
            if (selectedUser && selectedDate) {
                const res = await dailyEntryFormService.fetchByUserAndDate(
                    selectedUser.email,
                    selectedDate.toDateString()
                );
                result = res.data || [];
            } else if (selectedUser) {
                const res = await dailyEntryFormService.fetchByUserOnly(selectedUser.email);
                result = res.data || [];
            } else if (selectedDate) {
                const res = await dailyEntryFormService.fetchByDateOnly(selectedDate.toDateString());
                result = res.data || [];
            } else {
                result = allDailyEntries;
            }

            await exportToExcel(result, 'daily-entry');
        } catch (err) {
            Alert.alert('Error Exporting Daily Entry', err?.message);
        } finally {
            setExportingDaily(false);
        }
    };

    const exportTripDetails = async () => {
        setExportingTrip(true);
        try {
            let result = [];
            if (selectedUser && selectedDate) {
                const res = await tripService.fetchTripsByDate(
                    selectedUser.email,
                    selectedDate.toDateString()
                );
                result = res.data?.allTrips || [];
            } else if (selectedUser) {
                const res = await tripService.fetchTripsByUserOnly(selectedUser.email);
                result = res.data || [];
            } else if (selectedDate) {
                const res = await tripService.fetchTripsByDateOnly(selectedDate.toDateString());
                result = res.data || [];
            } else {
                result = allTrips;
            }

            await exportToExcel(result, 'trip-details');
        } catch (err) {
            Alert.alert('Error Exporting Trip Details', err?.message);
        } finally {
            setExportingTrip(false);
        }
    };

    const filteredUsers = users.filter((u) =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
                <ActivityIndicator size="large" color="#064e3b" />
                <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f0fdf4', minHeight: '100%' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#064e3b', textAlign: 'center', marginBottom: 16 }}>
                Admin Dashboard
            </Text>

            {/* Admin Info */}
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ccc', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#064e3b', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{currentUser?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>Username</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{currentUser?.username}</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Email</Text>
                    <Text style={{ fontSize: 14 }}>{currentUser?.email}</Text>
                </View>
            </View>

            {/* User Picker */}
            <Text className="text-[#064e3b] font-semibold text-base mb-1">Selected User</Text>
            <TouchableOpacity
                onPress={() => setUserModalVisible(true)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-3"
            >
                <Text className="text-[#064e3b]">
                    {selectedUser ? selectedUser.username : 'Choose User'}
                </Text>
            </TouchableOpacity>

            {/* User Modal */}
            <Modal
                visible={userModalVisible}
                animationType="slide"
                onRequestClose={() => setUserModalVisible(false)}
            >
                <View className="flex-1 bg-[#f0fdf4] px-5 pt-6">
                    {/* Header */}
                    <Text className="text-[#064e3b] font-bold text-xl mb-4 text-center">Select User</Text>

                    {/* Search Input */}
                    <TextInput
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
                    />

                    {/* List */}
                    <ScrollView className="flex-1">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((u, index) => (
                                <TouchableOpacity
                                    key={u.email + index}
                                    onPress={() => {
                                        setSelectedUser(u);
                                        setUserModalVisible(false);
                                    }}
                                    className={`rounded-xl px-4 py-3 mb-2 border ${selectedUser?.email === u.email
                                            ? 'bg-[#064e3b] border-[#064e3b]'
                                            : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <Text
                                        className={`text-base ${selectedUser?.email === u.email
                                                ? 'text-white font-semibold'
                                                : 'text-[#1f2937]'
                                            }`}
                                    >
                                        {u.username} ({u.email})
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text className="text-gray-500 text-center mt-10">No users found</Text>
                        )}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={() => setUserModalVisible(false)}
                        className="mt-6 bg-red-600 py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-semibold">Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>


            {/* Date Filter */}
            <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Select Date:</Text>
                <TouchableOpacity
                    onPress={() => setDatePickerVisibility(true)}
                    style={{
                        padding: 10,
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 6,
                        backgroundColor: '#fff',
                    }}
                >
                    <Text>{selectedDate ? selectedDate.toDateString() : 'Pick a date'}</Text>
                </TouchableOpacity>
                {selectedDate && (
                    <TouchableOpacity onPress={() => setSelectedDate(null)}>
                        <Text style={{ color: '#dc2626', marginTop: 4 }}>Clear Date</Text>
                    </TouchableOpacity>
                )}
            </View>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                    setSelectedDate(date);
                    setDatePickerVisibility(false);
                }}
                onCancel={() => setDatePickerVisibility(false)}
            />

            {/* Export Buttons */}
            <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                    onPress={exportDailyEntry}
                    disabled={exportingDaily}
                    style={{
                        backgroundColor: '#064e3b',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        alignItems: 'center',
                        opacity: exportingDaily ? 0.7 : 1,
                    }}
                >
                    {exportingDaily ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: 'white', fontWeight: '600' }}>Export Daily Entry</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={exportTripDetails}
                    disabled={exportingTrip}
                    style={{
                        backgroundColor: '#064e3b',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        opacity: exportingTrip ? 0.7 : 1,
                    }}
                >
                    {exportingTrip ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: 'white', fontWeight: '600' }}>Export Trip Details</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
