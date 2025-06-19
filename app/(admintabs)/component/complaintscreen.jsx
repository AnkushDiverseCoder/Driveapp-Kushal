import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    FlatList,
    ActivityIndicator,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import userComplaintService from "../../../services/userComplaintService";
import authService from "../../../services/authService";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

// Utility to find user by field
const getUserByField = (users, key, value) =>
    users.find((u) => u[key] === value);

// Sync displayName and email
const updateFormWithSync = ({ users, setter, field, value }) => {
    setter((prevForm) => {
        const updated = { ...prevForm, [field]: value };
        const user = getUserByField(users, field, value);
        if (user) {
            updated.displayName = user.displayName;
            updated.userEmail = user.email;
        }
        return updated;
    });
};

export default function UserComplaintScreen() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ userEmail: "", displayName: "", date: "", reason: "" });
    const [inputErrors, setInputErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Validation
    const isValidISODate = (date) => !isNaN(Date.parse(date));
    const validate = (data) => {
        const errs = {};
        if (!data.displayName.trim()) errs.displayName = "Display name required";
        if (!isValidISODate(data.date)) errs.date = "Valid ISO date required";
        if (!data.reason.trim()) errs.reason = "Reason is required";
        return errs;
    };

    const fetchUsers = async () => {
        try {
            const res = await authService.fetchAllUsers();
            const unique = [...new Map(res.data.filter(u => u.email && u.displayName).map(u => [u.email, u])).values()];
            setUsers(unique);
        } catch (e) {
            Alert.alert("Error", e.message || "Failed to fetch users");
        }
    };

    const fetchComplaints = async () => {
        setLoading(true);
        const res = await userComplaintService.listUserComplaints(page);
        if (res.success) {
            const docs = res.data.data;
            setComplaints((prev) => [...prev, ...docs]);
            if (docs.length < 20) setHasMore(false);
        } else {
            Alert.alert("Error", res.error || "Failed to fetch complaints");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [page]);

    const handleDateConfirm = (date) => {
        setForm((prev) => ({ ...prev, date: date.toISOString() }));
        setShowDatePicker(false);
    };

    const handleSubmit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setInputErrors(errs);
            return;
        }

        const payload = {
            userEmail: form.userEmail.trim(),
            displayName: form.displayName.trim(),
            reason: form.reason.trim(),
            date: form.date,
        };

        setLoading(true);
        const res = editingId
            ? await userComplaintService.updateUserComplaint(editingId, payload)
            : await userComplaintService.createUserComplaint(payload);
        setLoading(false);

        if (res.success) {
            Alert.alert("Success", editingId ? "Complaint updated!" : "Complaint submitted!");
            setForm({ userEmail: "", displayName: "", date: "", reason: "" });
            setEditingId(null);
            setComplaints([]);
            setPage(1);
            setHasMore(true);
        } else {
            Alert.alert("Error", res.error || "Something went wrong");
        }
    };

    const handleEdit = (item) => {
        setForm({
            userEmail: item.userEmail,
            displayName: item.displayName,
            date: item.date,
            reason: item.reason,
        });
        setEditingId(item.$id);
    };

    const exportToCSV = async () => {
        if (complaints.length === 0) return Alert.alert("No data to export");

        const csvContent = [
            ["Display Name", "Email", "Date", "Reason"],
            ...complaints.map((c) => [c.displayName, c.userEmail, c.date, c.reason])
        ]
            .map((row) => row.map((cell) => `"${cell?.replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const path = FileSystem.documentDirectory + "complaints.csv";
        await FileSystem.writeAsStringAsync(path, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(path, {
            mimeType: "text/csv",
            dialogTitle: "Export Complaints CSV",
            UTI: "public.comma-separated-values-text",
        });
    };

    const exportToPDF = async () => {
        if (complaints.length === 0) return Alert.alert("No data to export");

        const htmlContent = `
        <html>
        <head>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; }
            </style>
        </head>
        <body>
            <h2>User Complaints Report</h2>
            <table>
                <tr><th>Display Name</th><th>Email</th><th>Date</th><th>Reason</th></tr>
                ${complaints.map((c) => `
                    <tr>
                        <td>${c.displayName}</td>
                        <td>${c.userEmail}</td>
                        <td>${new Date(c.date).toLocaleString()}</td>
                        <td>${c.reason}</td>
                    </tr>
                `).join("")}
            </table>
        </body>
        </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Complaints PDF" });
    };

    const handleDelete = (id) => {
        Alert.alert("Confirm", "Delete this complaint?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const res = await userComplaintService.deleteUserComplaint(id);
                    if (res.success) {
                        setComplaints((prev) => prev.filter((c) => c.$id !== id));
                    } else {
                        Alert.alert("Error", res.error || "Failed to delete");
                    }
                },
            },
        ]);
    };

    const filteredUsers = users.filter((u) =>
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.title}>User Complaint Form</Text>

                <TouchableOpacity style={styles.picker} onPress={() => setShowNameModal(true)}>
                    <Text>{form.displayName || "Select display name"}</Text>
                </TouchableOpacity>
                {inputErrors.displayName && <Text style={styles.error}>{inputErrors.displayName}</Text>}

                <TextInput
                    value={form.userEmail}
                    editable={false}
                    placeholder="Auto-filled email"
                    style={[styles.input, { backgroundColor: "#e5e7eb" }]}
                />
                {inputErrors.userEmail && <Text style={styles.error}>{inputErrors.userEmail}</Text>}

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.picker}>
                    <Text>{form.date ? new Date(form.date).toLocaleString() : "Select Date & Time"}</Text>
                </TouchableOpacity>
                {inputErrors.date && <Text style={styles.error}>{inputErrors.date}</Text>}
                <DateTimePickerModal isVisible={showDatePicker} mode="datetime" onConfirm={handleDateConfirm} onCancel={() => setShowDatePicker(false)} />

                <TextInput
                    value={form.reason}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, reason: v }))}
                    placeholder="Enter complaint reason"
                    multiline
                    style={styles.textArea}
                />
                {inputErrors.reason && <Text style={styles.error}>{inputErrors.reason}</Text>}

                <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editingId ? "Update" : "Submit"} Complaint</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={exportToCSV} style={styles.submitBtn}>
                    <Text style={styles.submitText}>Export CSV</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={exportToPDF} style={[styles.submitBtn, { backgroundColor: '#334155' }]}>
                    <Text style={styles.submitText}>Export PDF</Text>
                </TouchableOpacity>


                <Text style={{ fontSize: 16, marginVertical: 10 }}>All Complaints</Text>

                {complaints.map((item) => (
                    <View key={item.$id} style={styles.card}>
                        <Text style={{ fontWeight: "600" }}>{item.displayName}</Text>
                        <Text>{item.userEmail}</Text>
                        <Text>{new Date(item.date).toLocaleString()}</Text>
                        <Text>{item.reason}</Text>
                        <View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                                <Text>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.$id)} style={styles.deleteBtn}>
                                <Text style={{ color: "white" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {hasMore && !loading && (
                    <TouchableOpacity onPress={() => setPage((prev) => prev + 1)} style={styles.submitBtn}>
                        <Text style={styles.submitText}>Load More</Text>
                    </TouchableOpacity>
                )}

                {loading && <ActivityIndicator color="#064e3b" style={{ marginTop: 10 }} />}
            </ScrollView>

            <Modal visible={showNameModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            placeholder="Search name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchInput}
                        />
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item) => item.email}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        updateFormWithSync({ users, setter: setForm, field: "displayName", value: item.displayName });
                                        setShowNameModal(false);
                                        setSearchQuery("");
                                    }}
                                    style={styles.modalItem}
                                >
                                    <Text>{item.displayName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setShowNameModal(false)} style={styles.closeBtn}>
                            <Text style={styles.submitText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = {
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#064e3b",
        textAlign: "center",
        marginBottom: 12,
    },
    picker: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        marginBottom: 8,
    },
    textArea: {
        backgroundColor: "#fff",
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        marginBottom: 8,
        height: 80,
        textAlignVertical: "top",
    },
    submitBtn: {
        backgroundColor: "#064e3b",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 20,
    },
    submitText: {
        color: "#fff",
        fontWeight: "600",
    },
    error: {
        color: "red",
        marginBottom: 8,
    },
    card: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    editBtn: {
        padding: 8,
        backgroundColor: "#facc15",
        borderRadius: 6,
    },
    deleteBtn: {
        padding: 8,
        backgroundColor: "#ef4444",
        borderRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "85%",
        maxHeight: "80%",
    },
    modalItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    closeBtn: {
        marginTop: 12,
        backgroundColor: "#064e3b",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    searchInput: {
        backgroundColor: "#f0f0f0",
        padding: 10,
        borderRadius: 6,
        marginBottom: 10,
    },
};
