// services/tripService.js
// ✅ Optimized & Structured Version (for copy-paste)
// ⚠️ Functionality unchanged — only cleaned, documented, and optimized

import { ID, Query } from "react-native-appwrite";
import databaseService from "./databaseService";
import authService from "./authService";
import employeeGlobalService from "./employeeGlobalService";

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_TRIP_ID;

const tripService = {
    // ============================
    // 🔹 Utility Helpers
    // ============================

    buildDateQuery(startDateStr, endDateStr) {
        if (!startDateStr || !endDateStr) return [];
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        end.setDate(end.getDate() + 1);
        return [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ];
    },

    buildUserQuery(emails) {
        if (!emails) return [];
        const emailArray = Array.isArray(emails) ? emails : [emails];
        return [Query.equal("userEmail", emailArray)];
    },

    // ============================
    // 🔹 Basic List & Pagination
    // ============================

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
        if (response.error) return { error: response.error };

        return {
            data: response.documents || [],
            currentPage: pageNumber,
            pageSize,
        };
    },

    async listAttachedTripsPagination(pageNumber = 1, pageSize = 20) {
        const offset = (pageNumber - 1) * pageSize;

        // Step 1: Fetch users
        const { data: users, error: userFetchError } =
            await authService.fetchAllUsers();
        if (userFetchError) return { error: userFetchError };

        // Step 2: Extract attached users
        const attachedUserEmails = (users || [])
            .filter((u) => u.labels?.includes("attached"))
            .map((u) => u.email);

        if (!attachedUserEmails.length) {
            return { data: [], currentPage: pageNumber, pageSize };
        }

        // Step 3: Query trips
        const queries = [
            Query.offset(offset),
            Query.limit(pageSize),
            Query.orderDesc("$createdAt"),
            Query.equal("userEmail", attachedUserEmails),
        ];
        const response = await databaseService.listDocuments(dbId, colId, queries);
        if (response.error) return { error: response.error };

        return {
            data: response.documents || [],
            currentPage: pageNumber,
            pageSize,
        };
    },

    // ============================
    // 🔹 Trip Updates
    // ============================

    async updateTripAsEdited(tripId, data) {
        const updatedData = { ...data, edited: true };
        const response = await databaseService.updateDocument(
            dbId,
            colId,
            tripId,
            updatedData
        );
        if (response.error) return { error: response.error };
        return { data: response };
    },

    async updateTrip(tripId, data) {
        const response = await databaseService.updateDocument(
            dbId,
            colId,
            tripId,
            data
        );
        if (response.error) return { error: response.error };
        return { data: response };
    },

    async deleteTrip(tripId) {
        try {
            const response = await databaseService.deleteDocument(dbId, colId, tripId);
            if (response.error) return { error: response.error };
            return { data: response };
        } catch (err) {
            return { data: null, error: err?.message || "Unexpected error." };
        }
    },

    // ============================
    // 🔹 Trip Fetching (Daily/Latest)
    // ============================

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
            (t) => t.startKm > 0 && t.endKm > 0
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

    async fetchMonthlyTripCount(userEmail) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const response = await databaseService.listAllDocuments(dbId, colId, [
            Query.equal("userEmail", userEmail),
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThanEqual("$createdAt", end.toISOString()),
        ]);
        if (response.error) return { error: response.error };

        return { data: response.data.length };
    },

    // ============================
    // 🔹 Trip Creation
    // ============================

    async createTrip(data) {
        // Ensure last trip is completed
        const latestTrip = await this.fetchLatestUserTrip(data.userEmail);
        if (latestTrip?.data) {
            const { startKm, endKm } = latestTrip.data;
            const valid =
                startKm && endKm && !isNaN(startKm) && !isNaN(endKm) && startKm > 0 && endKm > 0;
            if (!valid) {
                return {
                    data: null,
                    error:
                        "Cannot create new trip. Previous trip is incomplete (invalid KM readings).",
                };
            }
        }

        // Ensure unique tripId
        const existing = await this.findTripByTripId(data.tripId);
        if (existing) {
            return {
                data: null,
                error: "Trip ID already exists. Please use a unique ID.",
            };
        }

        try {
            const newId = ID.unique();
            const response = await databaseService.createDocument(dbId, colId, newId, data);
            return { data: response, error: null };
        } catch (err) {
            return { data: null, error: err?.message || "Error while creating trip." };
        }
    },

    async findTripByTripId(tripId) {
        try {
            const res = await databaseService.listDocuments(dbId, colId, [
                Query.equal("tripId", tripId),
            ]);
            return res.documents[0] || null;
        } catch (err) {
            console.error("Error checking tripId:", err);
            return null;
        }
    },

    // ============================
    // 🔹 Flexible Queries
    // ============================

    async fetchTripsByDateOnly(startDateStr, endDateStr) {
        const queries = this.buildDateQuery(startDateStr, endDateStr);
        if (!queries.length) return { data: [] };

        const response = await databaseService.listAllDocuments(dbId, colId, queries);
        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchTripsByUserOnly(userEmails) {
        const queries = this.buildUserQuery(userEmails);
        if (!queries.length) return { data: [] };

        const response = await databaseService.listAllDocuments(dbId, colId, queries);
        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    async fetchTripsByUserAndDate(userEmails, startDateStr, endDateStr) {
        const queries = [
            ...this.buildUserQuery(userEmails),
            ...this.buildDateQuery(startDateStr, endDateStr),
        ];
        if (!queries.length) return { data: [] };

        const response = await databaseService.listAllDocuments(dbId, colId, queries);
        if (response.error) return { error: response.error };
        return { data: response.data };
    },

    // ============================
    // 🔹 Incomplete Trip Status
    // ============================

    async getEmployeeIncompleteStatus(email) {
        const today = new Date().toISOString().split("T")[0];
        const [dailyRes, monthlyRes] = await Promise.all([
            this.fetchUserTripCounts("today", today),
            this.fetchUserTripCounts("month"),
        ]);
        if (dailyRes.error || monthlyRes.error) {
            return { error: dailyRes.error || monthlyRes.error };
        }

        const daily = dailyRes.data?.[email.toLowerCase()];
        const monthly = monthlyRes.data?.[email.toLowerCase()];

        return {
            data: {
                dailyIncomplete: !daily || daily.count < daily.reqTripCount,
                monthlyIncomplete: !monthly || monthly.count < monthly.reqTripCount,
                daily: daily || { count: 0, reqTripCount: 0 },
                monthly: monthly || { count: 0, reqTripCount: 0 },
            },
        };
    },

    async fetchUserTripCounts(mode = "today", dateParam = null) {
        let start, end;

        if (mode === "month") {
            const date = dateParam ? new Date(dateParam) : new Date();
            start = new Date(date.getFullYear(), date.getMonth(), 1, 7, 0, 0, 0);
            end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 6, 59, 59, 999);
        } else {
            const ref = dateParam ? new Date(dateParam) : new Date();
            const dayStart = new Date(
                ref.getFullYear(),
                ref.getMonth(),
                ref.getDate(),
                7,
                0,
                0,
                0
            );
            if (ref < dayStart) dayStart.setDate(dayStart.getDate() - 1);
            start = new Date(dayStart);
            end = new Date(dayStart);
            end.setDate(end.getDate() + 1);
            end.setHours(6, 59, 59, 999);
        }

        // Fetch trips
        const tripRes = await databaseService.listAllDocuments(dbId, colId, [
            Query.greaterThanEqual("$createdAt", start.toISOString()),
            Query.lessThan("$createdAt", end.toISOString()),
        ]);
        if (tripRes.error) return { error: tripRes.error };

        // Count trips
        const tripCounts = {};
        (tripRes.data || []).forEach((t) => {
            const email = t.userEmail?.toLowerCase();
            if (!email) return;
            tripCounts[email] = (tripCounts[email] || 0) + 1;
        });

        // Fetch required counts from global entries
        const globalRes = await employeeGlobalService.listEntries([
            Query.greaterThanEqual("createdAt", start.toISOString()),
            Query.lessThan("createdAt", end.toISOString()),
        ]);
        if (!globalRes.success) return { error: globalRes.error };

        // Build latest requirements map
        const latestReqMap = {};
        for (const e of globalRes.data.data) {
            const email = e.userEmail?.toLowerCase();
            if (!email) continue;
            if (
                !latestReqMap[email] ||
                new Date(e.createdAt) > new Date(latestReqMap[email].createdAt)
            ) {
                latestReqMap[email] = e;
            }
        }

        // Merge counts + requirements
        const result = {};
        for (const [email, count] of Object.entries(tripCounts)) {
            result[email] = { count, reqTripCount: latestReqMap[email]?.reqTripCount ?? 0 };
        }
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
};

export default tripService;
