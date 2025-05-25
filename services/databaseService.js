import { database } from "./appwrite";

const databaseService = {
    // List Documents
    async listDocuments(databaseId, collectionId) {
        try {
            const response = await database.listDocuments(databaseId, collectionId);
            return response.documents || [];
        } catch (error) {
            console.error('Error fetching documents:', error.message);
            return { error: error.message }
        }
    },
    async createDocument(databaseId, collectionId, data, id = null) {
        try {
            // Swap 'data' and 'id' for Appwrite SDK
            const response = await database.createDocument(databaseId, collectionId, id || undefined, data);
            return response;
        } catch (error) {
            console.error('Error creating document:', error.message);
            return { error: error.message };
        }
    }

    // Get Document
    // async getDocument(databaseId, collectionId, documentId) {
    //     try {
    //         const response = await database.getDocument(databaseId, collectionId, documentId);
    //         return response;
    //     } catch (error) {
    //         console.error('Error fetching document:', error.message);
    //         return { error: error.message }
    //     }
    // },
    // // Update Document
    // async updateDocument(collectionId, documentId, data) {
    //     try {
    //         const response = await database.updateDocument(collectionId, documentId, data);
    //         return response;
    //     } catch (error) {
    //         console.error('Error updating document:', error.message);
    //         return { error: error.message }
    //     }
    // },
    // // Delete Document
    // async deleteDocument(collectionId, documentId) {
    //     try {
    //         const response = await database.deleteDocument(collectionId, documentId);
    //         return response;
    //     } catch (error) {
    //         console.error('Error deleting document:', error.message);
    //         return { error: error.message }
    //     }
    // }
}

export default databaseService;