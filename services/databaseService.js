import { Query, ID } from "react-native-appwrite";
import { database } from "./appwrite";

// Optional: Retry wrapper utility
const withRetry = async (fn, retries = 3, delay = 500) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

// Optional reusable queries
export const commonQueries = {
    activeOnly: Query.equal("isActive", true),
    createdBy: (email) => Query.equal("userEmail", email),
};

const databaseService = {
    // List documents with optional queries
    async listDocuments(databaseId, collectionId, queries = []) {
        try {
            return await database.listDocuments(databaseId, collectionId, queries);
        } catch (error) {
            console.error('Error fetching documents:', error.message);
            return { error: error.message };
        }
    },

    // List all documents using batching
    async listAllDocuments(databaseId, collectionId, baseQueries = []) {
        const batchSize = 1000;
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

    // Get a document by ID with retry
    async getDocument(databaseId, collectionId, documentId) {
        try {
            return await withRetry(() =>
                database.getDocument(databaseId, collectionId, documentId)
            );
        } catch (error) {
            console.error('Error fetching document:', error.message);
            return { error: error.message };
        }
    },

    // Fallback: Get a document by matching attribute value
    async getDocumentByAttribute(databaseId, collectionId, key, value) {
        try {
            const response = await this.listDocuments(databaseId, collectionId, [Query.equal(key, value)]);
            if (response.documents?.length > 0) {
                return response.documents[0];
            }
            return { error: 'Document not found' };
        } catch (error) {
            console.error('Error fetching document by attribute:', error.message);
            return { error: error.message };
        }
    },

    // Create a document (uses 'unique()' if documentId not provided)
    async createDocument(databaseId, collectionId, documentId = ID.unique(), data) {
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
