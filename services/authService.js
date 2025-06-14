// services/authService.js

import { account } from './appwrite';
import databaseService from './databaseService';
import { ID, Query } from 'react-native-appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_USERS;
const VALID_LABELS = ['admin', 'employee', 'supervisor'];

const authService = {
    async register(username, email, password, labels, displayName = '') {
        if (!Array.isArray(labels)) {
            return { error: 'Labels must be an array.' };
        }

        try {
            const accountResponse = await account.create(
                ID.unique(),
                email,
                password,
                displayName || username
            );

            await databaseService.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                ID.unique(),
                {
                    username,
                    email,
                    labels: labels.length ? labels : ['employee'],
                    displayName: displayName || username,
                }
            );

            return { success: true, data: accountResponse };
        } catch (error) {
            return { error: error.message || 'Registration failed.' };
        }
    },

    async login(username, password) {
        try {
            const result = await databaseService.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('username', username)]
            );

            if (!result?.documents?.length) {
                return { error: 'Username not found.' };
            }

            const userDoc = result.documents[0];
            const email = userDoc.email;
            if (!email) return { error: 'Email not found for this user.' };

            const session = await account.createEmailPasswordSession(email, password);

            return {
                success: true,
                data: session,
                labels: Array.isArray(userDoc.labels) ? userDoc.labels : [],
                username: userDoc.username,
                displayName: userDoc.displayName
            };
        } catch (error) {
            return { error: error.message || 'Login failed. Please check your credentials.' };
        }
    },

    async getCurrentUser() {
        try {
            const userAccount = await account.get();

            const userMeta = await databaseService.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('email', userAccount.email)]
            );

            const userDoc = userMeta?.documents?.[0];

            return {
                ...userAccount,
                labels: Array.isArray(userDoc?.labels) ? userDoc.labels : [],
                username: userDoc?.username || userAccount.name,
                displayName: userDoc?.displayName || userAccount.name,
            };
        } catch (error) {
            return { error: error.message || 'Failed to fetch user data.' };
        }
    },

    async logout() {
        try {
            await account.deleteSession('current');
            return { success: true };
        } catch (error) {
            return { error: error.message || 'Logout failed.' };
        }
    },

    async changePassword(newPassword, oldPassword) {
        try {
            await account.updatePassword(newPassword, oldPassword);
            return { success: true };
        } catch (error) {
            return { error: error.message || 'Failed to update password.' };
        }
    },

    async updateUserById(documentId, updates = {}) {
        try {
            const {
                username,
                displayName,
                email,
                labels,
                currentPassword,
                newPassword
            } = updates;

            const updatePromises = [];

            if (username) {
                const existing = await databaseService.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                    Query.equal('username', username),
                ]);
                if (existing.documents.length && existing.documents[0].$id !== documentId) {
                    return { success: false, error: 'Username already exists.' };
                }
            }

            if (email) {
                const existing = await databaseService.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                    Query.equal('email', email),
                ]);
                if (existing.documents.length && existing.documents[0].$id !== documentId) {
                    return { success: false, error: 'Email already exists.' };
                }
            }

            if (displayName || username) {
                const newName = displayName || username;
                updatePromises.push(account.updateName(newName));
            }

            if (email && currentPassword?.trim()) {
                updatePromises.push(account.updateEmail(email, currentPassword.trim()));
            }

            if (newPassword?.trim() && newPassword.trim().length >= 6) {
                updatePromises.push(account.updatePassword(newPassword.trim()));
            }

            if (updatePromises.length) await Promise.all(updatePromises);

            const docUpdates = {};
            if (username) docUpdates.username = username;
            if (displayName) docUpdates.displayName = displayName;
            if (email) docUpdates.email = email;
            if (labels && VALID_LABELS.includes(labels)) {
                docUpdates.labels = [labels];
            }

            let updatedDoc = null;
            if (Object.keys(docUpdates).length > 0) {
                updatedDoc = await databaseService.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    documentId,
                    docUpdates
                );
            }

            return { success: true, data: updatedDoc || null };
        } catch (error) {
            console.error('Update error:', error);
            return {
                success: false,
                error: error?.message || 'Failed to update user.'
            };
        }
    },

    async deleteUserById(documentId) {
        try {
            await databaseService.deleteDocument(DATABASE_ID, USERS_COLLECTION_ID, documentId);
            return { success: true };
        } catch (error) {
            return { error: error.message || 'Failed to delete user.' };
        }
    },

    async fetchAllUsers() {
        try {
            const result = await databaseService.listAllDocuments(DATABASE_ID, USERS_COLLECTION_ID);
            if (result?.error) {
                return { error: result.error };
            }
            return { success: true, data: result.data };
        } catch (error) {
            return { error: error.message || 'Failed to fetch users.' };
        }
    },

    async fetchUsersPaginated(offset = 0, limit = 20, queries = []) {
        try {
            const res = await databaseService.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                ...queries,
                // Ensure limits and offset are included even if not passed
                ...(queries.find(q => q?.method === 'limit') ? [] : [Query.limit(limit)]),
                ...(queries.find(q => q?.method === 'offset') ? [] : [Query.offset(offset)])
            ]);
            return { success: true, data: res.documents };
        } catch (error) {
            console.error('Error fetching users:', error.message);
            return { success: false, error: error.message };
        }
    },

    async getUserByEmail(email) {
        const response = await databaseService.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal('email', email),
        ]);
        if (response.error || response.documents.length === 0) return null;
        return response.documents[0];
    },

    async getUsersByEmails(emails = []) {
        if (!emails.length) return {};
        const response = await databaseService.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal('email', emails),
        ]);
        if (response.error) return {};
        return Object.fromEntries(response.documents.map(user => [user.email, user]));
    },
};

export default authService;
