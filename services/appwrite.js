import { Platform } from 'react-native';
import { Client, Databases,Account } from 'react-native-appwrite'

const config = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    db: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
    col: {
        trips: process.env.EXPO_PUBLIC_APPWRITE_COL_TRIP_ID,
        dailyEntryForm: process.env.EXPO_PUBLIC_APPWRITE_COL_DAILY_ENTRY_FORM_ID,
        users : process.env.EXPO_PUBLIC_APPWRITE_COL_USERS,
        vehicleEntry: process.env.EXPO_PUBLIC_APPWRITE_COL_VEHICLE_ENTRY,
        advanceEntry:process.env.EXPO_PUBLIC_APPWRITE_COL_ADVANCE_ENTRY,
        clientList:process.env.EXPO_PUBLIC_APPWRITE_COL_CLIENT_ENTRY,
        employeeComplaint:process.env.EXPO_PUBLIC_APPWRITE_COL_USER_COMPLAINT,
        employeeGlobalData:process.env.EXPO_PUBLIC_APPWRITE_COL_EMPLOYEE_GLOBAL_DATA
    }
};

const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

switch (Platform.OS) {
    case 'android':
        client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME);
        break;
    case 'ios':
        client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID);
        break;
}

const database = new Databases(client);
const account = new Account(client);

export { client, database, config, account };