import { account } from './appwrite';
import { ID } from 'react-native-appwrite';

const authService = {
    async login(email, password) {
        try {
            const response = await account.createEmailPasswordSession(email, password);
            return response;
        } catch (error) {
            return { error: error.message || 'Login failed. Please check your email and password.' };
        }
    },

    async logout() {
        try {
            await account.deleteSession('current');
            return { success: true };  // return something on success
        } catch (error) {
            return { error: error.message || 'Logout failed. Please try again.' };
        }
    },

    async register(name, email, password) {
        try {
            const response = await account.create(ID.unique(), email, password, name);
            return { success: true, data: response };
        } catch (error) {
            return { error: error.message || 'Registration failed. Please check your details.' };
        }
    },

    async getCurrentUser() {
        try {
            // This will throw if no session or insufficient scope
            const user = await account.get();
            return user;
        } catch (error) {
            // Return error so caller can handle it
            return { error: error.message || 'Failed to fetch user data. Please try again.' };
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

