import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tripService from '@/services/tripService';
import CustomAlert from '@/components/CustomAlert';
import { useAuth } from '@/context/AuthContext';

const siteOptions = ['Sagility', 'Deloitte', 'Youchana', 'Cogent'];
const tripMethods = ['pickup', 'drop'];

export default function TravelForm() {
    const [form, setForm] = useState({
        location: '',
        siteName: '',
        tripMethod: '',   // Keep as tripMethod
        startKm: '',
        endKm: '',
        shiftTime: '',
    });

    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        let valid = true;
        const newErrors = {};

        // Check required fields
        for (const [key, val] of Object.entries(form)) {
            if (!val) {
                newErrors[key] = 'This field is required';
                valid = false;
            }
        }

        // Check KM logic
        if (form.startKm && form.endKm && +form.startKm > +form.endKm) {
            newErrors.endKm = 'End KM must be greater than Start KM';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        const distanceTravelled = parseFloat(form.endKm) - parseFloat(form.startKm);

        const payload = {
            ...form,
            startKm: parseFloat(form.startKm),
            endKm: parseFloat(form.endKm),
            distanceTravelled,
            userEmail: user.email,
            createdAt: new Date().toISOString(),
        };

        console.log('Payload:', payload);

        try {
            const { data, error } = await tripService.createTrip(payload);
            console.log(data)
            setLoading(false);

            if (error) {
                setAlert({
                    visible: true,
                    title: 'Error',
                    message: error.message || 'Error submitting trip.',
                });
            } else {
                setAlert({
                    visible: true,
                    title: 'Success',
                    message: 'Trip submitted successfully!',
                });

                // Reset form with tripMethod too
                setForm({
                    location: '',
                    siteName: '',
                    tripMethod: '',
                    startKm: '',
                    endKm: '',
                    shiftTime: '',
                });
            }
        } catch (e) {
            console.error('Error submitting trip:', e);
            setLoading(false);
            setAlert({
                visible: true,
                title: 'Error',
                message: 'Unexpected error occurred:'+ e.message,
            });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Location */}
                    <Animated.View entering={FadeInDown.duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Location</Text>
                        <TextInput
                            value={form.location}
                            onChangeText={(text) => handleChange('location', text)}
                            placeholder="Enter location"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.location && <Text className="text-red-500 mt-1">{errors.location}</Text>}
                    </Animated.View>

                    {/* Site Name Dropdown */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Site Name</Text>
                        <View className="mt-2 bg-white border border-gray-300 rounded-xl">
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
                    </Animated.View>

                    {/* Trip Method Radio Buttons */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Trip Method</Text>
                        <View className="flex-row mt-2">
                            {tripMethods.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => handleChange('tripMethod', type)}
                                    className={`mr-4 px-4 py-2 rounded-full border ${form.tripMethod === type ? 'bg-[#064e3b]' : 'border-gray-400'
                                        }`}
                                >
                                    <Text
                                        className={`${form.tripMethod === type ? 'text-white' : 'text-[#064e3b]'
                                            } capitalize`}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.tripMethod && <Text className="text-red-500 mt-1">{errors.tripMethod}</Text>}
                    </Animated.View>

                    {/* Start KM */}
                    <Animated.View entering={FadeInDown.delay(300).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">Start KM</Text>
                        <TextInput
                            value={form.startKm}
                            onChangeText={(text) => handleChange('startKm', text)}
                            placeholder="Start KM"
                            keyboardType="numeric"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.startKm && <Text className="text-red-500 mt-1">{errors.startKm}</Text>}
                    </Animated.View>

                    {/* End KM */}
                    <Animated.View entering={FadeInDown.delay(400).duration(300)} className="mb-4">
                        <Text className="text-[#064e3b] font-semibold text-base">End KM</Text>
                        <TextInput
                            value={form.endKm}
                            onChangeText={(text) => handleChange('endKm', text)}
                            placeholder="End KM"
                            keyboardType="numeric"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.endKm && <Text className="text-red-500 mt-1">{errors.endKm}</Text>}
                    </Animated.View>

                    {/* Distance */}
                    {form.startKm && form.endKm && !isNaN(form.startKm) && !isNaN(form.endKm) && (
                        <Animated.View entering={FadeInDown.delay(500).duration(300)} className="mb-4">
                            <Text className="text-[#064e3b] font-semibold text-base">Distance Travelled</Text>
                            <View className="mt-2 bg-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-[#064e3b] text-base">
                                    {parseFloat(form.endKm) - parseFloat(form.startKm)} km
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Shift Time */}
                    <Animated.View entering={FadeInDown.delay(600).duration(300)} className="mb-6">
                        <Text className="text-[#064e3b] font-semibold text-base">Shift Time</Text>
                        <TextInput
                            value={form.shiftTime}
                            onChangeText={(text) => handleChange('shiftTime', text)}
                            placeholder="Enter shift time (e.g., 9AM - 6PM)"
                            className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#064e3b]"
                        />
                        {errors.shiftTime && <Text className="text-red-500 mt-1">{errors.shiftTime}</Text>}
                    </Animated.View>

                    {/* Submit Button */}
                    <Animated.View entering={FadeInDown.delay(700).duration(400)}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className={`bg-[#064e3b] rounded-xl py-4 items-center shadow-md ${loading ? 'opacity-50' : ''
                                }`}
                        >
                            <Text className="text-white font-semibold text-lg">
                                {loading ? 'Submitting...' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Alert */}
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </SafeAreaView>
    );
}
