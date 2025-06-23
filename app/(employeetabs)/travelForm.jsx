import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tripService from '../../services/tripService'
import CustomAlert from '../../components/CustomAlert'
import { useAuth } from '../../context/AuthContext'
import vehicleService from '../../services/vechicleService'
import clientService from '../../services/clientService'

const tripMethods = ['pickup', 'drop']

export default function TravelForm() {
    const [siteOptions, setSiteOptions] = useState([])
    useEffect(() => {
        const fetchClients = async () => {
            const { success, data, error } = await clientService.listClients();
            if (success) {
                const names = data.data.map((item) => item.siteName).filter(Boolean);
                setSiteOptions(names);
            } else {
                console.error('Failed to fetch clients:', error);
            }
        };
        fetchClients();
    }, []);

    const [form, setForm] = useState({
        siteName: '',
        tripMethod: '',
        tripId: '',
        startKm: '',
        endKm: '',
        escort: false,
        vehicleNumber: '',
    })

    const [vehicleList, setVehicleList] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false)
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await vehicleService.listVehicles();
                const documents = response?.data?.data || [];
                const fetchedList = documents
                    .filter(doc => doc.labels !== 'attached') // 👈 Filter out 'employee'
                    .map(doc => ({
                        number: doc.vehicleNumber || 'Unknown',
                        type: doc.vehicleType || 'Unknown',
                        labels: doc.labels || 'Unknown',
                    }));
                setVehicleList(fetchedList);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                setVehicleList([]); // fallback to empty
            }
        };
        fetchVehicles();
    }, []);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: null }))
        console.log(vehicleList)
    }

    const validate = () => {
        let valid = true;
        const newErrors = {};
        const requiredFields = ['siteName', 'tripMethod', 'tripId'];

        for (const key of requiredFields) {
            if (!form[key]) {
                newErrors[key] = 'This field is required';
                valid = false;
            }
        }

        if (form.tripId && !/^[\d_-]+$/.test(form.tripId)) {
            newErrors.tripId = 'Trip ID must contain only numbers, - or _';
            valid = false;
        }

        if (form.siteName === 'Sagility' && !form.tripId.includes('-')) {
            newErrors.tripId = 'Trip ID for Sagility must include a "-"';
            valid = false;
        }

        if (!form.vehicleNumber) {
            newErrors.vehicleNumber = 'Please select a vehicle number';
            valid = false;
        }
        if (!form.startKm && form.startKm !== 0 && form.startKm !== '') {
            newErrors.startKm = 'Please Enter a Start Km';
            valid = false;
        }

        if (form.startKm && form.endKm && parseFloat(form.endKm) < parseFloat(form.startKm)) {
            newErrors.endKm = 'End KM must be greater than Start KM';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        // Check for Start KM limit
        const parsedStartKm = parseFloat(form.startKm);
        if (isNaN(parsedStartKm) || parsedStartKm < 100) {
            setAlert({
                visible: true,
                title: 'Error',
                message: 'Start KM must be a number and at least 100.',
            });
            return;
        }

        setLoading(true);

        const distanceTravelled = form.endKm && form.startKm
            ? parseFloat(form.endKm) - parseFloat(form.startKm)
            : 0;

        const payload = {
            ...form,
            startKm: parsedStartKm,
            endKm: form.endKm ? parseFloat(form.endKm) : 0,
            distanceTravelled,
            userEmail: user.email,
            attached: false,
        };

        try {
            const { data, error } = await tripService.createTrip(payload);
            console.log(data)
            setLoading(false);

            if (error) {
                setAlert({
                    visible: true,
                    title: 'Error',
                    message: error,
                });
                return;
            }

            setAlert({
                visible: true,
                title: 'Success',
                message: 'Trip submitted successfully!',
            });
            setForm({
                siteName: '',
                tripMethod: '',
                tripId: '',
                startKm: '',
                endKm: '',
                escort: false,
                vehicleNumber: '',
            });
        } catch (e) {
            setLoading(false);
            setAlert({
                visible: true,
                title: 'Error',
                message: 'Unexpected error occurred: ' + e.message,
            });
        }
    };

    const todayDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flex: 1 }}>
                        {/* SITE */}
                        <Text className="text-[#064e3b] font-semibold text-base">Site Name</Text>
                        <View className="mt-2 bg-white border border-gray-300 rounded-lg">
                            {siteOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    className={`px-8 py-6 text-lg ${form.siteName === option ? 'bg-[#e6f4f0]' : ''}`}
                                    onPress={() => handleChange('siteName', option)}
                                >
                                    <Text className="text-[#064e3b]">{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.siteName && <Text className="text-red-500 mt-1">{errors.siteName}</Text>}

                        {/* TRIP METHOD */}
                        <Text className="text-[#064e3b] font-semibold text-base mt-4">Trip Method</Text>
                        <View className="flex-row mt-2">
                            {tripMethods.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => handleChange('tripMethod', type)}
                                    className={`mr-4 px-8 py-4 rounded-lg border ${form.tripMethod === type ? 'bg-[#064e3b]' : 'border-gray-400'}`}
                                >
                                    <Text className={`${form.tripMethod === type ? 'text-white' : 'text-[#064e3b]'} capitalize`}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.tripMethod && <Text className="text-red-500 mt-1">{errors.tripMethod}</Text>}

                        {/* DATE + TRIP ID */}
                        <Text className="text-[#064e3b] font-semibold text-base mt-4">Date of Entry</Text>
                        <TextInput
                            value={todayDate}
                            editable={false}
                            className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b] bg-gray-100"
                        />

                        <Text className="text-[#064e3b] font-semibold text-base">Trip ID</Text>
                        <TextInput
                            value={form.tripId}
                            onChangeText={(text) => {
                                let formatted = text.replace(/[^0-9_-]/g, '')
                                if (form.siteName === 'Sagility' && formatted.length === 9 && !formatted.includes('-')) {
                                    formatted = formatted.slice(0, 8) + '-' + formatted.slice(8)
                                }
                                handleChange('tripId', formatted)
                            }}
                            placeholder="Enter trip ID"
                            className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b]"
                        />
                        {errors.tripId && <Text className="text-red-500 mt-1">{errors.tripId}</Text>}

                        {/* ESCORT */}
                        <Text className="text-[#064e3b] font-semibold text-base mt-4">Escort</Text>
                        <TouchableOpacity
                            onPress={() => handleChange('escort', !form.escort)}
                            className={`mt-2 px-4 py-2 border rounded-lg ${form.escort ? 'bg-[#064e3b]' : 'border-gray-400'}`}
                        >
                            <Text className={`${form.escort ? 'text-white' : 'text-[#064e3b]'}`}>{form.escort ? 'Yes' : 'No'}</Text>
                        </TouchableOpacity>

                        {/* VEHICLE MODAL */}
                        <Text className="text-[#064e3b] font-semibold text-base mt-4">Vehicle Number</Text>
                        <TouchableOpacity
                            onPress={() => setVehicleModalVisible(true)}
                            className="mt-2 bg-white border border-gray-400 rounded px-3 py-2"
                        >
                            <Text className={`${form.vehicleNumber ? 'text-black' : 'text-gray-400'}`}>
                                {form.vehicleNumber || 'Select vehicle number'}
                            </Text>
                        </TouchableOpacity>
                        {errors.vehicleNumber && <Text className="text-red-500 mt-1">{errors.vehicleNumber}</Text>}

                        <Modal
                            visible={vehicleModalVisible}
                            animationType="slide"
                            onRequestClose={() => setVehicleModalVisible(false)}
                            transparent={true}
                        >
                            <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-8">
                                <View className="bg-white rounded-lg p-4 w-full max-h-[90%]">
                                    <Text className="text-center text-lg font-semibold text-[#064e3b] mb-4">
                                        Select Vehicle Number
                                    </Text>
                                    <TextInput
                                        placeholder="Search vehicle number"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        className="border border-gray-400 rounded px-3 py-2 mb-4 text-[#064e3b]"
                                    />
                                    <ScrollView className="max-h-[70%]">
                                        {vehicleList.filter(v =>
                                            v.number.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((v, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                className="py-2 border-b border-gray-200"
                                                onPress={() => {
                                                    handleChange('vehicleNumber', v.number)
                                                    setVehicleModalVisible(false)
                                                    setSearchQuery('')
                                                }}
                                            >
                                                <Text className="text-[#064e3b]">{v.number} ({v.type})</Text>
                                            </TouchableOpacity>
                                        ))}
                                        {vehicleList.filter(v =>
                                            v.number.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length === 0 && (
                                                <Text className="text-center text-gray-400">No matching vehicles</Text>
                                            )}
                                    </ScrollView>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setVehicleModalVisible(false)
                                            setSearchQuery('')
                                        }}
                                        className="mt-4 py-2 bg-[#064e3b] rounded"
                                    >
                                        <Text className="text-white text-center font-semibold">Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        {/* KM FIELDS */}
                        <Text className="text-[#064e3b] font-semibold text-base mt-4">Start KM</Text>
                        <TextInput
                            value={form.startKm}
                            onChangeText={(text) => handleChange('startKm', text)}
                            placeholder="Enter start KM"
                            keyboardType="numeric"
                            className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b]"
                        />
                        {errors.startKm && <Text className="text-red-500 mt-1">{errors.startKm}</Text>}

                        {/* SUBMIT */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-[#064e3b] rounded-xl py-3 mt-6"
                            disabled={loading}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                {loading ? 'Submitting...' : 'Submit Trip'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </SafeAreaView>
    )
}
