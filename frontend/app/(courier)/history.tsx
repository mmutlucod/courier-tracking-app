import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

type FilterType = 'today' | 'week' | 'month' | 'all';

export default function CourierHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('today');

  useEffect(() => { fetchOrders(); }, []);

  const myCompletedOrders = orders.filter((o) => {
    const orderCourierId = typeof o.courierId === 'object' ? o.courierId._id : o.courierId;
    return orderCourierId?.toString() === user?._id?.toString() && o.status === 'delivered';
  });

  const getFilteredOrders = () => {
    const now = new Date();
    return myCompletedOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (filter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalEarnings = filteredOrders.reduce((sum, order) => sum + (order.total * 0.1), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Siparişler yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Geçmiş</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
          {[
            { key: 'today', label: 'Bugün' },
            { key: 'week', label: 'Bu Hafta' },
            { key: 'month', label: 'Bu Ay' },
            { key: 'all', label: 'Tümü' },
          ].map((item) => (
            <View
              key={item.key}
              style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
              onTouchEnd={() => setFilter(item.key as FilterType)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Toplam Kazanç</Text>
              <Text style={styles.earningsValue}>₺{totalEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsIconContainer}>
              <Ionicons name="cash" size={32} color={COLORS.SUCCESS} />
            </View>
          </View>
          <View style={styles.earningsFooter}>
            <View style={styles.earningsInfo}>
              <Ionicons name="cube" size={16} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.earningsInfoText}>{filteredOrders.length} sipariş</Text>
            </View>
            <View style={styles.earningsInfo}>
              <Ionicons name="trending-up" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.earningsInfoText}>%10 komisyon</Text>
            </View>
            {filteredOrders.length > 0 && (
              <View style={styles.earningsInfo}>
                <Ionicons name="analytics" size={16} color={COLORS.PRIMARY} />
                <Text style={styles.earningsInfoText}>
                  Ort: ₺{(totalEarnings / filteredOrders.length).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tamamlanan Siparişler ({filteredOrders.length})</Text>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Sipariş bulunamadı</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'today' ? 'Bugün henüz tamamlanmış sipariş yok' :
                 filter === 'week' ? 'Bu hafta tamamlanmış sipariş yok' :
                 filter === 'month' ? 'Bu ay tamamlanmış sipariş yok' :
                 'Henüz tamamlanmış sipariş yok'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdBadge}>
                    <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.SUCCESS} />
                    <Text style={styles.statusText}>Teslim Edildi</Text>
                  </View>
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="time" size={14} color={COLORS.TEXT_SECONDARY} />
                  <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={styles.addressContainer}>
                  <View style={styles.addressRow}>
                    <Ionicons name="radio-button-on" size={14} color={COLORS.SUCCESS} />
                    <Text style={styles.addressText} numberOfLines={1}>{order.pickupAddress}</Text>
                  </View>
                  <View style={styles.addressDivider} />
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={14} color={COLORS.ERROR} />
                    <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress}</Text>
                  </View>
                </View>
                {order.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="document-text" size={12} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.notesText} numberOfLines={1}>{order.notes}</Text>
                  </View>
                )}
                <View style={styles.orderFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Sipariş:</Text>
                    <Text style={styles.priceValue}>₺{order.total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.earningContainer}>
                    <Text style={styles.earningLabel}>Kazancım:</Text>
                    <Text style={styles.earningValue}>+₺{(order.total * 0.1).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: COLORS.GRAY[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[50],
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
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.TEXT,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.SUCCESS,
  },
  earningsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  earningsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdBadge: {
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  addressContainer: {
    backgroundColor: COLORS.GRAY[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressDivider: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.GRAY[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.TEXT,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  earningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  earningValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
});