import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { usePathname, Link, Slot } from 'expo-router';
import RoleGuard from '../../components/RoleGuard';

const tabs = [
    {
        name: 'home',
        title: 'Dashboard',
        icon: 'https://img.icons8.com/ios-filled/50/6b7280/home.png',
        iconActive: 'https://img.icons8.com/ios-filled/50/16a34a/home.png',
    },
    {
        name: 'trips',
        title: 'Trip Details',
        icon: 'https://img.icons8.com/ios-filled/50/6b7280/document.png',
        iconActive: 'https://img.icons8.com/ios-filled/50/16a34a/document.png',
    },
    {
        name: 'vehicleentry',
        title: 'Vehicle Entry',
        icon: 'https://img.icons8.com/ios-filled/50/6b7280/car--v1.png',
        iconActive: 'https://img.icons8.com/ios-filled/50/16a34a/car--v1.png',
    },
    {
        name: 'dailyentry',
        title: 'Daily Entry',
        icon: 'https://img.icons8.com/ios-filled/50/6b7280/calendar--v1.png',
        iconActive: 'https://img.icons8.com/ios-filled/50/16a34a/calendar--v1.png',
    },
    {
        name: 'signup',
        title: 'Sign Up',
        icon: 'https://img.icons8.com/ios-filled/50/6b7280/user-male-circle.png',
        iconActive: 'https://img.icons8.com/ios-filled/50/16a34a/user-male-circle.png',
    },
];


export default function TabsLayout() {

    const pathname = usePathname();
    const currentRoute = pathname?.split('/').filter(Boolean).pop() || 'home';

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <RoleGuard>
                <Header />

                <View className="flex-1 bg-gray-50">
                    <Slot />
                </View>

                <View className="flex-row h-[80px] border-t pb-5 border-gray-300 bg-white shadow-md shadow-black/5">
                    {tabs.map((tab) => {
                        const isActive = currentRoute === tab.name;
                        return (
                            <Link key={tab.name} href={`${tab.name}`} asChild>
                                <TouchableOpacity className="flex-1 items-center justify-center pt-2 pb-1.5 relative">
                                    <Image
                                        source={{ uri: isActive ? tab.iconActive : tab.icon }}
                                        className="w-6 h-6"
                                        resizeMode="contain"
                                    />
                                    <Text
                                        className={`mt-1 font-semibold text-xs ${isActive ? 'text-green-600' : 'text-gray-500'
                                            }`}
                                    >
                                        {tab.title}
                                    </Text>
                                    {isActive && (
                                        <View className="absolute bottom-0 h-0.75 w-1/2 bg-green-600 rounded-sm" />
                                    )}
                                </TouchableOpacity>
                            </Link>
                        );
                    })}
                </View>
            </RoleGuard>
        </SafeAreaView>
    );
}
