import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_DAILY_ENTRY_FORM_ID;

const dailyEntryFormService = {
    // List all entries
    async listDailyEntry() {
        const response = await databaseService.listDocuments(dbId, colId);
        if (response.error) return { error: response.error };
        return { data: response };
    },

    // Create a new entry with meterReading check
    async createDailyEntry(data) {
        try {
            if (!data.vehicleNumber || !data.meterReading) {
                return {
                    error: new Error('Vehicle number and meter reading are required.')
                };
            }

            const query = [
                Query.equal('vehicleNumber', data.vehicleNumber),
                Query.orderDesc('$createdAt'),
                Query.limit(1)
            ];

            const lastEntryResponse = await databaseService.listDocuments(dbId, colId, query);

            if (lastEntryResponse.error) {
                return { error: lastEntryResponse.error };
            }

            const lastEntry = lastEntryResponse.documents?.[0];

            if (lastEntry) {
                if (Number(data.meterReading) <= Number(lastEntry.meterReading)) {
                    return {
                        error: new Error('New meter reading must be greater than the last recorded value for this vehicle.')
                    };
                }
            }

            const createResponse = await databaseService.createDocument(dbId, colId, ID.unique(), data);
            if (createResponse.error) return { error: createResponse.error };
            return { data: createResponse };
        } catch (err) {
            return { error: new Error('Unexpected error occurred: ' + err.message) };
        }
    },

    async fetchByDateOnly(targetDateStr) {
        const start = new Date(targetDateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listDocuments(dbId, colId, [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.documents };
    },

    async fetchByUserOnly(userEmail) {
        const response = await databaseService.listDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
        ]);
        if (response.error) return { error: response.error };
        return { data: response.documents };
    },

    async fetchByUserAndDate(userEmail, targetDateStr) {
        const start = new Date(targetDateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.documents };
    }
};

export default dailyEntryFormService;
