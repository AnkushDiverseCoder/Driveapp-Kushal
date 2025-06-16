import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dailyEntryFormService from "../../services/dailyEntryFormService";

const accentColor = "#006400";

const DailyEntryPage = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [sortOrder, setSortOrder] = useState("desc");
    const [filterDate, setFilterDate] = useState(null);
    const [vehicleType, setVehicleType] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchEntries = async (pageNum = 1) => {
        if (loading || !hasMore) return;
        setLoading(true);
        const res = await dailyEntryFormService.listDailyEntryPagination(pageNum, 20, sortOrder);
        if (res.error) {
            console.error(res.error);
        } else {
            const newData = res.data || [];
            if (pageNum === 1) {
                setEntries(newData);
            } else {
                setEntries((prev) => [...prev, ...newData]);
            }
            if (newData.length < 20) setHasMore(false);
            setPage(pageNum);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEntries(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortOrder]);

    useEffect(() => {
        let filtered = entries.filter((item) =>
            item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filterDate) {
            const selectedDate = new Date(filterDate).toDateString();
            filtered = filtered.filter(
                (item) => new Date(item.$createdAt).toDateString() === selectedDate
            );
        }
        if (vehicleType) {
            filtered = filtered.filter((item) => item.vehicleType === vehicleType);
        }
        setFilteredData(filtered);
    }, [searchQuery, entries, filterDate, vehicleType]);

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
            <Text>User: {item.displayName}</Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {new Date(item.$createdAt).toLocaleString()}
            </Text>
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
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>Daily Entries</Text>

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
                        {filterDate ? new Date(filterDate).toLocaleDateString() : "Select Date"}
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

            {filteredData.length === 0 && loading ? (
                <ActivityIndicator size="large" color={accentColor} />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    ListFooterComponent={() => (
                        <TouchableOpacity
                            onPress={() => {
                                if (hasMore && !loading) fetchEntries(page + 1);
                            }}
                            disabled={!hasMore || loading}
                            style={{
                                backgroundColor: hasMore && !loading ? accentColor : "#ccc",
                                padding: 14,
                                borderRadius: 8,
                                alignItems: "center",
                                marginTop: 16,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                                    {hasMore ? "Load More" : "No More Entries"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

export default DailyEntryPage;
