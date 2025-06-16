// services/vehicleService.js

import { ID } from 'react-native-appwrite';
import databaseService from './databaseService';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID; // replace with your actual database ID
const VEHICLE_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_VEHICLE_ENTRY;       // replace with your actual collection ID

const vehicleService = {
    // 🔹 Get all vehicles
    async listVehicles(queries = []) {
        try {
            const res = await databaseService.listAllDocuments(DATABASE_ID, VEHICLE_COLLECTION_ID, queries);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch vehicles' };
        }
    },

    // 🔹 Get a single vehicle
    async getVehicle(documentId) {
        try {
            const res = await databaseService.getDocument(DATABASE_ID, VEHICLE_COLLECTION_ID, documentId);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch vehicle' };
        }
    },

    // 🔹 Create a vehicle
    async createVehicle(data) {
        try {
            const res = await databaseService.createDocument(DATABASE_ID, VEHICLE_COLLECTION_ID, ID.unique(), data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to create vehicle' };
        }
    },

    // 🔹 Update a vehicle
    async updateVehicle(documentId, data) {
        try {
            const res = await databaseService.updateDocument(DATABASE_ID, VEHICLE_COLLECTION_ID, documentId, data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to update vehicle' };
        }
    },

    // 🔹 Delete a vehicle
    async deleteVehicle(documentId) {
        try {
            const res = await databaseService.deleteDocument(DATABASE_ID, VEHICLE_COLLECTION_ID, documentId);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to delete vehicle' };
        }
    }
};

export default vehicleService;

