import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import clientService from '../../../services/clientService'; // Make sure this is implemented

export default function ClientServiceScreen() {
    const [form, setForm] = useState({ siteName: '' });
    const [inputError, setInputError] = useState('');
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [editForm, setEditForm] = useState({ siteName: '' });

    const fetchServices = async () => {
        const res = await clientService.listClients();
        if (res.success) setServices(res.data.data);
        else Alert.alert('Error', res.error || 'Failed to fetch services');
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSubmit = async () => {
        if (!form.siteName.trim()) {
            setInputError('Site name is required');
            return;
        }
        setLoading(true);
        const res = await clientService.createClient({
            siteName: form.siteName.trim(),
        });
        console.log('Service creation response:', res);
        setLoading(false);
        if (res.success) {
            setServices((prev) => [...prev, res.data]);
            setForm({ siteName: '' });
            setInputError('');
            Alert.alert('Success', 'Client service added');
        } else {
            Alert.alert('Error', res.error || 'Failed to add service');
        }
    };

    const handleDelete = async (id) => {
        const res = await clientService.deleteClient(id);
        if (res.success) {
            setServices((prev) => prev.filter((s) => s.$id !== id));
        } else {
            Alert.alert('Error', res.error || 'Failed to delete');
        }
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setEditForm({ siteName: service.siteName });
        setEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        if (!editForm.siteName.trim()) {
            Alert.alert('Validation', 'Site name is required');
            return;
        }
        const res = await clientService.updateClient(editingService.$id, {
            siteName: editForm.siteName.trim(),
        });

        if (res.success) {
            setServices((prev) =>
                prev.map((s) => (s.$id === editingService.$id ? res.data : s))
            );
            setEditModalVisible(false);
        } else {
            Alert.alert('Error', res.error || 'Failed to update');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-gray-100">
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text className="text-xl font-bold text-[#064e3b] text-center mb-4">Client Service Entry</Text>

                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Site Name</Text>
                    <TextInput
                        value={form.siteName}
                        onChangeText={(text) => {
                            setForm({ siteName: text });
                            setInputError('');
                        }}
                        placeholder="Enter site name"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputError ? <Text className="text-red-500 text-sm mt-1">{inputError}</Text> : null}
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-[#064e3b] py-3 rounded-xl mt-2"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">Submit</Text>
                    )}
                </TouchableOpacity>

                <Text className="text-lg font-semibold text-[#064e3b] mt-8 mb-4">Client Services</Text>

                {services.map((service) => (
                    <View key={service.$id} className="bg-white p-4 rounded-lg border mb-2 border-gray-300">
                        <Text className="font-semibold text-[#064e3b]">Site: {service.siteName}</Text>
                        <View className="flex-row gap-3 mt-2">
                            <TouchableOpacity onPress={() => openEditModal(service)} className="bg-yellow-500 px-3 py-2 rounded">
                                <Text className="text-white font-medium">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(service.$id)} className="bg-red-600 px-3 py-2 rounded">
                                <Text className="text-white font-medium">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50 px-4">
                    <View className="bg-white rounded-xl w-full p-5">
                        <Text className="text-lg font-bold text-[#064e3b] mb-4">Edit Client Service</Text>
                        <TextInput
                            value={editForm.siteName}
                            onChangeText={(text) => setEditForm({ siteName: text })}
                            placeholder="Site Name"
                            className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
                        />
                        <View className="flex-row justify-end space-x-4">
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text className="text-gray-600 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleEditSubmit}>
                                <Text className="text-green-700 font-semibold">Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
