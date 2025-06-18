import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import vehicleService from '../../services/vechicleService';

const labelOptions = ['employee', 'attached'];

export default function VehicleEntryScreen() {
    const [form, setForm] = useState({
        vehicleNumber: '',
        vehicleType: '',
        mileage: '',
        labels: 'employee',
    });
    const [inputErrors, setInputErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [editForm, setEditForm] = useState({
        vehicleNumber: '',
        vehicleType: '',
        mileage: '',
        labels: 'employee',
    });
    const [filterLabel, setFilterLabel] = useState('All');

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setInputErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (!form.vehicleNumber.trim()) errors.vehicleNumber = 'Vehicle number is required';
        if (!form.vehicleType.trim()) errors.vehicleType = 'Vehicle type is required';
        if (!form.mileage || isNaN(form.mileage)) errors.mileage = 'Mileage must be a number';
        if (!form.labels) errors.labels = 'Label is required';
        setInputErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchVehicles = async () => {
        const res = await vehicleService.listVehicles();
        if (res.success) setVehicles(res.data.data);
        else Alert.alert('Error', res.error || 'Failed to fetch vehicles');
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        const res = await vehicleService.createVehicle({
            vehicleNumber: form.vehicleNumber.trim(),
            vehicleType: form.vehicleType.trim(),
            mileage: parseInt(form.mileage),
            labels: form.labels,
        });
        setLoading(false);
        if (res.success) {
            Alert.alert('Success', 'Vehicle successfully added!');
            setVehicles((prev) => [...prev, res.data]);
            setForm({
                vehicleNumber: '',
                vehicleType: '',
                mileage: '',
                labels: 'employee',
            });
        } else {
            Alert.alert('Error', res.error || 'Something went wrong');
        }
    };

    const handleDelete = async (id) => {
        const res = await vehicleService.deleteVehicle(id);
        if (res.success) {
            setVehicles((prev) => prev.filter((v) => v.$id !== id));
        } else {
            Alert.alert('Error', res.error || 'Failed to delete');
        }
    };

    const openEditModal = (vehicle) => {
        setEditingVehicle(vehicle);
        setEditForm({
            vehicleNumber: vehicle.vehicleNumber,
            vehicleType: vehicle.vehicleType,
            mileage: vehicle.mileage?.toString() || '',
            labels: vehicle.labels || 'employee',
        });
        setEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        if (
            !editForm.vehicleNumber.trim() ||
            !editForm.vehicleType.trim() ||
            isNaN(editForm.mileage) ||
            !editForm.labels
        ) {
            Alert.alert('Validation', 'All fields are required and mileage must be numeric');
            return;
        }

        const res = await vehicleService.updateVehicle(editingVehicle.$id, {
            vehicleNumber: editForm.vehicleNumber.trim(),
            vehicleType: editForm.vehicleType.trim(),
            mileage: parseInt(editForm.mileage),
            labels: editForm.labels,
        });

        if (res.success) {
            setVehicles((prev) =>
                prev.map((v) => (v.$id === editingVehicle.$id ? res.data : v))
            );
            setEditModalVisible(false);
        } else {
            Alert.alert('Error', res.error || 'Failed to update');
        }
    };

    const filteredVehicles = filterLabel === 'All'
        ? vehicles
        : vehicles.filter((v) => v.labels === filterLabel);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-gray-100">
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text className="text-xl font-bold text-[#064e3b] text-center mb-4">Vehicle Entry Form</Text>

                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Vehicle Number</Text>
                    <TextInput
                        value={form.vehicleNumber}
                        onChangeText={(text) => handleChange('vehicleNumber', text)}
                        placeholder="Enter vehicle number"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputErrors.vehicleNumber && <Text className="text-red-500 text-sm mt-1">{inputErrors.vehicleNumber}</Text>}
                </View>

                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Vehicle Type</Text>
                    <TextInput
                        value={form.vehicleType}
                        onChangeText={(text) => handleChange('vehicleType', text)}
                        placeholder="e.g. INNOVA, XYLO"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputErrors.vehicleType && <Text className="text-red-500 text-sm mt-1">{inputErrors.vehicleType}</Text>}
                </View>

                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-1">Mileage</Text>
                    <TextInput
                        value={form.mileage}
                        onChangeText={(text) => handleChange('mileage', text)}
                        placeholder="Enter mileage"
                        keyboardType="numeric"
                        className="bg-white px-4 py-3 rounded-lg border border-gray-300"
                    />
                    {inputErrors.mileage && <Text className="text-red-500 text-sm mt-1">{inputErrors.mileage}</Text>}
                </View>

                <View className="mb-4">
                    <Text className="text-[#064e3b] font-semibold mb-2">Label</Text>
                    <View className="flex-row gap-4">
                        {labelOptions.map((label) => (
                            <TouchableOpacity key={label} onPress={() => handleChange('labels', label)} className="flex-row items-center">
                                <View className={`w-5 h-5 rounded-full mr-2 border ${form.labels === label ? 'bg-[#064e3b]' : 'border-gray-400'}`} />
                                <Text>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {inputErrors.labels && <Text className="text-red-500 text-sm mt-1">{inputErrors.labels}</Text>}
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-[#064e3b] py-3 rounded-xl mt-2"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">Submit Vehicle</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-8 mb-4">
                    <Text className="text-lg font-semibold text-[#064e3b] mb-2">Filter by Label</Text>
                    <View className="flex-row gap-4">
                        {['All', ...labelOptions].map((label) => (
                            <TouchableOpacity
                                key={label}
                                onPress={() => setFilterLabel(label)}
                                className={`px-4 py-2 rounded-full ${filterLabel === label ? 'bg-[#064e3b]' : 'bg-gray-300'}`}
                            >
                                <Text className={`text-sm ${filterLabel === label ? 'text-white' : 'text-black'}`}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {filteredVehicles.map((vehicle) => (
                    <View key={vehicle.$id} className="bg-white p-4 rounded-lg border mb-2 border-gray-300">
                        <Text className="font-semibold text-[#064e3b]">Number: {vehicle.vehicleNumber}</Text>
                        <Text className="text-gray-700">Type: {vehicle.vehicleType}</Text>
                        <Text className="text-gray-700">Mileage: {vehicle.mileage}</Text>
                        <Text className="text-gray-700">Label: {vehicle.labels}</Text>
                        <View className="flex-row gap-3 mt-2">
                            <TouchableOpacity onPress={() => openEditModal(vehicle)} className="bg-yellow-500 px-3 py-2 rounded">
                                <Text className="text-white font-medium">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(vehicle.$id)} className="bg-red-600 px-3 py-2 rounded">
                                <Text className="text-white font-medium">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal visible={editModalVisible} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50 px-4">
                    <View className="bg-white rounded-xl w-full p-5">
                        <Text className="text-lg font-bold text-[#064e3b] mb-4">Edit Vehicle</Text>
                        <TextInput
                            value={editForm.vehicleNumber}
                            onChangeText={(text) => setEditForm((prev) => ({ ...prev, vehicleNumber: text }))}
                            placeholder="Vehicle Number"
                            className="bg-gray-100 px-4 py-3 rounded-lg mb-3"
                        />
                        <TextInput
                            value={editForm.vehicleType}
                            onChangeText={(text) => setEditForm((prev) => ({ ...prev, vehicleType: text }))}
                            placeholder="Vehicle Type"
                            className="bg-gray-100 px-4 py-3 rounded-lg mb-3"
                        />
                        <TextInput
                            value={editForm.mileage}
                            onChangeText={(text) => setEditForm((prev) => ({ ...prev, mileage: text }))}
                            placeholder="Mileage"
                            keyboardType="numeric"
                            className="bg-gray-100 px-4 py-3 rounded-lg mb-3"
                        />
                        <View className="flex-row gap-4 mb-4">
                            {labelOptions.map((label) => (
                                <TouchableOpacity key={label} onPress={() => setEditForm((prev) => ({ ...prev, labels: label }))} className="flex-row items-center">
                                    <View className={`w-5 h-5 rounded-full mr-2 border ${editForm.labels === label ? 'bg-[#064e3b]' : 'border-gray-400'}`} />
                                    <Text>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
