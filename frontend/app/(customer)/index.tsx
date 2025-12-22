import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderDetailModal from '../../components/order-detail-modal';
import RatingModal from '../../components/rating-modal';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { useRatingStore } from '../../store/rating-store';
import { COLORS, ORDER_STATUS_LABELS } from '../../utils/constants';

export default function CustomerHome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders, fetchOrders, cancelOrder } = useOrderStore();
  const { ratings, fetchMyRatings } = useRatingStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const activeOrders = orders.filter((o) => {
    const orderCustomerId = typeof o.customerId === 'object' ? o.customerId._id : o.customerId;
    const currentUserId = user?._id;
    const isMyOrder = orderCustomerId?.toString() === currentUserId?.toString();
    const isActive = ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status);
    return isMyOrder && isActive;
  });

  useEffect(() => {
    fetchOrders();
    fetchMyRatings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchMyRatings()]);
    setRefreshing(false);
  };

  const handleOrderPress = useCallback((order: any) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalVisible(false);
  }, []);

  const handleCancelOrder = useCallback((orderId: string) => {
    Alert.alert(
      'Siparişi İptal Et',
      'Bu siparişi iptal etmek istediğinize emin misiniz?',
      [
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
      ]
    );
  }, [cancelOrder, fetchOrders]);

  const handleOpenRating = useCallback((order: any) => {
    setSelectedOrder(order);
    setRatingModalVisible(true);
  }, []);

  const handleCloseRating = useCallback(() => {
    setRatingModalVisible(false);
  }, []);

  const handleRatingSuccess = useCallback(() => {
    fetchOrders();
    fetchMyRatings();
  }, [fetchOrders, fetchMyRatings]);

  const ratedOrderIds = useMemo(() => 
    new Set(ratings.map(r => 
      typeof r.orderId === 'object' ? r.orderId._id : r.orderId
    ))
  , [ratings]);

  const isOrderRated = useCallback((orderId: string) => 
    ratedOrderIds.has(orderId) // O(1) ✅
  , [ratedOrderIds]);

  const getCourierName = useCallback((order: any): string => {
    if (!order.courierId) return 'Henüz atanmadı';
    return typeof order.courierId === 'object' ? order.courierId.name : 'Kurye';
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#FFF5E6',
      assigned: '#E6F7FF',
      picked_up: '#E6F7FF',
      in_transit: '#FFF5F0',
    };
    return colors[status as keyof typeof colors] || '#F5F5F5';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba 👋</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              logout();
              router.replace('/auth/login');
            }}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.ERROR} />
          </TouchableOpacity>
        </View>

        {/* New Order Card */}
        <TouchableOpacity
          style={styles.newOrderCard}
          onPress={() => router.push('/(customer)/new-order')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newOrderGradient}
          >
            <View style={styles.newOrderIcon}>
              <Ionicons name="add-circle-outline" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.newOrderTitle}>Yeni Sipariş Oluştur</Text>
            <Text style={styles.newOrderSubtext}>Hızlı ve güvenilir teslimat</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(customer)/orders')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="list" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.actionText}>Siparişlerim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(customer)/profile')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="person" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.actionText}>Profilim</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aktif Siparişler</Text>
            {activeOrders.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </View>

          {activeOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Aktif sipariş yok</Text>
              <Text style={styles.emptySubtext}>
                Yeni sipariş oluşturmak için yukarıdaki butona tıklayın
              </Text>
            </View>
          ) : (
            activeOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>
                      #{order._id.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <View style={styles.orderAddress}>
                    <Ionicons name="radio-button-on" size={14} color={COLORS.SUCCESS} />
                    <Text style={styles.orderAddressText} numberOfLines={1}>
                      {order.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.addressDivider} />
                  <View style={styles.orderAddress}>
                    <Ionicons name="location" size={14} color={COLORS.ERROR} />
                    <Text style={styles.orderAddressText} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>₺{order.total.toFixed(2)}</Text>
                  <View style={styles.orderAction}>
                    <Text style={styles.orderActionText}>Detaylar</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={detailModalVisible}
        order={selectedOrder}
        onClose={handleCloseDetailModal}
        onCancelOrder={handleCancelOrder}
        onRateOrder={handleOpenRating}
        isRated={selectedOrder ? isOrderRated(selectedOrder._id) : false}
      />

      {/* Rating Modal */}
      {ratingModalVisible && selectedOrder && (
        <RatingModal
          visible={ratingModalVisible}
          orderId={selectedOrder._id}
          courierName={getCourierName(selectedOrder)}
          onClose={handleCloseRating}
          onSuccess={handleRatingSuccess}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  greeting: { 
    fontSize: 16, 
    color: COLORS.TEXT_SECONDARY, 
    fontWeight: '500' 
  },
  name: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.TEXT, 
    marginTop: 4 
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newOrderCard: { 
    margin: 16 
  },
  newOrderGradient: { 
    padding: 32, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  newOrderIcon: { 
    marginBottom: 16 
  },
  newOrderTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 8 
  },
  newOrderSubtext: { 
    fontSize: 14, 
    color: '#FFFFFF', 
    opacity: 0.9 
  },
  section: { 
    padding: 16 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.TEXT,
  },
  badge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsContainer: { 
    flexDirection: 'row', 
    gap: 12 
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.TEXT 
  },
  emptyState: { 
    backgroundColor: '#FFFFFF', 
    padding: 40, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.TEXT, 
    marginTop: 16 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: COLORS.TEXT_SECONDARY, 
    marginTop: 8, 
    textAlign: 'center' 
  },
  orderCard: { 
    backgroundColor: '#FFFFFF', 
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
  orderBadge: {
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderBadgeText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: COLORS.TEXT 
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.PRIMARY 
  },
  orderBody: {
    marginBottom: 12,
  },
  orderAddress: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
  addressDivider: {
    width: 2,
    height: 8,
    backgroundColor: COLORS.GRAY[200],
    marginLeft: 6,
    marginVertical: 4,
  },
  orderAddressText: { 
    flex: 1, 
    fontSize: 13, 
    color: COLORS.TEXT 
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
  orderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
});