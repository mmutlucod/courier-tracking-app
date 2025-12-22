import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressesApi } from '../../services/api/addresses';
import { COLORS } from '../../utils/constants';

interface Address {
  _id: string;
  title: string;
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  neighbourhood?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadAddresses(); }, []));

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await addressesApi.list();
      setAddresses(response.addresses || []);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Adresler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (isSettingDefault) return;
    try {
      setIsSettingDefault(addressId);
      setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: addr._id === addressId })));
      await addressesApi.setDefault(addressId);
      await loadAddresses();
    } catch (error: any) {
      await loadAddresses();
      Alert.alert('Hata', error.message || 'Varsayılan adres ayarlanamadı');
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    Alert.alert('Adres Sil', 'Bu adresi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(addressId);
            await addressesApi.delete(addressId);
            await loadAddresses();
            Alert.alert('Başarılı', 'Adres silindi');
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Adres silinemedi');
          } finally {
            setIsDeleting(null);
          }
        },
      },
    ]);
  };

  const renderAddressCard = ({ item }: { item: Address }) => {
    const isDeleting_ = isDeleting === item._id;
    const isSettingDefault_ = isSettingDefault === item._id;

    return (
      <View style={[styles.addressCard, item.isDefault && styles.addressCardDefault]}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleRow}>
            <View style={[styles.iconBadge, item.isDefault && styles.iconBadgeDefault]}>
              {isSettingDefault_ ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Ionicons name={item.isDefault ? 'star' : 'location'} size={20} color={item.isDefault ? COLORS.WARNING : COLORS.PRIMARY} />
              )}
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.addressTitle}>{item.title}</Text>
              {item.isDefault && <Text style={styles.defaultLabel}>Varsayılan Adres</Text>}
            </View>
          </View>
          <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleDelete(item._id)} disabled={isDeleting_ || isSettingDefault_}>
            {isDeleting_ ? <ActivityIndicator size="small" color={COLORS.ERROR} /> : <Ionicons name="trash-outline" size={22} color={COLORS.ERROR} />}
          </TouchableOpacity>
        </View>

        <View style={styles.addressBody}>
          <Text style={styles.addressText}>{item.fullAddress}</Text>
          {item.directions && (
            <View style={styles.directionsBox}>
              <Ionicons name="information-circle" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.addressDirections}>{item.directions}</Text>
            </View>
          )}
        </View>

        <View style={styles.addressActions}>
          {!item.isDefault && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleSetDefault(item._id)} disabled={isSettingDefault !== null}>
              <Ionicons name="star" size={16} color={COLORS.WARNING} />
              <Text style={styles.actionButtonText}>Varsayılan Yap</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionButton, item.isDefault && styles.actionButtonFull]} onPress={() => router.push(`/(customer)/address-edit?id=${item._id}`)} disabled={isSettingDefault_ || isDeleting_}>
            <Ionicons name="create" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Düzenle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="location-outline" size={48} color={COLORS.PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>Henüz adres eklenmemiş</Text>
      <Text style={styles.emptySubtitle}>Sipariş verebilmek için en az bir adres eklemelisiniz</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(customer)/address-add')}>
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>İlk Adresimi Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Adreslerim</Text>
        {addresses.length > 0 ? (
          <TouchableOpacity style={styles.addIconButton} onPress={() => router.push('/(customer)/address-add')}>
            <Ionicons name="add-circle" size={28} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Adresler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 32 + insets.bottom }]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  addIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  addressCardDefault: {
    borderColor: COLORS.WARNING,
    backgroundColor: '#FFFBF0',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeDefault: {
    backgroundColor: '#FFF5E6',
  },
  titleColumn: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  defaultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WARNING,
  },
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBody: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  directionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  addressDirections: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY[300],
  },
  actionButtonFull: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});