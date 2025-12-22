import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../hooks/useAuth';
import customerSocketService from '../../services/socket/customer-socket';
import socketService from '../../services/socket/socket';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

interface DirectionsRoute { distance: number; duration: number; polyline: { latitude: number; longitude: number }[] }
interface LocationUpdateData { courierId: string; lat: number; lng: number; speed: number; timestamp: number }

export default function CustomerTracking() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { user } = useAuth();
  const { orders, fetchOrders } = useOrderStore();
  const mapRef = useRef<MapView>(null);

  const [route, setRoute] = useState<DirectionsRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [courierLocation, setCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [markerReady, setMarkerReady] = useState(false);

  const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.ios?.config?.googleMapsApiKey || Constants.expoConfig?.android?.config?.googleMaps?.apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const activeOrder = orderId ? orders.find((o) => o._id === orderId) : orders.find((o) => {
    const orderCustomerId = typeof o.customerId === 'object' ? o.customerId._id : o.customerId;
    const isMyOrder = orderCustomerId?.toString() === user?._id?.toString();
    const isActive = o.status === 'in_transit' || o.status === 'picked_up';
    return isMyOrder && isActive;
  });

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (activeOrder && !courierLocation) {
      setCourierLocation({ latitude: activeOrder.pickupLat, longitude: activeOrder.pickupLng });
      console.log('📍 İlk konum (pickup):', { lat: activeOrder.pickupLat, lng: activeOrder.pickupLng });
    }
  }, [activeOrder]);

  useEffect(() => {
    if (!activeOrder || !activeOrder.courierId) return;

    const initTracking = async () => {
      try {
        await socketService.connect();
        setIsSocketConnected(true);
        console.log('✅ Customer socket connected');

        const courierId = typeof activeOrder.courierId === 'object' ? activeOrder.courierId._id : activeOrder.courierId;

        customerSocketService.trackOrder({ orderId: activeOrder._id, customerId: user?._id });

        customerSocketService.onLocationUpdate((locationData: LocationUpdateData) => {
          if (locationData.courierId === courierId) {
            console.log('📍 Kurye konumu güncellendi:', { lat: locationData.lat.toFixed(6), lng: locationData.lng.toFixed(6), timestamp: new Date(locationData.timestamp).toLocaleTimeString() });
            setCourierLocation({ latitude: locationData.lat, longitude: locationData.lng });
            setLocationUpdateCount(prev => prev + 1);
          }
        });

        customerSocketService.onCourierUpdate((data) => { console.log('🚴 Kurye güncellendi:', data); });
        customerSocketService.onError((error) => { console.error('❌ Socket error:', error); });
      } catch (error) {
        console.error('❌ Socket connection failed:', error);
        Alert.alert('Bağlantı Hatası', 'Kurye takibi başlatılamadı');
      }
    };

    initTracking();

    return () => {
      if (activeOrder.courierId) {
        const courierId = typeof activeOrder.courierId === 'object' ? activeOrder.courierId._id : activeOrder.courierId;
        customerSocketService.untrackOrder({ courierId });
      }
      customerSocketService.removeListeners();
    };
  }, [activeOrder?.courierId, activeOrder?._id, user?._id]);

  useEffect(() => {
    if (courierLocation && activeOrder) {
      fetchRoute(courierLocation, { latitude: activeOrder.deliveryLat, longitude: activeOrder.deliveryLng });
    }
  }, [courierLocation, activeOrder]);

  const fetchRoute = async (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {
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

      if (data.status === 'OK' && data.routes.length > 0) {
        const routeData = data.routes[0].legs[0];
        const polylinePoints = decodePolyline(data.routes[0].overview_polyline.points);
        console.log('✅ Rota başarıyla alındı:', { distance: (routeData.distance.value / 1000).toFixed(2) + ' km', duration: Math.floor(routeData.duration.value / 60) + ' dk', points: polylinePoints.length });
        setRoute({ distance: routeData.distance.value, duration: routeData.duration.value, polyline: polylinePoints });
        if (locationUpdateCount <= 1 && mapRef.current) {
          mapRef.current.fitToCoordinates(polylinePoints, { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true });
        }
      } else if (data.status === 'REQUEST_DENIED') {
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

  const calculateSimpleRoute = (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {

    const straightDistance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const roadDistance = straightDistance;
    const averageSpeed = 25;
    const estimatedDuration = (roadDistance / averageSpeed) * 3600;
    setRoute({ distance: roadDistance * 1000, duration: estimatedDuration, polyline: [origin, destination] });
  };

  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons name="cube-outline" size={80} color={COLORS.GRAY[300]} />
          <Text style={styles.emptyTitle}>Aktif Teslimat Yok</Text>
          <Text style={styles.emptyText}>Yolda olan bir siparişiniz bulunmuyor</Text>
          <TouchableOpacity style={styles.goButton} onPress={() => router.replace('/(customer)/orders')}>
            <Text style={styles.goButtonText}>Siparişlere Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const deliveryLocation = { latitude: activeOrder.deliveryLat, longitude: activeOrder.deliveryLng };
  const courierName = typeof activeOrder.courierId === 'object' ? activeOrder.courierId.name : 'Kurye';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sipariş Takip</Text>
        <View style={{ width: 40 }} />
      </View>

      <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ latitude: activeOrder.deliveryLat, longitude: activeOrder.deliveryLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }} showsUserLocation={false} showsMyLocationButton={false}>
        {courierLocation && (
          <Marker coordinate={courierLocation} anchor={{ x: 0.5, y: 0.5 }} flat tracksViewChanges={!markerReady} onLayout={() => setMarkerReady(true)}>
            <View style={styles.markerContainer}>
              <Ionicons name="bicycle" size={28} color="#FFF" />
            </View>
          </Marker>
        )}
        <Marker coordinate={deliveryLocation} title="Teslimat Adresi" description={activeOrder.deliveryAddress}>
          <View style={styles.deliveryMarker}>
            <Ionicons name="location" size={40} color={COLORS.ERROR} />
          </View>
        </Marker>
        {route && route.polyline.length > 0 && <Polyline coordinates={route.polyline} strokeColor={COLORS.PRIMARY} strokeWidth={4} lineDashPattern={[1, 0]} />}
      </MapView>

      <View style={styles.statsOverlay}>
        <View style={styles.statBox}>
          <Ionicons name="map" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.statValue}>{route ? (route.distance / 1000).toFixed(1) : '---'} km</Text>
          <Text style={styles.statLabel}>Kalan Mesafe</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time" size={20} color={COLORS.WARNING} />
          <Text style={styles.statValue}>{route ? formatDuration(route.duration) : '---'}</Text>
          <Text style={styles.statLabel}>Tahmini Süre</Text>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.courierInfo}>
          <View style={styles.courierAvatar}>
            <Ionicons name="person" size={32} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.courierDetails}>
            <Text style={styles.courierName}>{courierName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, isSocketConnected && styles.statusActive]} />
              <Text style={styles.courierSubtext}>{isSocketConnected ? 'Kuryeniz yolda' : 'Bağlanıyor...'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={() => Alert.alert('Arama', 'Kurye arama özelliği yakında eklenecek')}>
            <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.infoTitle}>Teslimat Adresi</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={COLORS.ERROR} />
            <Text style={styles.addressText}>{activeOrder.deliveryAddress}</Text>
          </View>
        </View>

        {activeOrder.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.notesText}>{activeOrder.notes}</Text>
          </View>
        )}

        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Sipariş No:</Text>
          <Text style={styles.orderIdValue}>#{activeOrder._id.slice(-6).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY[50] },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
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
  map: { flex: 1 },
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
  deliveryMarker: { alignItems: 'center', justifyContent: 'center' },
  statsOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT, marginTop: 4 },
  statLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
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
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  courierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courierDetails: { flex: 1 },
  courierName: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY[400],
  },
  statusActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  courierSubtext: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressSection: { marginBottom: 16 },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressText: { flex: 1, fontSize: 16, color: COLORS.TEXT, lineHeight: 22 },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 12,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: { flex: 1, fontSize: 13, color: COLORS.TEXT, lineHeight: 18 },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  orderIdLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
});