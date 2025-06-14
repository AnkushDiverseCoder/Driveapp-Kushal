import { Query } from "react-native-appwrite";
import { database } from "./appwrite";

const databaseService = {
    // List documents
    async listDocuments(databaseId, collectionId, queries = []) {
        try {
            return await database.listDocuments(databaseId, collectionId, queries);
        } catch (error) {
            console.error('Error fetching documents:', error.message);
            return { error: error.message };
        }
    },
    
    // List all documents using batching (utility method)
    async listAllDocuments(databaseId, collectionId, baseQueries = []) {
        const batchSize = 100;
        let allDocuments = [];
        let offset = 0;

        while (true) {
            const paginatedQueries = [
                ...baseQueries,
                Query.offset(offset),
                Query.limit(batchSize),
            ];

            const response = await this.listDocuments(databaseId, collectionId, paginatedQueries);

            if (response.error) {
                return { error: response.error };
            }

            const docs = response.documents || [];
            allDocuments.push(...docs);

            if (docs.length < batchSize) break;
            offset += batchSize;
        }

        return { data: allDocuments };
    },


    // Get a single document
    async getDocument(databaseId, collectionId, documentId) {
        try {
            return await database.getDocument(databaseId, collectionId, documentId);
        } catch (error) {
            console.error('Error fetching document:', error.message);
            return { error: error.message };
        }
    },

    // Create a document
    async createDocument(databaseId, collectionId, documentId, data) {
        try {
            return await database.createDocument(databaseId, collectionId, documentId, data);
        } catch (error) {
            console.error('Error creating document:', error.message);
            return { error: error.message };
        }
    },

    // Update a document
    async updateDocument(databaseId, collectionId, documentId, data) {
        try {
            return await database.updateDocument(databaseId, collectionId, documentId, data);
        } catch (error) {
            console.error('Error updating document:', error.message);
            return { error: error.message };
        }
    },

    // Delete a document
    async deleteDocument(databaseId, collectionId, documentId) {
        try {
            return await database.deleteDocument(databaseId, collectionId, documentId);
        } catch (error) {
            console.error('Error deleting document:', error.message);
            return { error: error.message };
        }
    }
    
    
};

export default databaseService;
