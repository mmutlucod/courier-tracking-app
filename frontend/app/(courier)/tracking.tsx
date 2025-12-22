import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import courierSocketService from '../../services/socket/courier-socket';
import socketService from '../../services/socket/socket';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

interface DirectionsRoute {
  distance: number;
  duration: number;
  polyline: { latitude: number; longitude: number }[];
}

export default function CourierTracking() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, deliverOrder, fetchOrders } = useOrderStore();
  const mapRef = useRef<MapView>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const insets = useSafeAreaInsets();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [route, setRoute] = useState<DirectionsRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const [markerReady, setMarkerReady] = useState(false);

  const GOOGLE_MAPS_API_KEY = 
    Constants.expoConfig?.ios?.config?.googleMapsApiKey || 
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const activeOrder = orders.find((o) => {
    const orderCourierId = typeof o.courierId === 'object' ? o.courierId._id : o.courierId;
    return orderCourierId?.toString() === user?._id?.toString() && o.status === 'in_transit';
  });

  useEffect(() => {
    const initSocket = async () => {
      try {
        await socketService.connect();
        setIsSocketConnected(true);
        console.log('✅ Socket connected for tracking');
        if (activeOrder && user?._id) {
          courierSocketService.startDelivery({ courierId: user._id, orderId: activeOrder._id });
        }
      } catch (error) {
        console.error('❌ Socket connection failed:', error);
        Alert.alert('Bağlantı Hatası', 'Gerçek zamanlı konum paylaşımı başlatılamadı');
      }
    };

    initSocket();

    return () => {
      if (activeOrder && user?._id) {
        courierSocketService.stopDelivery({ courierId: user._id, orderId: activeOrder._id });
      }
      courierSocketService.removeListeners();
    };
  }, [activeOrder, user?._id]);

  useEffect(() => {
    if (activeOrder && isSocketConnected) startTracking();
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      setIsTracking(false);
    };
  }, [activeOrder, isSocketConnected]);

  useEffect(() => {
    if (currentLocation && activeOrder) {
      const isFirstLocation = !route;
      fetchRoute(currentLocation, { latitude: activeOrder.deliveryLat, longitude: activeOrder.deliveryLng }, isFirstLocation);
    }
  }, [currentLocation, activeOrder]);

  useEffect(() => {
    if (currentLocation && mapRef.current && isAutoFollow) {
      mapRef.current.animateCamera({ center: currentLocation, zoom: 15, heading: 0, pitch: 0 }, { duration: 500 });
    }
  }, [currentLocation, isAutoFollow]);

  const fetchRoute = async (
    origin: { latitude: number; longitude: number }, 
    destination: { latitude: number; longitude: number }, 
    shouldFitMap: boolean = false
  ) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API Key bulunamadı!');
      calculateSimpleRoute(origin, destination);
      return;
    }

    try {
      setIsLoadingRoute(true);
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('🗺️ Directions API çağrısı yapılıyor...');
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('📡 API Response Status:', data.status);

      if (data.status === 'OK' && data.routes.length > 0) {
        const routeData = data.routes[0].legs[0];
        const polylinePoints = decodePolyline(data.routes[0].overview_polyline.points);

        console.log('✅ Rota başarıyla alındı:', {
          distance: (routeData.distance.value / 1000).toFixed(2) + ' km',
          duration: Math.floor(routeData.duration.value / 60) + ' dk',
          points: polylinePoints.length
        });

        setRoute({ 
          distance: routeData.distance.value, // metre
          duration: routeData.duration.value, // saniye
          polyline: polylinePoints 
        });

        if (shouldFitMap && mapRef.current) {
          mapRef.current.fitToCoordinates(polylinePoints, { 
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, 
            animated: true 
          });
        }
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API KEY GEÇERSİZ:', data.error_message);
        calculateSimpleRoute(origin, destination);
      } else if (data.status === 'ZERO_RESULTS') {
        console.warn('⚠️ Rota bulunamadı');
        calculateSimpleRoute(origin, destination);
      } else {
        console.warn('⚠️ Google Directions API hatası:', data.status, data.error_message);
        calculateSimpleRoute(origin, destination);
      }
    } catch (error) {
      console.error('❌ Route fetch error:', error);
      calculateSimpleRoute(origin, destination);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const calculateSimpleRoute = (
    origin: { latitude: number; longitude: number }, 
    destination: { latitude: number; longitude: number }
  ) => {
    console.log('⚠️ Tahmini rota hesaplanıyor (kuş uçuşu)');
    const straightDistance = calculateDistance(
      origin.latitude, 
      origin.longitude, 
      destination.latitude, 
      destination.longitude
    );
    const roadDistance = straightDistance * 1.2;
    const averageSpeed = 30;
    
    const estimatedDurationHours = roadDistance / averageSpeed;
    const estimatedDuration = estimatedDurationHours * 3600;

    console.log('📊 Tahmini rota:', {
      kuşUçuşu: straightDistance.toFixed(2) + ' km',
      tahminiYol: roadDistance.toFixed(2) + ' km',
      tahminiSüre: Math.round(estimatedDuration / 60) + ' dk'
    });

    setRoute({ 
      distance: roadDistance * 1000,
      duration: estimatedDuration, 
      polyline: [origin, destination] 
    });
  };

  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let shift = 0, result = 0, byte;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni', 'GPS kullanımı için izin gerekli');
        return;
      }

      setIsTracking(true);
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const initialLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCurrentLocation(initialLocation);

      if (user?._id) {
        courierSocketService.sendLocation({
          courierId: user._id,
          lat: initialLocation.latitude,
          lng: initialLocation.longitude,
          speed: location.coords.speed || 0,
          accuracy: location.coords.accuracy || undefined,
          heading: location.coords.heading || undefined,
          timestamp: Date.now(),
        });
      }

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (location) => {
          const newLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          setCurrentLocation(newLocation);

          if (user?._id && socketService.isConnected()) {
            courierSocketService.sendLocation({
              courierId: user._id,
              lat: newLocation.latitude,
              lng: newLocation.longitude,
              speed: location.coords.speed || 0,
              accuracy: location.coords.accuracy || undefined,
              heading: location.coords.heading || undefined,
              timestamp: Date.now(),
            });
          }
        }
      );

      locationSubscriptionRef.current = subscription;
    } catch (error) {
      console.error('Tracking error:', error);
      Alert.alert('Hata', 'GPS konumu alınamadı');
      setIsTracking(false);
    }
  };

  const handleDeliver = () => {
    if (!activeOrder) return;

    Alert.alert('Teslim Edildi', 'Siparişi teslim edildi olarak işaretlemek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Teslim Edildi',
        onPress: async () => {
          try {
            await deliverOrder(activeOrder._id);
            if (locationSubscriptionRef.current) {
              locationSubscriptionRef.current.remove();
              locationSubscriptionRef.current = null;
            }
            if (user?._id) {
              courierSocketService.stopDelivery({ courierId: user._id, orderId: activeOrder._id });
            }
            Alert.alert('Başarılı!', 'Sipariş teslim edildi.', [
              { text: 'Tamam', onPress: () => { fetchOrders(); router.replace('/(courier)'); } },
            ]);
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'İşlem başarısız');
          }
        },
      },
    ]);
  };

  const handleMapPanDrag = () => { setIsAutoFollow(false); };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) return `${hours} sa ${remainingMinutes} dk`;
    return `${minutes} dk`;
  };

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top']}>
        <View style={styles.emptyContent}>
          <Ionicons name="bicycle-outline" size={80} color={COLORS.GRAY[300]} />
          <Text style={styles.emptyTitle}>Aktif Teslimat Yok</Text>
          <Text style={styles.emptyText}>Sipariş kabul ettiğinizde harita burada görünecek</Text>
          <TouchableOpacity style={styles.goButton} onPress={() => router.push('/(courier)/orders')}>
            <Text style={styles.goButtonText}>Siparişlere Git</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const deliveryLocation = { latitude: activeOrder.deliveryLat, longitude: activeOrder.deliveryLng };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 10 + insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teslimat</Text>
        <View style={{ width: 40 }} />
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || activeOrder.deliveryLat,
          longitude: currentLocation?.longitude || activeOrder.deliveryLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onPanDrag={handleMapPanDrag}
      >
        {currentLocation && (
          <Marker 
            coordinate={currentLocation} 
            anchor={{ x: 0.5, y: 0.5 }} 
            flat 
            tracksViewChanges={!markerReady} 
            onLayout={() => setMarkerReady(true)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="bicycle" size={22} color="#fff" />
            </View>
          </Marker>
        )}

        <Marker 
          coordinate={deliveryLocation} 
          title="Teslimat Adresi" 
          description={activeOrder.deliveryAddress}
        >
          <View style={styles.deliveryMarker}>
            <Ionicons name="location" size={40} color={COLORS.ERROR} />
          </View>
        </Marker>

        {route && route.polyline.length > 0 && (
          <Polyline 
            coordinates={route.polyline} 
            strokeColor={COLORS.PRIMARY} 
            strokeWidth={4} 
            lineDashPattern={[1, 0]} 
          />
        )}
      </MapView>

      {!isAutoFollow && currentLocation && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            setIsAutoFollow(true);
            if (mapRef.current && currentLocation) {
              mapRef.current.animateCamera({ center: currentLocation, zoom: 15 }, { duration: 300 });
            }
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      )}

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom }]}>
        <View style={styles.dragHandle} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="map" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.statValue}>{route ? (route.distance / 1000).toFixed(1) : '---'} km</Text>
            <Text style={styles.statLabel}>Mesafe</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={18} color={COLORS.WARNING} />
            <Text style={styles.statValue}>{route ? formatDuration(route.duration) : '---'}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cash" size={18} color={COLORS.SUCCESS} />
            <Text style={styles.statValue}>₺{(activeOrder.total * 0.1).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Kazanç</Text>
          </View>
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.infoTitle}>Teslimat Adresi</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color={COLORS.ERROR} />
            <Text style={styles.addressText}>{activeOrder.deliveryAddress}</Text>
          </View>
        </View>

        {activeOrder.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text" size={14} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.notesText}>{activeOrder.notes}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <View style={styles.gpsStatus}>
            <View style={[styles.gpsIndicator, isTracking && styles.gpsActive]} />
            <Text style={styles.gpsText}>{isTracking ? 'GPS Aktif' : 'GPS Bağlanıyor...'}</Text>
          </View>
          <View style={styles.socketStatus}>
            <View style={[styles.socketIndicator, isSocketConnected && styles.socketActive]} />
            <Text style={styles.socketText}>{isSocketConnected ? 'Canlı' : 'Bağlanıyor...'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deliverButton} onPress={handleDeliver}>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" />
          <Text style={styles.deliverButtonText}>Teslim Edildi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY[50] },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[50],
    padding: 24,
  },
  emptyContent: { alignItems: 'center', maxWidth: 300 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.TEXT, marginTop: 24 },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  goButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  goButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#ff6b00', 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT },
  map: { flex: 1 },
  deliveryMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterButton: {
    position: 'absolute',
    top: 270,
    right: 16,
    backgroundColor: '#FFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.GRAY[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.GRAY[200],
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.TEXT },
  statLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY },
  addressSection: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  addressText: { flex: 1, fontSize: 14, color: COLORS.TEXT, lineHeight: 20 },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
    padding: 10,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 8,
  },
  notesText: { flex: 1, fontSize: 12, color: COLORS.TEXT, lineHeight: 16 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 6,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY[400],
  },
  gpsActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  gpsText: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socketIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY[400],
  },
  socketActive: {
    backgroundColor: COLORS.INFO,
  },
  socketText: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deliverButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});