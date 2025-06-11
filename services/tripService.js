import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_TRIP_ID;

const tripService = {
    async listTrips() {
        const response = await databaseService.listDocuments(dbId, colId);
        if (response.error) return { error: response.error };
        return { data: response };
    },

    async fetchTripsByDate(userEmail, targetDateStr) {
        const start = new Date(targetDateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };

        const completedTrips = response.documents.filter(
            (trip) => trip.startKm > 0 && trip.endKm > 0
        );

        return {
            data: {
                totalTrips: response.documents.length,
                completedTripsCount: completedTrips.length,
                completedTrips,
                allTrips: response.documents,
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

    // TripService.js additions
    async fetchTripsByDateOnly(targetDateStr) {
        const start = new Date(targetDateStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const response = await databaseService.listDocuments(dbId, colId, [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);

        if (response.error) return { error: response.error };
        return { data: response.documents };
    },

    async fetchTripsByUserOnly(userEmail) {
        const response = await databaseService.listDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
        ]);
        if (response.error) return { error: response.error };
        return { data: response.documents };
    },


    async createTrip(data) {
        // Step 1: Fetch latest trip for the user
        const latestTrip = await this.fetchLatestUserTrip(data.userEmail);

        // Step 3: If a trip exists, check if it's complete
        if (latestTrip.data) {
            const { startKm, endKm } = latestTrip.data;
            if (!(startKm > 0 && endKm > 0)) {
                return {
                    data: null,
                    error:
                        "Cannot create new trip. Last trip is incomplete (missing startKm or endKm).",
                };
            }
        }

        // Step 4: Create new trip with valid unique ID
        const newId = ID.unique(); // <-- Generate valid unique ID here
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
