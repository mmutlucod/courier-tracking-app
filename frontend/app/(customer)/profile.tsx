import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

export default function CustomerProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile } = useAuth();
  const { orders } = useOrderStore();

  const myOrders = orders.filter((o) => {
    const orderCustomerId = typeof o.customerId === 'object' ? o.customerId._id : o.customerId;
    return orderCustomerId?.toString() === user?._id?.toString();
  });

  const completedOrders = myOrders.filter((o) => o.status === 'delivered');
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);

  useFocusEffect(useCallback(() => { refreshProfile(); }, []));

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => { logout(); router.replace('/auth/login'); } },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(customer)/profile-edit')}>
            <Ionicons name="create" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.statValue}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>Toplam Sipariş</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.SUCCESS} />
            <Text style={styles.statValue}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color={COLORS.WARNING} />
            <Text style={styles.statValue}>₺{totalSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Toplam Harcama</Text>
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
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user.phone || 'Belirtilmemiş'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/(customer)/addresses')} activeOpacity={0.7}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Varsayılan Adres</Text>
                {user.defaultAddress ? (
                  <>
                    <Text style={styles.infoValue}>{user.defaultAddress.title}</Text>
                    <Text style={styles.infoSubValue} numberOfLines={2}>{user.defaultAddress.fullAddress}</Text>
                  </>
                ) : (
                  <Text style={styles.infoPlaceholder}>Henüz adres eklenmemiş</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diğer</Text>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(customer)/orders')}>
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={20} color={COLORS.TEXT} />
            </View>
            <Text style={styles.actionText}>Sipariş Geçmişi</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(customer)/ratings')}>
            <View style={styles.actionIcon}>
              <Ionicons name="star" size={20} color={COLORS.TEXT} />
            </View>
            <Text style={styles.actionText}>Değerlendirmelerim</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.GRAY[50] },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[50],
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
  email: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 16 },
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
    textAlign: 'center',
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
  infoSubValue: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    lineHeight: 18,
  },
  infoPlaceholder: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
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