import { ID } from "react-native-appwrite";
import databaseService from "./databaseService";

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_TRIP_ID;

const tripService = {
    async listTrips() {
        const response = await databaseService.listDocuments(dbId, colId);
        if(response.error) return {error:response.error};
        return {data:response};
    },
    async createTrip(data) {
        const response = await databaseService.createDocument(dbId,colId,data,ID.unique());
        if(response.error) return {error:response.error};
        return {data:response,error:null};
    },
    // async updateTrip(tripId, data) {
    //     const response = await databaseService.updateDocument(colId, tripId, data);
    //     if(response.error) return {error:response.error};
    //     return {data:response};
    // },
    // async deleteTrip(tripId) {
    //     const response = await databaseService.deleteDocument(colId, tripId);
    //     if(response.error) return {error:response.error};
    //     return {data:response};
    // },
    
    // async getTrip(tripId) {
    //     const response = await databaseService.getDocument(dbId, colId, tripId);
    //     if(response.error) return {error:response.error};
    //     return {data:response};
    // }
}

export default tripService;