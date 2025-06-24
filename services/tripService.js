// services/tripService.js

import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";
import authService from "./authService";
import employeeGlobalService from './employeeGlobalService';

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_TRIP_ID;

const tripService = {
    async listTrips() {
        const response = await databaseService.listAllDocuments(dbId, colId);
        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async listTripsPagination(pageNumber = 1, pageSize = 20) {
        const offset = (pageNumber - 1) * pageSize;

        const queries = [
            Query.offset(offset),
            Query.limit(pageSize),
            Query.orderDesc("$createdAt"),
        ];

        const response = await databaseService.listDocuments(dbId, colId, queries);

        if (response.error) {
            return { error: response.error };
        }

        const data = response.documents || [];

        return {
            data,
            currentPage: pageNumber,
            pageSize,
        };
    },

    async listAttachedTripsPagination(pageNumber = 1, pageSize = 20) {
        const offset = (pageNumber - 1) * pageSize;

        // Step 1: Fetch all users
        const { data: users, error: userFetchError } = await authService.fetchAllUsers();
        if (userFetchError) {
            return { error: userFetchError };
        }

        // Step 2: Filter users whose labels include "attached"
        const attachedUserEmails = (users || [])
            .filter(user => user.labels && user.labels.includes("attached"))
            .map(user => user.email);

        if (attachedUserEmails.length === 0) {
            return {
                data: [],
                currentPage: pageNumber,
                pageSize,
            };
        }

        // Step 3: Build queries for trips
        const queries = [
            Query.offset(offset),
            Query.limit(pageSize),
            Query.orderDesc("$createdAt"),
            Query.equal("userEmail", attachedUserEmails),
        ];

        // Step 4: Fetch trips
        const response = await databaseService.listDocuments(dbId, colId, queries);

        if (response.error) {
            return { error: response.error };
        }

        const data = response.documents || [];

        return {
            data,
            currentPage: pageNumber,
            pageSize,
        };
    },
    async updateTripAsEdited(tripId, data) {
        const updatedData = {
            ...data,
            edited: true,
        };

        const response = await databaseService.updateDocument(dbId, colId, tripId, updatedData);

        if (response.error) return { error: response.error };

        return { data: response };
    },
    async fetchTripsByDate(userEmail, targetDateStr) {
        const start = new Date(targetDateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };

        const completedTrips = response.data.filter(
            (trip) => trip.startKm > 0 && trip.endKm > 0
        );

        return {
            data: {
                totalTrips: response.data.length,
                completedTripsCount: completedTrips.length,
                completedTrips,
                allTrips: response.data,
            },
        };
    },

    async fetchLatestUserTrip(userEmail) {
        const response = await databaseService.listDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.orderDesc("$createdAt"),
            Query.limit(1),
        ]);

        if (response.error) return { error: response.error };
        const trip = response.documents?.[0];
        if (!trip) return { error: "No trip found for this user" };
        return { data: trip };
    },

    async fetchUserTripCounts(mode = 'today', dateParam = null) {
        let start, end;

        if (mode === "month") {
            const date = dateParam ? new Date(dateParam) : new Date();
            start = new Date(date.getFullYear(), date.getMonth(), 1);
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);
        } else {
            const now = dateParam ? new Date(dateParam) : new Date();
            start = new Date(now);
            start.setHours(6, 58, 0, 0);
            if (now < start) start.setDate(start.getDate() - 1);
            end = new Date(start);
            end.setDate(start.getDate() + 1);
            end.setHours(6, 57, 59, 999);
        }

        const tripRes = await databaseService.listAllDocuments(dbId, colId, [
            Query.greaterThanEqual('$createdAt', start.toISOString()),
            Query.lessThan('$createdAt', end.toISOString()),
        ]);

        if (tripRes.error) return { error: tripRes.error };

        const tripCounts = {};
        (tripRes.data || []).forEach((trip) => {
            const email = trip.userEmail?.toLowerCase();
            if (!email) return;
            tripCounts[email] = (tripCounts[email] || 0) + 1;
        });

        // Get latest reqTripCount for each user
        const globalRes = await employeeGlobalService.listEntries([
            Query.greaterThanEqual('createdAt', start.toISOString()),
            Query.lessThan('createdAt', end.toISOString()),
        ]);
        if (!globalRes.success) return { error: globalRes.error };
        const latestReqMap = {};
        for (const entry of globalRes.data.data) {
            const email = entry.userEmail?.toLowerCase?.();
            if (!email) continue;
            if (!latestReqMap[email] || new Date(entry.createdAt) > new Date(latestReqMap[email].createdAt)) {
                latestReqMap[email] = entry;
            }
        }

        const result = {};
        for (const [email, count] of Object.entries(tripCounts)) {
            result[email] = {
                count,
                reqTripCount: latestReqMap[email]?.reqTripCount ?? 0,
            };
        }

        // Also include users who have reqTripCount but no trips
        for (const email of Object.keys(latestReqMap)) {
            if (!result[email]) {
                result[email] = {
                    count: 0,
                    reqTripCount: latestReqMap[email].reqTripCount ?? 0,
                };
            }
        }

        return { data: result };
    },
    async fetchTripsByDateOnly(startDateStr, endDateStr) {
        if (!startDateStr || !endDateStr) return { data: [] };

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchTripsByUserOnly(userEmails) {
        if (!userEmails || userEmails.length === 0) return { data: [] };

        const query = Query.equal("userEmail", Array.isArray(userEmails) ? userEmails : [userEmails]);

        const response = await databaseService.listAllDocuments(dbId, colId, [query]);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchTripsByUserAndDate(userEmails, startDateStr, endDateStr) {
        if (!userEmails?.length || !startDateStr || !endDateStr) return { data: [] };

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.equal("userEmail", userEmails),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async createTrip(data) {
        const latestTrip = await this.fetchLatestUserTrip(data.userEmail);

        if (latestTrip?.data) {
            const { startKm, endKm } = latestTrip.data;

            // Check if the previous trip is incomplete
            const isStartValid = startKm !== null && startKm !== undefined && startKm !== '' && !isNaN(startKm);
            const isEndValid = endKm !== null && endKm !== undefined && endKm !== '' && !isNaN(endKm);

            if (!isStartValid || !isEndValid || startKm <= 0 || endKm <= 0) {
                return {
                    data: null,
                    error: "Cannot create new trip. Previous trip is incomplete (missing or invalid KM readings).",
                };
            }
        }

        // Trip ID check
        const existingTrip = await this.findTripByTripId(data.tripId);
        if (existingTrip) {
            return {
                data: null,
                error: "Trip ID already exists. Please enter a unique Trip ID.",
            };
        }

        const newDocId = ID.unique();
        try {
            const response = await databaseService.createDocument(dbId, colId, newDocId, data);
            return { data: response, error: null };
        } catch (err) {
            return {
                data: null,
                error: err?.message || "Unexpected error while creating trip.",
            };
        }
    },

    async findTripByTripId(tripId) {
        try {
            const results = await databaseService.listDocuments(
                dbId,
                colId,
                [Query.equal("tripId", tripId)]
            );

            return results.documents[0] || null;
        } catch (err) {
            console.error("Error checking tripId:", err);
            return null; // Fail-safe
        }
    },

    async updateTrip(tripId, data) {
        const response = await databaseService.updateDocument(dbId, colId, tripId, data);
        if (response.error) return { error: response.error };
        return { data: response };
    },

    async fetchMonthlyTripCount(userEmail) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.greaterThanEqual("$createdAt", startOfMonth.toISOString()),
            Query.lessThanEqual("$createdAt", endOfMonth.toISOString()),
        ]);

        if (response.error) return { error: response.error };

        return { data: response.data.length };
    },

    async deleteTrip(tripId) {
        try {
            const response = await databaseService.deleteDocument(dbId, colId, tripId);
            if (response.error) return { error: response.error };
            return { data: response };
        } catch (err) {
            return {
                data: null,
                error: err?.message || "Unexpected error while deleting trip.",
            };
        }
    }

};

export default tripService;
