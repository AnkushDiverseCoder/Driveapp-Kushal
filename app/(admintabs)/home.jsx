// AdminDashboard.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, Modal
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
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState('start');
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
            const unique = Array.from(new Map(allUsers.data.map(u => [u.email, u])).values());
            setCurrentUser(current);
            setUsers(unique);

            const d = await dailyEntryFormService.listDailyEntry();
            const t = await tripService.listTrips();
            setAllDailyEntries(d.data.documents || []);
            setAllTrips(t.data.documents || []);
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = d => d.toISOString().split('T')[0];

    const exportToExcel = async (jsonData, fileName, columns) => {
        try {
            const filtered = jsonData.length
                ? jsonData.map(obj => columns.reduce((acc, c) => {
                    acc[c.label] = typeof c.value === 'function' ? c.value(obj) : obj[c.key] ?? '';
                    return acc;
                }, {}))
                : [{ "No Data": "No records found" }];

            const ws = XLSX.utils.json_to_sheet(filtered);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const uri = FileSystem.cacheDirectory + `${fileName}.xlsx`;
            await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `Export ${fileName}`, UTI: 'com.microsoft.excel.xlsx'
            });
        } catch (e) {
            Alert.alert('Export Failed', e.message || 'Unknown error');
        }
    };

    const resetFilters = () => {
        setSelectedUsers([]);
        setStartDate(null);
        setEndDate(null);
    };

    const exportDailyEntry = async () => {
        setExportingDaily(true);
        try {
            let data = [], emails = selectedUsers.map(u => u.email);
            const s = startDate ? formatDate(startDate) : null;
            const e = endDate ? formatDate(endDate) : null;

            if (emails.length && s && e) {
                data = await dailyEntryFormService.fetchByUserAndDate(emails, s, e).then(r => r.data);
            } else if (emails.length) {
                data = await dailyEntryFormService.fetchByUserOnly(emails).then(r => r.data);
            } else if (s && e) {
                data = await dailyEntryFormService.fetchByDateOnly(s, e).then(r => r.data);
            } else {
                data = allDailyEntries;
            }

            await exportToExcel(data, 'daily-entry', Object.keys(data[0] || {}).map(k => ({ key: k, label: k })));
        } catch (e) {
            Alert.alert('Error Exporting Daily Entry', e.message);
        } finally {
            setExportingDaily(false);
        }
    };

    const exportTripDetails = async () => {
        setExportingTrip(true);
        try {
            let data = [], emails = selectedUsers.map(u => u.email);
            const s = startDate ? formatDate(startDate) : null;
            const e = endDate ? formatDate(endDate) : null;

            // 🔹 Fetch trips based on filters
            if (emails.length && s && e) {
                data = await tripService.fetchTripsByUserAndDate(emails, s, e).then(r => r.data);
            } else if (emails.length) {
                data = await tripService.fetchTripsByUserOnly(emails).then(r => r.data);
            } else if (s && e) {
                data = await tripService.fetchTripsByDateOnly(s, e).then(r => r.data);
            } else {
                data = allTrips;
            }

            // 🔹 Get unique emails and fetch usernames
            const emailList = [...new Set(data.map(trip => trip.userEmail))];
            const userMap = await authService.getUsersByEmails(emailList);

            // 🔹 Attach username to each trip
            data = data.map(trip => ({
                ...trip,
                userName: userMap[trip.userEmail]?.username || 'Unknown',
            }));

            // 🔹 Define columns including new username field
            const columns = [
                { label: 'User Name', key: 'userName' },
                { label: 'Site Name', key: 'siteName' },
                { label: 'Created At', value: row => row.$createdAt?.split('T')[0] || '' },
                { label: 'Trip ID', key: 'tripId' },
                { label: 'Trip Method', key: 'TripMethod' },
                { label: 'Escort', value: row => row.escort ? 'Yes' : 'No' },
                { label: 'Vehicle Number', key: 'vehicleNumber' },
                { label: 'Start KM', key: 'startKm' },
                { label: 'End KM', key: 'endKm' },
                { label: 'Distance Travelled', key: 'distanceTravelled' },
                ...Object.keys(data[0] || {}).filter(k =>
                    !['userName', 'siteName', '$createdAt', 'tripId', 'TripMethod', 'escort', 'vehicleNumber', 'startKm', 'endKm', 'distanceTravelled'].includes(k)
                ).map(k => ({ label: k, key: k }))
            ];

            await exportToExcel(data, 'trip-details', columns);
        } catch (e) {
            Alert.alert('Error Exporting Trip Details', e.message);
        } finally {
            setExportingTrip(false);
        }
    };

    const toggleUser = u => {
        setSelectedUsers(prev =>
            prev.find(x => x.email === u.email)
                ? prev.filter(x => x.email !== u.email)
                : [...prev, u]
        );
    };

    const filtered = users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#064e3b" />
                <Text>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Admin Info */}
            <View style={styles.adminCard}>
                <Text style={styles.initial}>{currentUser?.username?.[0]?.toUpperCase() || '?'}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.adminLabel}>Username</Text>
                    <Text style={styles.adminValue}>{currentUser?.username}</Text>
                    <Text style={styles.adminLabel}>Email</Text>
                    <Text style={styles.adminValue}>{currentUser?.email}</Text>
                </View>
            </View>

            {/* User Picker */}
            <Text style={styles.sectionTitle}>Select Users:</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setUserModalVisible(true)}>
                <Text>{selectedUsers.length ? 'Change users...' : 'Choose users'}</Text>
            </TouchableOpacity>

            {/* Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {selectedUsers.map(u => (
                    <View key={u.email} style={styles.chip}>
                        <Text style={styles.chipText}>{u.username}</Text>
                    </View>
                ))}
            </View>

            <Modal visible={userModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Users</Text>
                    <TextInput
                        placeholder="Search users..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                    />
                    <ScrollView>
                        {filtered.map((u, i) => (
                            <TouchableOpacity
                                key={u.email + i}
                                onPress={() => toggleUser(u)}
                                style={[
                                    styles.userItem,
                                    selectedUsers.some(s => s.email === u.email) && styles.userSelected
                                ]}
                            >
                                <Text>
                                    {u.username} ({u.email})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setUserModalVisible(false)}>
                        <Text style={{ color: '#fff' }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Date Pickers */}
            <Text style={styles.sectionTitle}>Date Range:</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => { setDatePickerMode('start'); setDatePickerVisibility(true); }}>
                <Text>{startDate ? startDate.toDateString() : 'Select start date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={() => { setDatePickerMode('end'); setDatePickerVisibility(true); }}>
                <Text>{endDate ? endDate.toDateString() : 'Select end date'}</Text>
            </TouchableOpacity>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                    if (datePickerMode === 'start') {
                        setStartDate(date);
                    } else {
                        setEndDate(date);
                    }
                    setDatePickerVisibility(false);
                }}
                onCancel={() => setDatePickerVisibility(false)}
            />

            {/* Reset & Exports */}
            <View style={styles.btnRow}>
                <TouchableOpacity onPress={resetFilters} style={[styles.btn, { backgroundColor: '#dc2626' }]}>
                    <Text style={styles.btnText}>Reset Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={exportDailyEntry} disabled={exportingDaily} style={styles.btn}>
                    {exportingDaily ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Export Daily Entry</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={exportTripDetails} disabled={exportingTrip} style={styles.btn}>
                    {exportingTrip ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Export Trip Details</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = {
    container: { padding: 16, backgroundColor: '#f0fdf4' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    adminCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    initial: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#064e3b', color: '#fff', fontSize: 18, textAlign: 'center', textAlignVertical: 'center', marginRight: 12 },
    adminLabel: { fontSize: 12, color: '#666' },
    adminValue: { fontSize: 16, fontWeight: '600' },
    sectionTitle: { fontWeight: '600', marginBottom: 6, color: '#064e3b' },
    pickerBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 8 },
    chip: { backgroundColor: '#064e3b', padding: 8, borderRadius: 16, margin: 4 },
    chipText: { color: '#fff' },
    modalContainer: { flex: 1, padding: 16, backgroundColor: '#f0fdf4' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#064e3b', marginBottom: 12 },
    searchInput: { backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
    userItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 8 },
    userSelected: { backgroundColor: '#064e3b' },
    closeBtn: { marginTop: 12, backgroundColor: '#dc2626', padding: 12, borderRadius: 8, alignItems: 'center' },
    dateBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 6, borderColor: '#ccc', borderWidth: 1, marginBottom: 8 },
    btnRow: { marginTop: 20 },
    btn: { backgroundColor: '#064e3b', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    btnText: { color: '#fff', fontWeight: '600' },
};
