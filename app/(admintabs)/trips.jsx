import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, TextInput,
    Animated, Easing, Modal, TouchableOpacity, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TripService from '../../services/tripService';
import authService from '../../services/authService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { utils, write } from 'xlsx';
import clientService from '../../services/clientService';

const COLORS = {
    accent: '#065f46',
    darkAccent: '#064e3b',
    bgLight: '#f0f4f8',
    cardBg: '#ffffff',
    textPrimary: '#374151',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    danger: '#dc2626',
};

const PAGE_SIZE = 20;

const ATTACHED_FILTER_OPTIONS = [
    { label: 'All', value: null },
    { label: 'Attached', value: true },
    { label: 'Not Attached', value: false },
];

export default function TripDetails() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [date, setDate] = useState(null);
    const [attachedFilter, setAttachedFilter] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [tripMethodModalVisible, setTripMethodModalVisible] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTripData, setEditTripData] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [siteOptions, setSiteOptions] = useState([]);
    const [siteSelectModalVisible, setSiteSelectModalVisible] = useState(false);


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


    const animatedWidth = useState(new Animated.Value(180))[0];

    const fetchTrips = useCallback(async (pageNumber = 1, reset = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await TripService.listTripsPagination(pageNumber, PAGE_SIZE, date);
            const rawTrips = res.data || [];

            // Build user email list then get display names
            const emails = [...new Set(rawTrips.map(t => t.userEmail))];
            const userMap = await authService.getUsersByEmails(emails);

            const enriched = rawTrips.map(trip => ({
                ...trip,
                username: userMap?.[trip.userEmail]?.displayName || 'Unknown',
            }));

            if (reset) setData(enriched);
            else setData(prev => [...prev, ...enriched]);

            setHasMore(rawTrips.length === PAGE_SIZE);
            setPage(pageNumber);
        } catch (err) {
            setError('Failed to fetch trips.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [date]);

    const applyFilters = useCallback(() => {
        let temp = [...data];
        const q = search.trim().toLowerCase();
        const f = filter.trim().toLowerCase();

        temp = temp.filter(d => {
            const matchesSearch = (
                d.username?.toLowerCase().includes(q) ||
                d.userEmail?.toLowerCase().includes(q) ||
                d.siteName?.toLowerCase().includes(q) ||
                d.tripMethod?.toLowerCase().includes(q) ||
                String(d.startKm).includes(q) ||
                String(d.endKm).includes(q) ||
                String(d.distanceTravelled).includes(q)
            );
            const matchesFilter = f ? d.tripMethod?.toLowerCase().includes(f) : true;
            const matchesDate = date
                ? new Date(d.$createdAt).toDateString() === new Date(date).toDateString()
                : true;
            const matchesAttached =
                attachedFilter === null ? true : !!d.attached === attachedFilter;
            return matchesSearch && matchesFilter && matchesDate && matchesAttached;
        });

        switch (sortOption) {
            case 'createdAt_desc':
                temp.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
                break;
            case 'createdAt_asc':
                temp.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
                break;
            case 'tripMethod_asc':
                temp.sort((a, b) => a.tripMethod.localeCompare(b.tripMethod));
                break;
            case 'tripMethod_desc':
                temp.sort((a, b) => b.tripMethod.localeCompare(a.tripMethod));
                break;
            case 'distance_high':
                temp.sort((a, b) => b.distanceTravelled - a.distanceTravelled);
                break;
            case 'distance_low':
                temp.sort((a, b) => a.distanceTravelled - b.distanceTravelled);
                break;
            case 'username_asc':
                temp.sort((a, b) => a.username.localeCompare(b.username));
                break;
            case 'username_desc':
                temp.sort((a, b) => b.username.localeCompare(a.username));
                break;
            default:
                break;
        }

        setFilteredData(temp);
    }, [data, search, filter, sortOption, date, attachedFilter]);

    useEffect(() => {
        fetchTrips(1, true);
    }, [fetchTrips]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const loadMore = () => {
        if (!loading && hasMore) fetchTrips(page + 1);
    };

    const resetAll = () => {
        setSearch('');
        setFilter('');
        setDate(null);
        setSortOption(null);
        setAttachedFilter(null);
        fetchTrips(1, true);
    };

    const animateWidth = (to) =>
        Animated.timing(animatedWidth, {
            toValue: to,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

    const formatDate = (iso) =>
        new Date(iso).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    const handleDelete = async (tripId) => {
        Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await TripService.deleteTrip(tripId);
                        fetchTrips(1, true);
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete trip');
                        console.error(err);
                    }
                },
            },
        ]);
    };

    const openEditModal = (trip) => {
        setEditTripData({
            tripMethod: trip.tripMethod || '',
            siteName: trip.siteName || '',
            vehicleNumber: trip.vehicleNumber || '',
            startKm: trip.startKm?.toString() || '',
            endKm: trip.endKm?.toString() || '',
            distanceTravelled: trip.distanceTravelled?.toString() || '',
            tripId: trip.tripId || '',
            attached: trip.attached ?? false,
            $id: trip.$id,
        });
        setEditModalVisible(true);
    };

    const handleEditSave = async () => {
        if (!editTripData) return;

        const startKmNum = Number(editTripData.startKm);
        const endKmNum = Number(editTripData.endKm);
        const distanceNum = Number(editTripData.distanceTravelled);

        if (
            isNaN(startKmNum) ||
            isNaN(endKmNum) ||
            isNaN(distanceNum) ||
            !editTripData.tripMethod.trim()
        ) {
            Alert.alert('Invalid Input', 'Please enter valid numbers and trip method.');
            return;
        }

        const updatedData = {
            tripMethod: editTripData.tripMethod.trim(),
            siteName: editTripData.siteName.trim(),
            vehicleNumber: editTripData.vehicleNumber.trim(),
            startKm: startKmNum,
            endKm: endKmNum,
            distanceTravelled: distanceNum,
            tripId: editTripData.tripId.trim(),
            attached: !!editTripData.attached,
            edited: true,
        };

        setEditLoading(true);
        try {
            const response = await TripService.updateTripAsEdited(editTripData.$id, updatedData);
            if (response.error) {
                Alert.alert('Error', 'Failed to update trip');
            } else {
                setEditModalVisible(false);
                fetchTrips(1, true);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to update trip');
            console.error(err);
        } finally {
            setEditLoading(false);
        }
    };

    const toggleAttachedEdit = () => {
        if (!editTripData) return;
        setEditTripData(prev => ({ ...prev, attached: !prev.attached }));
    };

    const exportToExcel = async () => {
        try {
            const ws = utils.json_to_sheet(
                filteredData.map(
                    ({
                        $id,
                        username,
                        userEmail,
                        siteName,
                        tripId,
                        vehicleNumber,
                        startKm,
                        endKm,
                        distanceTravelled,
                        tripMethod,
                        attached,
                        $createdAt,
                    }) => ({
                        ID: $id,
                        Username: username,
                        Email: userEmail,
                        Site: siteName,
                        'Trip ID': tripId,
                        'Vehicle Number': vehicleNumber,
                        'Start KM': startKm,
                        'End KM': endKm,
                        'Distance Travelled': distanceTravelled,
                        'Trip Method': tripMethod,
                        Attached: attached ? 'Yes' : 'No',
                        'Created At': new Date($createdAt).toLocaleString('en-IN'),
                    })
                )
            );

            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Trips');

            const wboutData = write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileUri = `${FileSystem.documentDirectory}trips_${Date.now()}.xlsx`;

            await FileSystem.writeAsStringAsync(fileUri, wboutData, {
                encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(fileUri, {
                mimeType:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Trips as Excel',
                UTI: 'com.microsoft.excel.xlsx',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
            console.error(error);
        }
    };

    const renderAttachedFilterButtons = () => (
        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 4, alignItems: 'center' }}>
            {ATTACHED_FILTER_OPTIONS.map(opt => (
                <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => setAttachedFilter(opt.value)}
                    style={{
                        backgroundColor: attachedFilter === opt.value ? COLORS.accent : COLORS.cardBg,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 40,
                        justifyContent: 'center',
                    }}
                    accessibilityLabel={`Filter Attached: ${opt.label}`}
                    accessibilityRole="button"
                >
                    <Text style={{
                        color: attachedFilter === opt.value ? 'white' : COLORS.textPrimary,
                        fontWeight: '600',
                        fontSize: 14,
                    }}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderCard = (entry) => (
        <View key={entry.$id} style={styles.card}>
            <View style={styles.topBar}>
                <Text style={styles.bold}>{entry.username}</Text>
                <Text style={styles.badge}>{entry.tripMethod}</Text>
            </View>
            <View style={styles.row}>
                <Text>Site</Text>
                <Text>{entry.siteName}</Text>
            </View>
            <View style={styles.row}>
                <Text>Trip ID</Text>
                <Text>{entry.tripId}</Text>
            </View>
            <View style={styles.row}>
                <Text>Vehicle</Text>
                <Text>{entry.vehicleNumber}</Text>
            </View>
            <View style={styles.row}>
                <Text>Start KM</Text>
                <Text>{entry.startKm}</Text>
            </View>
            <View style={styles.row}>
                <Text>End KM</Text>
                <Text>{entry.endKm}</Text>
            </View>
            <View style={styles.row}>
                <Text>Distance</Text>
                <Text>{entry.distanceTravelled} KM</Text>
            </View>
            <View style={styles.row}>
                <Text>Attached</Text>
                <Text>{entry.attached ? 'Yes' : 'No'}</Text>
            </View>
            <Text style={styles.footer}>{formatDate(entry.$createdAt)}</Text>
            <TouchableOpacity onPress={() => openEditModal(entry)} style={{ marginTop: 8 }}>
                <Text style={{ color: COLORS.accent, textAlign: 'center' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(entry.$id)} style={{ marginTop: 8 }}>
                <Text style={{ color: COLORS.danger, textAlign: 'center' }}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.filterContainer}>
                    <Animated.View style={[styles.inputWrapper, { width: animatedWidth }]}>
                        <TextInput
                            placeholder="Search..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                            onFocus={() => animateWidth(300)}
                            onBlur={() => animateWidth(180)}
                            style={styles.input}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </Animated.View>
                    <TouchableOpacity
                        onPress={() => setTripMethodModalVisible(true)}
                        style={[styles.inputWrapper, { width: 120, justifyContent: 'center' }]}
                    >
                        <Text style={styles.input}>{filter || 'Method'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={[styles.inputWrapper, { width: 160, justifyContent: 'center' }]}
                    >
                        <Text style={styles.input}>
                            {date ? new Date(date).toLocaleDateString('en-IN') : 'Select Date'}
                        </Text>
                    </TouchableOpacity>

                    {/* Attached Filter Buttons */}
                    {renderAttachedFilterButtons()}

                    <TouchableOpacity style={[styles.button, { width: 70 }]} onPress={() => setSortModalVisible(true)}>
                        <Text style={styles.buttonText}>Sort</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { width: 70 }]} onPress={exportToExcel}>
                        <Text style={styles.buttonText}>Export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resetButton, { width: 70 }]} onPress={resetAll}>
                        <Text style={{ color: 'red', textAlign: 'center' }}>Reset</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date ? new Date(date) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}

                {loading && page === 1 && <ActivityIndicator size="large" color={COLORS.accent} />}
                {error && <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>}
                {!loading && !error && (filteredData.length ? filteredData.map(renderCard) : <Text style={styles.footer}>No trips found.</Text>)}
                {hasMore && !loading && (
                    <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                        <Text style={styles.loadMoreText}>Load More</Text>
                    </TouchableOpacity>
                )}
                {loading && page > 1 && <ActivityIndicator size="small" color={COLORS.accent} />}

                {/* Sort Modal */}
                <Modal visible={sortModalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Sort By</Text>
                            {[
                                { key: 'createdAt_desc', label: 'Date: Newest First' },
                                { key: 'createdAt_asc', label: 'Date: Oldest First' },
                                { key: 'tripMethod_asc', label: 'Trip Method A-Z' },
                                { key: 'tripMethod_desc', label: 'Trip Method Z-A' },
                                { key: 'distance_high', label: 'Distance High → Low' },
                                { key: 'distance_low', label: 'Distance Low → High' },
                                { key: 'username_asc', label: 'Username A-Z' },
                                { key: 'username_desc', label: 'Username Z-A' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    onPress={() => {
                                        setSortOption(opt.key);
                                        setSortModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalOption}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                                <Text style={{ color: COLORS.accent, marginTop: 12 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Trip Method Modal */}
                <Modal visible={tripMethodModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Select Trip Method</Text>
                            {['pickup', 'drop'].map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    onPress={() => {
                                        setFilter(method);
                                        setTripMethodModalVisible(false);
                                    }}
                                    style={{ paddingVertical: 8 }}
                                >
                                    <Text style={styles.modalOption}>{method.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity onPress={() => setTripMethodModalVisible(false)}>
                                <Text style={{ color: COLORS.accent, marginTop: 12 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>

            {/* Edit Trip Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Edit Trip</Text>
                        {editTripData ? (
                            <>
                                <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="Trip Method"
                                    value={editTripData.tripMethod}
                                    onChangeText={(text) => setEditTripData({ ...editTripData, tripMethod: text })}
                                />
                                {/* <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="Site Name"
                                    value={editTripData.siteName}
                                    onChangeText={(text) => setEditTripData({ ...editTripData, siteName: text })}
                                /> */}
                                <TouchableOpacity
                                    onPress={() => setSiteSelectModalVisible(true)}
                                    style={[styles.input, {
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        borderColor: COLORS.border,
                                        borderRadius: 6,
                                        padding: 10,
                                        justifyContent: 'center',
                                    }]}
                                >
                                    <Text style={{ color: COLORS.textPrimary }}>
                                        {editTripData.siteName || 'Select Site Name'}
                                    </Text>
                                </TouchableOpacity>
                                <Modal visible={siteSelectModalVisible} transparent animationType="fade">
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContainer}>
                                            <Text style={styles.modalTitle}>Select Site Name</Text>
                                            <ScrollView style={{ maxHeight: 300 }}>
                                                {siteOptions.map((site) => (
                                                    <TouchableOpacity
                                                        key={site}
                                                        onPress={() => {
                                                            setEditTripData(prev => ({ ...prev, siteName: site }));
                                                            setSiteSelectModalVisible(false);
                                                        }}
                                                        style={{ paddingVertical: 10 }}
                                                    >
                                                        <Text style={styles.modalOption}>{site}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                            <TouchableOpacity onPress={() => setSiteSelectModalVisible(false)} style={{ marginTop: 12 }}>
                                                <Text style={{ color: COLORS.accent }}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>


                                <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="Vehicle Number"
                                    value={editTripData.vehicleNumber}
                                    onChangeText={(text) => setEditTripData({ ...editTripData, vehicleNumber: text })}
                                />
                                <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="Start KM"
                                    value={editTripData.startKm}
                                    keyboardType="numeric"
                                    onChangeText={(text) => setEditTripData({ ...editTripData, startKm: text })}
                                />
                                <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="End KM"
                                    value={editTripData.endKm}
                                    keyboardType="numeric"
                                    onChangeText={(text) => setEditTripData({ ...editTripData, endKm: text })}
                                />
                                <TextInput
                                    style={[styles.input, { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 }]}
                                    placeholder="Distance Travelled"
                                    value={editTripData.distanceTravelled}
                                    keyboardType="numeric"
                                    onChangeText={(text) => setEditTripData({ ...editTripData, distanceTravelled: text })}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <TouchableOpacity
                                        onPress={toggleAttachedEdit}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderWidth: 1,
                                            borderColor: COLORS.border,
                                            borderRadius: 4,
                                            backgroundColor: editTripData.attached ? COLORS.accent : 'transparent',
                                            marginRight: 8,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{ checked: editTripData.attached }}
                                        accessibilityLabel="Toggle Attached"
                                    >
                                        {editTripData.attached && (
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 16 }}>Attached</Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TouchableOpacity
                                        onPress={() => setEditModalVisible(false)}
                                        style={[styles.button, { backgroundColor: COLORS.danger, flex: 1, marginRight: 8 }]}
                                        disabled={editLoading}
                                    >
                                        <Text style={[styles.buttonText, { color: 'white', textAlign: 'center' }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleEditSave}
                                        style={[styles.button, { flex: 1 }]}
                                        disabled={editLoading}
                                    >
                                        {editLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={[styles.buttonText, { textAlign: 'center' }]}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = {
    container: {
        padding: 12,
        backgroundColor: COLORS.bgLight,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputWrapper: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        justifyContent: 'center',
    },
    input: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    button: {
        backgroundColor: '#e0f2f1',
        height: 40,
        justifyContent: 'center',
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.accent,
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#ffe4e6',
        height: 40,
        justifyContent: 'center',
        borderRadius: 8,
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: COLORS.accent,
        color: 'white',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 12,
        overflow: 'hidden',
    },
    bold: {
        fontWeight: '700',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    footer: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    loadMoreButton: {
        backgroundColor: COLORS.darkAccent,
        paddingVertical: 10,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 40,
        alignItems: 'center',
    },
    loadMoreText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 12,
        color: COLORS.textPrimary,
    },
    modalOption: {
        fontSize: 14,
        paddingVertical: 8,
        color: COLORS.textPrimary,
    },
};

