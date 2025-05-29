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

            // Query for the last entry for the same vehicle number
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

            // Validate new meter reading
            if (lastEntry) {
                if (Number(data.meterReading) <= Number(lastEntry.meterReading)) {
                    return {
                        error: new Error('New meter reading must be greater than the last recorded value for this vehicle.')
                    };
                }
            }

            // Create new entry
            const createResponse = await databaseService.createDocument(dbId, colId, ID.unique(), data);

            if (createResponse.error) {
                return { error: createResponse.error };
            }

            return { data: createResponse, error: null };
        } catch (err) {
            return { error: new Error('Unexpected error occurred: ' + err.message) };
        }
    }


    // Add update/delete methods if needed
    // async updateEntry(entryId, data) { ... },
    // async deleteEntry(entryId) { ... }
};

export default dailyEntryFormService;
