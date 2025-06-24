import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Alert, Modal,
    TextInput, ScrollView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import employeeGlobalService from '../../../../services/employeeGlobalService';
import authService from '../../../../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDieselTrackingScreen() {
    const [activeTab, setActiveTab] = useState('daily');
    const [users, setUsers] = useState([]);
    const [allEntries, setAllEntries] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        fetchUsersAndData();
    }, [activeTab]);

    const fetchUsersAndData = async () => {
        try {
            const res = await authService.fetchAllUsers();
            const unique = Array.from(new Map(res.data.map(u => [u.email, u])).values());
            setUsers(unique);

            if (activeTab === 'daily') {
                const res = await employeeGlobalService.listEntries([]);
                const latestEntries = {};

                for (const entry of res.data.data) {
                    const email = entry.userEmail.toLowerCase();
                    if (!latestEntries[email] || new Date(entry.createdAt) > new Date(latestEntries[email].createdAt)) {
                        latestEntries[email] = entry;
                    }
                }

                setAllEntries(Object.values(latestEntries));
            } else {
                fetchMonthlyEntries();
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to load data');
        }
    };

    const fetchMonthlyEntries = async () => {
        try {
            const res = await employeeGlobalService.listEntries([]);
            let filtered = res.data.data;

            if (startDate && endDate) {
                filtered = filtered.filter(entry => {
                    const d = new Date(entry.createdAt);
                    return d >= startDate && d <= endDate;
                });
            }

            if (vehicleFilter) {
                filtered = filtered.filter(entry =>
                    entry.vehicleNumber.toLowerCase().includes(vehicleFilter.toLowerCase())
                );
            }

            const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllEntries(sorted);
        } catch (err) {
            Alert.alert('Error', 'Failed to load monthly data');
        }
    };

    const filteredEntries = allEntries.filter(entry => {
        if (!employeeSearch) return true;
        const user = users.find(u => u.email.toLowerCase() === entry.userEmail.toLowerCase());
        return user?.displayName?.toLowerCase().includes(employeeSearch.toLowerCase());
    });

    const getDisplayName = (email) => {
        return users.find(u => u.email.toLowerCase() === email.toLowerCase())?.displayName || 'Unknown';
    };

    const exportToExcel = () => {
        if (!filteredEntries.length) {
            Alert.alert('No Data', 'No entries to export.');
            return;
        }

        const exportData = filteredEntries.map(entry => ({
            Date: new Date(entry.createdAt).toLocaleDateString('en-GB'),
            'Vehicle No': entry.vehicleNumber,
            'Prev KM': entry.previousMeterReading,
            'User': getDisplayName(entry.userEmail),
            'Diesel': entry.fuelFilled,
            'Remaining': entry.remainingDistance
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Diesel Report');
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        const filename = `${activeTab}_diesel_export_${Date.now()}.xlsx`;
        const fileUri = FileSystem.documentDirectory + filename;

        FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64
        }).then(() =>
            Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Diesel Report',
                UTI: 'com.microsoft.excel.xlsx'
            })
        ).catch(err => Alert.alert('Export Failed', err.message));
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-3 pt-4">
            <View className="flex-row justify-around mb-4">
                <TouchableOpacity onPress={() => setActiveTab('daily')}>
                    <Text className={`text-base font-semibold ${activeTab === 'daily' ? 'text-[#064e3b]' : 'text-gray-400'}`}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('monthly')}>
                    <Text className={`text-base font-semibold ${activeTab === 'monthly' ? 'text-[#064e3b]' : 'text-gray-400'}`}>Monthly</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                value={employeeSearch}
                onChangeText={setEmployeeSearch}
                placeholder="Search by employee name"
                className="bg-white border border-[#064e3b] rounded-xl px-4 py-3 mb-3"
            />

            {activeTab === 'monthly' && (
                <>
                    <TextInput
                        placeholder="Filter by vehicle number"
                        value={vehicleFilter}
                        onChangeText={setVehicleFilter}
                        className="bg-white border border-gray-300 px-4 py-3 mb-3 rounded-xl"
                    />

                    <TouchableOpacity onPress={() => setShowStartPicker(true)} className="bg-gray-100 px-4 py-3 mb-2 rounded-xl">
                        <Text className="text-[#064e3b]">{startDate ? startDate.toDateString() : 'Select Start Date'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowEndPicker(true)} className="bg-gray-100 px-4 py-3 mb-4 rounded-xl">
                        <Text className="text-[#064e3b]">{endDate ? endDate.toDateString() : 'Select End Date'}</Text>
                    </TouchableOpacity>

                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, date) => {
                                setShowStartPicker(false);
                                if (date) setStartDate(date);
                            }}
                        />
                    )}
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, date) => {
                                setShowEndPicker(false);
                                if (date) setEndDate(date);
                            }}
                        />
                    )}

                    <TouchableOpacity
                        onPress={fetchMonthlyEntries}
                        className="bg-[#064e3b] px-4 py-2 mb-4 rounded-xl"
                    >
                        <Text className="text-white text-center font-semibold text-sm">Filter Monthly Data</Text>
                    </TouchableOpacity>
                </>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="min-w-[800px]">
                    <View className="flex-row bg-[#064e3b] py-2 px-2 rounded-t-lg">
                        <Text className="w-[10%] text-xs font-bold text-center text-white">User</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Date</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Vehicle</Text>
                        <Text className="w-[15%] text-xs font-bold text-center text-white">Prev KM</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Fuel</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">KM</Text>
                        <Text className="w-[10%] text-xs font-bold text-center text-white">Remain</Text>
                    </View>

                    <FlatList
                        data={filteredEntries}
                        keyExtractor={(item, index) => `${item.$id}-${index}`}
                        renderItem={({ item }) => (
                            <View className="flex-row border-b border-gray-200 py-2 px-2">
                                <Text className="w-[10%] text-xs text-center">{getDisplayName(item.userEmail)}</Text>
                                <Text className="w-[10%] text-xs text-center">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                <Text className="w-[15%] text-xs text-center">{item.vehicleNumber}</Text>
                                <Text className="w-[15%] text-xs text-center">{item.previousMeterReading}</Text>
                                <Text className="w-[10%] text-xs text-center">{item.fuelFilled}</Text>
                                <Text className="w-[10%] text-xs text-center">{item.meterReading}</Text>
                                <Text className={`w-[10%] text-xs text-center font-bold ${item.remainingDistance < 30 ? 'text-red-500' : 'text-green-600'}`}>
                                    {item.remainingDistance}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </ScrollView>

            <TouchableOpacity onPress={exportToExcel} className="bg-[#064e3b] px-4 py-3 mt-4 rounded-xl">
                <Text className="text-white text-center font-semibold text-sm">Export {activeTab === 'daily' ? 'Daily' : 'Monthly'} Report</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
