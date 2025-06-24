import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Modal, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomAlert from '../../components/CustomAlert';
import dieselService from '../../services/dailyEntryFormService';
import authService from '../../services/authService';
import vehicleService from '../../services/vechicleService';
import employeeGlobalService from '../../services/employeeGlobalService';

import { useRouter } from 'expo-router';

export default function DieselForm() {
    const [form, setForm] = useState({
        meterReading: '',
        fuelQuantity: '',
        vehicleNumber: '',
        vehicleType: '',
        reqTripCount: '', // 🆕 added
    });
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState({ name: '', email: '' });
    const [vehicleList, setVehicleList] = useState([]);
    const [mileage, setMileage] = useState(0);
    const [totalDistance, setTotalDistance] = useState(null);
    const [, setUsers] = useState([]);
    const router = useRouter();
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const allUsers = await authService.fetchAllUsers();
            const unique = Array.from(new Map(allUsers.data.map(u => [u.email, u])).values());
            setUsers(unique);
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to fetch trip data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function fetchEmployees() {
            const { data, error } = await authService.fetchAllUsers();
            if (error) {
                setAlert({ visible: true, title: 'Error', message: 'Failed to fetch employees' });
                return;
            }
            const employees = data.filter((u) => u.labels?.includes('employee'));
            setEmployeeList(employees);
            setFilteredEmployees(employees);
        }
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!employeeSearch) {
            setFilteredEmployees(employeeList);
        } else {
            const lower = employeeSearch.toLowerCase();
            setFilteredEmployees(
                employeeList.filter(
                    (u) =>
                        u.displayName?.toLowerCase().includes(lower) ||
                        u.username?.toLowerCase().includes(lower) ||
                        u.email?.toLowerCase().includes(lower)
                )
            );
        }
    }, [employeeSearch, employeeList]);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await vehicleService.listVehicles();
                const documents = response?.data?.data || [];
                const fetchedList = documents.map(doc => ({
                    number: doc.vehicleNumber || 'Unknown',
                    type: doc.vehicleType || 'Unknown',
                    mileage: doc.mileage || 0,
                }));
                setVehicleList(fetchedList);
            } catch (error) {
                console.error('Failed to fetch vehicles:', error);
                setVehicleList([]);
            }
        };
        fetchVehicles();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const onSelectVehicleNumber = (vehicle) => {
        setForm((prev) => ({
            ...prev,
            vehicleNumber: vehicle.number,
            vehicleType: vehicle.type,
        }));
        setMileage(vehicle.mileage);
        setErrors((prev) => ({ ...prev, vehicleNumber: '', vehicleType: '' }));
        setVehicleModalVisible(false);
    };

    const filteredVehicleNumbers = useMemo(() => {
        if (!searchQuery) return vehicleList;
        const lower = searchQuery.toLowerCase();
        return vehicleList.filter(
            (v) => v.number.toLowerCase().includes(lower) || v.type.toLowerCase().includes(lower)
        );
    }, [searchQuery, vehicleList]);

    useEffect(() => {
        if (form.fuelQuantity && mileage > 0) {
            setTotalDistance(parseFloat(form.fuelQuantity) * mileage);
        } else {
            setTotalDistance(null);
        }
    }, [form.fuelQuantity, mileage]);

    const validate = () => {
        const newErrors = {};
        let valid = true;
        if (!form.meterReading) {
            newErrors.meterReading = 'Meter reading is required';
            valid = false;
        }
        if (!form.fuelQuantity) {
            newErrors.fuelQuantity = 'Fuel quantity is required';
            valid = false;
        }
        if (!form.vehicleNumber) {
            newErrors.vehicleNumber = 'Vehicle number is required';
            valid = false;
        }
        if (!form.vehicleType) {
            newErrors.vehicleType = 'Vehicle type is required';
            valid = false;
        }
        if (!form.reqTripCount) {
            newErrors.reqTripCount = 'Requested trip count is required';
            valid = false;
        }
        if (!selectedEmployee.email) {
            newErrors.employee = 'Select an employee';
            valid = false;
        }
        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);

        const totalDistance = parseFloat(form.fuelQuantity) * mileage;
        const payload = {
            ...form,
            meterReading: parseFloat(form.meterReading),
            fuelQuantity: parseFloat(form.fuelQuantity),
            mileage,
            totalDistance,
            reqTripCount: parseInt(form.reqTripCount),
            userEmail: selectedEmployee.email,
            createdAt: new Date().toISOString(),
        };

        try {
            const { data, error } = await dieselService.createDailyEntry(payload);
            if (data) {
                setAlert({ visible: true, title: 'Success', message: 'Diesel entry submitted successfully!' });
            } else {
                setLoading(false);
                setAlert({ visible: true, title: 'Error', message: error.message || 'Failed to submit diesel entry.' });
                return;
            }

            const globalRes = await employeeGlobalService.createOrUpdateEntry(form, selectedEmployee, mileage);

            if (globalRes.error) {
                setAlert({
                    visible: true,
                    title: 'Warning',
                    message: 'Diesel entry saved, but global tracking failed: ' + globalRes.error,
                });
            } else {
                setAlert({
                    visible: true,
                    title: 'Success',
                    message: 'Diesel entry and tracking updated successfully!',
                });
            }

            setForm({
                meterReading: '',
                fuelQuantity: '',
                vehicleNumber: '',
                vehicleType: '',
                reqTripCount: '',
            });
            setSelectedEmployee({ name: '', email: '' });
            setSearchQuery('');
            setEmployeeSearch('');
        } catch (e) {
            setAlert({ visible: true, title: 'Error', message: 'Unexpected error: ' + e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text className="text-[#064e3b] font-semibold text-base">Today Meter Reading</Text>
                    <TextInput
                        value={form.meterReading}
                        onChangeText={(text) => handleChange('meterReading', text)}
                        placeholder="Enter current reading (km)"
                        keyboardType="numeric"
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                    />
                    {errors.meterReading && <Text className="text-red-500 mt-1">{errors.meterReading}</Text>}

                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Fuel Quantity (in liters)</Text>
                    <TextInput
                        value={form.fuelQuantity}
                        onChangeText={(text) => handleChange('fuelQuantity', text)}
                        placeholder="e.g., 10"
                        keyboardType="numeric"
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                    />
                    {errors.fuelQuantity && <Text className="text-red-500 mt-1">{errors.fuelQuantity}</Text>}

                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Vehicle Number</Text>
                    <TouchableOpacity
                        onPress={() => setVehicleModalVisible(true)}
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
                    >
                        <Text className="text-[#064e3b]">{form.vehicleNumber || 'Select Vehicle Number'}</Text>
                    </TouchableOpacity>
                    {errors.vehicleNumber && <Text className="text-red-500 mt-1">{errors.vehicleNumber}</Text>}

                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Vehicle Type</Text>
                    <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3" style={{ opacity: 0.7 }}>
                        <Text className="text-[#064e3b] text-base">{form.vehicleType || '-'}</Text>
                    </View>
                    {errors.vehicleType && <Text className="text-red-500 mt-1">{errors.vehicleType}</Text>}

                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Select Employee</Text>
                    <TouchableOpacity
                        onPress={() => setEmployeeModalVisible(true)}
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
                    >
                        <Text className="text-[#064e3b]">{selectedEmployee.name || 'Select Employee'}</Text>
                    </TouchableOpacity>
                    {errors.employee && <Text className="text-red-500 mt-1">{errors.employee}</Text>}

                    {/* Employee Modal */}
                    <Modal visible={employeeModalVisible} animationType="slide" transparent onRequestClose={() => setEmployeeModalVisible(false)}>
                        <View className="flex-1 justify-end bg-black bg-opacity-50">
                            <View className="bg-white p-4 rounded-t-2xl max-h-[80%]">
                                <Text className="text-[#064e3b] font-bold text-lg mb-4">Select Employee</Text>
                                <TextInput
                                    placeholder="Search by name or email"
                                    value={employeeSearch}
                                    onChangeText={setEmployeeSearch}
                                    className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
                                />
                                <FlatList
                                    data={filteredEmployees}
                                    keyExtractor={(item) => item.$id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={async () => {
                                                const name = item.displayName || item.username || item.email;
                                                const email = item.email;

                                                const { data: tripCount, error } = await dieselService.getLatestReqTripCountByEmail(email);

                                                if (error) {
                                                    setAlert({ visible: true, title: 'Error', message: error.message });
                                                }

                                                setSelectedEmployee({ name, email });
                                                setForm((prev) => ({
                                                    ...prev,
                                                    reqTripCount: tripCount?.toString() || '', // prefill or keep blank
                                                }));
                                                setEmployeeModalVisible(false);
                                            }}
                                            className="p-3 border-b border-gray-200"
                                        >
                                            <Text className="text-[#064e3b] text-base">
                                                {item.displayName || item.username || item.email} ({item.email})
                                            </Text>
                                        </TouchableOpacity>

                                    )}
                                />
                            </View>
                        </View>
                    </Modal>

                    {selectedEmployee.email && (
                        <>
                            <Text className="text-[#064e3b] font-semibold text-base mt-4">Requested Trips Count</Text>
                            <TextInput
                                value={form.reqTripCount}
                                onChangeText={(text) => handleChange('reqTripCount', text)}
                                placeholder="e.g., 2"
                                keyboardType="numeric"
                                className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                            />
                            {errors.reqTripCount && <Text className="text-red-500 mt-1">{errors.reqTripCount}</Text>}
                        </>
                    )}

                    {errors.reqTripCount && <Text className="text-red-500 mt-1">{errors.reqTripCount}</Text>}


                    {form.vehicleType && form.fuelQuantity && (
                        <>
                            <Text className="text-[#064e3b] font-semibold text-base mt-4">Mileage</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">{mileage} km/l</Text>
                            </View>
                            <Text className="text-[#064e3b] font-semibold text-base mt-4">Estimated Distance</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">{totalDistance?.toFixed(2)} km</Text>
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className={`bg-[#064e3b] rounded-xl mt-4 py-4 items-center shadow-sm ${loading ? 'opacity-50' : 'opacity-100'}`}
                    >
                        <Text className="text-white text-xl font-semibold">{loading ? 'Submitting...' : 'Submit'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.replace('/(supervisortabs)/components/trip/tripcountscreen')} style={styles.btn}>
                        <Text style={styles.btnText}>Trip Count</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.replace('/(supervisortabs)/components/complaintscreen')} style={styles.btn}>
                        <Text style={styles.btnText}>Complaint</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Vehicle Modal */}
                <Modal visible={vehicleModalVisible} animationType="slide" transparent onRequestClose={() => setVehicleModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black bg-opacity-50">
                        <View className="bg-white p-4 rounded-t-2xl max-h-[80%]">
                            <Text className="text-[#064e3b] font-bold text-lg mb-4">Select Vehicle Number</Text>
                            <TextInput
                                placeholder="Search by number or type"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
                            />
                            <FlatList
                                data={filteredVehicleNumbers}
                                keyExtractor={(item) => item.$id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => onSelectVehicleNumber(item)} className="p-3 border-b border-gray-200">
                                        <Text className="text-[#064e3b] text-base">{item.number} ({item.type})</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </SafeAreaView>
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
    sectionTitle2: { fontSize: 20, fontWeight: '600', color: '#064e3b', marginTop: 30, marginBottom: 14 },
    searchBarContainer: { marginBottom: 12 },
    searchBar: { backgroundColor: '#fff', borderColor: '#064e3b', borderWidth: 1.2, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, color: '#111' },
    tableWrapper: { borderWidth: 1.5, borderColor: '#064e3b', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#064e3b', paddingVertical: 10, paddingHorizontal: 10 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#e0e0e0' },
    tableCell: { fontSize: 14, color: '#064e3b' },
    tableCell2: { fontSize: 14, color: '#fff' },
    noTripsText: { padding: 14, textAlign: 'center', color: '#6b7280', fontStyle: 'italic' },
};