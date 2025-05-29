import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system'; // If using Expo
import * as Sharing from 'expo-sharing'; // If using Expo

import DailyEntryFormService from '../../services/dailyEntryFormService';
import TripService from '../../services/tripService';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [tripData, setTripData] = useState([]);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await DailyEntryFormService.listDailyEntry();
            const response2 = await TripService.listTrips();
            setData(response.data.documents || []);
            setTripData(response2.data.documents || []);
        } catch (err) {
            console.log(err.message);
            setError('Failed to fetch data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Convert JSON to XLSX and trigger download/share
    const exportToExcel = async (jsonData, fileName) => {
        try {
            let dataToExport = jsonData;

            if (!jsonData || jsonData.length === 0) {
                console.log(`No data for ${fileName}, exporting headers only.`);
                dataToExport = [{ "No Data Available": "" }];
            } else {
                console.log(`Exporting data for ${fileName}:`, jsonData);
            }

            // Convert JSON to worksheet
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            // Create workbook and append worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            // Write to base64
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // File path
            const fileUri = FileSystem.cacheDirectory + `${fileName}.xlsx`;

            // Save base64 to file
            await FileSystem.writeAsStringAsync(fileUri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Share
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `Export ${fileName}`,
                UTI: 'com.microsoft.excel.xlsx',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to export file.');
            console.error('Export error:', error);
        }
    };



    const renderTable = () => {
        if (loading) {
            return (
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color="#065f46" />
                    <Text style={styles.stateText}>Loading trip data...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={[styles.stateText, { color: 'red' }]}>{error}</Text>
                </View>
            );
        }

        if (data.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>No trip data available.</Text>
                </View>
            );
        }

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 24 }}>
                <View style={{ minWidth: 800 }}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { flex: 2 }]}>Employee Email</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Vehicle</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Meter</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Fuel (L)</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Mileage</Text>
                        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'center' }]}>Distance</Text>
                        <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>Date</Text>
                    </View>
                    {data.map((entry) => (
                        <View key={entry.$id} style={styles.tableRow}>
                            <Text style={[styles.cellText, { flex: 2 }]}>{entry.userEmail}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.vehicleType}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.meterReading}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.fuelQuantity}</Text>
                            <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{entry.mileage}</Text>
                            <Text style={[styles.cellText, { flex: 1.5, textAlign: 'center' }]}>{entry.totalDistance}</Text>
                            <Text style={[styles.cellText, { flex: 2, textAlign: 'center' }]}>
                                {new Date(entry.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    return (
        <ScrollView
            contentContainerStyle={{
                padding: 12,
                backgroundColor: '#ecfdf5',
                minHeight: '100%',
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Download Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 }}>
                <TouchableOpacity
                    onPress={() => exportToExcel(tripData, 'tripdata')}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>tripdata download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => exportToExcel(data, 'dailyformdata')}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>dailyformdownload</Text>
                </TouchableOpacity>
            </View>

            {/* Table or States */}
            {renderTable()}
        </ScrollView>
    );
}

const styles = {
    button: {
        backgroundColor: '#065f46',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#065f46',
        paddingVertical: 12,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingHorizontal: 12,
    },
    headerText: {
        color: 'white',
        fontWeight: '600',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    cellText: {
        color: '#065f46',
    },
    stateContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    stateText: {
        marginTop: 12,
        fontSize: 16,
        color: '#065f46',
        textAlign: 'center',
    },
};
