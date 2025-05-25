import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACCENT = '#064e3b';
const SITE_NAMES = ['Sagility', 'Deloitte', 'Youchana', 'Cogent'];
const TRIP_TYPES = ['Pickup', 'Drop'];

export default function TravelForm() {
    const [form, setForm] = useState({
        location: '',
        siteName: '',
        tripType: '',
        startKm: '',
        endKm: '',
        shiftTime: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.location.trim()) newErrors.location = 'Location is required';
        if (!form.siteName) newErrors.siteName = 'Select a site name';
        if (!form.tripType) newErrors.tripType = 'Select trip type';
        if (!form.startKm) newErrors.startKm = 'Enter start km';
        if (!form.endKm) newErrors.endKm = 'Enter end km';
        if (
            form.startKm &&
            form.endKm &&
            parseFloat(form.endKm) < parseFloat(form.startKm)
        )
            newErrors.endKm = 'End Km must be greater';
        if (!form.shiftTime.trim()) newErrors.shiftTime = 'Shift time required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const distanceTravelled =
        form.startKm && form.endKm
            ? `${parseFloat(form.endKm) - parseFloat(form.startKm)} km`
            : '0 km';

    const handleSubmit = () => {
        if (!validate()) return;
        setLoading(true);
        const payload = {
            ...form,
            startKm: parseFloat(form.startKm),
            endKm: parseFloat(form.endKm),
            distance: parseFloat(form.endKm) - parseFloat(form.startKm),
            createdAt: new Date().toISOString(),
        };

        setTimeout(() => {
            setLoading(false);
            alert('Trip submitted successfully!');
            console.log('Form data:', payload);
        }, 1200);
    };

    const baseInput =
        'bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[17px] text-gray-900';
    const label = `text-[${ACCENT}] font-semibold text-[16px] mb-2`;
    const errorText = 'text-red-500 text-sm mt-1';

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="px-6 py-4"
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Location */}
                    <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
                        <Text className={label}>Location</Text>
                        <TextInput
                            placeholder="Enter location"
                            value={form.location}
                            onChangeText={(val) => handleChange('location', val)}
                            className={baseInput}
                        />
                        {errors.location && <Text className={errorText}>{errors.location}</Text>}
                    </Animated.View>

                    {/* Site Name */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
                        <Text className={label}>Site Name</Text>
                        <View className="flex-row flex-wrap gap-3">
                            {SITE_NAMES.map((site) => (
                                <TouchableOpacity
                                    key={site}
                                    onPress={() => handleChange('siteName', site)}
                                    className={`px-5 py-3 rounded-full border ${form.siteName === site
                                            ? 'bg-[#064e3b] border-[#064e3b]'
                                            : 'border-gray-300'
                                        }`}
                                >
                                    <Text
                                        className={`text-[15px] ${form.siteName === site ? 'text-white' : 'text-gray-800'
                                            }`}
                                    >
                                        {site}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.siteName && <Text className={errorText}>{errors.siteName}</Text>}
                    </Animated.View>

                    {/* Trip Type */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mb-6">
                        <Text className={label}>Trip Type</Text>
                        <View className="flex-row gap-4 mt-2">
                            {TRIP_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => handleChange('tripType', type)}
                                    className={`px-6 py-3 rounded-full border ${form.tripType === type
                                            ? 'bg-[#064e3b] border-[#064e3b]'
                                            : 'border-gray-300'
                                        }`}
                                >
                                    <Text
                                        className={`text-[15px] ${form.tripType === type ? 'text-white' : 'text-gray-800'
                                            }`}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.tripType && <Text className={errorText}>{errors.tripType}</Text>}
                    </Animated.View>

                    {/* Start Km */}
                    <Animated.View entering={FadeInDown.delay(300).duration(300)} className="mb-6">
                        <Text className={label}>Start Km</Text>
                        <TextInput
                            placeholder="Enter start km"
                            value={form.startKm}
                            onChangeText={(val) => handleChange('startKm', val)}
                            keyboardType="numeric"
                            className={baseInput}
                        />
                        {errors.startKm && <Text className={errorText}>{errors.startKm}</Text>}
                    </Animated.View>

                    {/* End Km */}
                    <Animated.View entering={FadeInDown.delay(400).duration(300)} className="mb-6">
                        <Text className={label}>End Km</Text>
                        <TextInput
                            placeholder="Enter end km"
                            value={form.endKm}
                            onChangeText={(val) => handleChange('endKm', val)}
                            keyboardType="numeric"
                            className={baseInput}
                        />
                        {errors.endKm && <Text className={errorText}>{errors.endKm}</Text>}
                    </Animated.View>

                    {/* Distance */}
                    <Animated.View entering={FadeInDown.delay(500).duration(300)} className="mb-6">
                        <Text className={label}>Distance Travelled</Text>
                        <View className="bg-gray-100 px-5 py-4 rounded-2xl">
                            <Text className="text-[16px] text-gray-800">{distanceTravelled}</Text>
                        </View>
                    </Animated.View>

                    {/* Shift Time */}
                    <Animated.View entering={FadeInDown.delay(600).duration(300)} className="mb-6">
                        <Text className={label}>Shift Time</Text>
                        <TextInput
                            placeholder="e.g. Morning / Night / General"
                            value={form.shiftTime}
                            onChangeText={(val) => handleChange('shiftTime', val)}
                            className={baseInput}
                        />
                        {errors.shiftTime && <Text className={errorText}>{errors.shiftTime}</Text>}
                        {/* TODO: Replace with dropdown or enum list */}
                    </Animated.View>

                    {/* Submit Button */}
                    <Animated.View entering={FadeInDown.delay(700).duration(300)} className="mt-2">
                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleSubmit}
                            className="bg-[#064e3b] rounded-2xl py-4 items-center shadow-md"
                            style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-semibold text-lg">Submit</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
