import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneInput } from '../../components/ui/phone-input';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, VEHICLE_TYPE_LABELS } from '../../utils/constants';

type VehicleType = 'bicycle' | 'motorcycle' | 'car';

export default function CourierProfileEdit() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone?.replace('+90', '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') || '',
    vehicleType: (user?.vehicleType || 'bicycle') as VehicleType,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'İsim gerekli';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon gerekli';
    } else if (formData.phone.replace(/\s/g, '').length !== 10) {
      newErrors.phone = '10 haneli telefon numarası girin';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);
      await updateProfile({
        name: formData.name,
        phone: '+90' + formData.phone.replace(/\s/g, ''),
        vehicleType: formData.vehicleType,
      });
      Alert.alert('Başarılı!', 'Profiliniz güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili Düzenle</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>İsim</Text>
              </View>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız Soyadınız"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>Telefon</Text>
              </View>
              <PhoneInput value={formData.phone} onChangeText={(text) => updateField('phone', text)} error={errors.phone} />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bicycle" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>Araç Tipi</Text>
              </View>
              <View style={styles.vehicleButtons}>
                {(['bicycle', 'motorcycle', 'car'] as VehicleType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.vehicleButton, formData.vehicleType === type && styles.vehicleButtonActive]}
                    onPress={() => updateField('vehicleType', type)}
                  >
                    <Ionicons
                      name={type === 'bicycle' ? 'bicycle' : type === 'motorcycle' ? 'bicycle' : 'car'}
                      size={24}
                      color={formData.vehicleType === type ? '#FFF' : COLORS.TEXT}
                    />
                    <Text style={[styles.vehicleButtonText, formData.vehicleType === type && styles.vehicleButtonTextActive]}>
                      {VEHICLE_TYPE_LABELS[type] || type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.INFO} />
              <Text style={styles.infoText}>Email adresiniz değiştirilemez. Diğer bilgilerinizi güncelleyebilirsiniz.</Text>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.submitText}>Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  keyboardView: { 
    flex: 1 
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
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
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.TEXT },
  inputWrapper: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  input: { padding: 16, fontSize: 15, color: COLORS.TEXT },
  errorText: { fontSize: 12, color: COLORS.ERROR, marginTop: 4, marginLeft: 8 },
  vehicleButtons: {
    gap: 12,
  },
  vehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  vehicleButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  vehicleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  vehicleButtonTextActive: {
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E6F7FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.INFO, lineHeight: 16 },
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
});