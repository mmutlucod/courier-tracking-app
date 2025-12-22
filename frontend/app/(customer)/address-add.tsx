import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { addressesApi } from '../../services/api/addresses';
import { COLORS } from '../../utils/constants';

export default function AddAddressScreen() {
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    title: '', city: '', district: '', neighbourhood: '', buildingNo: '', floor: '', apartmentNo: '', directions: '', latitude: 0, longitude: 0, isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsGeocodingLoading(false);
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
    if (!formData.title.trim()) newErrors.title = 'Adres başlığı gerekli';
    if (!formData.city.trim()) newErrors.city = 'İl gerekli';
    if (!formData.district.trim()) newErrors.district = 'İlçe gerekli';
    if (!formData.neighbourhood.trim()) newErrors.neighbourhood = 'Mahalle gerekli';
    if (formData.latitude === 0 || formData.longitude === 0) {
      if (!newErrors.city) newErrors.city = 'Lütfen "Mevcut Konumumu Kullan" butonuna tıklayın';
    }
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

      await addressesApi.create({
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

      Alert.alert('Başarılı!', 'Adres eklendi', [{ text: 'Tamam', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Adres eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <Text style={styles.title}>Yeni Adres Ekle</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <Input label="Adres Başlığı" placeholder="Adres Başlığı giriniz" value={formData.title} onChangeText={(text) => updateField('title', text)} error={errors.title} icon="bookmark-outline" />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Adres Bilgileri</Text>

            <View style={styles.addressRow}>
              <View style={styles.addressHalf}>
                <Input label="İl" placeholder="İl" value={formData.city} onChangeText={(text) => updateField('city', text)} error={errors.city} icon="business-outline" />
              </View>
              <View style={styles.addressHalf}>
                <Input label="İlçe" placeholder="İlçe" value={formData.district} onChangeText={(text) => updateField('district', text)} error={errors.district} icon="map-outline" />
              </View>
            </View>

            <Input label="Mahalle / Sokak" placeholder="Mahalle ve Sokak adı" value={formData.neighbourhood} onChangeText={(text) => updateField('neighbourhood', text)} error={errors.neighbourhood} icon="navigate-outline" />

            <View style={styles.addressRow}>
              <View style={styles.addressThird}>
                <Input label="Bina No" placeholder="Bina" value={formData.buildingNo} onChangeText={(text) => updateField('buildingNo', text)} icon="home-outline" keyboardType="numeric" />
              </View>
              <View style={styles.addressThird}>
                <Input label="Kat" placeholder="Kat" value={formData.floor} onChangeText={(text) => updateField('floor', text)} icon="layers-outline" keyboardType="numeric" />
              </View>
              <View style={styles.addressThird}>
                <Input label="Daire" placeholder="Daire" value={formData.apartmentNo} onChangeText={(text) => updateField('apartmentNo', text)} icon="key-outline" keyboardType="numeric" />
              </View>
            </View>

            <Input label="Adres Tarifi (Opsiyonel)" placeholder="Yeşil kapılı bina, 2. kat" value={formData.directions} onChangeText={(text) => updateField('directions', text)} icon="create-outline" multiline numberOfLines={4} />

            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <View style={styles.locationInfo}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.locationText}>Konum bilgisi alındı ✓</Text>
              </View>
            )}

            <TouchableOpacity style={styles.checkboxContainer} onPress={toggleDefault} activeOpacity={0.7}>
              <View style={[styles.checkbox, formData.isDefault && styles.checkboxActive]}>
                {formData.isDefault && <Ionicons name="checkmark" size={18} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Varsayılan adres olarak kaydet</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.gpsButton} onPress={handleGetCurrentLocation} disabled={isGeocodingLoading} activeOpacity={0.7}>
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

            <Button title="Adresi Kaydet" onPress={handleSubmit} loading={isSubmitting} icon="checkmark-circle-outline" style={styles.submitButton} />
          </View>
        </ScrollView>

        <Loading visible={isSubmitting} message="Adres kaydediliyor..." />
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
    paddingTop: 16,
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    fontWeight: '500',
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