import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

export default function CourierOrders() {
  const router = useRouter();
  const { activeOrders, fetchActiveOrders, assignOrder } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchActiveOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveOrders();
    setRefreshing(false);
  };

  const handleAccept = (orderId: string) => {
    Alert.alert('Sipariş Kabul', 'Bu siparişi kabul ediyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kabul Et',
        onPress: async () => {
          try {
            await assignOrder(orderId);
            Alert.alert('Başarılı!', 'Sipariş kabul edildi. Teslimat sayfasına yönlendiriliyorsunuz.', [
              { text: 'Tamam', onPress: () => router.push('/(courier)/tracking') },
            ]);
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Sipariş kabul edilemedi');
          }
        },
      },
    ]);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yeni Siparişler</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bekleyen Siparişler ({activeOrders.length})</Text>

          {activeOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Yeni sipariş yok</Text>
              <Text style={styles.emptySubtext}>Yeni siparişler burada görünecek</Text>
            </View>
          ) : (
            activeOrders.map((order) => {
              const distance = calculateDistance(
                order.pickupLat || 0,
                order.pickupLng || 0,
                order.deliveryLat || 0,
                order.deliveryLng || 0
              );
              const earning = (order.total || 0) * 0.1;
              const distanceText = isNaN(distance) ? '0.0' : distance.toFixed(1);
              const earningText = isNaN(earning) ? '0.00' : earning.toFixed(2);
              const totalText = isNaN(order.total) ? '0.00' : order.total.toFixed(2);

              return (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderIdBadge}>
                      <Text style={styles.orderIdText}>#{(order._id || '------').slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Restoranda</Text>
                    </View>
                  </View>
                  <View style={styles.addressesContainer}>
                    <View style={styles.addressRow}>
                      <Ionicons name="radio-button-on" size={14} color={COLORS.SUCCESS} />
                      <Text style={styles.addressLabel}>Alış:</Text>
                      <Text style={styles.addressText} numberOfLines={1}>{order.pickupAddress || 'Adres belirtilmemiş'}</Text>
                    </View>
                    <View style={styles.addressDivider} />
                    <View style={styles.addressRow}>
                      <Ionicons name="location" size={14} color={COLORS.ERROR} />
                      <Text style={styles.addressLabel}>Teslimat:</Text>
                      <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress || 'Adres belirtilmemiş'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                      <Ionicons name="navigate" size={16} color={COLORS.TEXT_SECONDARY} />
                      <Text style={styles.infoText}>{distanceText} km</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="cash" size={16} color={COLORS.SUCCESS} />
                      <Text style={styles.infoText}>₺{earningText} kazanç</Text>
                    </View>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sipariş Tutarı:</Text>
                    <Text style={styles.totalValue}>₺{totalText}</Text>
                  </View>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(order._id)}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.acceptButtonText}>Kabul Et</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.GRAY[50] 
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 20 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.TEXT },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT, marginBottom: 16 },
  emptyState: {
    backgroundColor: '#FFF',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.TEXT, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 8 },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdBadge: {
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderIdText: { fontSize: 12, fontWeight: '700', color: COLORS.TEXT },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
  },
  pendingText: { fontSize: 12, fontWeight: '600', color: COLORS.WARNING },
  addressesContainer: { marginBottom: 16 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_SECONDARY },
  addressText: { flex: 1, fontSize: 13, color: COLORS.TEXT },
  addressDivider: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.GRAY[200],
    marginLeft: 7,
    marginVertical: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});