import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import dailyEntryFormService from "../../services/dailyEntryFormService";
import employeeGlobalService from "../../services/employeeGlobalService";
import authService from "../../services/authService";

const accentColor = "#006400";

const DailyEntryPage = () => {
    const [entries, setEntries] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("desc");
    const [filterDate, setFilterDate] = useState(null);
    const [vehicleType, setVehicleType] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- Centralized filtering ---
    const applyFilters = (data) => {
        let filtered = data;

        if (searchQuery) {
            filtered = filtered.filter(
                (item) =>
                    item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterDate) {
            const selectedDate = new Date(filterDate).toDateString();
            filtered = filtered.filter(
                (item) => new Date(item.$createdAt).toDateString() === selectedDate
            );
        }

        if (vehicleType) {
            filtered = filtered.filter((item) => item.vehicleType === vehicleType);
        }

        return filtered;
    };

    const fetchEntries = useCallback(
        async (pageNum = 1, append = false) => {
            if ((append && loadingMore) || (!append && loadingInitial)) return;

            if (append) setLoadingMore(true);
            else setLoadingInitial(true);

            try {
                const res = await dailyEntryFormService.listDailyEntryPagination(
                    pageNum,
                    20,
                    sortOrder
                );

                if (!res.error) {
                    const newData = res.data || [];
                    const emails = [...new Set(newData.map((entry) => entry.userEmail))];
                    const userMap = await authService.getUsersByEmails(emails);

                    const enrichedData = newData.map((entry) => ({
                        ...entry,
                        username: userMap[entry.userEmail]?.displayName ?? "Unknown",
                    }));

                    setEntries((prev) => {
                        const updated = append ? [...prev, ...enrichedData] : enrichedData;
                        // filter AFTER updating
                        setFilteredData(applyFilters(updated));
                        return updated;
                    });

                    // 🔑 only stop if this page returned less than limit
                    if (newData.length < 20) {
                        setHasMore(false);
                    }

                    setPage(pageNum);
                }
            } catch (error) {
                console.error("Error fetching entries:", error);
            } finally {
                if (append) setLoadingMore(false);
                else setLoadingInitial(false);
            }
        },
        [loadingInitial, loadingMore, sortOrder] // ✅ keep minimal dependencies
    );


    useEffect(() => {
        fetchEntries(1, false);
    }, [fetchEntries]);

    // Re-apply filters whenever search/filter inputs change
    useEffect(() => {
        setFilteredData(applyFilters(entries));
    }, [searchQuery, filterDate, vehicleType, entries]);

    const handleDelete = async (id) => {
        Alert.alert("Confirm Delete", "Are you sure you want to delete this entry?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                onPress: async () => {
                    try {
                        setLoadingInitial(true);
                        const res = await dailyEntryFormService.deleteDailyEntry(id);
                        if (res.error) {
                            Alert.alert("Error", res.error);
                        } else {
                            setEntries((prevEntries) => {
                                const updated = prevEntries.filter((entry) => entry.$id !== id);
                                setFilteredData(applyFilters(updated));
                                return updated;
                            });
                            Alert.alert("Success", "Entry deleted successfully");

                            const globalDeleteRes = await employeeGlobalService.deleteEntry(id);
                            if (globalDeleteRes.error) {
                                Alert.alert(
                                    "Warning",
                                    "Entry deleted, but failed to remove from global tracking: " +
                                    globalDeleteRes.error
                                );
                            }
                        }
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete entry", error.message);
                    } finally {
                        setLoadingInitial(false);
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <View
            style={{
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                elevation: 2,
            }}
        >
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>
                {item.vehicleNumber} ({item.vehicleType})
            </Text>
            <Text>Meter Reading: {item.meterReading}</Text>
            <Text>Fuel Quantity: {item.fuelQuantity}L</Text>
            <Text>Total Distance: {item.totalDistance} km</Text>
            <Text>Mileage: {item.mileage} km/l</Text>
            <Text>User: {String(item.username || "Unknown")}</Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {new Date(item.$createdAt).toLocaleString()}
            </Text>
            <TouchableOpacity
                onPress={() => handleDelete(item.$id)}
                style={{
                    backgroundColor: "red",
                    padding: 8,
                    borderRadius: 5,
                    marginTop: 8,
                    alignSelf: "flex-end",
                }}
            >
                <Text style={{ color: "#fff" }}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const toggleSortOrder = () => {
        setEntries([]);
        setPage(1);
        setHasMore(true);
        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || filterDate;
        setShowDatePicker(Platform.OS === "ios");
        setFilterDate(currentDate);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f0f0f0", padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
                Daily Entries
            </Text>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search vehicle or user"
                    style={{
                        flex: 1,
                        backgroundColor: "#fff",
                        padding: 12,
                        borderRadius: 8,
                        marginRight: 8,
                    }}
                />
                <TouchableOpacity
                    onPress={toggleSortOrder}
                    style={{
                        backgroundColor: accentColor,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        {sortOrder === "desc" ? "Newest" : "Oldest"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={{
                        backgroundColor: "#fff",
                        padding: 10,
                        borderRadius: 8,
                        marginRight: 8,
                        flex: 1,
                    }}
                >
                    <Text>
                        {filterDate
                            ? new Date(filterDate).toLocaleDateString()
                            : "Select Date"}
                    </Text>
                </TouchableOpacity>
                <TextInput
                    placeholder="Vehicle Type"
                    value={vehicleType}
                    onChangeText={setVehicleType}
                    style={{
                        flex: 1,
                        backgroundColor: "#fff",
                        padding: 10,
                        borderRadius: 8,
                    }}
                />
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={filterDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {loadingInitial && entries.length === 0 ? (
                <ActivityIndicator
                    size="large"
                    color={accentColor}
                    style={{ marginTop: 40 }}
                />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => item.$id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    ListFooterComponent={() => {
                        if (!hasMore) {
                            return (
                                <Text
                                    style={{
                                        textAlign: "center",
                                        padding: 16,
                                        color: "#888",
                                    }}
                                >
                                    No More Entries
                                </Text>
                            );
                        }
                        return (
                            <TouchableOpacity
                                onPress={() => fetchEntries(page + 1, true)}
                                disabled={loadingMore}
                                style={{
                                    backgroundColor: loadingMore ? "#ccc" : accentColor,
                                    padding: 14,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    marginTop: 16,
                                }}
                            >
                                {loadingMore ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                                        Load More
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
};

export default DailyEntryPage;
