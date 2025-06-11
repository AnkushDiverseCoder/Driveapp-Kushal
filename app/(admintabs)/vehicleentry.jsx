import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import vehicleService from '../../services/vechicleService'; // adjust path as needed

export default function VehicleEntryScreen() {
    const [form, setForm] = useState({
        vehicleNumber: '',
        vehicleType: '',
    });

    const [inputErrors, setInputErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setInputErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (!form.vehicleNumber.trim()) errors.vehicleNumber = 'Vehicle number is required';
        if (!form.vehicleType.trim()) errors.vehicleType = 'Vehicle type is required';
        setInputErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        const res = await vehicleService.createVehicle({
            vehicleNumber: form.vehicleNumber.trim(),
            vehicleType: form.vehicleType.trim(),
        });

        setLoading(false);

        if (res.success) {
            Alert.alert('Success', 'Vehicle successfully added!');
            setForm({ vehicleNumber: '', vehicleType: '' });
        } else {
            Alert.alert('Error', res.error || 'Something went wrong');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-gray-100"
        >
            <ScrollView contentContainerStyle={{ padding: 20 }}>

                <Text className="text-xl font-bold text-[#064e3b] text-center mb-4">
                    Vehicle Entry Form
                </Text>

                {/* Vehicle Number Input */}
                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Vehicle Number</Text>
                    <TextInput
                        value={form.vehicleNumber}
                        onChangeText={(text) => handleChange('vehicleNumber', text)}
                        placeholder="Enter vehicle number"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputErrors.vehicleNumber && (
                        <Text className="text-red-500 text-sm mt-1">
                            {inputErrors.vehicleNumber}
                        </Text>
                    )}
                </View>

                {/* Vehicle Type Input */}
                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Vehicle Type</Text>
                    <TextInput
                        value={form.vehicleType}
                        onChangeText={(text) => handleChange('vehicleType', text)}
                        placeholder="e.g. INNOVA, XYLO"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputErrors.vehicleType && (
                        <Text className="text-red-500 text-sm mt-1">
                            {inputErrors.vehicleType}
                        </Text>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-[#064e3b] py-3 rounded-xl mt-2"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            Submit Vehicle
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
