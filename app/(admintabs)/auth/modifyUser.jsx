import React, {
    useEffect,
    useState,
    useCallback,
    memo,
} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    FlatList,
} from 'react-native';
import authService from '../../../services/authService';
import { Query } from 'react-native-appwrite';

const ModifyUser = () => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        displayName: '',
        labels: '',
        currentPassword: '',
        newPassword: '',
    });

    const fetchUsers = useCallback(
        async (reset = false) => {
            const startOffset = reset ? 0 : offset;
            const queries = [
                Query.limit(20),
                Query.offset(startOffset),
                sortOrder === 'desc'
                    ? Query.orderDesc('$createdAt')
                    : Query.orderAsc('$createdAt'),
            ];

            if (searchQuery.trim()) {
                queries.push(
                    Query.or([
                        Query.startsWith('username', searchQuery),
                        Query.startsWith('email', searchQuery),
                    ])
                );
            }

            const response = await authService.fetchUsersPaginated(
                startOffset,
                20,
                queries
            );

            if (response.success) {
                const newUsers = reset
                    ? response.data
                    : [...users, ...response.data];
                setUsers(newUsers);
                setOffset(startOffset + 20);
                setHasMore(response.data.length === 20);
            } else {
                Alert.alert('Error', response.error || 'Failed to fetch users');
            }
        },
        [offset, searchQuery, sortOrder, users]
    );

    useEffect(() => {
        setOffset(0);
        fetchUsers(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, sortOrder]);

    const openModal = (user) => {
        setCurrentUser(user);
        setForm({
            username: user.username || '',
            email: user.email || '',
            displayName: user.displayName || '',
            labels: (user.labels || [])[0] || '',
            currentPassword: '',
            newPassword: '',
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setCurrentUser(null);
        setForm({
            username: '',
            email: '',
            displayName: '',
            labels: '',
            currentPassword: '',
            newPassword: '',
        });
        setModalVisible(false);
    };

    const handleUpdate = async () => {
        if (!form.username || !form.email) {
            Alert.alert('Validation Error', 'Username and Email are required');
            return;
        }

        const updates = {
            username: form.username,
            email: form.email,
            displayName: form.displayName,
            labels: form.labels,
        };

        if (form.currentPassword?.trim()) {
            updates.currentPassword = form.currentPassword.trim();
        }

        if (form.newPassword?.trim()) {
            if (form.newPassword.trim().length < 6) {
                Alert.alert('Validation Error', 'New password must be at least 6 characters');
                return;
            }
            updates.newPassword = form.newPassword.trim();
        }

        const response = await authService.updateUserById(currentUser.$id, updates);
        if (response.success) {
            Alert.alert('Success', 'User updated successfully');
            closeModal();
            setOffset(0);
            fetchUsers(true);
        } else {
            Alert.alert('Error', response.error || 'Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const response = await authService.deleteUserById(userId);
                    if (response.success) {
                        Alert.alert('Deleted', 'User deleted successfully.');
                        setOffset(0);
                        fetchUsers(true);
                    } else {
                        Alert.alert('Error', response.error || 'Delete failed');
                    }
                },
            },
        ]);
    };

    const UserCard = memo(function UserCard({ user, onModify, onDelete }) {
        return (
            <View className="bg-white border border-gray-200 shadow-sm px-4 py-4 mb-4 rounded-xl">
                <Text className="font-semibold text-gray-800 mb-3">
                    Username: {user.username}
                </Text>
                <View className="flex-row flex-wrap justify-between">
                    {[
                        ['Email', user.email],
                        ['Name', user.username],
                        ['Display Name', user.displayName],
                        ['Labels', (user.labels || []).join(', ')],
                        ['Password', user.password],  // 👈 New row
                    ].map(([label, value], i) => (
                        <View key={i} className="w-[48%] mb-3 bg-gray-50 px-3 py-2 rounded-md">
                            <Text className="text-xs text-gray-500">{label}</Text>
                            <Text className="text-sm font-medium text-gray-800">{value}</Text>
                        </View>
                    ))}
                </View>
                <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                        onPress={() => onModify(user)}
                        className="bg-blue-500 px-3 py-1 rounded"
                    >
                        <Text className="text-white">Modify</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onDelete(user.$id)}
                        className="bg-red-500 px-3 py-1 rounded"
                    >
                        <Text className="text-white">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    });

    return (
        <View className="bg-white flex-1 px-4">
            <View className="mt-4 mb-2">
                <TextInput
                    placeholder="Search by username or email"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="border border-gray-300 rounded-xl p-3 text-gray-800 mb-2"
                />
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => setSortOrder('desc')}
                        className={`px-4 py-2 rounded-full border ${sortOrder === 'desc' ? 'bg-[#064e3b]' : 'bg-gray-100'
                            }`}
                    >
                        <Text
                            className={
                                sortOrder === 'desc' ? 'text-white' : 'text-gray-700'
                            }
                        >
                            Newest
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSortOrder('asc')}
                        className={`px-4 py-2 rounded-full border ${sortOrder === 'asc' ? 'bg-[#064e3b]' : 'bg-gray-100'
                            }`}
                    >
                        <Text
                            className={
                                sortOrder === 'asc' ? 'text-white' : 'text-gray-700'
                            }
                        >
                            Oldest
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                    <UserCard
                        user={item}
                        onModify={openModal}
                        onDelete={handleDelete}
                    />
                )}
                ListHeaderComponent={
                    <View className="bg-[#064e3b] px-4 py-2 rounded-t-xl shadow-sm mb-4 mt-2">
                        <Text className="text-white text-center font-bold text-lg tracking-wide">
                            Manage Users
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore && (
                        <TouchableOpacity
                            onPress={() => fetchUsers(false)}
                            className="bg-[#064e3b] mx-4 my-4 py-3 rounded-xl"
                        >
                            <Text className="text-center text-white font-semibold">
                                Load More
                            </Text>
                        </TouchableOpacity>
                    )
                }
                contentContainerStyle={{ paddingBottom: 30 }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={7}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black bg-opacity-50">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="w-full"
                    >
                        <View className="bg-white px-6 pt-6 rounded-t-3xl max-h-[90%] pb-4">
                            <Text className="text-xl font-bold mb-4 text-[#064e3b] text-center">
                                Edit User
                            </Text>

                            <TextInput
                                value={form.username}
                                onChangeText={(text) => setForm({ ...form, username: text })}
                                placeholder="Username"
                                className="border border-gray-300 rounded-xl p-3 mb-3 text-gray-800"
                            />
                            <TextInput
                                value={form.email}
                                onChangeText={(text) => setForm({ ...form, email: text })}
                                placeholder="Email"
                                keyboardType="email-address"
                                className="border border-gray-300 rounded-xl p-3 mb-3 text-gray-800"
                            />
                            <TextInput
                                value={form.displayName}
                                onChangeText={(text) =>
                                    setForm({ ...form, displayName: text })
                                }
                                placeholder="Display Name"
                                className="border border-gray-300 rounded-xl p-3 mb-3 text-gray-800"
                            />

                            <View className="mb-4">
                                <Text className="mb-2 font-medium text-gray-600">
                                    Select Role
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {['admin', 'employee', 'supervisor'].map((label) => (
                                        <TouchableOpacity
                                            key={label}
                                            onPress={() => setForm({ ...form, labels: label })}
                                            className={`px-4 py-2 rounded-full border ${form.labels === label
                                                ? 'bg-[#064e3b] border-[#064e3b]'
                                                : 'bg-gray-100 border-gray-300'
                                                }`}
                                        >
                                            <Text
                                                className={`${form.labels === label
                                                    ? 'text-white font-medium'
                                                    : 'text-gray-700'
                                                    }`}
                                            >
                                                {label.charAt(0).toUpperCase() + label.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TextInput
                                value={form.currentPassword}
                                onChangeText={(text) =>
                                    setForm({ ...form, currentPassword: text })
                                }
                                placeholder="Current Password (for email change)"
                                secureTextEntry
                                className="border border-gray-300 rounded-xl p-3 mb-3 text-gray-800"
                            />

                            <TextInput
                                value={form.newPassword}
                                onChangeText={(text) =>
                                    setForm({ ...form, newPassword: text })
                                }
                                placeholder="New Password (optional)"
                                secureTextEntry
                                className="border border-gray-300 rounded-xl p-3 mb-4 text-gray-800"
                            />

                            <View className="flex-row justify-between gap-4">
                                <TouchableOpacity
                                    onPress={handleUpdate}
                                    className="flex-1 bg-[#064e3b] py-3 rounded-2xl shadow"
                                >
                                    <Text className="text-center text-white font-semibold">
                                        Save
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={closeModal}
                                    className="flex-1 bg-gray-300 py-3 rounded-2xl shadow"
                                >
                                    <Text className="text-center text-gray-700 font-semibold">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

export default ModifyUser;
