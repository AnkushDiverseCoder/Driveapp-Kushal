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

const tripMethods = ['pickup', 'drop']
const siteOptions = ['Sagility', 'Deloitte', 'Youchana', 'Cogent']

const vehicleNumbersList = [
    { number: 'TS09UA9275', type: 'XYLO' },
    { number: 'TS09UA9278', type: 'XYLO' },
    { number: 'TS09UB1415', type: 'XYLO' },
    { number: 'TS09UB1416', type: 'XYLO' },
    { number: 'TS09UB5527', type: 'XYLO' },
    { number: 'TS09UB5531', type: 'XYLO' },
    { number: 'TS09UB5532', type: 'XYLO' },
    { number: 'TS09UB5533', type: 'XYLO' },
    { number: 'TS09UB5534', type: 'XYLO' },
    { number: 'TS09UB5536', type: 'XYLO' },
    { number: 'TS09UB8821', type: 'INNOVA' },
    { number: 'TS09UB8822', type: 'INNOVA' },
    { number: 'TS09UB8823', type: 'INNOVA' },
    { number: 'TS09UB8825', type: 'INNOVA' },
    { number: 'TS09UC1909', type: 'WINGER' },
    { number: 'TS09UC1910', type: 'WINGER' },
    { number: 'TS09UC1911', type: 'WINGER' },
    { number: 'TS09UC1912', type: 'WINGER' },
    { number: 'TS09UC1913', type: 'WINGER' },
    { number: 'TS09UD9032', type: 'BOLERO NEO' },
    { number: 'TS09UD9033', type: 'BOLERO NEO' },
    { number: 'TS09UD9088', type: 'BOLERO NEO' },
    { number: 'TS09UD9089', type: 'BOLERO NEO' },
    { number: 'TS09UD9098', type: 'BOLERO NEO' },
    { number: 'TS09UD9353', type: 'BOLERO NEO' },
    { number: 'TS09UD9354', type: 'BOLERO NEO' },
    { number: 'TS09UD9355', type: 'BOLERO NEO' },
    { number: 'TS09UD9356', type: 'BOLERO NEO' },
    { number: 'TS09UD9357', type: 'BOLERO NEO' },
    { number: 'TS09UE0058', type: 'MARAZZO' },
    { number: 'TS09UE0059', type: 'MARAZZO' },
    { number: 'TS09UE0646', type: 'TIGOR XPRES-T SEDAN EV' },
    { number: 'TS09UE0647', type: 'TIGOR XPRES-T SEDAN EV' },
    { number: 'TS09UE1009', type: 'KIA' },
    { number: 'TG09T0662', type: 'INNOVA' },
    { number: 'TG09T0694', type: 'INNOVA' },
    { number: 'TG09T0695', type: 'INNOVA' },
    { number: 'TG09T0696', type: 'INNOVA' },
    { number: 'TG09T0697', type: 'INNOVA' },
    { number: 'TG09T0698', type: 'INNOVA' },
    { number: 'TG09T4672', type: 'MG  ZS EV' },
    { number: 'TG09T4752', type: 'KIA' },
    { number: 'TG09T4753', type: 'KIA' },
    { number: 'TG09T4754', type: 'KIA' },
    { number: 'TG09T4755', type: 'KIA' },
    { number: 'TG09T4763', type: 'KIA' },
]

export default function TravelForm() {
    const [form, setForm] = useState({
        siteName: '',
        tripMethod: '',
        tripId: '',
        startKm: '',
        endKm: '',
        escort: false,
        vehicleNumber: '',
    })

    const [vehicleList, setVehicleList] = useState(vehicleNumbersList)
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

                // Handle response with nested structure
                const documents = response?.data?.documents;

                if (Array.isArray(documents)) {
                    const fetchedList = documents.map(doc => ({
                        number: doc.vehicleNumber || 'Unknown',
                        type: doc.vehicleType || 'Unknown',
                    }));

                    const mergedList = [...vehicleNumbersList, ...fetchedList];

                    // Remove duplicates by `number`
                    const uniqueList = Array.from(
                        new Map(mergedList.map(item => [item.number, item])).values()
                    );

                    setVehicleList(uniqueList); // Set your state here
                } else {
                    console.warn('No documents found in vehicle response:', response);
                    setVehicleList(vehicleNumbersList); // fallback to hardcoded list
                }
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                setVehicleList(vehicleNumbersList); // fallback on error
            }
        };

        fetchVehicles();
    }, []);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: null }))
    }

    const validate = () => {
        let valid = true
        const newErrors = {}
        const requiredFields = ['siteName', 'tripMethod', 'tripId']
        for (const key of requiredFields) {
            if (!form[key]) {
                newErrors[key] = 'This field is required'
                valid = false
            }
        }
        // Trip ID pattern validation: only numbers, underscores, and hyphens
        if (form.tripId && !/^[\d_-]+$/.test(form.tripId)) {
            newErrors.tripId = 'Trip ID must contain only numbers, - or _';
            valid = false;
        }
        if (!form.vehicleNumber) {
            newErrors.vehicleNumber = 'Please select a vehicle number'
            valid = false
        }
        if (form.startKm && form.endKm && +form.startKm > +form.endKm) {
            newErrors.endKm = 'End KM must be greater than Start KM'
            valid = false
        }
        setErrors(newErrors)
        return valid
    }

    const handleSubmit = async () => {
        if (!validate()) return
        setLoading(true)

        const distanceTravelled = form.endKm && form.startKm
            ? parseFloat(form.endKm) - parseFloat(form.startKm)
            : 0

        const payload = {
            ...form,
            startKm: form.startKm ? parseFloat(form.startKm) : 0,
            endKm: form.endKm ? parseFloat(form.endKm) : 0,
            distanceTravelled,
            userEmail: user.email,
        }

        try {
            // eslint-disable-next-line no-unused-vars
            const { data, error } = await tripService.createTrip(payload)
            setLoading(false)
            if (error) {
                setAlert({ visible: true, title: 'Error', message: error.message || 'Last Trip Is Not Completed.' })
            } else {
                setAlert({ visible: true, title: 'Success', message: 'Trip submitted successfully!' })
                setForm({
                    siteName: '',
                    tripMethod: '',
                    tripId: '',
                    startKm: '',
                    endKm: '',
                    escort: false,
                    vehicleNumber: '',
                })
            }
        } catch (e) {
            setLoading(false)
            setAlert({ visible: true, title: 'Error', message: 'Unexpected error occurred: ' + e.message })
        }
    }

    const todayDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Site Dropdown */}
                    <Text className="text-[#064e3b] font-semibold text-base">Site Name</Text>
                    <View className="mt-2 bg-white border border-gray-300 rounded-lg">
                        {siteOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                className={`px-4 py-3 ${form.siteName === option ? 'bg-[#e6f4f0]' : ''}`}
                                onPress={() => handleChange('siteName', option)}
                            >
                                <Text className="text-[#064e3b]">{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.siteName && <Text className="text-red-500 mt-1">{errors.siteName}</Text>}

                    {/* Trip Method */}
                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Trip Method</Text>
                    <View className="flex-row mt-2">
                        {tripMethods.map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => handleChange('tripMethod', type)}
                                className={`mr-4 px-4 py-2 rounded-lg border ${form.tripMethod === type ? 'bg-[#064e3b]' : 'border-gray-400'}`}
                            >
                                <Text className={`${form.tripMethod === type ? 'text-white' : 'text-[#064e3b]'} capitalize`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.tripMethod && <Text className="text-red-500 mt-1">{errors.tripMethod}</Text>}

                    {/* Trip ID */}
                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Date of Entry</Text>
                    <TextInput
                        value={todayDate}
                        editable={false}
                        className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b] bg-gray-100"
                    />

                    <Text className="text-[#064e3b] font-semibold text-base">Trip ID</Text>
                    <TextInput
                        value={form.tripId}
                        onChangeText={(text) => handleChange('tripId', text)}
                        placeholder="Enter trip ID"
                        className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b]"
                    />
                    {errors.tripId && <Text className="text-red-500 mt-1">{errors.tripId}</Text>}

                    {/* Escort */}
                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Escort</Text>
                    <TouchableOpacity
                        onPress={() => handleChange('escort', !form.escort)}
                        className={`mt-2 px-4 py-2 border rounded-lg ${form.escort ? 'bg-[#064e3b]' : 'border-gray-400'}`}
                    >
                        <Text className={`${form.escort ? 'text-white' : 'text-[#064e3b]'}`}>{form.escort ? 'Yes' : 'No'}</Text>
                    </TouchableOpacity>

                    {/* Vehicle Selection */}
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

                    {/* KM Fields */}
                    <Text className="text-[#064e3b] font-semibold text-base mt-4">Start KM</Text>
                    <TextInput
                        value={form.startKm}
                        onChangeText={(text) => handleChange('startKm', text)}
                        placeholder="Enter start KM"
                        keyboardType="numeric"
                        className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b]"
                    />
                    <Text className="text-[#064e3b] font-semibold text-base mt-4">End KM</Text>
                    <TextInput
                        value={form.endKm}
                        onChangeText={(text) => handleChange('endKm', text)}
                        placeholder="Enter end KM"
                        keyboardType="numeric"
                        className="border border-gray-400 rounded-lg px-3 py-2 mt-2 text-[#064e3b]"
                    />
                    {errors.endKm && <Text className="text-red-500 mt-1">{errors.endKm}</Text>}

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="bg-[#064e3b] rounded-xl py-3 mt-6"
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {loading ? 'Submitting...' : 'Submit Trip'}
                        </Text>
                    </TouchableOpacity>
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
