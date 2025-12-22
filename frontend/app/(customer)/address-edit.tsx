import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { addressesApi } from '../../services/api/addresses';
import { COLORS } from '../../utils/constants';

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    title: '', city: '', district: '', neighbourhood: '', buildingNo: '', floor: '', apartmentNo: '', directions: '', latitude: 0, longitude: 0, isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  useEffect(() => { if (id) loadAddress(); }, [id]);

  const loadAddress = async () => {
    try {
      setIsLoadingAddress(true);
      const response = await addressesApi.getById(id as string);
      const addr = response.address;
      setFormData({
        title: addr.title || '', city: addr.city || '', district: addr.district || '', neighbourhood: addr.neighbourhood || '', buildingNo: addr.buildingNo || '', floor: addr.floor || '', apartmentNo: addr.apartmentNo || '', directions: addr.directions || '', latitude: addr.lat || 0, longitude: addr.lng || 0, isDefault: addr.isDefault || false,
      });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Adres bilgileri yüklenemedi', [{ text: 'Tamam', onPress: () => router.back() }]);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleDefault = () => { setFormData((prev) => ({ ...prev, isDefault: !prev.isDefault })); };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGeocodingLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni verilmedi');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const addresses = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });

      if (addresses.length > 0) {
        const addr = addresses[0];
        console.log('📍 Reverse Geocode Result:', addr);
        const neighbourhood = [addr.district, addr.street].filter(Boolean).join(' ');
        setFormData((prev) => ({
          ...prev,
          city: addr.city || addr.region || '',
          district: addr.subregion || addr.district || '',
          neighbourhood: neighbourhood || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        Alert.alert('Başarılı', 'Mevcut konumunuz alındı');
      }
    } catch (error) {
      console.error('Konum hatası:', error);
      Alert.alert('Hata', 'Konum alınamadı');
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Adres başlığı gerekli';
    if (!formData.city) newErrors.city = 'İl gerekli';
    if (!formData.district) newErrors.district = 'İlçe gerekli';
    if (!formData.neighbourhood) newErrors.neighbourhood = 'Mahalle gerekli';
    if (formData.latitude === 0 || formData.longitude === 0) newErrors.city = 'Lütfen "Mevcut Konumumu Kullan" butonuna tıklayın';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const fullAddress = [
        formData.neighbourhood,
        formData.buildingNo && `No: ${formData.buildingNo}`,
        formData.floor && `Kat: ${formData.floor}`,
        formData.apartmentNo && `D: ${formData.apartmentNo}`,
        formData.district,
        formData.city,
      ].filter(Boolean).join(', ');

      await addressesApi.update(id as string, {
        title: formData.title,
        fullAddress: fullAddress,
        lat: formData.latitude,
        lng: formData.longitude,
        city: formData.city,
        district: formData.district,
        neighbourhood: formData.neighbourhood,
        buildingNo: formData.buildingNo || undefined,
        floor: formData.floor || undefined,
        apartmentNo: formData.apartmentNo || undefined,
        directions: formData.directions || undefined,
        isDefault: formData.isDefault,
      });

      Alert.alert('Başarılı!', 'Adres güncellendi', [{ text: 'Tamam', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Adres güncellenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAddress) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
          <Text style={styles.title}>Adres Düzenle</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Loading visible={true} message="Adres bilgileri yükleniyor..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <Text style={styles.title}>Adres Düzenle</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <Input label="Adres Başlığı *" placeholder="Adres başlığı giriniz" value={formData.title} onChangeText={(text) => updateField('title', text)} error={errors.title} icon="bookmark-outline" />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Adres Bilgileri *</Text>

            <View style={styles.addressRow}>
              <View style={styles.addressHalf}>
                <Input label="İl *" placeholder="İl giriniz" value={formData.city} onChangeText={(text) => updateField('city', text)} error={errors.city} icon="business-outline" />
              </View>
              <View style={styles.addressHalf}>
                <Input label="İlçe *" placeholder="İlçe giriniz" value={formData.district} onChangeText={(text) => updateField('district', text)} error={errors.district} icon="map-outline" />
              </View>
            </View>

            <Input label="Mahalle / Sokak *" placeholder="Mahalle ve sokak giriniz" value={formData.neighbourhood} onChangeText={(text) => updateField('neighbourhood', text)} error={errors.neighbourhood} icon="navigate-outline" />

            <View style={styles.addressRow}>
              <View style={styles.addressThird}>
                <Input label="Bina No" placeholder="No" value={formData.buildingNo} onChangeText={(text) => updateField('buildingNo', text)} icon="home-outline" keyboardType="numeric" />
              </View>
              <View style={styles.addressThird}>
                <Input label="Kat" placeholder="Kat" value={formData.floor} onChangeText={(text) => updateField('floor', text)} icon="layers-outline" keyboardType="numeric" />
              </View>
              <View style={styles.addressThird}>
                <Input label="Daire" placeholder="Daire" value={formData.apartmentNo} onChangeText={(text) => updateField('apartmentNo', text)} icon="key-outline" keyboardType="numeric" />
              </View>
            </View>

            <Input label="Adres Tarifi (Opsiyonel)" placeholder="Kurye için adres tarifi giriniz" value={formData.directions} onChangeText={(text) => updateField('directions', text)} icon="create-outline" multiline numberOfLines={4} />

            <TouchableOpacity style={styles.checkboxContainer} onPress={toggleDefault} activeOpacity={0.7}>
              <View style={[styles.checkbox, formData.isDefault && styles.checkboxActive]}>
                {formData.isDefault && <Ionicons name="checkmark" size={18} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Varsayılan adres olarak kaydet</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.gpsButton} onPress={handleGetCurrentLocation} disabled={isGeocodingLoading}>
              {isGeocodingLoading ? (
                <>
                  <Ionicons name="reload-outline" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.gpsButtonText}>Konum alınıyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.gpsButtonText}>Mevcut Konumumu Kullan</Text>
                </>
              )}
            </TouchableOpacity>

            <Button title="Değişiklikleri Kaydet" onPress={handleSubmit} loading={isSubmitting} icon="checkmark-circle-outline" style={styles.submitButton} />
          </View>
        </ScrollView>

        <Loading visible={isSubmitting} message="Adres güncelleniyor..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16, // ✅ Azaltıldı
    paddingBottom: 20,
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
  form: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.GRAY[200],
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressHalf: {
    flex: 1,
  },
  addressThird: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.GRAY[300],
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  gpsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  submitButton: {
    marginBottom: 16,
  },
});