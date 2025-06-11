import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import dieselService from '../../services/dailyEntryFormService';
import { useAuth } from '../../context/AuthContext';



const vehicleTypesMap = {
    'XYLO': 10,
    'INNOVA': 12,
    'WINGER': 9,
    'BOLERO NEO': 13,
    'MARAZZO': 12,
    'TIGOR XPRES-T SEDAN EV': 0, // No mileage provided, adjust if you have it
    'KIA': 12,
    'MG  ZS EV': 0, // No mileage provided
};

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
];

export default function DieselForm() {
    const [form, setForm] = useState({
        meterReading: '',
        fuelQuantity: '',
        vehicleNumber: '',
        vehicleType: '',
    });
    const { user } = useAuth();
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);



    // Modal state for vehicle number selection
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');



    const [mileage, setMileage] = useState(0);
    const [totalDistance, setTotalDistance] = useState(null);



    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };



    // When vehicle number is selected, update vehicleType automatically
    const onSelectVehicleNumber = (vehicle) => {
        setForm((prev) => ({
            ...prev,
            vehicleNumber: vehicle.number,
            vehicleType: vehicle.type,
        }));
        setErrors((prev) => ({ ...prev, vehicleNumber: '', vehicleType: '' }));
        setVehicleModalVisible(false);
    };



    useEffect(() => {
        const newMileage = vehicleTypesMap[form.vehicleType] ?? 0;
        setMileage(newMileage);



        if (form.fuelQuantity && newMileage > 0) {
            const distance = parseFloat(form.fuelQuantity) * newMileage;
            setTotalDistance(distance);
        } else {
            setTotalDistance(null);
        }
    }, [form.vehicleType, form.fuelQuantity]);



    const validate = () => {
        const newErrors = {};
        let valid = true;



        if (!form.meterReading) {
            newErrors.meterReading = 'Meter reading is required';
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



        setErrors(newErrors);
        return valid;
    };



    const handleSubmit = async () => {
        if (!validate()) return;



        setLoading(true);
        const mileage = vehicleTypesMap[form.vehicleType] || 0;
        const totalDistance = parseFloat(form.fuelQuantity) * mileage;



        const payload = {
            ...form,
            meterReading: parseFloat(form.meterReading),
            fuelQuantity: parseFloat(form.fuelQuantity),
            mileage,
            totalDistance,
            userEmail: user?.email || '',
            createdAt: new Date().toISOString(),
        };



        try {
            const { data, error } = await dieselService.createDailyEntry(payload);
            setLoading(false);



            if (error) {
                setAlert({
                    visible: true,
                    title: 'Error',
                    message: error.message || 'Failed to submit diesel entry.',
                });
            } else {
                setAlert({
                    visible: true,
                    title: 'Success',
                    message: 'Diesel entry submitted successfully!',
                });
                setForm({
                    meterReading: '',
                    fuelQuantity: '',
                    vehicleNumber: '',
                    vehicleType: '',
                });
                setVehicleModalVisible(false);
                setSearchQuery('');
            }
        } catch (e) {
            setLoading(false);
            setAlert({
                visible: true,
                title: 'Error',
                message: 'Unexpected error: ' + e.message,
            });
        }
    };



    // Filter vehicle numbers based on search query
    const filteredVehicleNumbers = useMemo(() => {
        if (!searchQuery) return vehicleNumbersList;
        const lower = searchQuery.toLowerCase();
        return vehicleNumbersList.filter(
            (v) => v.number.toLowerCase().includes(lower) || v.type.toLowerCase().includes(lower)
        );
    }, [searchQuery]);



    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Meter Reading */}
                    <Text className="text-[#064e3b] font-semibold text-base">Today Meter Reading</Text>
                    <TextInput
                        value={form.meterReading}
                        onChangeText={(text) => handleChange('meterReading', text)}
                        placeholder="Enter current reading (km)"
                        keyboardType="numeric"
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                    />
                    {errors.meterReading && (
                        <Text className="text-red-500 mt-1">{errors.meterReading}</Text>
                    )}



                    {/* Fuel Quantity */}
                    <Text className="text-[#064e3b] font-semibold text-base">Fuel Quantity (in liters)</Text>
                    <TextInput
                        value={form.fuelQuantity}
                        onChangeText={(text) => handleChange('fuelQuantity', text)}
                        placeholder="e.g., 10"
                        keyboardType="numeric"
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                    />
                    {errors.fuelQuantity && (
                        <Text className="text-red-500 mt-1">{errors.fuelQuantity}</Text>
                    )}



                    {/* Vehicle Number */}
                    <Text className="text-[#064e3b] font-semibold text-base">Vehicle Number</Text>
                    <TouchableOpacity
                        onPress={() => setVehicleModalVisible(true)}
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
                    >
                        <Text className="text-[#064e3b]">
                            {form.vehicleNumber || 'Select Vehicle Number'}
                        </Text>
                    </TouchableOpacity>
                    {errors.vehicleNumber && (
                        <Text className="text-red-500 mt-1">{errors.vehicleNumber}</Text>
                    )}



                    {/* Vehicle Type - read-only */}
                    <Text className="text-[#064e3b] font-semibold text-base">Vehicle Type</Text>
                    <View
                        className="mt-2 bg-gray-100 rounded-xl px-4 py-3"
                        style={{ opacity: 0.7 }}
                    >
                        <Text className="text-[#064e3b] text-base">
                            {form.vehicleType || '-'}
                        </Text>
                    </View>
                    {errors.vehicleType && (
                        <Text className="text-red-500 mt-1">{errors.vehicleType}</Text>
                    )}



                    {/* Mileage + Distance */}
                    {form.vehicleType && form.fuelQuantity && (
                        <View>
                            <Text className="text-[#064e3b] font-semibold text-base">Mileage</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">{mileage} km/l</Text>
                            </View>



                            <Text className="text-[#064e3b] font-semibold text-base mt-4">Estimated Distance</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">{totalDistance?.toFixed(2)} km</Text>
                            </View>
                        </View>
                    )}



                    {/* Submit */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className={`bg-[#064e3b] rounded-xl mt-4 py-4 items-center shadow-sm ${loading ? 'opacity-50' : 'opacity-100'
                                }`}
                        >
                            <Text className="text-white text-xl font-semibold">
                                {loading ? 'Submitting...' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                </ScrollView>
                {/* Vehicle Number Selection Modal */}
                <Modal
                    visible={vehicleModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setVehicleModalVisible(false)}
                >
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
                                    <TouchableOpacity
                                        onPress={() => onSelectVehicleNumber(item)}
                                        className="p-3 border-b border-gray-200"
                                    >
                                        <Text className="text-[#064e3b] text-base">
                                            {item.number} ({item.type})
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
