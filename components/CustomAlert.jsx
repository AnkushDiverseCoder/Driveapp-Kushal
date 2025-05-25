// components/CustomAlert.js
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function CustomAlert({ visible, title, message, onClose }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View className="flex-1 justify-center items-center bg-black/30 px-6">
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    className="bg-white rounded-2xl w-full max-w-md p-6 items-center shadow-2xl"
                >
                    <Text className="text-[#064e3b] text-xl font-semibold mb-2">{title}</Text>
                    <Text className="text-gray-700 text-base text-center mb-6">{message}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="bg-[#064e3b] px-6 py-3 rounded-xl shadow-md"
                    >
                        <Text className="text-white font-medium text-base">Okay</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}
