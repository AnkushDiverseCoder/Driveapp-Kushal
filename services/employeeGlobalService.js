import { ID, Query } from 'react-native-appwrite';
import databaseService from './databaseService';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const EMPLOYEE_GLOBAL_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_EMPLOYEE_GLOBAL_DATA;

const employeeGlobalService = {
    async listEntries(queries = []) {
        try {
            const res = await databaseService.listDocuments(DATABASE_ID, EMPLOYEE_GLOBAL_COLLECTION_ID, queries);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch entries' };
        }
    },

    async createEntry(data) {
        try {
            const res = await databaseService.createDocument(DATABASE_ID, EMPLOYEE_GLOBAL_COLLECTION_ID, ID.unique(), data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to create entry' };
        }
    },

    async updateEntry(documentId, data) {
        try {
            const res = await databaseService.updateDocument(DATABASE_ID, EMPLOYEE_GLOBAL_COLLECTION_ID, documentId, data);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to update entry' };
        }
    },

    async createOrUpdateEntry(form, selectedEmployee, mileage) {
        try {
            const totalDistance = parseFloat(form.fuelQuantity) * mileage;

            const prevRes = await this.listEntries([
                Query.equal('userEmail', [selectedEmployee.email]),
                Query.equal('vehicleNumber', [form.vehicleNumber]),
                Query.orderDesc('createdAt'),
                Query.limit(1),
            ]);

            const prev = prevRes?.data?.documents?.[0];
            const previousMeterReading = prev?.meterReading || 0;
            const totalDistanceCovered = parseFloat(form.meterReading) - previousMeterReading;
            const remainingDistance = prev?.remainingDistance
                ? prev.remainingDistance - totalDistanceCovered
                : totalDistance;

            const payload = {
                meterReading: parseFloat(form.meterReading),
                totalDistance: totalDistanceCovered,
                remainingDistance,
                previousMeterReading,
                fuelFilled: parseFloat(form.fuelQuantity),
                notes: '',
                userEmail: selectedEmployee.email,
                vehicleNumber: form.vehicleNumber,
                createdAt: new Date().toISOString(),
            };

            if (!prev || new Date(prev.createdAt).toDateString() !== new Date().toDateString()) {
                return await this.createEntry(payload);
            } else {
                return await this.updateEntry(prev.$id, payload);
            }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to create/update global entry' };
        }
    },
};

export default employeeGlobalService;
