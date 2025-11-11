// services/employeeLocationService.js

import { ID, Query } from 'react-native-appwrite';
import databaseService from './databaseService';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const EMPLOYEE_GLOBAL_DATA_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COL_EMPLOYEE_GLOBAL_DATA;

const employeeLocationService = {
    /**
     * Update or create employee location data
     * @param {string} email - Employee email
     * @param {object} locationData - Location data { currentLatitude, currentLongitude, currentSpeed, currentAddress }
     */
    async updateEmployeeLocation(email, locationData) {
        try {
            // Check if employee location record exists
            const existing = await databaseService.listDocuments(
                DATABASE_ID,
                EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                [Query.equal('email', email)]
            );

            const data = {
                email,
                currentLatitude: locationData.currentLatitude,
                currentLongitude: locationData.currentLongitude,
                currentSpeed: locationData.currentSpeed || 0,
                currentAddress: locationData.currentAddress || '',
                lastUpdated: new Date().toISOString(),
            };

            if (existing.documents.length > 0) {
                // Update existing record
                const updated = await databaseService.updateDocument(
                    DATABASE_ID,
                    EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                    existing.documents[0].$id,
                    data
                );
                return { success: true, data: updated };
            } else {
                // Create new record
                const created = await databaseService.createDocument(
                    DATABASE_ID,
                    EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                    ID.unique(),
                    data
                );
                return { success: true, data: created };
            }
        } catch (error) {
            return { success: false, error: error.message || 'Failed to update location' };
        }
    },

    /**
     * Get employee location by email
     * @param {string} email - Employee email
     */
    async getEmployeeLocation(email) {
        try {
            const result = await databaseService.listDocuments(
                DATABASE_ID,
                EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                [Query.equal('email', email)]
            );

            if (result.documents.length === 0) {
                return { success: false, error: 'Employee location not found' };
            }

            return { success: true, data: result.documents[0] };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch location' };
        }
    },

    /**
     * Get all employee locations
     * @param {array} queries - Optional Appwrite queries
     */
    async getAllEmployeeLocations(queries = []) {
        try {
            const result = await databaseService.listAllDocuments(
                DATABASE_ID,
                EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                queries
            );

            if (result?.error) {
                return { success: false, error: result.error };
            }

            return { success: true, data: result.data };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch locations' };
        }
    },

    /**
     * Get active employees (updated within last X minutes)
     * @param {number} minutesThreshold - Time threshold in minutes (default: 30)
     */
    async getActiveEmployees(minutesThreshold = 30) {
        try {
            const result = await databaseService.listAllDocuments(
                DATABASE_ID,
                EMPLOYEE_GLOBAL_DATA_COLLECTION_ID
            );

            if (result?.error) {
                return { success: false, error: result.error };
            }

            const now = new Date();
            const activeEmployees = result.data.filter(emp => {
                const lastUpdated = new Date(emp.$updatedAt);
                const diffMinutes = (now - lastUpdated) / 60000;
                return diffMinutes <= minutesThreshold && emp.currentLatitude && emp.currentLongitude;
            });

            return { success: true, data: activeEmployees };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to fetch active employees' };
        }
    },

    /**
     * Delete employee location data
     * @param {string} documentId - Document ID
     */
    async deleteEmployeeLocation(documentId) {
        try {
            await databaseService.deleteDocument(
                DATABASE_ID,
                EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
                documentId
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to delete location' };
        }
    },

    /**
     * Batch update multiple employee locations
     * @param {array} locationUpdates - Array of { email, locationData }
     */
    async batchUpdateLocations(locationUpdates) {
        try {
            const results = await Promise.allSettled(
                locationUpdates.map(update =>
                    this.updateEmployeeLocation(update.email, update.locationData)
                )
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
            const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

            return {
                success: true,
                successCount: successful.length,
                failureCount: failed.length,
                results
            };
        } catch (error) {
            return { success: false, error: error.message || 'Batch update failed' };
        }
    },

    /**
     * Calculate distance between two coordinates in kilometers
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Get employees within a certain radius of a location
     * @param {number} centerLat - Center latitude
     * @param {number} centerLon - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     */
    async getEmployeesInRadius(centerLat, centerLon, radiusKm) {
        try {
            const result = await this.getAllEmployeeLocations();
            
            if (!result.success) {
                return result;
            }

            const employeesInRadius = result.data.filter(emp => {
                if (!emp.currentLatitude || !emp.currentLongitude) return false;
                
                const distance = this.calculateDistance(
                    centerLat,
                    centerLon,
                    emp.currentLatitude,
                    emp.currentLongitude
                );
                
                return distance <= radiusKm;
            }).map(emp => ({
                ...emp,
                distanceFromCenter: this.calculateDistance(
                    centerLat,
                    centerLon,
                    emp.currentLatitude,
                    emp.currentLongitude
                )
            }));

            return { success: true, data: employeesInRadius };
        } catch (error) {
            return { success: false, error: error.message || 'Failed to get employees in radius' };
        }
    }
};

export default employeeLocationService;