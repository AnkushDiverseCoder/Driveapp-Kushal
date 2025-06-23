// AdminDieselTrackingScreen.js

import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Alert, Modal,
    TextInput, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import employeeGlobalService from '../../../../services/employeeGlobalService';
import authService from '../../../../services/authService';

export default function AdminDieselTrackingScreen() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [allEntries, setAllEntries] = useState([]);
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const res = await authService.fetchAllUsers();
            const unique = Array.from(new Map(res.data.map(u => [u.email, u])).values());
            setUsers(unique);
            setFilteredUsers(unique);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch users',e);
        }
    };

    const fetchEntriesForEmployee = async (email) => {
        try {
            const res = await employeeGlobalService.listEntries([]);
            let filtered = res.data.data.filter(entry => entry.userEmail.toLowerCase() === email.toLowerCase());

            if (monthFilter) {
                const selectedMonth = new Date(monthFilter).getMonth();
                const selectedYear = new Date(monthFilter).getFullYear();
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.createdAt);
                    return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
                });
            }

            if (vehicleFilter) {
                filtered = filtered.filter(entry => entry.vehicleNumber.toLowerCase().includes(vehicleFilter.toLowerCase()));
            }

            const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllEntries(sorted);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch trip data',err);
        }
    };

    const handleEmployeeSelect = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeModalVisible(false);
        fetchEntriesForEmployee(employee.email);
    };

    const exportToExcel = () => {
        if (!allEntries.length) {
            Alert.alert('No Data', 'No entries to export.');
            return;
        }

        const exportData = allEntries.map(entry => ({
            Date: new Date(entry.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short',year:"numeric"}),
            'Vehicle No': entry.vehicleNumber,
            'Prev KM': entry.previousMeterReading,
            User: selectedEmployee?.displayName,
            Diesel: entry.fuelFilled,
            Distance: entry.remainingDistance
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Diesel Report');
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileUri = FileSystem.documentDirectory + `diesel_export_${Date.now()}.xlsx`;

        FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 })
            .then(() => Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Diesel Report',
                UTI: 'com.microsoft.excel.xlsx',
            }))
            .catch((err) => Alert.alert('Export Failed', err.message));
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-3 pt-4">
            <Text className="text-2xl font-bold text-[#064e3b] mb-4">Admin Diesel Tracking</Text>

            <TouchableOpacity
                onPress={() => setEmployeeModalVisible(true)}
                className="bg-[#064e3b] px-4 py-3 rounded-xl mb-4"
            >
                <Text className="text-white text-center font-semibold">
                    {selectedEmployee ? selectedEmployee.displayName : 'Select Employee'}
                </Text>
            </TouchableOpacity>

            {selectedEmployee && (
                <>
                    <TextInput
                        value={vehicleFilter}
                        onChangeText={(val) => {
                            setVehicleFilter(val);
                            fetchEntriesForEmployee(selectedEmployee.email);
                        }}
                        placeholder="Filter by vehicle number"
                        className="bg-gray-100 rounded-xl px-4 py-3 mb-3"
                    />

                    <TouchableOpacity
                        onPress={() => setShowMonthPicker(true)}
                        className="bg-gray-100 px-4 py-3 rounded-xl mb-3"
                    >
                        <Text className="text-[#064e3b] font-medium">
                            {monthFilter ? new Date(monthFilter).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Select Month'}
                        </Text>
                    </TouchableOpacity>

                    {showMonthPicker && (
                        <DateTimePicker
                            value={monthFilter || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowMonthPicker(false);
                                if (selectedDate) {
                                    setMonthFilter(selectedDate);
                                    fetchEntriesForEmployee(selectedEmployee.email);
                                }
                            }}
                        />
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="min-w-[800px]">
                            <View className="flex-row bg-[#064e3b] rounded-t-lg py-2 px-2">
                                <Text className="w-[10%] text-xs font-bold text-center text-white">Display Name</Text>
                                <Text className="w-[10%] text-xs font-bold text-center text-white">Date</Text>
                                <Text className="w-[15%] text-xs font-bold text-center text-white">Vehicle No</Text>
                                <Text className="w-[10%] text-xs font-bold text-center text-white">Mileage</Text>
                                <Text className="w-[15%] text-xs font-bold text-center text-white">Prev KM</Text>
                                <Text className="w-[10%] text-xs font-bold text-center text-white">Fuel</Text>
                                <Text className="w-[15%] text-xs font-bold text-center text-white">Today KM</Text>
                                <Text className="w-[10%] text-xs font-bold text-center text-white">Remaining</Text>
                            </View>
                            <FlatList
                                data={allEntries}
                                keyExtractor={(item, index) => `${item.$id}-${index}`}
                                renderItem={({ item }) => (
                                    <View className="flex-row border-b border-gray-300 py-2 px-2">
                                        <Text className="w-[10%] text-xs text-center">{selectedEmployee?.displayName}</Text>
                                        <Text className="w-[10%] text-xs text-center">{ new Date(item?.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short',year:"numeric"})}</Text>
                                        <Text className="w-[15%] text-xs text-center">{item.vehicleNumber}</Text>
                                        <Text className="w-[10%] text-xs text-center">{item.mileage}</Text>
                                        <Text className="w-[15%] text-xs text-center">{item.previousMeterReading}</Text>
                                        <Text className="w-[10%] text-xs text-center">{item.fuelFilled}</Text>
                                        <Text className="w-[15%] text-xs text-center">{item.meterReading}</Text>
                                        <Text className={`w-[10%] text-xs text-center font-semibold ${item.remainingDistance < 30 ? 'text-red-600' : 'text-green-700'}`}>{item.remainingDistance}</Text>
                                    </View>
                                )}
                            />
                        </View>
                    </ScrollView>

                    <TouchableOpacity onPress={exportToExcel} className="bg-[#064e3b] px-4 py-3 mt-4 rounded-xl">
                        <Text className="text-white text-center font-semibold text-sm">Export to Excel</Text>
                    </TouchableOpacity>
                </>
            )}

            <Modal visible={employeeModalVisible} animationType="slide" transparent onRequestClose={() => setEmployeeModalVisible(false)}>
                <View className="flex-1 justify-end bg-black bg-opacity-50">
                    <View className="bg-white p-4 rounded-t-2xl max-h-[80%]">
                        <Text className="text-[#064e3b] font-bold text-lg mb-4">Select Employee</Text>
                        <TextInput
                            placeholder="Search by name or email"
                            value={employeeSearch}
                            onChangeText={(text) => {
                                setEmployeeSearch(text);
                                const filtered = users.filter(u =>
                                    u.displayName?.toLowerCase().includes(text.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(text.toLowerCase())
                                );
                                setFilteredUsers(filtered);
                            }}
                            className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
                        />
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item) => item.$id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleEmployeeSelect(item)} className="p-3 border-b border-gray-200">
                                    <Text className="text-[#064e3b] text-base">{item.displayName || item.username || item.email}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}