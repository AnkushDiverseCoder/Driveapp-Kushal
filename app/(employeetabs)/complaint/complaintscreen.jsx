import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    SafeAreaView
} from 'react-native';
import authService from '../../../services/authService';
import userComplaintService from '../../../services/userComplaintService';

const accentColor = '#006400';
const screenWidth = Dimensions.get('window').width;

const EmployeeComplaintScreen = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComplaints = async () => {
            setLoading(true);
            const user = await authService.getCurrentUser();

            if (!user?.email) {
                setError('User not logged in or missing email');
                setLoading(false);
                return;
            }

            const res = await userComplaintService.getComplaintsByEmail(user.email);

            if (res.success) {
                setComplaints(res.data.data || []);
            } else {
                setError(res.error);
            }

            setLoading(false);
        };

        fetchComplaints();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={accentColor} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (complaints.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No complaints found.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.heading}>Your Complaints</Text>
                <View style={styles.grid}>
                    {complaints.map((item) => (
                        <View key={item.$id} style={styles.card}>
                            <Text style={styles.cardTitle}>Recorded By #{item.RPDisplayName}</Text>
                            <View style={styles.cardContent}>
                                <Text style={styles.label}>Date</Text>
                                <Text style={styles.value}>
                                    {new Date(item.date).toLocaleDateString()}
                                </Text>

                                <Text style={styles.label}>Reason</Text>
                                <Text style={styles.value}>{item.reason}</Text>

                                <Text style={styles.label}>Display Name</Text>
                                <Text style={styles.value}>{item.displayName}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f2f4f8',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: accentColor,
        marginBottom: 20,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: screenWidth > 500 ? '48%' : '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 10,
    },
    cardContent: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
    },
    value: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    recordedByHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: accentColor,
        marginTop: 12,
        marginBottom: 2,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
});

export default EmployeeComplaintScreen;
