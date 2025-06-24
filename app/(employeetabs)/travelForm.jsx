// Import required packages
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, Modal, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import tripService from '../../services/tripService';
import vehicleService from '../../services/vechicleService';
import clientService from '../../services/clientService';
import CustomAlert from '../../components/CustomAlert';
import { useAuth } from '../../context/AuthContext';

const tripMethods = ['pickup', 'drop'];

export default function TravelForm() {
    const { user } = useAuth();

    const [form, setForm] = useState({
        siteName: '', tripMethod: '', tripId: '',
        vehicleNumber: '', startKm: '', escort: false,
    });

    const [shiftHour, setShiftHour] = useState('');
    const [shiftMinute, setShiftMinute] = useState('');
    const [shiftPickerVisible, setShiftPickerVisible] = useState(false);

    const [siteOptions, setSiteOptions] = useState([]);
    const [vehicleList, setVehicleList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEnabled = {
        siteName: true,
        tripMethod: !!form.siteName,
        tripId: !!form.tripMethod,
        vehicleNumber: !!form.tripId,
        startKm: !!form.vehicleNumber,
    };

    useEffect(() => {
        const fetchClients = async () => {
            const { success, data } = await clientService.listClients();
            if (success) setSiteOptions(data.data.map(i => i.siteName).filter(Boolean));
        };
        const fetchVehicles = async () => {
            const { data } = await vehicleService.listVehicles();
            setVehicleList(data?.data.filter(v => v.labels !== 'attached').map(v => ({
                number: v.vehicleNumber || '', type: v.vehicleType || ''
            })));
        };
        fetchClients();
        fetchVehicles();
    }, []);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleShiftConfirm = (date) => {
        const hr = date.getHours() % 12 || 12;
        const min = [0, 15, 30, 45].reduce((a, b) => Math.abs(min - a) < Math.abs(min - b) ? a : b);
        setShiftHour(String(hr));
        setShiftMinute(String(min).padStart(2, '0'));
        setShiftPickerVisible(false);
    };

    const validate = () => {
        const newErrors = {};
        let valid = true;

        ['siteName', 'tripMethod', 'tripId', 'vehicleNumber', 'startKm'].forEach(field => {
            if (!form[field]) {
                newErrors[field] = 'This field is required';
                valid = false;
            }
        });

        if (form.tripId && !/^[\d_-]+$/.test(form.tripId)) {
            newErrors.tripId = 'Trip ID must contain only numbers, - or _';
            valid = false;
        }

        if (form.siteName === 'Sagility' && !form.tripId.includes('-')) {
            newErrors.tripId = 'Trip ID for Sagility must include "-"';
            valid = false;
        }

        if (!shiftHour || !shiftMinute) {
            Alert.alert('Error', 'Please select a shift time');
            valid = false;
        }

        const start = parseFloat(form.startKm);
        if (isNaN(start) || start < 100) {
            newErrors.startKm = 'Start KM must be ≥ 100';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload = {
            ...form,
            startKm: parseFloat(form.startKm),
            endKm: 0,
            distanceTravelled: 0,
            shiftTime: `${shiftHour}:${shiftMinute}`,
            userEmail: user.email,
            attached: false,
        };

        try {
            setLoading(true);
            const { error } = await tripService.createTrip(payload);
            setLoading(false);

            if (error) {
                setAlert({ visible: true, title: 'Error', message: error });
            } else {
                setAlert({ visible: true, title: 'Success', message: 'Trip submitted successfully!' });
                setForm({ siteName: '', tripMethod: '', tripId: '', vehicleNumber: '', startKm: '', escort: false });
                setShiftHour('');
                setShiftMinute('');
            }
        } catch (e) {
            setLoading(false);
            setAlert({ visible: true, title: 'Error', message: e.message });
        }
    };

    const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Site Name */}
                    <Text style={{ color: 'black', fontWeight: 'bold' }}>Site Name</Text>
                    {siteOptions.map((opt, i) => (
                        <TouchableOpacity key={i} onPress={() => handleChange('siteName', opt)} style={{
                            padding: 12, marginTop: 8, backgroundColor: form.siteName === opt ? '#e6f4f0' : 'white',
                            borderWidth: 1, borderColor: '#ccc', borderRadius: 8
                        }}>
                            <Text style={{ color: 'black', fontWeight: 'bold' }}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                    {errors.siteName && <Text style={{ color: 'red' }}>{errors.siteName}</Text>}

                    {/* Trip Method */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Trip Method</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        {tripMethods.map(method => (
                            <TouchableOpacity
                                key={method}
                                onPress={() => isEnabled.tripMethod && handleChange('tripMethod', method)}
                                style={{
                                    backgroundColor: method === 'pickup' ? '#ccf3d9' : '#fff9c4',
                                    padding: 12, marginRight: 12, borderRadius: 8,
                                    borderWidth: 1, borderColor: form.tripMethod === method ? '#064e3b' : '#ccc'
                                }}
                            >
                                <Text style={{ color: 'black', fontWeight: 'bold', textTransform: 'capitalize' }}>{method}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.tripMethod && <Text style={{ color: 'red' }}>{errors.tripMethod}</Text>}

                    {/* Trip ID */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Trip ID</Text>
                    <TextInput
                        editable={isEnabled.tripId}
                        value={form.tripId}
                        onChangeText={text => handleChange('tripId', form.siteName === 'Sagility' && text.length === 9 && !text.includes('-')
                            ? text.slice(0, 8) + '-' + text.slice(8) : text.replace(/[^0-9_-]/g, '')
                        )}
                        placeholder="Enter Trip ID"
                        style={{
                            borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                            padding: 12, color: 'black', fontWeight: 'bold', marginTop: 8
                        }}
                    />
                    {errors.tripId && <Text style={{ color: 'red' }}>{errors.tripId}</Text>}

                    {/* Vehicle Number */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Vehicle Number</Text>
                    <TouchableOpacity
                        disabled={!isEnabled.vehicleNumber}
                        onPress={() => setVehicleModalVisible(true)}
                        style={{
                            marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1,
                            borderColor: '#ccc', backgroundColor: 'white'
                        }}
                    >
                        <Text style={{ color: 'black', fontWeight: 'bold' }}>{form.vehicleNumber || 'Select vehicle number'}</Text>
                    </TouchableOpacity>
                    {errors.vehicleNumber && <Text style={{ color: 'red' }}>{errors.vehicleNumber}</Text>}

                    {/* Vehicle Modal */}
                    <Modal visible={vehicleModalVisible} transparent animationType="slide">
                        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 20 }}>
                            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                                <Text style={{ textAlign: 'center', fontWeight: 'bold', color: '#064e3b', fontSize: 18 }}>Select Vehicle Number</Text>
                                <TextInput
                                    placeholder="Search vehicle"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 10 }}
                                />
                                <ScrollView style={{ maxHeight: 300 }}>
                                    {vehicleList.filter(v => v.number.toLowerCase().includes(searchQuery.toLowerCase())).map((v, i) => (
                                        <TouchableOpacity key={i} onPress={() => {
                                            handleChange('vehicleNumber', v.number);
                                            setVehicleModalVisible(false);
                                            setSearchQuery('');
                                        }}>
                                            <Text style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>{v.number} ({v.type})</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setVehicleModalVisible(false)} style={{ marginTop: 16, backgroundColor: '#064e3b', padding: 12, borderRadius: 8 }}>
                                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Start KM */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Start KM</Text>
                    <TextInput
                        editable={isEnabled.startKm}
                        keyboardType="numeric"
                        placeholder="Enter Start KM"
                        value={form.startKm}
                        onChangeText={text => handleChange('startKm', text)}
                        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8, color: 'black', fontWeight: 'bold' }}
                    />
                    {errors.startKm && <Text style={{ color: 'red' }}>{errors.startKm}</Text>}

                    {/* Escort */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Escort</Text>
                    <TouchableOpacity
                        onPress={() => handleChange('escort', !form.escort)}
                        style={{ marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: form.escort ? '#064e3b' : 'white' }}
                    >
                        <Text style={{ color: form.escort ? 'white' : 'black', fontWeight: 'bold' }}>{form.escort ? 'Yes' : 'No'}</Text>
                    </TouchableOpacity>

                    {/* Shift Time */}
                    <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 16 }}>Shift Time</Text>
                    <TouchableOpacity onPress={() => setShiftPickerVisible(true)} style={{ marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: 'white' }}>
                        <Text style={{ color: 'black', fontWeight: 'bold' }}>{shiftHour && shiftMinute ? `${shiftHour}:${shiftMinute}` : 'Select shift time'}</Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={shiftPickerVisible}
                        mode="time"
                        onConfirm={handleShiftConfirm}
                        onCancel={() => setShiftPickerVisible(false)}
                        minuteInterval={15}
                    />

                    {/* Submit */}
                    <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ marginTop: 30, backgroundColor: '#064e3b', padding: 14, borderRadius: 10 }}>
                        <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>{loading ? 'Submitting...' : 'Submit Trip'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
        </SafeAreaView>
    );
}
