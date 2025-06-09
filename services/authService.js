import { account } from './appwrite';
import databaseService from './databaseService';
import { ID, Query } from 'react-native-appwrite';

// Environment variables
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_USERS;

const authService = {
    async register(username, email, password, labels) {

        if (!Array.isArray(labels)) {
            return { error: 'Labels must be an array.' };
        }

        try {


            await databaseService.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                ID.unique(),
                {
                    username,
                    email,
                    labels: labels.length ? labels : ["employee"]
                }
            );

            const accountResponse = await account.create(ID.unique(), email, password, username);

            return { success: true, data: accountResponse };
        } catch (error) {
            return { error: error.message || 'Registration failed.' };
        }
    },

    async login(username, password) {
        try {
            console.log('Attempting login with username:', username);
            const result = await databaseService.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('username', username)]
            );
            console.log('Login result:', result);
            if (!result?.documents?.length) {
                return { error: 'Username not found.' };
            }

            const userDoc = result.documents[0];
            const email = userDoc.email;
            if (!email) {
                return { error: 'Email not found for this user.' };
            }
            const session = await account.createEmailPasswordSession(email, password);

            return {
                success: true,
                data: session,
                labels: Array.isArray(userDoc.labels) ? userDoc.labels : [],
                username: userDoc.username,
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
            if (!userMeta?.documents?.length) {
                return {
                    ...userAccount,
                    labels: [],
                    username: userAccount.name,
                };
            }

            const userDoc = userMeta.documents[0];
            return {
                ...userAccount,
                labels: Array.isArray(userDoc.labels) ? userDoc.labels : [],
                username: userDoc.username,
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
};

export default authService;

