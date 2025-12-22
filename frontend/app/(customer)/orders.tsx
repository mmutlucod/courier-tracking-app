import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OrderDetailModal from '../../components/order-detail-modal';
import RatingModal from '../../components/rating-modal';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { useRatingStore } from '../../store/rating-store';
import { COLORS, ORDER_STATUS_LABELS } from '../../utils/constants';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export default function CustomerOrders() {
  const { user } = useAuth();
  const { orders, fetchOrders, cancelOrder } = useOrderStore();
  const { ratings, fetchMyRatings } = useRatingStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const formatNumber = useCallback((value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(Number(value))) return '0' + '.'.repeat(decimals > 0 ? 1 : 0) + '0'.repeat(decimals);
    return Number(value).toFixed(decimals);
  }, []);

  const myOrders = useMemo(() => orders.filter((o) => {
    const orderCustomerId = typeof o.customerId === 'object' ? o.customerId._id : o.customerId;
    const currentUserId = user?._id;
    return orderCustomerId?.toString() === currentUserId?.toString();
  }), [orders, user]);

  const getFilteredOrders = useCallback(() => {
    switch (filter) {
      case 'active': return myOrders.filter(o => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status));
      case 'completed': return myOrders.filter(o => o.status === 'delivered');
      case 'cancelled': return myOrders.filter(o => o.status === 'cancelled');
      default: return myOrders;
    }
  }, [filter, myOrders]);

  const filteredOrders = useMemo(() => getFilteredOrders(), [getFilteredOrders]);

  const filterCounts = useMemo(() => ({
    all: myOrders.length,
    active: myOrders.filter(o => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status)).length,
    completed: myOrders.filter(o => o.status === 'delivered').length,
    cancelled: myOrders.filter(o => o.status === 'cancelled').length,
  }), [myOrders]);

  useEffect(() => { fetchOrders(); fetchMyRatings(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchMyRatings()]);
    setRefreshing(false);
  }, []);

  const handleOrderPress = useCallback((order: any) => { setSelectedOrder(order); setDetailModalVisible(true); }, []);
  const handleCloseDetailModal = useCallback(() => { setDetailModalVisible(false); }, []);

  const handleCancelOrder = useCallback((orderId: string) => {
    Alert.alert('Siparişi İptal Et', 'Bu siparişi iptal etmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(orderId);
            Alert.alert('Başarılı', 'Sipariş iptal edildi');
            fetchOrders();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'İptal edilemedi');
          }
        },
      },
    ]);
  }, [cancelOrder, fetchOrders]);

  const handleOpenRating = useCallback((order: any) => { setSelectedOrder(order); setRatingModalVisible(true); }, []);
  const handleCloseRating = useCallback(() => { setRatingModalVisible(false); }, []);
  const handleRatingSuccess = useCallback(() => { fetchOrders(); fetchMyRatings(); }, [fetchOrders, fetchMyRatings]);

  const ratedOrderIds = useMemo(() => 
    new Set(ratings.map(r => 
      typeof r.orderId === 'object' ? r.orderId._id : r.orderId
    ))
  , [ratings]);

  const isOrderRated = useCallback((orderId: string) => 
    ratedOrderIds.has(orderId) 
  , [ratedOrderIds]);

  const getStatusColor = useCallback((status: string) => {
    const statusColors = {
      pending: { bg: '#FFF5E6', text: COLORS.WARNING },
      assigned: { bg: '#E6F7FF', text: COLORS.INFO },
      picked_up: { bg: '#E6F7FF', text: COLORS.INFO },
      in_transit: { bg: '#FFF5F0', text: COLORS.PRIMARY },
      delivered: { bg: '#E8F5E9', text: COLORS.SUCCESS },
      cancelled: { bg: '#FEE', text: COLORS.ERROR },
    };
    return statusColors[status as keyof typeof statusColors] || { bg: COLORS.GRAY[100], text: COLORS.TEXT_SECONDARY };
  }, []);

  const formatDateShort = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }, []);

  const getCourierName = useCallback((order: any): string => {
    if (!order.courierId) return 'Henüz atanmadı';
    return typeof order.courierId === 'object' ? order.courierId.name : 'Kurye';
  }, []);

  const filterButtons = useMemo(() => [
    { key: 'all' as FilterType, label: 'Tümü', count: filterCounts.all },
    { key: 'active' as FilterType, label: 'Aktif', count: filterCounts.active },
    { key: 'completed' as FilterType, label: 'Tamamlanan', count: filterCounts.completed },
    { key: 'cancelled' as FilterType, label: 'İptal', count: filterCounts.cancelled },
  ], [filterCounts]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Siparişlerim</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
          {filterButtons.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.filterButton, filter === item.key && styles.filterButtonActive]} onPress={() => setFilter(item.key)}>
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              {item.count > 0 && (
                <View style={[styles.filterBadge, filter === item.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === item.key && styles.filterBadgeTextActive]}>{item.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Sipariş bulunamadı</Text>
              <Text style={styles.emptySubtext}>{filter === 'all' ? 'Henüz sipariş vermediniz' : 'Bu filtre için sipariş yok'}</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const statusColor = getStatusColor(order.status);
              const isRated = isOrderRated(order._id);

              return (
                <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => handleOrderPress(order)} activeOpacity={0.7}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderIdBadge}>
                      <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                      <Text style={[styles.statusText, { color: statusColor.text }]}>{ORDER_STATUS_LABELS[order.status]}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Ionicons name="time" size={14} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.dateText}>{formatDateShort(order.createdAt)}</Text>
                  </View>

                  <View style={styles.addressesContainer}>
                    <View style={styles.addressRow}>
                      <Ionicons name="radio-button-on" size={12} color={COLORS.SUCCESS} />
                      <Text style={styles.addressText} numberOfLines={1}>{order.pickupAddress}</Text>
                    </View>
                    <View style={styles.addressDivider} />
                    <View style={styles.addressRow}>
                      <Ionicons name="location" size={12} color={COLORS.ERROR} />
                      <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.orderAmount}>₺{formatNumber(order.total)}</Text>
                    {isRated && order.status === 'delivered' && (
                      <View style={styles.ratedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                        <Text style={styles.ratedBadgeText}>Değerlendirildi</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <OrderDetailModal visible={detailModalVisible} order={selectedOrder} onClose={handleCloseDetailModal} onCancelOrder={handleCancelOrder} onRateOrder={handleOpenRating} isRated={selectedOrder ? isOrderRated(selectedOrder._id) : false} />

      {ratingModalVisible && selectedOrder && (
        <RatingModal visible={ratingModalVisible} orderId={selectedOrder._id} courierName={getCourierName(selectedOrder)} onClose={handleCloseRating} onSuccess={handleRatingSuccess} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.GRAY[50] 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.TEXT 
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: { 
    backgroundColor: '#FFFFFF', 
    paddingBottom: 16 
  },
  filtersContent: { 
    paddingHorizontal: 24, 
    gap: 8 
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
    gap: 6,
  },
  filterButtonActive: { 
    backgroundColor: COLORS.PRIMARY, 
    borderColor: COLORS.PRIMARY 
  },
  filterText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.TEXT 
  },
  filterTextActive: { 
    color: '#FFFFFF' 
  },
  filterBadge: {
    backgroundColor: COLORS.GRAY[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: { 
    backgroundColor: COLORS.PRIMARY_DARK 
  },
  filterBadgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: COLORS.TEXT 
  },
  filterBadgeTextActive: { 
    color: '#FFFFFF' 
  },
  section: { 
    padding: 16 
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
    marginTop: 16 
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
    color: COLORS.TEXT 
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
  dateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 12 
  },
  dateText: { 
    fontSize: 13, 
    color: COLORS.TEXT_SECONDARY 
  },
  addressesContainer: { 
    marginBottom: 12 
  },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  addressText: { 
    flex: 1, 
    fontSize: 13, 
    color: COLORS.TEXT 
  },
  addressDivider: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.GRAY[200],
    marginLeft: 5,
    marginVertical: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  orderAmount: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.TEXT 
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  ratedBadgeText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.SUCCESS 
  },
});