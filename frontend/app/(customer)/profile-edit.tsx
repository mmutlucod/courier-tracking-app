import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneInput } from '../../components/ui/phone-input';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';

export default function CustomerProfileEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone?.replace('+90', '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') || '',
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
      await updateProfile({ name: formData.name, phone: '+90' + formData.phone.replace(/\s/g, '') });
      Alert.alert('Başarılı!', 'Profiliniz güncellendi.', [{ text: 'Tamam', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                <Text style={styles.sectionTitle}>İsim Soyisim</Text>
              </View>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <TextInput style={styles.input} placeholder="Adınız Soyadınız" value={formData.name} onChangeText={(text) => updateField('name', text)} autoCapitalize="words" />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>Telefon</Text>
              </View>
              <PhoneInput value={formData.phone} onChangeText={(text) => updateField('phone', text)} error={errors.phone} />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="mail" size={20} color={COLORS.INFO} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Email adresiniz</Text> güvenlik nedeniyle değiştirilemez.
              </Text>
            </View>

            <TouchableOpacity style={styles.addressInfoBox} onPress={() => router.push('/(customer)/addresses')} activeOpacity={0.7}>
              <View style={styles.addressInfoLeft}>
                <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.addressInfoText}>
                  <Text style={styles.infoBold}>Adreslerinizi</Text> yönetmek için <Text style={styles.addressInfoLink}>Adreslerim</Text> sayfasına gidin.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : (
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
  input: { 
    padding: 16, 
    fontSize: 15, 
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  errorText: { 
    fontSize: 12, 
    color: COLORS.ERROR, 
    marginTop: 4, 
    marginLeft: 8,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E6F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: { 
    flex: 1, 
    fontSize: 13, 
    color: COLORS.INFO, 
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: '700',
  },
  addressInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF5F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '20',
  },
  addressInfoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT,
    lineHeight: 18,
  },
  addressInfoLink: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
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