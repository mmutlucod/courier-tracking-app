// app/index.tsx

import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  if (user?.role === 'courier') return <Redirect href="/(courier)" />;
  return <Redirect href="/(customer)" />;
}
