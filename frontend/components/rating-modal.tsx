import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRatingStore } from '../store/rating-store';
import { COLORS } from '../utils/constants';

interface RatingModalProps {
  visible: boolean;
  orderId: string;
  courierName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RatingModal({ visible, orderId, courierName = 'Kurye', onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { createRating, isLoading } = useRatingStore();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Uyarı', 'Lütfen bir puan seçin');
      return;
    }

    try {
      await createRating(orderId, rating, comment);
      Alert.alert('Başarılı!', 'Değerlendirmeniz kaydedildi', [{ text: 'Tamam', onPress: () => { onClose(); onSuccess?.(); } }]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Değerlendirme gönderilemedi');
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Kuryeyi Değerlendir</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
          </View>

          <View style={styles.courierInfo}>
            <View style={styles.courierAvatar}>
              <Ionicons name="person" size={32} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.courierName}>{courierName}</Text>
          </View>

          <Text style={styles.label}>Puanınız</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={40} color={star <= rating ? COLORS.WARNING : COLORS.GRAY[300]} />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && '😞 Çok Kötü'}
              {rating === 2 && '😕 Kötü'}
              {rating === 3 && '😐 Orta'}
              {rating === 4 && '😊 İyi'}
              {rating === 5 && '🤩 Mükemmel'}
            </Text>
          )}

          <Text style={styles.label}>Yorumunuz (Opsiyonel)</Text>
          <TextInput style={styles.textArea} placeholder="Deneyiminizi paylaşın..." value={comment} onChangeText={setComment} multiline numberOfLines={4} maxLength={500} />
          <Text style={styles.charCount}>{comment.length}/500</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton, (rating === 0 || isLoading) && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={rating === 0 || isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Gönder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  courierAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  courierName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.TEXT,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.GRAY[200],
  },
  charCount: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.GRAY[300],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});