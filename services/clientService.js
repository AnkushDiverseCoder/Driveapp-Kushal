// services/clientService.js

import { ID } from 'react-native-appwrite';
import databaseService from './databaseService';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID; // replace with your actual DB ID
const CLIENT_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_CLIENT_ENTRY; // replace with your actual collection ID

const clientService = {
    // 🔹 Get all clients
    async listClients(queries = []) {
        try {
            const res = await databaseService.listAllDocuments(DATABASE_ID, CLIENT_COLLECTION_ID, queries);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch clients' };
        }
    },

    // 🔹 Get a single client by document ID
    async getClient(documentId) {
        try {
            const res = await databaseService.getDocument(DATABASE_ID, CLIENT_COLLECTION_ID, documentId);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch client' };
        }
    },

    // 🔹 Create a new client entry
    async createClient(data) {
        try {
            const res = await databaseService.createDocument(DATABASE_ID, CLIENT_COLLECTION_ID, ID.unique(), data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to create client' };
        }
    },

    // 🔹 Update an existing client
    async updateClient(documentId, data) {
        try {
            const res = await databaseService.updateDocument(DATABASE_ID, CLIENT_COLLECTION_ID, documentId, data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to update client' };
        }
    },

    // 🔹 Delete a client
    async deleteClient(documentId) {
        try {
            const res = await databaseService.deleteDocument(DATABASE_ID, CLIENT_COLLECTION_ID, documentId);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to delete client' };
        }
    }
};

export default clientService;
