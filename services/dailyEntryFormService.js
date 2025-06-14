// services/dailyEntryFormService.js

import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_DAILY_ENTRY_FORM_ID;

const dailyEntryFormService = {
    async listDailyEntry() {
        const response = await databaseService.listAllDocuments(dbId, colId);
        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async listDailyEntryPagination(page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const response = await databaseService.listDocuments(dbId, colId, [
                Query.limit(limit),
                Query.offset(offset),
                Query.orderDesc("$createdAt"),
            ]);

            if (response.error) return { error: response.error };
            return { data: response.documents || [] };
        } catch (err) {
            return { error: new Error("Pagination fetch failed: " + err.message) };
        }
    },

    async createDailyEntry(data) {
        try {
            if (!data.vehicleNumber || !data.meterReading) {
                return {
                    error: new Error("Vehicle number and meter reading are required."),
                };
            }

            const lastEntryResponse = await databaseService.listDocuments(dbId, colId, [
                Query.equal("vehicleNumber", data.vehicleNumber),
                Query.orderDesc("$createdAt"),
                Query.limit(1),
            ]);

            if (lastEntryResponse.error) {
                return { error: lastEntryResponse.error };
            }

            const lastEntry = lastEntryResponse.documents?.[0];

            if (lastEntry) {
                if (Number(data.meterReading) <= Number(lastEntry.meterReading)) {
                    return {
                        error: new Error(
                            "New meter reading must be greater than the last recorded value for this vehicle."
                        ),
                    };
                }
            }

            const createResponse = await databaseService.createDocument(dbId, colId, ID.unique(), data);
            if (createResponse.error) return { error: createResponse.error };
            return { data: createResponse };
        } catch (err) {
            return { error: new Error("Unexpected error occurred: " + err.message) };
        }
    },

    async fetchByDateOnly(startDateStr, endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr || start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchByUserOnly(emails) {
        const emailArray = Array.isArray(emails) ? emails : [emails];

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.equal("userEmail", emailArray),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchByUserAndDate(emails, startDateStr, endDateStr) {
        const emailArray = Array.isArray(emails) ? emails : [emails];
        const start = new Date(startDateStr);
        const end = new Date(endDateStr || start);
        end.setDate(end.getDate() + 1);

        const queries = [
            Query.equal("userEmail", emailArray),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ];

        const response = await databaseService.listAllDocuments(dbId, colId, queries);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },
};

export default dailyEntryFormService;
