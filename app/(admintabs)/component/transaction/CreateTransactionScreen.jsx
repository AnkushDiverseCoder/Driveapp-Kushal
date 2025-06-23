import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    Modal, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import transactionService from '../../../../services/transactionService';
import authService from '../../../../services/authService';


const TransactionManagerScreen = () => {
    const [users, setUsers] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [form, setForm] = useState({ type: '', heading: '', date: new Date(), amount: '', remarks: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [filterType, setFilterType] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const fetchAllUsers = async () => {
        try {
            const res = await authService.fetchAllUsers();
            const unique = Array.from(new Map(res.data.map(u => [u.email.toLowerCase(), u])).values());
            setUsers(unique);
            setFilteredEmployees(unique);
        } catch {
            Alert.alert('Error', 'Failed to fetch users');
        }
    };

    const fetchTransactions = React.useCallback(async () => {
        if (!selectedEmployee.email) return;
        setLoading(true);
        const res = await transactionService.listAllTransactions(selectedEmployee.email);
        setLoading(false);
        if (res.success) {
            setTransactions(res.data);
            setFilteredTransactions(res.data);
        } else Alert.alert('Error', res.error);
    }, [selectedEmployee.email]);

    useEffect(() => { fetchAllUsers(); }, []);
    useEffect(() => {
        const filtered = users.filter((u) => {
            const keyword = employeeSearch.toLowerCase();
            return (
                u.displayName?.toLowerCase().includes(keyword) ||
                u.username?.toLowerCase().includes(keyword) ||
                u.email?.toLowerCase().includes(keyword)
            );
        });
        setFilteredEmployees(filtered);
    }, [employeeSearch,users]);

    useEffect(() => { fetchTransactions(); }, [selectedEmployee,fetchTransactions]);

    useEffect(() => {
        let tx = [...transactions];
        if (filterType) tx = tx.filter((t) => JSON.parse(t.transaction).type === filterType);
        if (filterDate) tx = tx.filter((t) =>
            new Date(JSON.parse(t.transaction).date).toDateString() === new Date(filterDate).toDateString()
        );
        setFilteredTransactions(tx);
    }, [filterType, filterDate, transactions]);

    const handleSubmit = async () => {
        const errs = {};
        if (!form.type) errs.type = 'Select type';
        if (!form.heading.trim()) errs.heading = 'Heading required';
        if (!form.amount.trim() || isNaN(form.amount)) errs.amount = 'Valid amount required';
        if (!form.remarks.trim()) errs.remarks = 'Remarks required';
        if (!selectedEmployee.email) errs.employee = 'Select employee';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const payload = {
            userEmail: selectedEmployee.email,
            displayName: selectedEmployee.name,
            transaction: JSON.stringify({
                ...form,
                amount: parseFloat(form.amount),
                date: form.date.toISOString()
            })
        };

        setLoading(true);
        const res = editingTransaction
            ? await transactionService.updateTransaction(editingTransaction.$id, payload)
            : await transactionService.createTransaction(payload);
        setLoading(false);

        if (!res.success) Alert.alert('Error', res.error);
        else {
            Alert.alert('Success', editingTransaction ? 'Transaction updated' : 'Transaction added');
            setForm({ type: '', heading: '', date: new Date(), amount: '', remarks: '' });
            setEditingTransaction(null);
            fetchTransactions();
        }
    };

    const handleEdit = (item) => {
        const tx = JSON.parse(item.transaction);
        setEditingTransaction(item);
        setForm({
            type: tx.type,
            heading: tx.heading,
            date: new Date(tx.date),
            amount: tx.amount.toString(),
            remarks: tx.remarks
        });
    };

    const handleDelete = async (id) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                onPress: async () => {
                    const res = await transactionService.deleteTransaction(id);
                    if (res.success) fetchTransactions();
                    else Alert.alert('Error', res.error);
                }
            }
        ]);
    };

    const handleExport = async () => {
        const previewData = filteredTransactions.map((t) => {
            const tx = JSON.parse(t.transaction);
            return {
                Date: new Date(tx.date).toLocaleDateString(),
                Type: tx.type,
                Heading: tx.heading,
                Amount: tx.amount,
                Remarks: tx.remarks
            };
        });

        Alert.alert(
            'Preview',
            previewData.map(d => `${d.Date} | ${d.Type.toUpperCase()} | ₹${d.Amount} | ${d.Remarks}`).join('\n'),
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export',
                    onPress: async () => {
                        const ws = XLSX.utils.json_to_sheet(previewData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
                        const fileUri = FileSystem.documentDirectory + `${selectedEmployee.name}-transactions.xlsx`;
                        const binary = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
                        await FileSystem.writeAsStringAsync(fileUri, binary, { encoding: FileSystem.EncodingType.Base64 });
                        await Sharing.shareAsync(fileUri);
                    }
                }
            ]
        );
    };

    const calculateTotals = () => {
        let credit = 0, debit = 0;
        filteredTransactions.forEach(t => {
            const tx = JSON.parse(t.transaction);
            if (tx.type === 'credit') credit += tx.amount;
            else debit += tx.amount;
        });
        return { credit, debit, balance: credit - debit };
    };

    const { credit, debit, balance } = calculateTotals();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
            <ScrollView className="flex-1 bg-white p-4">

                <Text className="text-lg font-bold text-[#064e3b]">Transaction Manager</Text>

                <Text className="mt-4 font-semibold text-[#064e3b]">Select Employee</Text>
                <TouchableOpacity
                    onPress={() => setEmployeeModalVisible(true)}
                    className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
                >
                    <Text className="text-[#064e3b]">{selectedEmployee.name || 'Select Employee'}</Text>
                </TouchableOpacity>
                {errors.employee && <Text className="text-red-500 mt-1">{errors.employee}</Text>}

                {/* Transaction Form */}
                <Text className="mt-6 font-bold text-[#064e3b]">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </Text>

                <View className="mt-2">
                    <Text className="font-semibold text-[#064e3b]">Type</Text>
                    <View className="flex-row gap-4 mt-2">
                        {['credit', 'debit'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setForm({ ...form, type })}
                                className={`px-4 py-2 rounded-xl border ${form.type === type ? 'bg-green-700 border-green-800' : 'border-gray-300 bg-gray-100'
                                    }`}
                            >
                                <Text className="text-white font-medium">
                                    {type === 'credit' ? 'Addition' : 'Deduction'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.type && <Text className="text-red-500 mt-1">{errors.type}</Text>}

                    <Text className="mt-4 font-semibold text-[#064e3b]">Heading</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                        <TextInput
                            placeholder="Enter heading"
                            value={form.heading}
                            onChangeText={(t) => setForm({ ...form, heading: t })}
                            className={`flex-1 bg-gray-100 rounded-xl px-4 py-3 ${form.heading === 'oldAdvance' ? 'bg-yellow-100 border border-yellow-400' : ''
                                }`}
                        />
                        <TouchableOpacity
                            onPress={() => setForm({ ...form, heading: 'oldAdvance' })}
                            className="bg-gray-200 px-3 py-2 rounded-xl"
                        >
                            <Text className="text-sm text-[#064e3b]">Old Advance</Text>
                        </TouchableOpacity>
                    </View>
                    {errors.heading && <Text className="text-red-500 mt-1">{errors.heading}</Text>}

                    <Text className="mt-4 font-semibold text-[#064e3b]">Date</Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="mt-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
                    >
                        <Text className="text-[#064e3b]">{form.date.toDateString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={form.date}
                            mode="date"
                            display="default"
                            onChange={(e, selected) => {
                                setShowDatePicker(false);
                                if (selected) setForm({ ...form, date: selected });
                            }}
                        />
                    )}

                    <Text className="mt-4 font-semibold text-[#064e3b]">Amount</Text>
                    <TextInput
                        placeholder="Enter amount"
                        value={form.amount}
                        onChangeText={(t) => setForm({ ...form, amount: t })}
                        keyboardType="numeric"
                        className="bg-gray-100 rounded-xl px-4 py-3 mt-2"
                    />
                    {errors.amount && <Text className="text-red-500 mt-1">{errors.amount}</Text>}

                    <Text className="mt-4 font-semibold text-[#064e3b]">Remarks</Text>
                    <TextInput
                        placeholder="Enter remarks"
                        value={form.remarks}
                        onChangeText={(t) => setForm({ ...form, remarks: t })}
                        className="bg-gray-100 rounded-xl px-4 py-3 mt-2"
                    />
                    {errors.remarks && <Text className="text-red-500 mt-1">{errors.remarks}</Text>}

                    <TouchableOpacity
                        disabled={loading}
                        onPress={handleSubmit}
                        className="mt-6 bg-[#064e3b] py-4 rounded-xl"
                    >
                        <Text className="text-white text-center font-semibold text-base">
                            {loading ? 'Submitting...' : editingTransaction ? 'Update Transaction' : 'Submit Transaction'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filters and Summary */}
                {filteredTransactions.length > 0 && (
                    <>
                        <Text className="mt-8 font-bold text-[#064e3b]">Filter Transactions</Text>
                        <View className="flex-row justify-between gap-2 mt-2">
                            <TextInput
                                placeholder="Filter by date (YYYY-MM-DD)"
                                value={filterDate}
                                onChangeText={setFilterDate}
                                className="flex-1 bg-gray-100 px-4 py-2 rounded-xl"
                            />
                            <TouchableOpacity
                                onPress={() => setFilterType(filterType === 'credit' ? '' : 'credit')}
                                className="px-4 py-2 rounded-xl bg-blue-500"
                            >
                                <Text className="text-white">Credit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFilterType(filterType === 'debit' ? '' : 'debit')}
                                className="px-4 py-2 rounded-xl bg-red-500"
                            >
                                <Text className="text-white">Debit</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="mt-4 text-[#064e3b] font-semibold">
                            Total Credit: ₹{credit} | Debit: ₹{debit} | Balance: ₹{balance}
                        </Text>

                        <TouchableOpacity
                            onPress={handleExport}
                            className="bg-green-600 px-4 py-3 mt-3 rounded-xl"
                        >
                            <Text className="text-white text-center">Export to Excel</Text>
                        </TouchableOpacity>
                    </>
                )}

                {loading && <ActivityIndicator size="large" className="mt-4" />}
                <FlatList
                    data={filteredTransactions}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => {
                        const tx = JSON.parse(item.transaction);
                        return (
                            <View className="border border-gray-300 rounded-xl p-3 mt-3 bg-gray-50">
                                <Text className="text-[#064e3b] font-bold">{tx.heading}</Text>
                                <Text>{tx.type.toUpperCase()} - ₹{tx.amount}</Text>
                                <Text className="text-gray-600">{tx.remarks}</Text>
                                <Text className="text-xs text-gray-400">{new Date(tx.date).toDateString()}</Text>
                                <View className="flex-row justify-end mt-2 space-x-2">
                                    <TouchableOpacity onPress={() => handleEdit(item)} className="bg-blue-500 px-3 py-1 rounded">
                                        <Text className="text-white">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.$id)} className="bg-red-500 px-3 py-1 rounded">
                                        <Text className="text-white">Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Employee Modal */}
                <Modal visible={employeeModalVisible} animationType="slide" transparent>
                    <View className="flex-1 justify-end bg-black bg-opacity-50">
                        <View className="bg-white p-4 rounded-t-2xl max-h-[80%]">
                            <Text className="text-[#064e3b] font-bold text-lg mb-4">Select Employee</Text>
                            <TextInput
                                placeholder="Search by name or email"
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
                                            setSelectedEmployee({
                                                name: item.displayName || item.username || item.email,
                                                email: item.email
                                            });
                                            setEmployeeModalVisible(false);
                                        }}
                                        className="p-3 border-b border-gray-200"
                                    >
                                        <Text className="text-[#064e3b] text-base">
                                            {item.displayName || item.username || item.email} ({item.email})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default TransactionManagerScreen;
