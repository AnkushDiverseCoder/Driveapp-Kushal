import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import authService from '../../services/authService';
import dailyEntryFormService from '../../services/dailyEntryFormService';
import tripService from '../../services/tripService';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import employeeGlobalService from '../../services/employeeGlobalService';
import { Query } from 'react-native-appwrite'
import transactionService from '../../services/transactionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const [monthlyTripCount, setMonthlyTripCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [incompleteStatus, setIncompleteStatus] = useState(null);

    const [balanceKm, setBalanceKm] = useState(null);
    const [runningBalance, setRunningBalance] = useState(null);
    const [currentMeterInput, setCurrentMeterInput] = useState('');
    const [remainingAfterInput, setRemainingAfterInput] = useState(null);
    const [latestMeterReading, setLatestMeterReading] = useState(null);

    useEffect(() => {
        fetchProfile(new Date());
    }, []);

    useEffect(() => {
        if (latestMeterReading !== null && balanceKm !== null && currentMeterInput !== '') {
            const totalAvailableKm = parseFloat(latestMeterReading) + parseFloat(balanceKm);
            const diff = totalAvailableKm - parseFloat(currentMeterInput);
            setRemainingAfterInput(isNaN(diff) ? null : diff);
        } else {
            setRemainingAfterInput(null);
        }
    }, [currentMeterInput, balanceKm, latestMeterReading]);

    const fetchProfile = async (date) => {
        try {
            setLoading(true);
            const currentUser = await authService.getCurrentUser();
            if (!currentUser?.email) return;

            const today = new Date();

            const entryList = await dailyEntryFormService.listDailyEntry();
            const foundTodayEntry = entryList?.data?.documents?.find((entry) => {
                const entryDate = new Date(entry.$createdAt);
                return isSameDay(today, entryDate) && entry.userEmail === currentUser.email;
            });
            setDailyEntryDone(!!foundTodayEntry);

            const tripResult = await tripService.fetchTripsByDate(
                currentUser.email,
                date.toISOString().split('T')[0]
            );

            if (!tripResult.error) {
                setTripData(tripResult.data);
            }

            const globalEntryRes = await employeeGlobalService.listEntries([
                Query.equal('userEmail', [currentUser.email.toLowerCase()]),
                Query.orderDesc('createdAt'),
                Query.limit(1)
            ]);

            const latestGlobalEntry = globalEntryRes?.data?.data?.[0];
            const latestRemainingKm = latestGlobalEntry?.remainingDistance;
            const latestMeter = latestGlobalEntry?.meterReading;

            setBalanceKm(latestRemainingKm ?? null);
            setLatestMeterReading(latestMeter ?? null);

            const monthlyCountRes = await tripService.fetchMonthlyTripCount(currentUser.email);
            if (!monthlyCountRes.error) {
                setMonthlyTripCount(monthlyCountRes.data);
            }

            const incompleteRes = await tripService.getEmployeeIncompleteStatus(currentUser.email);
            console.log('Incomplete Status:', incompleteRes.data);
            if (!incompleteRes.error) {
                setIncompleteStatus(incompleteRes.data);
            }

            const balanceRes = await transactionService.getUserBalanceSummary(currentUser.email);
            if (!balanceRes.error) {
                setRunningBalance(balanceRes.data.balance);
            }



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

    const handleMeterInput = () => {
        const meterValue = parseFloat(currentMeterInput);
        if (isNaN(meterValue) || meterValue < 0) {
            Alert.alert('Invalid Input', 'Please enter a valid meter reading.');
            return;
        }

        if (latestMeterReading === null || balanceKm === null) {
            Alert.alert('Data Missing', 'Could not fetch latest meter reading data.');
            return;
        }

        const totalAvailableKm = parseFloat(latestMeterReading) + parseFloat(balanceKm);
        const diff = totalAvailableKm - meterValue;

        if (diff < 0) {
            Alert.alert('Warning', 'The meter reading exceeds the available kilometers.');
        }
        setRemainingAfterInput(diff);
    };

    const clearSessionStorage = async () => {
        try {
            await AsyncStorage.removeItem('userSession');
            Alert.alert('Session Cleared', 'User  session has been cleared.');
        } catch (error) {
            console.error('Error clearing session:', error);
        }
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
            <View className="relative">
                <View className="bg-[#064e3b] px-4 py-2 rounded-t-xl shadow-sm">
                    <Text className="text-white text-center font-bold text-lg tracking-wide">
                        User Information
                    </Text>
                </View>
            </View>

            <View className="bg-white rounded-b-xl px-4 py-4 mb-4 shadow-sm border border-gray-200 flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-[#064e3b] items-center justify-center mr-4">
                    <Text className="text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-gray-500">Username</Text>
                    <Text className="text-base font-semibold text-gray-900 mb-1">{user?.name}</Text>
                    <Text className="text-xs text-gray-500">Email</Text>
                    <Text className="text-sm text-gray-800">{user?.email}</Text>
                </View>
            </View>

            {incompleteStatus && (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
                    {incompleteStatus.dailyIncomplete && (
                        <Text className="text-sm text-yellow-800">
                            ⚠️ You haven’t completed today’s required trips ({incompleteStatus.daily.count}/{incompleteStatus.daily.reqTripCount})
                        </Text>
                    )}
                    {incompleteStatus.monthlyIncomplete && (
                        <Text className="text-sm text-yellow-800 mt-1">
                            📅 This month’s trips are also incomplete ({incompleteStatus.monthly.count}/{incompleteStatus.monthly.reqTripCount})
                        </Text>
                    )}
                    {!incompleteStatus.dailyIncomplete && !incompleteStatus.monthlyIncomplete && (
                        <Text className="text-sm text-green-700">
                            ✅ You have completed both daily and monthly required trips.
                        </Text>
                    )}
                </View>
            )}


            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">Monthly Trip Summary</Text>
                <View className="flex-row flex-wrap justify-between">
                    <View className="w-[48%] bg-gray-50 px-3 py-4 rounded-md items-center justify-center mb-4">
                        <Text className="text-xs text-gray-500 mb-1">Total Trips This Month</Text>
                        <Text className="text-2xl font-bold text-[#064e3b]">{monthlyTripCount}</Text>
                    </View>
                    <View className="w-[48%] bg-gray-50 px-3 py-4 rounded-md items-center justify-center mb-4">
                        <Text className="text-xs text-gray-500 mb-1">Todays Remaining KM</Text>
                        <Text className="text-xl font-bold text-[#064e3b]">
                            {balanceKm !== null ? `${balanceKm} km` : 'N/A'}
                        </Text>
                    </View>
                    <View className="w-full bg-gray-50 px-4 py-4 rounded-xl mb-6 border border-gray-200 shadow-sm">
                        <Text className="text-xs text-gray-500 mb-1">Your Current Balance</Text>
                        <Text className="text-2xl font-bold text-[#064e3b]">
                            ₹ {runningBalance !== null ? runningBalance.toFixed(2) : 'Loading...'}
                        </Text>
                    </View>
                </View>

                <View className="mt-2">
                    <Text className="text-xs text-gray-600 mb-1">
                        Check your current meter vs available kilometers
                    </Text>
                    <View className="mb-2">
                        <Text className="text-xs text-gray-500">Latest Meter Reading:</Text>
                        <Text className="text-sm font-medium">{latestMeterReading ?? 'N/A'}</Text>
                    </View>
                    <TextInput
                        placeholder="Enter current meter reading"
                        keyboardType="numeric"
                        value={currentMeterInput}
                        onChangeText={setCurrentMeterInput}
                        className="border border-gray-300 rounded-md px-3 py-2 mb-2 text-gray-800 bg-white"
                    />
                    <TouchableOpacity
                        onPress={handleMeterInput}
                        className="bg-blue-500 py-2 rounded-md mb-2"
                    >
                        <Text className="text-white text-center">Calculate Remaining KM</Text>
                    </TouchableOpacity>
                    {remainingAfterInput !== null && (
                        <View className="mt-2">
                            <Text className="text-xs text-gray-500">Available Kilometers:</Text>
                            <Text className="text-sm font-medium">
                                {(parseFloat(latestMeterReading) + parseFloat(balanceKm)).toFixed(2)} km
                            </Text>
                            <Text className={`text-sm font-semibold mt-1 ${remainingAfterInput < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                Remaining after input: {remainingAfterInput.toFixed(2)} km
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="flex-row space-x-4 mb-6">
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

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                date={selectedDate}
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisibility(false)}
            />

            {tripData && (
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
            )}

            {tripData?.allTrips?.length > 0 && (
                <>
                    <View className="relative">
                        <View className="bg-[#064e3b] px-4 py-2 rounded-t-xl shadow-sm">
                            <Text className="text-white text-center font-bold text-lg tracking-wide">
                                Trip Details
                            </Text>
                        </View>
                    </View>
                    <View className="space-y-4">
                        {tripData.allTrips.map((trip) => (
                            <View
                                key={trip.$id}
                                className={`bg-white border ${trip.edited ? 'border-green-500' : 'border-gray-200'} shadow-sm px-4 py-4`}
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

            <TouchableOpacity
                onPress={() => router.push('/(employeetabs)/auth/modifyPassword')}
                className="mt-10 bg-green-900 py-4 rounded-xl shadow-sm"
            >
                <Text className="text-white text-center font-bold text-base">Update Login Credentials</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => router.push('/(employeetabs)/complaint/complaintscreen')}
                className="mt-6 bg-green-900 py-4 rounded-xl shadow-sm"
            >
                <Text className="text-white text-center font-bold text-base">Complaint List</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={clearSessionStorage}
                className="mt-6 bg-red-600 py-4 rounded-xl shadow-sm"
            >
                <Text className="text-white text-center font-bold text-base">Clear Session Storage</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
