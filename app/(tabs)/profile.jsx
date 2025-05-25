import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';

const adminData = {
    name: 'John Doe',
    email: 'admin@example.com',
    employeeCount: 32,
};

export default function Profile() {
    return (
        <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
                padding: 24,
                backgroundColor: '#f0fdf4',
                alignItems: 'center',
            }}
        >
            {/* Logo */}
            <Image
                source={require('../../assets/driverLogo.png')}
                style={{ width: 100, height: 100, resizeMode: 'contain', marginBottom: 24, marginTop: 16 }}
            />

            {/* Admin Info */}
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 4,
                    marginBottom: 24,
                }}
            >
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#065f46', marginBottom: 8 }}>
                    {adminData.name}
                </Text>
                <Text style={{ fontSize: 16, color: '#065f46', opacity: 0.8 }}>{adminData.email}</Text>
            </View>

            {/* Employees Count */}
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 4,
                    marginBottom: 24,
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#065f46' }}>
                    Total Employees
                </Text>
                <Text
                    style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: '#16a34a',
                        marginTop: 6,
                    }}
                >
                    {adminData.employeeCount}
                </Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
                style={{
                    width: '100%',
                    backgroundColor: '#16a34a',
                    paddingVertical: 16,
                    borderRadius: 16,
                    marginBottom: 16,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                onPress={() => alert('Navigate to Employee Details Update')}
            >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    Update Employee Details
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{
                    width: '100%',
                    backgroundColor: '#065f46',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                onPress={() => alert('Navigate to Update Login Credentials')}
            >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    Update Login Credentials
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
