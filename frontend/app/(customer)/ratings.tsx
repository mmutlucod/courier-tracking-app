import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRatingStore } from '../../store/rating-store';
import { COLORS } from '../../utils/constants';

export default function CustomerRatings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ratings, isLoading, fetchMyRatings } = useRatingStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => { fetchMyRatings(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRatings();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStarColor = (index: number, rating: number) => index <= rating ? COLORS.WARNING : COLORS.GRAY[300];

  const getCourierName = (courier: any): string => {
    if (!courier) return 'Kurye';
    return typeof courier === 'object' ? courier.name : 'Kurye';
  };

  const getOrderId = (order: any): string => {
    if (!order) return '---';
    const id = typeof order === 'object' ? order._id : order;
    return id ? `#${id.slice(-6).toUpperCase()}` : '---';
  };

  if (isLoading && ratings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Değerlendirmelerim</Text>
          <View style={{ width: 40 }} />
        </View>

        {ratings.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ratings.length}</Text>
              <Text style={styles.statLabel}>Toplam Değerlendirme</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          {ratings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color={COLORS.GRAY[300]} />
              <Text style={styles.emptyText}>Henüz değerlendirme yapmadınız</Text>
              <Text style={styles.emptySubtext}>Tamamlanan siparişlerinizi değerlendirerek kuryelerimize geri bildirim sağlayabilirsiniz</Text>
            </View>
          ) : (
            ratings.map((rating) => (
              <View key={rating._id} style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                  <View style={styles.courierInfo}>
                    <View style={styles.courierAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.PRIMARY} />
                    </View>
                    <View>
                      <Text style={styles.courierName}>{getCourierName(rating.courierId)}</Text>
                      <Text style={styles.orderId}>Sipariş: {getOrderId(rating.orderId)}</Text>
                    </View>
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name="star" size={18} color={getStarColor(star, rating.rating)} />
                    ))}
                  </View>
                </View>
                {rating.comment && (
                  <View style={styles.commentContainer}>
                    <Text style={styles.commentText}>{rating.comment}</Text>
                  </View>
                )}
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.TEXT_SECONDARY} />
                  <Text style={styles.dateText}>{formatDate(rating.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  commentContainer: {
    backgroundColor: COLORS.GRAY[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});