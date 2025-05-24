import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';

export default function Header() {
    const handleLogout = () => {
        Alert.alert('Logout', 'You clicked logout!');
        // Add your logout logic here
    };

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#f9fafb',
                borderBottomWidth: 1,
                borderColor: '#d1d5db',
            }}
        >
            <Image
                source={require('../assets/driverLogo.png')} // adjust path if needed
                style={{ width: 120, height: 40, resizeMode: 'contain' }}
            />

            <TouchableOpacity
                onPress={handleLogout}
                style={{
                    backgroundColor: '#16a34a',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                }}
            >
                <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
