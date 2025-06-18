// components/CustomAlert.js
import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, Animated, Easing } from 'react-native'

export default function CustomAlert({ visible, title, message, onClose }) {
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start()
    }, [visible,opacity])

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', opacity }}>
                <View style={{
                    margin: 40,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                    elevation: 5,
                    top: '30%',
                }}>
                    <Text style={{ fontSize: 20, fontWeight: '600', color: '#064e3b', marginBottom: 12, textAlign: 'center' }}>
                        {title}
                    </Text>
                    <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20 }}>
                        {message}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            backgroundColor: '#064e3b',
                            paddingVertical: 10,
                            paddingHorizontal: 24,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Okay</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    )
}
