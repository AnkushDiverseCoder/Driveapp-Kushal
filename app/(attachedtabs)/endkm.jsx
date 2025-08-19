import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Keyboard,
    Alert,
    ActivityIndicator,
    TouchableWithoutFeedback,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import tripService from "../../services/tripService";

export default function TripUpdateForm() {
    const { user } = useAuth();
    const userEmail = user?.email;

    const [trip, setTrip] = useState(null);
    const [tripId, setTripId] = useState("");
    const [startKm, setStartKm] = useState("");
    const [endKm, setEndKm] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    const tripCompleted = trip?.startKm > 0 && trip?.endKm > 0;

    useEffect(() => {
        async function fetchTrip() {
            if (!userEmail) {
                setError("User email not found");
                setLoading(false);
                return;
            }

            const res = await tripService.fetchLatestUserTrip(userEmail);
            if (res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }

            const latestTrip = res.data;
            console.log("Latest Trip:", latestTrip);
            setTrip(latestTrip);
            setTripId(latestTrip.tripId || "");
            setStartKm(latestTrip.startKm?.toString() || "");
            setEndKm(latestTrip.endKm?.toString() || "");
            setLoading(false);
        }

        fetchTrip();
    }, [userEmail]);

    const onUpdate = async () => {
        setError("");

        if (!trip) {
            setError("No trip loaded");
            return;
        }

        const start = Number(startKm);
        const end = Number(endKm);

        if (isNaN(start) || isNaN(end)) {
            setError("Start Km and End Km must be valid numbers");
            return;
        }

        if (end < start) {
            setError("End Km cannot be less than Start Km");
            return;
        }

        if (tripCompleted) {
            Alert.alert(
                "Update Not Allowed",
                "This trip is already completed and cannot be updated."
            );
            return;
        }

        const distanceTravelled = end - start;

        setUpdating(true);
        const updateData = {
            startKm: start,
            endKm: end,
            distanceTravelled,
            tripId: tripId.trim(),
        };

        const res = await tripService.updateTrip(trip.$id, updateData);
        setUpdating(false);

        if (res.error) {
            setError(res.error);
            return;
        }

        Keyboard.dismiss();
        Alert.alert("Success", "Trip updated successfully!");
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!trip) {
        return (
            <View style={styles.center}>
                <Text>No trip data available.</Text>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.container}>
                <Text style={styles.label}>Site Name</Text>
                <Text style={styles.readOnlyField}>{trip.siteName || "-"}</Text>

                {/* Editable Trip ID */}
                <Text style={styles.label}>Trip ID</Text>
                <TextInput
                    style={styles.input}
                    value={tripId}
                    onChangeText={setTripId}
                    editable={!tripCompleted}
                    placeholder="Enter trip ID"
                />

                {/* Start Km */}
                <Text style={styles.label}>Start Km</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={startKm}
                    onChangeText={setStartKm}
                    editable={false}
                    placeholder="Enter start km"
                />

                {/* End Km */}
                <Text style={styles.label}>End Km</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={endKm}
                    onChangeText={setEndKm}
                    editable={!tripCompleted}
                    placeholder="Enter end km"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                    title={updating ? "Updating..." : "Update Trip"}
                    onPress={onUpdate}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: "#fff",
    },
    label: {
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    readOnlyField: {
        fontSize: 16,
        paddingVertical: 8,
        color: "#555",
        backgroundColor: "#eee",
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    error: {
        color: "red",
        marginVertical: 10,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
