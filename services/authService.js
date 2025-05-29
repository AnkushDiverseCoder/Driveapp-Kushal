// authService.js

import { account, database } from './appwrite';
import { ID } from 'react-native-appwrite';

const DATABASE_ID =process.env.EXPO_PUBLIC_APPWRITE_DB_ID;        // Replace with your actual database ID
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_USERS;           // Replace with your actual users collection ID

const authService = {
    // Register user (Account + DB)
    async register(name, email, password, label = 'employee') {
        try {
            // Step 1: Create user account
            const accountResponse = await account.create(ID.unique(), email, password, name);

            // Step 2: Create user document in the DB
            const userDoc = await database.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                accountResponse.$id, // Use the same ID as account ID
                {
                    name,
                    email,
                    labels: [label], // Default label is 'employee'
                    accountId: accountResponse.$id
                }
            );

            return { success: true, data: accountResponse, userDoc };
        } catch (error) {
            return { error: error.message || 'Registration failed. Please try again.' };
        }
    },

    // Login with email and password
    async login(email, password) {
        try {
            const session = await account.createEmailPasswordSession(email, password);
            return session;
        } catch (error) {
            return { error: error.message || 'Login failed. Please check your email and password.' };
        }
    },

    // Logout the current session
    async logout() {
        try {
            await account.deleteSession('current');
            return { success: true };
        } catch (error) {
            return { error: error.message || 'Logout failed. Please try again.' };
        }
    },

    // Fetch the current user's account + database profile
    async getCurrentUser() {
        try {
            const user = await account.get();
            const userDoc = await database.getDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id);

            return userDoc;
        } catch (error) {
            return { error: error.message || 'Failed to fetch user data. Please log in again.' };
        }
    },

    // Change password
    async changePassword(newPassword, oldPassword) {
        try {
            await account.updatePassword(newPassword, oldPassword);
            return { success: true };
        } catch (error) {
            return { error: error.message || 'Failed to update password.' };
        }
    }
};

export default authService;

