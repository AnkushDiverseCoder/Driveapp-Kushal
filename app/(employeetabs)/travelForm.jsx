import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TravelForm() {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [distance, setDistance] = useState('12.5 km');
    const [price, setPrice] = useState('$24.00');

    return (
        <SafeAreaView className="flex-1 bg-green-50 p-6">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <Animated.View entering={FadeInDown.duration(500)} className="mb-4">
                    <Text className="text-green-900 font-semibold text-base">Start Location</Text>
                    <TextInput
                        value={startLocation}
                        onChangeText={setStartLocation}
                        placeholder="Enter start location"
                        className="mt-2 bg-white rounded-xl px-4 py-3 text-green-900 text-base"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-4">
                    <Text className="text-green-900 font-semibold text-base">End Location</Text>
                    <TextInput
                        value={endLocation}
                        onChangeText={setEndLocation}
                        placeholder="Enter end location"
                        className="mt-2 bg-white rounded-xl px-4 py-3 text-green-900 text-base"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-4">
                    <Text className="text-green-900 font-semibold text-base">Distance</Text>
                    <View className="mt-2 bg-white rounded-xl px-4 py-3">
                        <Text className="text-green-900 text-base">{distance}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mb-6">
                    <Text className="text-green-900 font-semibold text-base">Calculated Price</Text>
                    <View className="mt-2 bg-white rounded-xl px-4 py-3">
                        <Text className="text-green-900 text-base">{price}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(500)}>
                    <TouchableOpacity
                        onPress={() => alert('Trip submitted!')}
                        className="bg-green-600 rounded-xl py-4 items-center shadow-md"
                        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
                    >
                        <Text className="text-white font-semibold text-lg">Submit</Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
