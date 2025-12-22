import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressesApi } from '../../services/api/addresses';
import { useOrderStore } from '../../store/order-store';
import { COLORS } from '../../utils/constants';

type LocationMode = 'gps' | 'manual' | 'saved';

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

export default function NewOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createOrder, isLoading } = useOrderStore();

  const [formData, setFormData] = useState({ pickupAddress: '', pickupLat: 0, pickupLng: 0, deliveryAddress: '', deliveryLat: 0, deliveryLng: 0, notes: '' });
  const [deliveryMode, setDeliveryMode] = useState<LocationMode>('saved');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => { loadSavedAddresses(); }, []);

  const loadSavedAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await addressesApi.list();
      setSavedAddresses(response.addresses);
      const defaultAddr = response.addresses.find((addr) => addr.isDefault);
      if (defaultAddr && deliveryMode === 'saved') selectSavedAddress(defaultAddr);
    } catch (error: any) {
      console.error('Adresler yüklenemedi:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const selectSavedAddress = (address: Address) => {
    setSelectedAddress(address);
    setFormData((prev) => ({ ...prev, deliveryAddress: address.fullAddress, deliveryLat: address.lat, deliveryLng: address.lng }));
    setShowAddressModal(false);
  };

  const fetchGPSLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError('');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Konum izni gerekli');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setFormData((prev) => ({ ...prev, deliveryLat: location.coords.latitude, deliveryLng: location.coords.longitude }));

      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (address) {
          const addressString = [address.street, address.district, address.city].filter(Boolean).join(', ');
          setFormData((prev) => ({ ...prev, deliveryAddress: addressString || 'Adres bulunamadı' }));
        }
      } catch (error) {
        console.log('Reverse geocoding failed:', error);
        setFormData((prev) => ({ ...prev, deliveryAddress: `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` }));
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Konum alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDeliveryAddressChange = async (text: string) => {
    updateField('deliveryAddress', text);
    if (deliveryMode === 'manual' && text.length >= 10) {
      try {
        const results = await Location.geocodeAsync(text);
        if (results && results.length > 0) {
          const firstResult = results[0];
          setFormData((prev) => ({ ...prev, deliveryLat: firstResult.latitude, deliveryLng: firstResult.longitude }));
        }
      } catch (error) {
        console.log('Geocoding failed:', error);
      }
    }
  };

  const handlePickupAddressChange = async (text: string) => {
    updateField('pickupAddress', text);
    if (text.length >= 10) {
      try {
        const results = await Location.geocodeAsync(text);
        if (results && results.length > 0) {
          const firstResult = results[0];
          setFormData((prev) => ({ ...prev, pickupLat: firstResult.latitude, pickupLng: firstResult.longitude }));
        }
      } catch (error) {
        console.log('Geocoding failed:', error);
      }
    }
  };

  const switchDeliveryMode = (mode: LocationMode) => {
    setDeliveryMode(mode);
    setLocationError('');
    setSelectedAddress(null);
    if (mode === 'gps') {
      fetchGPSLocation();
    } else if (mode === 'saved') {
      const defaultAddr = savedAddresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        selectSavedAddress(defaultAddr);
      } else {
        setFormData((prev) => ({ ...prev, deliveryAddress: '', deliveryLat: 0, deliveryLng: 0 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, deliveryAddress: '', deliveryLat: 0, deliveryLng: 0 }));
    }
  };

  const calculateDistance = () => {
    if (!formData.pickupLat || !formData.deliveryLat) return 0;
    const R = 6371;
    const dLat = ((formData.deliveryLat - formData.pickupLat) * Math.PI) / 180;
    const dLon = ((formData.deliveryLng - formData.pickupLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((formData.pickupLat * Math.PI) / 180) * Math.cos((formData.deliveryLat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = calculateDistance();
  const basePrice = 15;
  const pricePerKm = 5;
  const total = basePrice + distance * pricePerKm;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupAddress.trim()) newErrors.pickupAddress = 'Alış adresi gerekli';
    if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = 'Teslimat adresi gerekli';
    if (!formData.pickupLat || !formData.pickupLng) newErrors.pickupAddress = 'Alış konumu seçilmedi';
    if (!formData.deliveryLat || !formData.deliveryLng) newErrors.deliveryAddress = 'Teslimat konumu alınamadı';
    if (distance < 0.1) newErrors.distance = 'Adresler çok yakın (min 100m)';
    if (distance > 50) newErrors.distance = 'Mesafe çok uzun (max 50km)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (deliveryMode === 'saved' && !selectedAddress) {
      Alert.alert('Hata', 'Lütfen bir adres seçin.');
      return;
    }
    try {
      await createOrder({
        pickupAddress: formData.pickupAddress,
        pickupLat: formData.pickupLat,
        pickupLng: formData.pickupLng,
        deliveryAddress: formData.deliveryAddress,
        deliveryLat: formData.deliveryLat,
        deliveryLng: formData.deliveryLng,
        total,
        notes: formData.notes,
        deliveryAddressId: deliveryMode === 'saved' ? selectedAddress?._id : undefined,
      });
      Alert.alert('Başarılı!', 'Siparişiniz oluşturuldu. En yakın kurye atanacak.', [{ text: 'Tamam', onPress: () => router.replace('/(customer)') }]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sipariş oluşturulamadı');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity style={[styles.addressItem, selectedAddress?._id === item._id && styles.addressItemSelected]} onPress={() => selectSavedAddress(item)} activeOpacity={0.7}>
      <View style={styles.addressItemHeader}>
        <View style={styles.addressItemTitleRow}>
          <Ionicons name={item.isDefault ? 'star' : 'star-outline'} size={18} color={item.isDefault ? COLORS.WARNING : COLORS.TEXT_SECONDARY} />
          <Text style={styles.addressItemTitle}>{item.title}</Text>
        </View>
        {selectedAddress?._id === item._id && <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />}
      </View>
      <Text style={styles.addressItemText} numberOfLines={2}>{item.fullAddress}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Yeni Sipariş</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="radio-button-on" size={20} color={COLORS.SUCCESS} />
                </View>
                <Text style={styles.sectionTitle}>Alış Adresi</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} placeholder="Örn: Konyaaltı Sahili, Antalya" value={formData.pickupAddress} onChangeText={handlePickupAddressChange} multiline />
              </View>
              <Text style={styles.helperText}>💡 Adres yazın, konum otomatik bulunacak</Text>
              {errors.pickupAddress && <Text style={styles.errorText}>{errors.pickupAddress}</Text>}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location" size={20} color={COLORS.ERROR} />
                </View>
                <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
              </View>

              <View style={styles.modeToggle}>
                <TouchableOpacity style={[styles.modeButton, deliveryMode === 'saved' && styles.modeButtonActive]} onPress={() => switchDeliveryMode('saved')}>
                  <Ionicons name="bookmarks" size={16} color={deliveryMode === 'saved' ? '#FFF' : COLORS.TEXT_SECONDARY} />
                  <Text style={[styles.modeButtonText, deliveryMode === 'saved' && styles.modeButtonTextActive]}>Kayıtlı</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, deliveryMode === 'gps' && styles.modeButtonActive]} onPress={() => switchDeliveryMode('gps')}>
                  <Ionicons name="navigate" size={16} color={deliveryMode === 'gps' ? '#FFF' : COLORS.TEXT_SECONDARY} />
                  <Text style={[styles.modeButtonText, deliveryMode === 'gps' && styles.modeButtonTextActive]}>GPS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, deliveryMode === 'manual' && styles.modeButtonActive]} onPress={() => switchDeliveryMode('manual')}>
                  <Ionicons name="create" size={16} color={deliveryMode === 'manual' ? '#FFF' : COLORS.TEXT_SECONDARY} />
                  <Text style={[styles.modeButtonText, deliveryMode === 'manual' && styles.modeButtonTextActive]}>Manuel</Text>
                </TouchableOpacity>
              </View>

              {deliveryMode === 'saved' && (
                <>
                  {isLoadingAddresses ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                      <Text style={styles.loadingText}>Adresler yükleniyor...</Text>
                    </View>
                  ) : savedAddresses.length === 0 ? (
                    <View style={styles.emptyAddressBox}>
                      <Ionicons name="location-outline" size={40} color={COLORS.TEXT_SECONDARY} />
                      <Text style={styles.emptyAddressText}>Kayıtlı adresiniz yok</Text>
                      <TouchableOpacity style={styles.addAddressButton} onPress={() => router.push('/(customer)/address-add')}>
                        <Ionicons name="add-circle" size={18} color={COLORS.PRIMARY} />
                        <Text style={styles.addAddressButtonText}>Adres Ekle</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.selectAddressButton} onPress={() => setShowAddressModal(true)}>
                      <View style={styles.selectAddressContent}>
                        <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
                        <View style={{ flex: 1 }}>
                          {selectedAddress ? (
                            <>
                              <Text style={styles.selectedAddressTitle}>{selectedAddress.title}</Text>
                              <Text style={styles.selectedAddressText} numberOfLines={1}>{selectedAddress.fullAddress}</Text>
                            </>
                          ) : (
                            <Text style={styles.selectAddressPlaceholder}>Adres seçiniz</Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {deliveryMode === 'gps' && (
                <>
                  {isLoadingLocation ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                      <Text style={styles.loadingText}>Konumunuz alınıyor...</Text>
                    </View>
                  ) : locationError ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} />
                      <Text style={styles.errorBoxText}>{locationError}</Text>
                      <TouchableOpacity style={styles.retryButton} onPress={fetchGPSLocation}>
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.inputWrapper}>
                        <TextInput style={styles.input} value={formData.deliveryAddress} multiline editable={false} />
                      </View>
                      <View style={styles.gpsActions}>
                        <Text style={styles.helperText}>📍 GPS'den alındı</Text>
                        <TouchableOpacity style={styles.refreshIconButton} onPress={fetchGPSLocation}>
                          <Ionicons name="refresh" size={16} color={COLORS.PRIMARY} />
                          <Text style={styles.refreshText}>Yenile</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {deliveryMode === 'manual' && (
                <>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="Örn: Lara Plajı, Antalya" value={formData.deliveryAddress} onChangeText={handleDeliveryAddressChange} multiline />
                  </View>
                  <Text style={styles.helperText}>💡 Adres yazın, konum otomatik bulunacak</Text>
                  {formData.deliveryLat !== 0 && formData.deliveryLng !== 0 && (
                    <View style={styles.coordsInfo}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                      <Text style={styles.coordsText}>Konum bulundu: {formData.deliveryLat.toFixed(5)}, {formData.deliveryLng.toFixed(5)}</Text>
                    </View>
                  )}
                </>
              )}

              {errors.deliveryAddress && <Text style={styles.errorText}>{errors.deliveryAddress}</Text>}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text" size={20} color={COLORS.PRIMARY} />
                </View>
                <Text style={styles.sectionTitle}>Notlar (Opsiyonel)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Örn: Zil çalınız, 3. kat" value={formData.notes} onChangeText={(text) => updateField('notes', text)} multiline numberOfLines={3} />
              </View>
            </View>

            {distance > 0 && (
              <View style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <Text style={styles.priceLabel}>Sipariş Özeti</Text>
                </View>
                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <Ionicons name="navigate" size={20} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.priceItemLabel}>Mesafe</Text>
                  </View>
                  <Text style={styles.priceItemValue}>{distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceItemLabel}>Başlangıç</Text>
                  <Text style={styles.priceItemValue}>₺{basePrice.toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceItemLabel}>Mesafe ({distance.toFixed(1)} km × ₺{pricePerKm})</Text>
                  <Text style={styles.priceItemValue}>₺{(distance * pricePerKm).toFixed(2)}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Toplam</Text>
                  <Text style={styles.priceTotalValue}>₺{total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {errors.distance && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} />
                <Text style={styles.errorBoxText}>{errors.distance}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading || isLoadingLocation} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.submitText}>Siparişi Oluştur</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.INFO} />
              <Text style={styles.infoText}>Kayıtlı adreslerinizi kullanabilir, GPS konumunuzu alabilir veya manuel adres girebilirsiniz.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showAddressModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adres Seçin</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>
            <FlatList data={savedAddresses} renderItem={renderAddressItem} keyExtractor={(item) => item._id} contentContainerStyle={styles.addressList} showsVerticalScrollIndicator={false} />
            <TouchableOpacity style={styles.modalAddButton} onPress={() => { setShowAddressModal(false); router.push('/(customer)/address-add'); }}>
              <Ionicons name="add-circle" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.modalAddButtonText}>Yeni Adres Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.TEXT },
  form: { padding: 24 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.TEXT },
  
  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  modeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  modeButtonTextActive: {
    color: '#FFF',
  },

  // Saved Address Selection
  selectAddressButton: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
    padding: 16,
  },
  selectAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAddressPlaceholder: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  selectedAddressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  selectedAddressText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },

  // Empty Address Box
  emptyAddressBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyAddressText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },

  inputWrapper: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  input: { padding: 16, fontSize: 15, color: COLORS.TEXT },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4, marginLeft: 8 },
  errorText: { fontSize: 12, color: COLORS.ERROR, marginTop: 4, marginLeft: 8 },
  
  // GPS Actions
  gpsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  refreshIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },

  // Coords Info
  coordsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },

  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.GRAY[50],
    padding: 16,
    borderRadius: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 12,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: COLORS.ERROR },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.ERROR,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },

  priceCard: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  priceHeader: { marginBottom: 16 },
  priceLabel: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceItemLabel: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  priceItemValue: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT },
  priceDivider: { height: 1, backgroundColor: COLORS.GRAY[200], marginVertical: 12 },
  priceTotalLabel: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT },
  priceTotalValue: { fontSize: 24, fontWeight: '800', color: COLORS.PRIMARY },
  submitButton: { marginBottom: 16 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  submitText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E6F7FF',
    padding: 12,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.INFO, lineHeight: 16 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  addressList: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  addressItemSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  addressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  addressItemText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  modalAddButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
});