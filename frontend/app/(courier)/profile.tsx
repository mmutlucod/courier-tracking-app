import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

const getVehicleTypeDisplay = (vehicleType?: string): string => {
  const vehicleTypes: { [key: string]: string } = {
    bicycle: '🚲 Bisiklet',
    motorcycle: '🏍️ Motosiklet',
    car: '🚗 Araba',
  };
  return vehicleTypes[vehicleType || ''] || '❓ Belirtilmemiş';
};

export default function CourierProfile() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const { orders } = useOrderStore();

  useEffect(() => { refreshProfile(); }, []);

  const myOrders = orders.filter((o) => {
    const orderCourierId = typeof o.courierId === 'object' ? o.courierId._id : o.courierId;
    return orderCourierId?.toString() === user?._id?.toString();
  });

  const completedOrders = myOrders.filter((o) => o.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.total * 0.1, 0);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.name}>{user.name || ''}</Text>
          <Text style={styles.email}>{user.email || ''}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.ratingText}>{(user.rating || 5.0).toFixed(1)} ({user.totalDeliveries || 0} teslimat)</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(courier)/profile-edit')}>
            <Ionicons name="create" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.SUCCESS} />
            <Text style={styles.statValue}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color={COLORS.WARNING} />
            <Text style={styles.statValue}>₺{totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Toplam Kazanç</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilgilerim</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email || ''}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user.phone || ''}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="bicycle" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Araç Tipi</Text>
                <Text style={styles.infoValue}>{getVehicleTypeDisplay(user.vehicleType)}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name={user.isAvailable ? 'checkmark-circle' : 'close-circle'} size={20} color={user.isAvailable ? COLORS.SUCCESS : COLORS.ERROR} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Durum</Text>
                <Text style={[styles.infoValue, { color: user.isAvailable ? COLORS.SUCCESS : COLORS.ERROR }]}>
                  {user.isAvailable ? 'Müsait' : 'Meşgul'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diğer</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(courier)/history')}>
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={20} color={COLORS.TEXT} />
            </View>
            <Text style={styles.actionText}>Sipariş Geçmişi</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color={COLORS.ERROR} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
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
    backgroundColor: COLORS.GRAY[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.TEXT, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 8 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT, marginBottom: 12 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.TEXT },
  divider: {
    height: 1,
    backgroundColor: COLORS.GRAY[200],
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  actionDivider: {
    height: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FEE',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.ERROR },
});