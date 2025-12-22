// app/auth/register.tsx

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { PhoneInput } from '../../components/ui/phone-input';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, VEHICLE_TYPE_LABELS } from '../../utils/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '', // ✅ Artık sadece numara kısmı (555 123 45 67)
    role: 'customer' as 'courier' | 'customer',
    vehicleType: 'bicycle' as 'bicycle' | 'motorcycle' | 'car',
    addressTitle: 'Ev',
    fullAddress: '',
    city: '',
    district: '',
    neighbourhood: '',
    buildingNo: '',
    floor: '',
    apartmentNo: '',
    directions: '',
    latitude: 0,
    longitude: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAddressChange = (text: string) => {
    updateField('fullAddress', text);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length < 10) {
      setFormData((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
      setIsGeocodingLoading(false);
      return;
    }

    setIsGeocodingLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const geocoded = await Location.geocodeAsync(text);
        
        if (geocoded.length > 0) {
          const { latitude, longitude } = geocoded[0];
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        } else {
          setFormData((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
        }
      } catch (error) {
        console.log('Geocoding hatası:', error);
        setFormData((prev) => ({ ...prev, latitude: 0, longitude: 0 }));
      } finally {
        setIsGeocodingLoading(false);
      }
    }, 2000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email gerekli';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir email girin';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!formData.name) {
      newErrors.name = 'İsim gerekli';
    }

    if (!formData.phone) {
      newErrors.phone = 'Telefon gerekli';
    } else if (formData.phone.replace(/\s/g, '').length !== 10) {
      newErrors.phone = '10 haneli telefon numarası girin';
    }

    if (formData.role === 'customer') {
      if (!formData.fullAddress) {
        newErrors.fullAddress = 'Adres gerekli';
      }
      if (formData.latitude === 0 || formData.longitude === 0) {
        newErrors.fullAddress = 'Geçerli bir adres girin (konum bulunamadı)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const data: any = {
        email: formData.email.toLowerCase(),
        password: formData.password,
        name: formData.name,
        phone: '+90' + formData.phone.replace(/\s/g, ''), // ✅ +90 ekle ve boşlukları kaldır
        role: formData.role,
      };

      if (formData.role === 'courier') {
        data.vehicleType = formData.vehicleType;
      } else {
        data.firstAddress = {
          title: formData.addressTitle,
          fullAddress: formData.fullAddress,
          lat: formData.latitude,
          lng: formData.longitude,
          city: formData.city || undefined,
          district: formData.district || undefined,
          neighbourhood: formData.neighbourhood || undefined,
          buildingNo: formData.buildingNo || undefined,
          floor: formData.floor || undefined,
          apartmentNo: formData.apartmentNo || undefined,
          directions: formData.directions || undefined,
        };
      }

      await register(data);
      router.replace('/');
    } catch (err: any) {
      console.log('Hata', err.message || 'Kayıt başarısız');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add" size={40} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Yeni hesap oluştur</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.sectionTitle}>Hesap Tipi</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'customer' && styles.roleButtonActive,
                ]}
                onPress={() => updateField('role', 'customer')}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={
                    formData.role === 'customer'
                      ? COLORS.PRIMARY
                      : COLORS.GRAY[400]
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'customer' && styles.roleButtonTextActive,
                  ]}
                >
                  Müşteri
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'courier' && styles.roleButtonActive,
                ]}
                onPress={() => updateField('role', 'courier')}
              >
                <Ionicons
                  name="bicycle"
                  size={24}
                  color={
                    formData.role === 'courier' ? COLORS.PRIMARY : COLORS.GRAY[400]
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'courier' && styles.roleButtonTextActive,
                  ]}
                >
                  Kurye
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="İsim Soyisim"
              placeholder="Ahmet Yılmaz"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              error={errors.name}
              icon="person-outline"
            />

            <Input
              label="Email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PhoneInput
              label="Telefon"
              placeholder="555 123 45 67"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              error={errors.phone}
            />

            <Input
              label="Şifre"
              placeholder="En az 6 karakter"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              icon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
            />

            <Input
              label="Şifre Tekrar"
              placeholder="Şifreyi tekrar girin"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              icon="lock-closed-outline"
              rightIcon={
                showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
              }
              onRightIconPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              secureTextEntry={!showConfirmPassword}
            />

            {/* Courier specific */}
            {formData.role === 'courier' && (
              <View style={styles.vehicleContainer}>
                <Text style={styles.sectionTitle}>Araç Tipi</Text>
                <View style={styles.vehicleButtons}>
                  {(['bicycle', 'motorcycle', 'car'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.vehicleButton,
                        formData.vehicleType === type &&
                          styles.vehicleButtonActive,
                      ]}
                      onPress={() => updateField('vehicleType', type)}
                    >
                      <Ionicons
                        name={
                          type === 'bicycle'
                            ? 'bicycle'
                            : type === 'motorcycle'
                            ? 'bicycle'
                            : 'car'
                        }
                        size={20}
                        color={
                          formData.vehicleType === type
                            ? COLORS.PRIMARY
                            : COLORS.GRAY[400]
                        }
                      />
                      <Text
                        style={[
                          styles.vehicleButtonText,
                          formData.vehicleType === type &&
                            styles.vehicleButtonTextActive,
                        ]}
                      >
                        {VEHICLE_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Customer specific - Detaylı adres */}
            {formData.role === 'customer' && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Adres Bilgileri</Text>
                
                <Input
                  label="Adres Başlığı"
                  placeholder="Ev, İş, vs."
                  value={formData.addressTitle}
                  onChangeText={(text) => updateField('addressTitle', text)}
                  icon="bookmark-outline"
                />

                <Input
                  label="Açık Adres *"
                  placeholder="Mahalle, Sokak, No"
                  value={formData.fullAddress}
                  onChangeText={handleAddressChange}
                  error={errors.fullAddress}
                  icon="location-outline"
                  multiline
                  numberOfLines={3}
                  rightIcon={isGeocodingLoading ? 'reload-outline' : undefined}
                />

                {formData.latitude !== 0 && formData.longitude !== 0 && (
                  <View style={styles.coordinatesInfo}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                    <Text style={styles.coordinatesText}>
                      Konum bulundu ✓
                    </Text>
                  </View>
                )}

                <View style={styles.addressRow}>
                  <View style={styles.addressHalf}>
                    <Input
                      label="İl"
                      placeholder="İstanbul"
                      value={formData.city}
                      onChangeText={(text) => updateField('city', text)}
                      icon="business-outline"
                    />
                  </View>
                  <View style={styles.addressHalf}>
                    <Input
                      label="İlçe"
                      placeholder="Beşiktaş"
                      value={formData.district}
                      onChangeText={(text) => updateField('district', text)}
                      icon="map-outline"
                    />
                  </View>
                </View>

                <Input
                  label="Mahalle"
                  placeholder="Yıldız Mahallesi"
                  value={formData.neighbourhood}
                  onChangeText={(text) => updateField('neighbourhood', text)}
                  icon="navigate-outline"
                />

                <View style={styles.addressRow}>
                  <View style={styles.addressThird}>
                    <Input
                      label="Bina No"
                      placeholder="12"
                      value={formData.buildingNo}
                      onChangeText={(text) => updateField('buildingNo', text)}
                      icon="home-outline"
                    />
                  </View>
                  <View style={styles.addressThird}>
                    <Input
                      label="Kat"
                      placeholder="3"
                      value={formData.floor}
                      onChangeText={(text) => updateField('floor', text)}
                      icon="layers-outline"
                    />
                  </View>
                  <View style={styles.addressThird}>
                    <Input
                      label="Daire"
                      placeholder="5"
                      value={formData.apartmentNo}
                      onChangeText={(text) => updateField('apartmentNo', text)}
                      icon="key-outline"
                    />
                  </View>
                </View>

                <Input
                  label="Adres Tarifi (Opsiyonel)"
                  placeholder="Yeşil kapılı bina, 2. kat"
                  value={formData.directions}
                  onChangeText={(text) => updateField('directions', text)}
                  icon="create-outline"
                  multiline
                />
              </View>
            )}

            <Button
              title="Kayıt Ol"
              onPress={handleRegister}
              loading={isLoading}
              icon="checkmark-circle-outline"
              style={styles.registerButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Loading visible={isLoading} message="Kayıt yapılıyor..." />
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#FFF5F0',
    borderColor: COLORS.PRIMARY,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GRAY[400],
  },
  roleButtonTextActive: {
    color: COLORS.PRIMARY,
  },
  form: {
    marginBottom: 24,
  },
  vehicleContainer: {
    marginTop: 8,
  },
  vehicleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
    gap: 6,
  },
  vehicleButtonActive: {
    backgroundColor: '#FFF5F0',
    borderColor: COLORS.PRIMARY,
  },
  vehicleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY[400],
  },
  vehicleButtonTextActive: {
    color: COLORS.PRIMARY,
  },
  addressSection: {
    marginTop: 8,
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
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
});