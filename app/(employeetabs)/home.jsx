import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CustomAlert from '../../components/CustomAlert';
import dieselService from '../../services/dailyEntryFormService';
import { useAuth } from '../../context/AuthContext';

const vehicleTypes = {
    'Innova Crysta': 12,
    'Kia Carens': 12,
    'Bolero Neo': 13,
    'Marazzo': 12,
    'Winger': 9,
};

export default function DieselForm() {
    const [form, setForm] = useState({
        meterReading: '',
        fuelQuantity: '',
        vehicleType: '',
    });
    const { user } = useAuth();
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

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
        const mileage = vehicleTypes[form.vehicleType];
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
                setForm({ meterReading: '', fuelQuantity: '', vehicleType: '' });
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

    const mileage = vehicleTypes[form.vehicleType];
    const totalDistance =
        form.fuelQuantity && mileage ? parseFloat(form.fuelQuantity) * mileage : null;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Meter Reading */}
                    <Animated.View entering={FadeInDown.duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Today Meter Reading</Text>
                        <TextInput
                            value={form.meterReading}
                            onChangeText={(text) => handleChange('meterReading', text)}
                            placeholder="Enter current reading (km)"
                            keyboardType="numeric"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.meterReading && <Text className="text-red-500 mt-1">{errors.meterReading}</Text>}
                    </Animated.View>

                    {/* Fuel Quantity */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Fuel Quantity (in liters)</Text>
                        <TextInput
                            value={form.fuelQuantity}
                            onChangeText={(text) => handleChange('fuelQuantity', text)}
                            placeholder="e.g., 10"
                            keyboardType="numeric"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.fuelQuantity && <Text className="text-red-500 mt-1">{errors.fuelQuantity}</Text>}
                    </Animated.View>

                    {/* Vehicle Type */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Vehicle Type</Text>
                        <View className="mt-2 bg-white border border-gray-300 rounded-xl">
                            {Object.keys(vehicleTypes).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    className={`px-4 py-3 ${form.vehicleType === type ? 'bg-[#e6f4f0]' : ''}`}
                                    onPress={() => handleChange('vehicleType', type)}
                                >
                                    <Text className="text-[#064e3b]">{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.vehicleType && <Text className="text-red-500 mt-1">{errors.vehicleType}</Text>}
                    </Animated.View>

                    {/* Mileage + Distance */}
                    {form.vehicleType && form.fuelQuantity && (
                        <Animated.View entering={FadeInDown.delay(300).duration(300)} className="mb-6">
                            <Text className="text-[#064e3b] font-semibold text-base">Mileage</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">{mileage} km/l</Text>
                            </View>

                            <Text className="text-[#064e3b] font-semibold text-base mt-4">Estimated Distance</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">
                                    {totalDistance?.toFixed(2)} km
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Submit */}
                    <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className={`bg-[#064e3b] rounded-xl py-4 items-center shadow-md ${loading ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-white font-semibold text-lg">
                                {loading ? 'Submitting...' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}
