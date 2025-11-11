// services/locationService.js
// Simplified global location service for all users

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { database, config } from './appwrite';
import { ID, Query } from 'react-native-appwrite';

const DATABASE_ID = config.db;
const LOCATION_COLLECTION_ID = config.col.location;
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Global state
let currentUserEmail = null;
let isTrackingActive = false;
let watchSubscription = null;

// Define background location task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data && currentUserEmail) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      await locationService.updateLocationInDatabase(
        currentUserEmail,
        location.coords.latitude,
        location.coords.longitude,
        location.coords.speed || 0
      );
    }
  }
});

const locationService = {
  // Set current user
  setCurrentUser(email) {
    currentUserEmail = email;
  },

  // Get tracking status
  isTracking() {
    return isTrackingActive;
  },

  // Check permissions
  async checkPermissions() {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foreground.status === 'granted',
        background: background.status === 'granted',
      };
    } catch (error) {
      console.error('Check permissions error:', error);
      return { foreground: false, background: false };
    }
  },

  // Request permissions with native dialogs
  async requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        return {
          success: false,
          error: 'Location permission required for tracking',
        };
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      return {
        success: true,
        hasBackground: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Request permissions error:', error);
      return {
        success: false,
        error: error.message || 'Failed to request permissions',
      };
    }
  },

  // Get current location
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return { success: true, data: location };
    } catch (error) {
      console.error('Get location error:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Reverse geocoding with error handling + fallback
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Validate coordinates
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        console.warn('⚠️ Invalid coordinates for reverse geocoding');
        return 'Unknown location';
      }

      // Try native reverse geocoding
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country,
        ]
          .filter(Boolean)
          .join(', ');
        return fullAddress || 'Unknown location';
      }

      // If no result, fallback to approximate text
      return `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
    } catch (error) {
      // Handle offline / restricted devices gracefully
      console.error('⚠️ Reverse geocoding error:', error?.message || error);
      return `Lat: ${latitude?.toFixed(4) || '?'} , Lon: ${longitude?.toFixed(4) || '?'}`;
    }
  },

  // Update location in database
  async updateLocationInDatabase(email, latitude, longitude, speed) {
    try {
      const address = await this.getAddressFromCoordinates(latitude, longitude);
      const speedKmh = speed ? Math.abs(speed * 3.6) : 0;

      // Check if document exists
      const existingDocs = await database.listDocuments(
        DATABASE_ID,
        LOCATION_COLLECTION_ID,
        [Query.equal('email', email), Query.limit(1)]
      );

      const locationData = {
        email,
        currentLatitude: latitude,
        currentLongitude: longitude,
        currentSpeed: speedKmh,
        currentAddress: address.substring(0, 2999),
        isOnline: true,
        lastUpdated: new Date().toISOString(),
      };

      if (existingDocs.documents.length > 0) {
        await database.updateDocument(
          DATABASE_ID,
          LOCATION_COLLECTION_ID,
          existingDocs.documents[0].$id,
          locationData
        );
        console.log('✅ Location updated:', email);
      } else {
        await database.createDocument(
          DATABASE_ID,
          LOCATION_COLLECTION_ID,
          ID.unique(),
          locationData
        );
        console.log('✅ Location created:', email);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Database update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Start tracking with foreground service
  async startTracking(email) {
    try {
      if (isTrackingActive) {
        console.log('Already tracking');
        return { success: true, message: 'Already tracking' };
      }

      currentUserEmail = email;

      // Check permissions
      const permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        const permResult = await this.requestPermissions();
        if (!permResult.success) {
          return permResult;
        }
      }

      // Get initial location
      const locationResult = await this.getCurrentLocation();
      if (locationResult.success) {
        await this.updateLocationInDatabase(
          email,
          locationResult.data.coords.latitude,
          locationResult.data.coords.longitude,
          locationResult.data.coords.speed || 0
        );
      }

      // Start watching position (foreground)
      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        async (location) => {
          await this.updateLocationInDatabase(
            email,
            location.coords.latitude,
            location.coords.longitude,
            location.coords.speed || 0
          );
        }
      );

      // Start background tracking if permission granted
      if (permissions.background) {
        await this.startBackgroundTracking();
      }

      isTrackingActive = true;
      console.log('🚀 Location tracking started');

      return { success: true };
    } catch (error) {
      console.error('Start tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Start background tracking
  async startBackgroundTracking() {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      if (!isTaskDefined) {
        console.log('Background task not defined');
        return;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000, // 15 seconds
        distanceInterval: 20, // 20 meters
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Tracking your work location',
          notificationColor: '#064e3b',
        },
        pausesUpdatesAutomatically: false,
      });

      console.log('📍 Background tracking started');
    } catch (error) {
      console.error('Background tracking error:', error);
    }
  },

  // Stop tracking
  async stopTracking() {
    try {
      if (watchSubscription) {
        watchSubscription.remove();
        watchSubscription = null;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      if (currentUserEmail) {
        const existingDocs = await database.listDocuments(
          DATABASE_ID,
          LOCATION_COLLECTION_ID,
          [Query.equal('email', currentUserEmail)]
        );

        if (existingDocs.documents.length > 0) {
          await database.updateDocument(
            DATABASE_ID,
            LOCATION_COLLECTION_ID,
            existingDocs.documents[0].$id,
            { isOnline: false }
          );
        }
      }

      isTrackingActive = false;
      console.log('🛑 Tracking stopped');

      return { success: true };
    } catch (error) {
      console.error('Stop tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Initialize on app start - called from splash screen
  async initialize(email, role) {
    try {
      console.log('🔧 Initializing location for:', role);

      const permResult = await this.requestPermissions();
      if (!permResult.success) {
        console.log('⚠️ Permissions denied, skipping tracking');
        return { success: false, error: permResult.error };
      }

      const trackResult = await this.startTracking(email);

      return trackResult;
    } catch (error) {
      console.error('Initialize error:', error);
      return { success: false, error: error.message };
    }
  },
};

export default locationService;
