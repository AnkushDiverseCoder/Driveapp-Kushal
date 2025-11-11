// app/(admintabs)/AdminEmployeeGPSTracker.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Switch,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { database, config, client } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';
import authService from '../../services/authService';

const DATABASE_ID = config.db;
const EMPLOYEE_GLOBAL_DATA_COLLECTION_ID = config.col.location;

const { width, height } = Dimensions.get('window');

// Helper function to validate coordinates
const isValidCoordinate = (lat, lon) => {
  return (
    lat !== null &&
    lat !== undefined &&
    lon !== null &&
    lon !== undefined &&
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

export default function AdminEmployeeGPSTracker() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterLabel, setFilterLabel] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const mapRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 17.385044,
    longitude: 78.486671,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Fetch all non-admin users and their locations
  const fetchEmployeeLocations = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const usersResult = await authService.fetchAllUsers();
      
      if (!usersResult.success || !usersResult.data) {
        throw new Error('Failed to fetch users');
      }

      const nonAdminUsers = usersResult.data.filter(user => {
        const labels = Array.isArray(user.labels) ? user.labels : [];
        return !labels.includes('admin');
      });

      const locationResponse = await database.listDocuments(
        DATABASE_ID,
        EMPLOYEE_GLOBAL_DATA_COLLECTION_ID,
        [Query.limit(500)]
      );

      const locationMap = {};
      locationResponse.documents.forEach(doc => {
        if (doc && doc.email) {
          locationMap[doc.email] = doc;
        }
      });

      const employeeData = nonAdminUsers.map(user => {
        const locationData = locationMap[user.email] || {};
        
        // Parse and validate coordinates
        let currentLat = null;
        let currentLon = null;
        
        if (locationData.currentLatitude !== undefined && locationData.currentLongitude !== undefined) {
          const lat = typeof locationData.currentLatitude === 'string' 
            ? parseFloat(locationData.currentLatitude) 
            : locationData.currentLatitude;
          const lon = typeof locationData.currentLongitude === 'string' 
            ? parseFloat(locationData.currentLongitude) 
            : locationData.currentLongitude;
          
          if (isValidCoordinate(lat, lon)) {
            currentLat = lat;
            currentLon = lon;
          }
        }
        
        return {
          $id: user.$id,
          email: user.email,
          username: user.username || 'Unknown',
          displayName: user.displayName || user.username || user.email,
          labels: user.labels || [],
          currentLatitude: currentLat,
          currentLongitude: currentLon,
          currentSpeed: locationData.currentSpeed || null,
          currentAddress: locationData.currentAddress || null,
          isOnline: locationData.isOnline || false,
          $updatedAt: locationData.$updatedAt || user.$updatedAt,
          locationDocId: locationData.$id || null,
        };
      });
      
      if (!isMountedRef.current) return;
      
      setEmployees(employeeData);
      applyFilters(employeeData, searchQuery, showOnlyActive, filterLabel);
      
      // Set initial map region to first valid employee location
      if (employeeData.length > 0 && !selectedEmployee) {
        const firstActiveEmp = employeeData.find(emp => 
          isValidCoordinate(emp.currentLatitude, emp.currentLongitude)
        );
        if (firstActiveEmp) {
          setMapRegion({
            latitude: firstActiveEmp.currentLatitude,
            longitude: firstActiveEmp.currentLongitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          });
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to fetch employee locations. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchEmployeeLocations();

    const setupSubscription = async () => {
      try {
        const channels = [
          `databases.${DATABASE_ID}.collections.${EMPLOYEE_GLOBAL_DATA_COLLECTION_ID}.documents`,
        ];
        
        unsubscribeRef.current = client.subscribe(channels, (response) => {
          if (isMountedRef.current) {
            fetchEmployeeLocations();
          }
        });
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    setupSubscription();

    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        fetchEmployeeLocations();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.log('Unsubscribe error:', err);
        }
      }
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    applyFilters(employees, searchQuery, showOnlyActive, filterLabel);
  }, [searchQuery, showOnlyActive, filterLabel, employees]);

  const applyFilters = (data, search, activeOnly, label) => {
    let filtered = [...data];

    if (label !== 'all') {
      filtered = filtered.filter(emp => {
        const labels = Array.isArray(emp.labels) ? emp.labels : [];
        return labels.includes(label);
      });
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.displayName?.toLowerCase().includes(query) ||
        emp.username?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query)
      );
    }

    if (activeOnly) {
      filtered = filtered.filter(emp => 
        isValidCoordinate(emp.currentLatitude, emp.currentLongitude)
      );
    }

    setFilteredEmployees(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployeeLocations();
  };

  const focusOnEmployee = (employee) => {
    if (!employee || !isValidCoordinate(employee.currentLatitude, employee.currentLongitude)) {
      Alert.alert('No Location', 'This employee has no location data available.');
      return;
    }

    setSelectedEmployee(employee);
    const newRegion = {
      latitude: employee.currentLatitude,
      longitude: employee.currentLongitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(newRegion);
    
    if (mapRef.current && mapReady) {
      setTimeout(() => {
        try {
          mapRef.current.animateToRegion(newRegion, 1000);
        } catch (error) {
          console.error('Error animating to region:', error);
        }
      }, 200);
    }
  };

  const fitAllMarkers = () => {
    const activeEmployees = filteredEmployees.filter(emp => 
      isValidCoordinate(emp.currentLatitude, emp.currentLongitude)
    );

    if (activeEmployees.length === 0) {
      Alert.alert('No Active Employees', 'No employees with location data found.');
      return;
    }

    if (mapRef.current && mapReady && activeEmployees.length > 0) {
      setTimeout(() => {
        try {
          mapRef.current.fitToCoordinates(
            activeEmployees.map(emp => ({
              latitude: emp.currentLatitude,
              longitude: emp.currentLongitude,
            })),
            {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            }
          );
        } catch (error) {
          console.error('Error fitting markers:', error);
        }
      }, 500);
    }
  };

  const zoomIn = () => {
    if (mapRef.current && mapReady) {
      const newDelta = Math.max(mapRegion.latitudeDelta * 0.5, 0.001);
      const newRegion = {
        ...mapRegion,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };
      setMapRegion(newRegion);
      try {
        mapRef.current.animateToRegion(newRegion, 300);
      } catch (error) {
        console.error('Zoom in error:', error);
      }
      setZoomLevel(newDelta);
    }
  };

  const zoomOut = () => {
    if (mapRef.current && mapReady) {
      const newDelta = Math.min(mapRegion.latitudeDelta * 2, 100);
      const newRegion = {
        ...mapRegion,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };
      setMapRegion(newRegion);
      try {
        mapRef.current.animateToRegion(newRegion, 300);
      } catch (error) {
        console.error('Zoom out error:', error);
      }
      setZoomLevel(newDelta);
    }
  };

  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const getStatusColor = (timestamp) => {
    if (!timestamp) return '#6b7280';
    try {
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMins = Math.floor((now - updated) / 60000);
      
      if (diffMins < 5) return '#22c55e';
      if (diffMins < 30) return '#eab308';
      return '#ef4444';
    } catch (error) {
      return '#6b7280';
    }
  };

  const getRoleBadgeColor = (labels) => {
    if (!labels || !Array.isArray(labels)) return '#6b7280';
    if (labels.includes('supervisor')) return '#3b82f6';
    if (labels.includes('employee')) return '#8b5cf6';
    return '#6b7280';
  };

  const getRoleLabel = (labels) => {
    if (!labels || !Array.isArray(labels)) return 'Unknown';
    if (labels.includes('supervisor')) return 'Supervisor';
    if (labels.includes('employee')) return 'Employee';
    return 'Unknown';
  };

  const renderEmployeeItem = ({ item }) => {
    const isSelected = selectedEmployee?.$id === item.$id;
    const hasLocation = isValidCoordinate(item.currentLatitude, item.currentLongitude);
    const statusColor = hasLocation ? getStatusColor(item.$updatedAt) : '#6b7280';
    const roleColor = getRoleBadgeColor(item.labels);
    const roleLabel = getRoleLabel(item.labels);
    
    return (
      <TouchableOpacity
        style={[styles.employeeCard, isSelected && styles.selectedCard]}
        onPress={() => {
          if (hasLocation) {
            focusOnEmployee(item);
            setViewMode('map');
          }
        }}
        activeOpacity={hasLocation ? 0.7 : 1}
      >
        <View style={styles.employeeHeader}>
          <View style={styles.employeeInfo}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.employeeTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.employeeName}>{item.displayName}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
                  <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
              </View>
              <Text style={styles.employeeUsername}>@{item.username}</Text>
              <Text style={styles.employeeEmail}>{item.email}</Text>
            </View>
          </View>
          <Text style={styles.timeText}>{getTimeSinceUpdate(item.$updatedAt)}</Text>
        </View>
        
        {hasLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.coordinatesText}>
              📍 {item.currentLatitude.toFixed(6)}, {item.currentLongitude.toFixed(6)}
            </Text>
            {item.currentSpeed !== undefined && item.currentSpeed !== null && (
              <Text style={styles.speedText}>
                🚗 Speed: {item.currentSpeed.toFixed(1)} km/h
              </Text>
            )}
            {item.currentAddress && (
              <Text style={styles.addressText} numberOfLines={1}>
                📍 {item.currentAddress}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noLocationText}>No location data available</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMapView = () => {
  const activeEmployees = filteredEmployees.filter(emp => 
    isValidCoordinate(emp.currentLatitude, emp.currentLongitude)
  );

  if (activeEmployees.length === 0) {
    return (
      <View style={styles.emptyMapContainer}>
        <Text style={styles.emptyMapText}>No active employees to display on map</Text>
        <TouchableOpacity 
          style={styles.switchToListButton}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.switchToListText}>Switch to List View</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        mapType='standard'
        showsTraffic={showTraffic}
        showsBuildings={true}
        showsIndoors={true}
        showsPointsOfInterest={true}
        onMapReady={() => {
          console.log('Map is ready');
          setMapReady(true);
          if (activeEmployees.length > 0) {
            setTimeout(() => {
              try {
                fitAllMarkers();
              } catch (error) {
                console.error('Initial fit error:', error);
              }
            }, 1000);
          }
        }}
        onRegionChangeComplete={(region) => {
          setMapRegion(region);
          setZoomLevel(region.latitudeDelta);
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#064e3b"
        loadingBackgroundColor="#f3f4f6"
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        zoomControlEnabled={false}
        minZoomLevel={3}
        maxZoomLevel={20}
      >
        {activeEmployees.map((employee) => {
          try {
            const pinColor = getStatusColor(employee.$updatedAt);
            
            return (
              <React.Fragment key={employee.$id}>
                 <Marker
                  coordinate={{
                    latitude: employee.currentLatitude,
                    longitude: employee.currentLongitude,
                  }}
                  pinColor={pinColor}
                  onPress={() => setSelectedEmployee(employee)}
                  title={employee.displayName}
                  description={`${getRoleLabel(employee.labels)} • ${getTimeSinceUpdate(employee.$updatedAt)}`}
                  anchor={{ x: 0.5, y: 1 }}
                  centerOffset={{ x: 0, y: -20 }}
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.markerBubble, { backgroundColor: pinColor }]}>
                      <Text style={styles.markerText}>
                        {employee.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.markerNameContainer}>
                      <Text style={styles.markerName} numberOfLines={1}>
                        {employee.displayName}
                      </Text>
                    </View>
                    <View style={[styles.markerArrow, { borderTopColor: pinColor }]} />
                  </View>
                  <Callout tooltip>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{employee.displayName}</Text>
                      <View style={[styles.calloutRoleBadge, { backgroundColor: getRoleBadgeColor(employee.labels) }]}>
                        <Text style={styles.calloutRoleText}>{getRoleLabel(employee.labels)}</Text>
                      </View>
                      <Text style={styles.calloutText}>@{employee.username}</Text>
                      <Text style={styles.calloutText}>{employee.email}</Text>
                      <View style={styles.calloutDivider} />
                      <Text style={styles.calloutText}>
                        🕐 Updated: {getTimeSinceUpdate(employee.$updatedAt)}
                      </Text>
                      {employee.currentSpeed !== undefined && employee.currentSpeed !== null && (
                        <Text style={styles.calloutText}>
                          🚗 Speed: {employee.currentSpeed.toFixed(1)} km/h
                        </Text>
                      )}
                      {employee.currentAddress && (
                        <Text style={styles.calloutAddress} numberOfLines={2}>
                          📍 {employee.currentAddress}
                        </Text>
                      )}
                    </View>
                  </Callout>
                </Marker>
                
                {/* Accuracy circle */}
                <Circle
                  center={{
                    latitude: employee.currentLatitude,
                    longitude: employee.currentLongitude,
                  }}
                  radius={50}
                  fillColor={`${pinColor}20`}
                  strokeColor={pinColor}
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          } catch (error) {
            console.error('Error rendering marker for employee:', employee.$id, error);
            return null;
          }
        })}
      </MapView>
      
      {/* Rest of your UI components remain the same */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
        <Text style={styles.mapTypeButtonText}>
          {mapType === 'standard' ? '🗺️' : mapType === 'satellite' ? '🛰️' : '🌐'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.trafficButton, showTraffic && styles.trafficButtonActive]} 
        onPress={() => setShowTraffic(!showTraffic)}
      >
        <Text style={styles.trafficButtonText}>🚦</Text>
      </TouchableOpacity>

      {activeEmployees.length > 1 && (
        <TouchableOpacity style={styles.fitAllButton} onPress={fitAllMarkers}>
          <Text style={styles.fitAllButtonText}>📍 Fit All</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsCard}>
        <Text style={styles.statsText}>
          {activeEmployees.length} / {filteredEmployees.length} Active
        </Text>
        <Text style={styles.statsSubtext}>
          Zoom: {zoomLevel < 0.01 ? 'Max' : zoomLevel > 10 ? 'Min' : 'Medium'}
        </Text>
      </View>

      {selectedEmployee && (
        <View style={styles.selectedEmployeeCard}>
          <View style={styles.selectedEmployeeHeader}>
            <View>
              <Text style={styles.selectedEmployeeName}>{selectedEmployee.displayName}</Text>
              <Text style={styles.selectedEmployeeRole}>{getRoleLabel(selectedEmployee.labels)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedEmployee(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedEmployee.currentSpeed !== undefined && selectedEmployee.currentSpeed !== null && (
            <Text style={styles.selectedEmployeeSpeed}>
              🚗 {selectedEmployee.currentSpeed.toFixed(1)} km/h
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#064e3b" />
        <Text style={styles.loadingText}>Loading employee locations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee GPS Tracker</Text>
        <Text style={styles.headerSubtitle}>
          {filteredEmployees.filter(e => isValidCoordinate(e.currentLatitude, e.currentLongitude)).length} / {filteredEmployees.length} Active
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        
        <View style={styles.filterRow}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active Only</Text>
            <Switch
              value={showOnlyActive}
              onValueChange={setShowOnlyActive}
              trackColor={{ false: '#d1d5db', true: '#064e3b' }}
              thumbColor={showOnlyActive ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {filterLabel === 'all' ? '👥 All' : filterLabel === 'employee' ? '👤 Employees' : '👔 Supervisors'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
                🗺️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
                📋
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {viewMode === 'map' ? (
        renderMapView()
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.$id}
          renderItem={renderEmployeeItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#064e3b']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || showOnlyActive ? 'No employees found' : 'No employee data available'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Role</Text>
            
            {['all', 'employee', 'supervisor'].map(label => (
              <TouchableOpacity
                key={label}
                style={[styles.filterOption, filterLabel === label && styles.filterOptionActive]}
                onPress={() => {
                  setFilterLabel(label);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[styles.filterOptionText, filterLabel === label && styles.filterOptionTextActive]}>
                  {label === 'all' ? '👥 All Users' : label === 'employee' ? '👤 Employees' : '👔 Supervisors'}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#064e3b',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#064e3b',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMapText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  switchToListButton: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchToListText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerNameContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    top: '40%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#064e3b',
  },
  mapTypeButton: {
    position: 'absolute',
    right: 20,
    top: '30%',
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeButtonText: {
    fontSize: 20,
  },
  trafficButton: {
    position: 'absolute',
    right: 20,
    top: '20%',
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  trafficButtonActive: {
    backgroundColor: '#064e3b',
  },
  trafficButtonText: {
    fontSize: 20,
  },
  fitAllButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#064e3b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fitAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 80,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  statsSubtext: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedEmployeeCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedEmployeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedEmployeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  selectedEmployeeRole: {
    fontSize: 12,
    color: '#064e3b',
    fontWeight: '600',
    marginTop: 2,
  },
  selectedEmployeeSpeed: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  calloutContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    minWidth: 220,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
  },
  calloutRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  calloutText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#064e3b',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  employeeTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  employeeUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginLeft: 8,
  },
  locationInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  speedText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noLocationText: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#064e3b',
    marginBottom: 16,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#064e3b',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#064e3b',
    fontWeight: '600',
  },
});