import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, ORDER_STATUS_LABELS } from '../utils/constants';

interface OrderDetailModalProps {
  visible: boolean;
  order: any | null;
  onClose: () => void;
  onCancelOrder?: (orderId: string) => void;
  onRateOrder?: (order: any) => void;
  isRated?: boolean;
}

export default function OrderDetailModal({ visible, order, onClose, onCancelOrder, onRateOrder, isRated = false }: OrderDetailModalProps) {
  const router = useRouter();

  const formatNumber = useCallback((value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(Number(value))) return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
    return Number(value).toFixed(decimals);
  }, []);

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

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, []);

  const getCourierName = useCallback((order: any): string => {
    if (!order?.courierId) return 'Henüz atanmadı';
    return typeof order.courierId === 'object' ? order.courierId.name : 'Kurye';
  }, []);

  const getCourierPhone = useCallback((order: any): string => {
    if (!order?.courierId) return '-';
    return typeof order.courierId === 'object' ? order.courierId.phone || '-' : '-';
  }, []);

  const getCourierVehicle = useCallback((order: any): string => {
    if (!order?.courierId) return '-';
    if (typeof order.courierId === 'object') {
      const vehicleEmojis = { bicycle: '🚲 Bisiklet', motorcycle: '🏍️ Motor', car: '🚗 Araba' };
      return vehicleEmojis[order.courierId.vehicleType as keyof typeof vehicleEmojis] || '-';
    }
    return '-';
  }, []);

  const handleTrackOrder = useCallback(() => {
    if (!order?._id) return; // ✅ Null check
    onClose();
    router.push({ pathname: '/(customer)/tracking', params: { orderId: order._id } });
  }, [onClose, router, order]);

  const canCancel = useMemo(() => order?.status === 'pending' || order?.status === 'assigned', [order]);
  const canTrack = useMemo(() => order?.status === 'in_transit' || order?.status === 'picked_up', [order]);
  const canRate = useMemo(() => order?.status === 'delivered' && !isRated, [order, isRated]);

  // ✅ HATA ÇÖZÜMÜ: order null ise hiçbir şey render etme
  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Sipariş Detayı</Text>
                <Text style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status).bg }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status).text }]}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </Text>
              </View>
            </View>

            {order.courierId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kurye Bilgileri</Text>
                <View style={styles.card}>
                  <View style={styles.courierRow}>
                    <View style={styles.courierAvatar}>
                      <Ionicons name="bicycle" size={24} color={COLORS.PRIMARY} />
                    </View>
                    <View style={styles.courierInfo}>
                      <Text style={styles.courierName}>{getCourierName(order)}</Text>
                      <Text style={styles.courierDetail}>{getCourierPhone(order)}</Text>
                      <Text style={styles.courierDetail}>{getCourierVehicle(order)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adres Bilgileri</Text>
              <View style={styles.card}>
                <View style={styles.addressRow}>
                  <View style={styles.addressIcon}>
                    <Ionicons name="radio-button-on" size={20} color={COLORS.SUCCESS} />
                  </View>
                  <View style={styles.addressContent}>
                    <Text style={styles.addressLabel}>Alış Noktası</Text>
                    <Text style={styles.addressText}>{order.pickupAddress || '-'}</Text>
                  </View>
                </View>
                <View style={styles.addressDivider} />
                <View style={styles.addressRow}>
                  <View style={styles.addressIcon}>
                    <Ionicons name="location" size={20} color={COLORS.ERROR} />
                  </View>
                  <View style={styles.addressContent}>
                    <Text style={styles.addressLabel}>Teslimat Noktası</Text>
                    <Text style={styles.addressText}>{order.deliveryAddress || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {order.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sipariş Notu</Text>
                <View style={styles.card}>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fiyat Detayları</Text>
              <View style={styles.card}>
                {order.distance !== undefined && order.distance !== null && (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Mesafe</Text>
                      <Text style={styles.priceValue}>{formatNumber(order.distance, 1)} km</Text>
                    </View>
                    <View style={styles.priceDivider} />
                  </>
                )}
                {order.basePrice !== undefined && order.basePrice !== null && (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Taban Ücret</Text>
                      <Text style={styles.priceValue}>₺{formatNumber(order.basePrice)}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                  </>
                )}
                {order.distancePrice !== undefined && order.distancePrice !== null && (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Mesafe Ücreti</Text>
                      <Text style={styles.priceValue}>₺{formatNumber(order.distancePrice)}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                  </>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotal}>Toplam</Text>
                  <Text style={styles.priceAmount}>₺{formatNumber(order.total)}</Text>
                </View>
              </View>
            </View>

            {order.createdAt && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={16} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.actions}>
              {canTrack && (
                <TouchableOpacity style={styles.trackBtn} onPress={handleTrackOrder}>
                  <Ionicons name="navigate" size={20} color="#FFF" />
                  <Text style={styles.trackBtnText}>Canlı Takip Et</Text>
                </TouchableOpacity>
              )}
              {canCancel && onCancelOrder && (
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => { 
                    onClose(); 
                    onCancelOrder(order._id); 
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.ERROR} />
                  <Text style={styles.cancelBtnText}>Siparişi İptal Et</Text>
                </TouchableOpacity>
              )}
              {canRate && onRateOrder && (
                <TouchableOpacity 
                  style={styles.rateBtn} 
                  onPress={() => { 
                    onClose(); 
                    onRateOrder(order); 
                  }}
                >
                  <Ionicons name="star" size={20} color={COLORS.WARNING} />
                  <Text style={styles.rateBtnText}>Kuryeyi Değerlendir</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.TEXT 
  },
  orderId: { 
    fontSize: 14, 
    color: COLORS.TEXT_SECONDARY, 
    marginTop: 4 
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { 
    marginBottom: 20 
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  card: { 
    backgroundColor: COLORS.GRAY[50], 
    borderRadius: 12, 
    padding: 16 
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  courierRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  courierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierInfo: { 
    flex: 1 
  },
  courierName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.TEXT 
  },
  courierDetail: { 
    fontSize: 13, 
    color: COLORS.TEXT_SECONDARY, 
    marginTop: 2 
  },
  addressRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContent: { 
    flex: 1 
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  addressText: { 
    fontSize: 14, 
    color: COLORS.TEXT, 
    lineHeight: 20 
  },
  addressDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY[200],
    marginVertical: 16,
  },
  notesText: { 
    fontSize: 14, 
    color: COLORS.TEXT, 
    lineHeight: 20 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  priceLabel: { 
    fontSize: 14, 
    color: COLORS.TEXT_SECONDARY 
  },
  priceValue: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.TEXT 
  },
  priceTotal: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.TEXT 
  },
  priceAmount: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.PRIMARY 
  },
  priceDivider: { 
    height: 1, 
    backgroundColor: COLORS.GRAY[200], 
    marginVertical: 12 
  },
  dateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  dateText: { 
    fontSize: 13, 
    color: COLORS.TEXT_SECONDARY 
  },
  actions: { 
    gap: 12 
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  trackBtnText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFF' 
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelBtnText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.ERROR 
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF5E6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  rateBtnText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.WARNING 
  },
});