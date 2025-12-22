import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loading } from '../../components/ui/loading';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    clearError();
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email gerekli');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Geçerli bir email girin');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Şifre gerekli');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login({ email: email.toLowerCase(), password });
      router.replace('/');
    } catch (err: any) {
      console.log('Hata', err.message || 'Giriş başarısız');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="location" size={48} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.title}>Hoş Geldin!</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={(text) => { setEmail(text); setEmailError(''); }}
              error={emailError}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Şifre"
              placeholder="••••••"
              value={password}
              onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
              error={passwordError}
              icon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button title="Giriş Yap" onPress={handleLogin} loading={isLoading} icon="log-in-outline" style={styles.loginButton} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Loading visible={isLoading} message="Giriş yapılıyor..." />
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  form: {
    marginBottom: 32,
  },
  loginButton: {
    marginTop: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ERROR,
    fontWeight: '500',
  },
  testContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
  },
  testTitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.GRAY[200],
    gap: 6,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.PRIMARY,
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