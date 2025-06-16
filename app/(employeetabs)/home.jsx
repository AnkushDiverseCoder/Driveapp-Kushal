import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import authService from '../../services/authService';
import dailyEntryFormService from '../../services/dailyEntryFormService';
import tripService from '../../services/tripService';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const ACCENT_COLOR = '#064e3b';

function isSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();

    const [dailyEntryDone, setDailyEntryDone] = useState(false);
    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    useEffect(() => {
        fetchProfile(new Date());
    }, []);

    const fetchProfile = async (date) => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (!currentUser?.email) return;

            const entryList = await dailyEntryFormService.listDailyEntry();
            const tripResult = await tripService.fetchTripsByDate(
                currentUser.email,
                date.toISOString().split('T')[0]
            );

            if (!tripResult.error) {
                setTripData(tripResult.data);
            }

            const today = new Date();
            const foundTodayEntry = entryList.data.documents.find((entry) => {
                const entryDate = new Date(entry.$createdAt);
                return isSameDay(today, entryDate) && entry.userEmail === currentUser.email;
            });

            setDailyEntryDone(!!foundTodayEntry);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateConfirm = (date) => {
        setSelectedDate(date);
        fetchProfile(date);
        setDatePickerVisibility(false);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-100 px-4 pt-6 pb-12">
            
            {/* Centered Heading */}
            <View className="relative">
                <View className="bg-[#064e3b] px-4 py-2 rounded-t-xl shadow-sm">
                    <Text className="text-white text-center font-bold text-lg tracking-wide">
                        User Information
                    </Text>
                </View>
            </View>



            {/* Compact User Info Box */}
            <View className="bg-white rounded-b-xl px-4 py-4 mb-4 shadow-sm border border-gray-200 flex-row items-center">
                {/* Optional Avatar Circle */}
                <View className="w-12 h-12 rounded-full bg-[#064e3b] items-center justify-center mr-4">
                    <Text className="text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>

                {/* User Details */}
                <View className="flex-1">
                    <Text className="text-xs text-gray-500">Username</Text>
                    <Text className="text-base font-semibold text-gray-900 mb-1">{user?.name}</Text>

                    <Text className="text-xs text-gray-500">Email</Text>
                    <Text className="text-sm text-gray-800">{user?.email}</Text>
                </View>
            </View>


            {/* Status + Date Row */}
            <View className="flex-row space-x-4 mb-6 ">
                <View className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-200 mr-4">
                    <Text className="text-sm text-gray-500 mb-1">Daily Entry Status</Text>
                    <Text className={`text-base font-semibold ${dailyEntryDone ? 'text-green-700' : 'text-red-600'}`}>
                        {dailyEntryDone ? 'Completed' : 'Not Done'}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => setDatePickerVisibility(true)}
                    className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-200"
                >
                    <Text className="text-sm text-gray-500 mb-1">Selected Date</Text>
                    <Text className="text-base font-medium text-gray-800">
                        {selectedDate.toDateString().split(' ').slice(1).join(' ')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Date Modal Picker */}
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                date={selectedDate}
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisibility(false)}
            />

            {/* Trip Summary */}
            {tripData && (
                <>
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
                    <Text className="text-lg font-semibold text-gray-800 mb-4">Trip Summary</Text>
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-gray-600">Total Trips</Text>
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                            <Text className="text-green-800 font-bold">{tripData.totalTrips}</Text>
                        </View>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Completed</Text>
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                            <Text className="text-green-800 font-bold">{tripData.completedTripsCount}</Text>
                        </View>
                    </View>
                </View>
                </>
            )}
q
            {/* Trip Details Grid */}
            {tripData?.allTrips?.length > 0 && (
                <>
                    {/* Centered Heading */}
                    <View className="relative">
                        <View className="bg-[#064e3b] px-4 py-2 rounded-t-xl shadow-sm">
                            <Text className="text-white text-center font-bold text-lg tracking-wide">
                                Trip Details
                            </Text>
                        </View>
                    </View>
                    <View className="space-y-4">
                        {tripData.allTrips.map((trip, index) => (
                            <View
                                key={trip.$id}
                                className="bg-white border border-gray-200  shadow-sm px-4 py-4"
                            >
                                <Text className="font-semibold text-gray-800 mb-3">Trip #{trip.tripId}</Text>
                                <View className="flex-row flex-wrap justify-between">
                                    {[
                                        ['Vehicle', trip.vehicleNumber],
                                        ['Site', trip.siteName],
                                        ['Method', trip.tripMethod],
                                        ['Start Km', trip.startKm],
                                        ['End Km', trip.endKm],
                                        ['Distance', `${trip.distanceTravelled} km`],
                                        ['Escort', trip.escort ? 'Yes' : 'No'],
                                    ].map(([label, value], i) => (
                                        <View
                                            key={i}
                                            className="w-[48%] mb-3 bg-gray-50 px-3 py-2 rounded-md"
                                        >
                                            <Text className="text-xs text-gray-500">{label}</Text>
                                            <Text className="text-sm font-medium text-gray-800">{value}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Text className="text-xs text-gray-400 text-right mt-2">
                                    {new Date(trip.$createdAt).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Update Credentials Button */}
            <TouchableOpacity
                onPress={() => router.push('/(employeetabs)/auth/modifyPassword')}
                className="mt-10 bg-green-900 py-4 rounded-xl shadow-sm"
            >
                <Text className="text-white text-center font-bold text-base">Update Login Credentials</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
