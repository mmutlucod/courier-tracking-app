import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../../utils/constants';

interface LoadingProps {
  visible: boolean;
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  visible,
  message = 'Yükleniyor...',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 150,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
});