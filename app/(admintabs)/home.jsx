// AdminDashboard.js (Optimized Frontend + UX polish)
// Dependencies you already use:
// expo-file-system, expo-sharing, xlsx, react-native-modal-datetime-picker, expo-router
// plus your services: authService, dailyEntryFormService, tripService

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, Modal, FlatList
} from 'react-native';
import * as XLSX from 'xlsx';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import authService from '../../services/authService';
import dailyEntryFormService from '../../services/dailyEntryFormService';
import tripService from '../../services/tripService';
import { useRouter } from 'expo-router';

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

const formatDateYMD = (d) => d?.toISOString?.().split('T')[0] || null;

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// prevent double taps
const useSingleFlight = () => {
  const busyRef = useRef(false);
  const wrap = useCallback(async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try { await fn(); } finally { busyRef.current = false; }
  }, []);
  return wrap;
};

// generic helper to reuse your existing service methods without changing backend
const fetchWithFilters = async (service, listAllFn, filterFns, emails, s, e) => {
  if (emails.length && s && e) {
    return service[filterFns.userAndDate](emails, s, e).then(r => r.data || []);
  } else if (emails.length) {
    return service[filterFns.userOnly](emails).then(r => r.data || []);
  } else if (s && e) {
    return service[filterFns.dateOnly](s, e).then(r => r.data || []);
  } else {
    return service[listAllFn]().then(r => r.data?.documents || []);
  }
};

// chunk + build workbook; small delay ensures spinners actually render first
const buildAndShareExcel = async (rows, fileName, columns) => {
  await new Promise(r => setTimeout(r, 80)); // let UI update
  const filtered = rows.length
    ? rows.map(obj =>
        columns.reduce((acc, c) => {
          acc[c.label] = typeof c.value === 'function'
            ? c.value(obj)
            : (obj[c.key] ?? '');
          return acc;
        }, {})
      )
    : [{ "No Data": "No records found" }];

  const chunkSize = 6000;
  const wb = XLSX.utils.book_new();
  for (let i = 0; i < filtered.length; i += chunkSize) {
    const chunk = filtered.slice(i, i + chunkSize);
    const ws = XLSX.utils.json_to_sheet(chunk);
    XLSX.utils.book_append_sheet(wb, ws, `Sheet_${Math.floor(i / chunkSize) + 1}`);
  }

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.cacheDirectory + `${fileName}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Export ${fileName}`, UTI: 'com.microsoft.excel.xlsx'
  });
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [exportingDaily, setExportingDaily] = useState(false);
  const [exportingTrip, setExportingTrip] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();
  const runOnce = useSingleFlight();

  useEffect(() => {
    (async () => {
      try {
        const current = await authService.getCurrentUser();
        const allUsers = await authService.fetchAllUsers(); // keep backend as-is
        const unique = Array.from(new Map((allUsers?.data || []).map(u => [u.email, u])).values());
        setCurrentUser(current);
        setUsers(unique);
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u?.username?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q)
    );
  }, [users, debouncedSearch]);

  const resetFilters = () => {
    setSelectedUsers([]);
    setStartDate(null);
    setEndDate(null);
  };

  const exportDailyEntry = () =>
    runOnce(async () => {
      setExportingDaily(true);
      try {
        const emails = selectedUsers.map(u => u.email);
        const s = formatDateYMD(startDate);
        const e = formatDateYMD(endDate);

        const data = await fetchWithFilters(
          dailyEntryFormService,
          'listDailyEntry',
          { userAndDate: 'fetchByUserAndDate', userOnly: 'fetchByUserOnly', dateOnly: 'fetchByDateOnly' },
          emails, s, e
        );

        // build columns dynamically (keeps your current flexibility)
        const cols = Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));
        await buildAndShareExcel(data, 'daily-entry', cols);
      } catch (err) {
        Alert.alert('Error Exporting Daily Entry', err?.message || 'Unknown error');
      } finally {
        setExportingDaily(false);
      }
    });

  const exportTripDetails = () =>
    runOnce(async () => {
      setExportingTrip(true);
      try {
        const emails = selectedUsers.map(u => u.email);
        const s = formatDateYMD(startDate);
        const e = formatDateYMD(endDate);

        let data = await fetchWithFilters(
          tripService,
          'listTrips',
          { userAndDate: 'fetchTripsByUserAndDate', userOnly: 'fetchTripsByUserOnly', dateOnly: 'fetchTripsByDateOnly' },
          emails, s, e
        );

        // enrich usernames once
        const emailList = [...new Set(data.map(trip => trip.userEmail).filter(Boolean))];
        if (emailList.length) {
          const userMap = await authService.getUsersByEmails(emailList);
          data = data.map(trip => ({
            ...trip,
            userName: userMap?.[trip.userEmail]?.username || 'Unknown',
          }));
        }

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
        ];

        await buildAndShareExcel(data, 'trip-details', columns);
      } catch (e) {
        Alert.alert('Error Exporting Trip Details', e?.message || 'Unknown error');
      } finally {
        setExportingTrip(false);
      }
    });

  const toggleUser = useCallback((u) => {
    setSelectedUsers(prev =>
      prev.find(x => x.email === u.email)
        ? prev.filter(x => x.email !== u.email)
        : [...prev, u]
    );
  }, []);

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
          {/* Use FlatList for large lists */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(u, i) => `${u.email}-${i}`}
            renderItem={({ item }) => {
              const selected = selectedUsers.some(s => s.email === item.email);
              return (
                <TouchableOpacity
                  onPress={() => toggleUser(item)}
                  style={[styles.userItem, selected && styles.userSelected]}
                >
                  <Text style={{ color: selected ? '#fff' : '#111' }}>
                    {item.username} ({item.email})
                  </Text>
                </TouchableOpacity>
              );
            }}
            initialNumToRender={20}
            windowSize={8}
            maxToRenderPerBatch={20}
            removeClippedSubviews
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setUserModalVisible(false)}>
            <Text style={{ color: '#fff' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Date Pickers */}
      <Text style={styles.sectionTitle}>Date Range:</Text>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => { setDatePickerMode('start'); setDatePickerVisibility(true); }}
      >
        <Text>{startDate ? startDate.toDateString() : 'Select start date'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => { setDatePickerMode('end'); setDatePickerVisibility(true); }}
      >
        <Text>{endDate ? endDate.toDateString() : 'Select end date'}</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          if (datePickerMode === 'start') setStartDate(date);
          else setEndDate(date);
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

        {/* Your navigation buttons preserved */}
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/advanceentry')} style={styles.btn}>
          <Text style={styles.btnText}>Accountant Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/component/clientservicescreen')} style={styles.btn}>
          <Text style={styles.btnText}>Client Service Screen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/component/complaintscreen')} style={styles.btn}>
          <Text style={styles.btnText}>Client Complaint</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/component/trip/tripcountscreen')} style={styles.btn}>
          <Text style={styles.btnText}>TripCount</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/component/diselForm/adminDiselEntry')} style={styles.btn}>
          <Text style={styles.btnText}>Diesel Count</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/component/transaction/CreateTransactionScreen')} style={styles.btn}>
          <Text style={styles.btnText}>Create Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(admintabs)/adminemployeetracker')} style={styles.btn}>
          <Text style={styles.btnText}>Employee Tracker</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
