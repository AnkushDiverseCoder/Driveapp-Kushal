// services/tripService.js

import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";
import authService from "./authService";

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

        if (latestTrip.data) {
            const { startKm, endKm } = latestTrip.data;
            if (!(startKm > 0 && endKm > 0)) {
                return {
                    data: null,
                    error: "Cannot create new trip. Last trip is incomplete (missing startKm or endKm).",
                };
            }
        }

        const newId = ID.unique();
        const response = await databaseService.createDocument(dbId, colId, newId, data);
        if (response.error) return { error: response.error };
        return { data: response, error: null };
    },

    async updateTrip(tripId, data) {
        const response = await databaseService.updateDocument(dbId, colId, tripId, data);
        if (response.error) return { error: response.error };
        return { data: response };
    },
};

export default tripService;
