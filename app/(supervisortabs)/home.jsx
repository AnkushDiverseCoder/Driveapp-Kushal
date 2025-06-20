import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Modal, FlatList, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import CustomAlert from '../../components/CustomAlert';
import dieselService from '../../services/dailyEntryFormService';
import authService from '../../services/authService';
import vehicleService from '../../services/vechicleService';
import tripService from '../../services/tripService';
import employeeGlobalService from '../../services/employeeGlobalService';

export default function DieselForm() {
    const [form, setForm] = useState({
        meterReading: '', fuelQuantity: '', vehicleNumber: '', vehicleType: '',
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
    const [tripCounts, setTripCounts] = useState({});
    const [users, setUsers] = useState([]);
    const [tripSearch, setTripSearch] = useState('');
    const [tripCustomDateEnabled, setTripCustomDateEnabled] = useState(false);
    const [tripDate, setTripDate] = useState(null);
    const [tripDatePickerVisible, setTripDatePickerVisible] = useState(false);

    const filteredTripEntries = Object.entries(tripCounts).filter(([email]) => {
        const user = users.find(u => u.email === email);
        return user?.displayName?.toLowerCase().includes(tripSearch.toLowerCase());
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async (date = null) => {
        try {
            const allUsers = await authService.fetchAllUsers();
            const unique = Array.from(new Map(allUsers.data.map(u => [u.email, u])).values());
            setUsers(unique);
            const counts = await tripService.fetchTodayUserTripCounts(date);
            setTripCounts(counts.data || {});
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
            userEmail: selectedEmployee.email,
            createdAt: new Date().toISOString(),
        };

        try {
            const { data, error } = await dieselService.createDailyEntry(payload);
            if (data) {
                setAlert({ visible: true, title: 'Success', message: 'Diesel entry submitted successfully!' });
            } else
            if (error) {
                setLoading(false);
                setAlert({ visible: true, title: 'Error', message: error.message || 'Failed to submit diesel entry.' });
                return;
            }

            const globalRes = await employeeGlobalService.createOrUpdateEntry(form, selectedEmployee, mileage);

            if (globalRes.error) {
                setAlert({ visible: true, title: 'Warning', message: 'Diesel entry saved, but global tracking failed: ' + globalRes.error });
            } else {
                setAlert({ visible: true, title: 'Success', message: 'Diesel entry and tracking updated successfully!' });
            }

            setForm({ meterReading: '', fuelQuantity: '', vehicleNumber: '', vehicleType: '' });
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

                    <View className="flex-row items-center mt-8 mb-2">
                        <Text className="text-base font-semibold text-[#064e3b] mr-2">View Custom Trip Date:</Text>
                        <Switch
                            value={tripCustomDateEnabled}
                            onValueChange={(val) => {
                                setTripCustomDateEnabled(val);
                                if (!val) {
                                    setTripDate(null);
                                    fetchAllData();
                                } else {
                                    setTripDatePickerVisible(true);
                                }
                            }}
                        />
                    </View>
                    {tripCustomDateEnabled && (
                        <TouchableOpacity onPress={() => setTripDatePickerVisible(true)} className="bg-gray-100 px-4 py-3 rounded-xl mb-4">
                            <Text>{tripDate ? tripDate.toDateString() : 'Select Date'}</Text>
                        </TouchableOpacity>
                    )}
                    <DateTimePickerModal
                        isVisible={tripDatePickerVisible}
                        mode="date"
                        onConfirm={(date) => {
                            setTripDate(date);
                            fetchAllData(date);
                            setTripDatePickerVisible(false);
                        }}
                        onCancel={() => setTripDatePickerVisible(false)}
                    />
                    <Text style={styles.sectionTitle2}>
                        {tripCustomDateEnabled && tripDate
                            ? `Trips on ${tripDate.toDateString()}`
                            : 'Today’s Trips (6 AM to 5:59 AM)'}
                    </Text>
                    <View style={styles.searchBarContainer}>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Search by Display Name..."
                            placeholderTextColor="#888"
                            value={tripSearch}
                            onChangeText={setTripSearch}
                        />
                    </View>
                    <View style={styles.tableWrapper}>
                        <View style={styles.tableRowHeader}>
                            <Text style={[styles.tableCell2, { flex: 2 }]}>Display Name</Text>
                            <Text style={[styles.tableCell2, { flex: 1, textAlign: 'right' }]}>Total Trips</Text>
                        </View>
                        {filteredTripEntries.length === 0 ? (
                            <Text style={styles.noTripsText}>No trips found.</Text>
                        ) : (
                            filteredTripEntries.map(([email, count], idx) => {
                                const user = users.find(u => u.email === email);
                                return (
                                    <View
                                        key={email}
                                        style={[
                                            styles.tableRow,
                                            { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f6fef9' },
                                        ]}
                                    >
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{user?.displayName || 'Unknown'}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{count}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
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
                                keyExtractor={(item) => item.number}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => onSelectVehicleNumber(item)} className="p-3 border-b border-gray-200">
                                        <Text className="text-[#064e3b] text-base">{item.number} ({item.type})</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

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
                                        onPress={() => {
                                            setSelectedEmployee({
                                                name: item.displayName || item.username || item.email,
                                                email: item.email
                                            });
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
    sectionTitle2: { fontSize: 20, fontWeight: '600', color: '#064e3b', marginTop: 30, marginBottom: 14 },
    searchBarContainer: { marginBottom: 12 },
    searchBar: { backgroundColor: '#fff', borderColor: '#064e3b', borderWidth: 1.2, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, color: '#111' },
    tableWrapper: { borderWidth: 1.5, borderColor: '#064e3b', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#064e3b', paddingVertical: 10, paddingHorizontal: 10 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#e0e0e0' },
    tableCell: { fontSize: 14, color: '#064e3b' },
    tableCell2: { fontSize: 14, color: '#fff' },
    noTripsText: { padding: 14, textAlign: 'center', color: '#6b7280', fontStyle: 'italic' },
}
