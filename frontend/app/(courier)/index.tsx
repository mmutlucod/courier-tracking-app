import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

export default function CourierDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, fetchOrders } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const myOrders = orders.filter((o) => {
    const orderCourierId = typeof o.courierId === 'object' ? o.courierId._id : o.courierId;
    return orderCourierId?.toString() === user?._id?.toString();
  });

  const activeOrders = myOrders.filter((o) => o.status === 'in_transit');
  const today = new Date().toDateString();
  const todayOrders = myOrders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const completedToday = todayOrders.filter((o) => o.status === 'delivered').length;
  const totalEarnings = todayOrders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total * 0.1, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba 👋</Text>
            <Text style={styles.name}>{user?.name || 'Kurye'}</Text>
          </View>
          <TouchableOpacity style={styles.statusBadge} onPress={() => router.push('/(courier)/profile')}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.SUCCESS }]} />
            <Text style={styles.statusText}>Müsait</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Aktif Teslimat</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.SUCCESS} />
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Bugün Tamamlanan</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Bugünkü Kazanç</Text>
              <Text style={styles.earningsValue}>₺{totalEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsIcon}>
              <Ionicons name="cash" size={32} color={COLORS.SUCCESS} />
            </View>
          </View>
          <Text style={styles.earningsSubtext}>%10 komisyon üzerinden</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(courier)/orders')}>
              <LinearGradient colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]} style={styles.actionGradient}>
                <Ionicons name="list" size={24} color="#FFF" />
                <Text style={styles.actionText}>Yeni Siparişler</Text>
              </LinearGradient>
            </TouchableOpacity>

            {activeOrders.length > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(courier)/tracking')}>
                <LinearGradient colors={[COLORS.INFO, '#1976D2']} style={styles.actionGradient}>
                  <Ionicons name="navigate" size={24} color="#FFF" />
                  <Text style={styles.actionText}>Teslimat Yap</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif Teslimatlar</Text>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={48} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Aktif teslimat yok</Text>
            </View>
          ) : (
            activeOrders.map((order) => (
              <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => router.push(`/tracking`)}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</Text>
                  <View style={styles.inTransitBadge}>
                    <Text style={styles.inTransitText}>Yolda</Text>
                  </View>
                </View>
                <View style={styles.orderAddress}>
                  <Ionicons name="location" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.orderAddressText} numberOfLines={1}>{order.deliveryAddress}</Text>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>₺{order.total.toFixed(2)}</Text>
                  <Text style={styles.orderEarning}>+₺{(order.total * 0.1).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))
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
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  greeting: { fontSize: 16, color: COLORS.TEXT_SECONDARY, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.TEXT, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.SUCCESS },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '800', color: COLORS.TEXT, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  earningsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 8 },
  earningsValue: { fontSize: 32, fontWeight: '800', color: COLORS.SUCCESS },
  earningsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsSubtext: { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT, marginBottom: 16 },
  actionsContainer: { gap: 12 },
  actionButton: { borderRadius: 12, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyState: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 12 },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: { fontSize: 12, fontWeight: '700', color: COLORS.TEXT },
  inTransitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E6F7FF',
    borderRadius: 8,
  },
  inTransitText: { fontSize: 12, fontWeight: '600', color: COLORS.INFO },
  orderAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  orderAddressText: { flex: 1, fontSize: 14, color: COLORS.TEXT },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT },
  orderEarning: { fontSize: 16, fontWeight: '700', color: COLORS.SUCCESS },
});