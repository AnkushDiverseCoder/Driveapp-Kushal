import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import authService from '../../services/authService';
import advanceEntryService from '../../services/advanceEntryService';

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export default function AdvanceEntry() {
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState({ name: '', email: '' });

    const [oldAdvance, setOldAdvance] = useState('');
    const [newAdvanceAmount, setNewAdvanceAmount] = useState('');
    const [newAdvanceDate, setNewAdvanceDate] = useState(new Date());
    const [deductionAmount, setDeductionAmount] = useState('');
    const [entries, setEntries] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        async function fetchEmployees() {
            const { data, error } = await authService.fetchAllUsers();
            if (error) {
                setAlert({ visible: true, title: 'Error', message: 'Failed to fetch employees' });
                return;
            }
            const employees = data.filter((u) => u.labels?.includes('employee'));
            setEmployeeList(employees);
            setFilteredEmployees(employees);
        }

        async function fetchEntries() {
            const { documents, error } = await advanceEntryService.listEntries();
            if (error) return;
            const filtered = documents.filter((entry) => {
                const entryDate = new Date(JSON.parse(entry.newAdvance).date);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            });
            setEntries(filtered);
        }

        fetchEmployees();
        fetchEntries();
    }, []);

    useEffect(() => {
        if (!employeeSearch) {
            setFilteredEmployees(employeeList);
        } else {
            const lower = employeeSearch.toLowerCase();
            setFilteredEmployees(
                employeeList.filter((u) =>
                    u.username?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)
                )
            );
        }
    }, [employeeSearch, employeeList]);

    const handleSubmit = async () => {
        if (!selectedEmployee.email || !oldAdvance || !newAdvanceAmount || !deductionAmount) {
            setAlert({ visible: true, title: 'Error', message: 'Please fill all fields' });
            return;
        }

        const totalAdvance = parseFloat(oldAdvance) + parseFloat(newAdvanceAmount);
        const balanceDue = totalAdvance - parseFloat(deductionAmount);

        const entry = {
            displayName: selectedEmployee.name,
            userEmail: selectedEmployee.email,
            oldAdvance: parseFloat(oldAdvance),
            newAdvance: JSON.stringify({ amount: parseFloat(newAdvanceAmount), date: newAdvanceDate.toISOString().split('T')[0] }),
            deductions: JSON.stringify({ amount: parseFloat(deductionAmount) }),
            totalAdvance,
            balanceDue,
        };

        try {
            if (editingEntry) {
                await advanceEntryService.updateEntry(editingEntry.$id, entry);
            } else {
                await advanceEntryService.createEntry(entry);
            }
            setAlert({ visible: true, title: 'Success', message: 'Entry saved successfully' });
            setEditingEntry(null);
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to save entry' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await advanceEntryService.deleteEntry(id);
            setAlert({ visible: true, title: 'Deleted', message: 'Entry deleted successfully' });
            setEntries((prev) => prev.filter((e) => e.$id !== id));
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to delete entry' });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <TouchableOpacity
                        onPress={() => setEmployeeModalVisible(true)}
                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4"
                    >
                        <Text>{selectedEmployee.name || 'Select Employee'}</Text>
                    </TouchableOpacity>

                    <TextInput
                        placeholder="Old Advance"
                        keyboardType="numeric"
                        value={oldAdvance}
                        onChangeText={setOldAdvance}
                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4"
                    />
                    <TextInput
                        placeholder="New Advance Amount"
                        keyboardType="numeric"
                        value={newAdvanceAmount}
                        onChangeText={setNewAdvanceAmount}
                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4"
                    />
                    <TextInput
                        placeholder="Deduction Amount"
                        keyboardType="numeric"
                        value={deductionAmount}
                        onChangeText={setDeductionAmount}
                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4"
                    />

                    <TouchableOpacity onPress={handleSubmit} className="bg-green-600 py-3 rounded-xl">
                        <Text className="text-white text-center font-bold">{editingEntry ? 'Update' : 'Submit'}</Text>
                    </TouchableOpacity>

                    <Text className="mt-8 mb-2 font-bold text-lg text-[#064e3b]">This Month Entries</Text>
                    {entries.map((entry) => {
                        const newAdvance = JSON.parse(entry.newAdvance);
                        const deductions = JSON.parse(entry.deductions);
                        return (
                            <View key={entry.$id} className="bg-gray-100 p-4 mb-2 rounded-xl">
                                <Text className="font-bold text-[#064e3b]">{entry.userName} ({entry.userEmail})</Text>
                                <Text>Old: {entry.oldAdvance} | New: {newAdvance.amount} | Deducted: {deductions.amount}</Text>
                                <Text>Total: {entry.totalAdvance} | Balance: {entry.balanceDue}</Text>
                                <View className="flex-row mt-2">
                                    <TouchableOpacity onPress={() => setEditingEntry(entry)} className="bg-blue-600 px-4 py-2 mr-2 rounded-xl">
                                        <Text className="text-white">Modify</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(entry.$id)} className="bg-red-600 px-4 py-2 rounded-xl">
                                        <Text className="text-white">Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={employeeModalVisible} animationType="slide" transparent onRequestClose={() => setEmployeeModalVisible(false)}>
                <View className="flex-1 justify-end bg-black bg-opacity-50">
                    <View className="bg-white p-4 rounded-t-2xl max-h-[80%]">
                        <Text className="text-[#064e3b] font-bold text-lg mb-4">Select Employee</Text>
                        <TextInput
                            placeholder="Search by username or email"
                            value={employeeSearch}
                            onChangeText={setEmployeeSearch}
                            className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
                        />
                        <FlatList
                            data={filteredEmployees}
                            keyExtractor={(item) => item.$id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedEmployee({ name: item.username, email: item.email });
                                        setEmployeeModalVisible(false);
                                    }}
                                    className="p-3 border-b border-gray-200"
                                >
                                    <Text className="text-[#064e3b] text-base">
                                        {item.username} ({item.email})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </SafeAreaView>
    );
}