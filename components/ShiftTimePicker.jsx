import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ShiftTimePicker({ visible, onClose, onConfirm, initialTime }) {
    const initialDate = initialTime ? new Date(initialTime) : new Date();

    const [selectedTime, setSelectedTime] = useState(initialDate);

    useEffect(() => {
        setSelectedTime(initialDate);
    }, [initialTime]);

    const onChange = (event, date) => {
        if (Platform.OS === "android") {
            if (event.type === "set" && date) {
                setSelectedTime(date);

                const today = new Date();
                const combined = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    date.getHours(),
                    date.getMinutes(),
                    0,
                    0
                );
                onConfirm(combined.toISOString());
            }
            onClose();
        } else {
            if (date) setSelectedTime(date);
        }
    };

    const cancelIOS = () => onClose();

    const confirmIOS = () => {
        const today = new Date();
        const combined = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            0,
            0
        );
        onConfirm(combined.toISOString());
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
            >
                <View
                    style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 20,
                        width: 320,
                    }}
                >
                    <Text
                        style={{
                            color: "#064e3b",
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 20,
                        }}
                    >
                        Select Shift Time
                    </Text>

                    <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onChange}
                        style={{ width: "100%" }}
                    />

                    {Platform.OS === "ios" && (
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "flex-end",
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity onPress={cancelIOS} style={{ marginRight: 20 }}>
                                <Text style={{ color: "red", fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmIOS}>
                                <Text
                                    style={{
                                        color: "#064e3b",
                                        fontSize: 16,
                                        fontWeight: "600",
                                    }}
                                >
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
