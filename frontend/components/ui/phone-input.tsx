import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../utils/constants';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ label, value, onChangeText, error, placeholder = '555 123 45 67' }) => {
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    let formatted = '';
    if (limited.length > 0) formatted = limited.slice(0, 3);
    if (limited.length > 3) formatted += ' ' + limited.slice(3, 6);
    if (limited.length > 6) formatted += ' ' + limited.slice(6, 8);
    if (limited.length > 8) formatted += ' ' + limited.slice(8, 10);
    return formatted;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <View style={styles.prefixContainer}>
          <Ionicons name="call" size={18} color={COLORS.PRIMARY} />
          <Text style={styles.prefix}>+90</Text>
        </View>
        <View style={styles.divider} />
        <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={COLORS.GRAY[400]} value={value} onChangeText={handleChange} keyboardType="number-pad" maxLength={13} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
    overflow: 'hidden',
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 12, // ✅ Sağ tarafa padding eklendi
    paddingVertical: 16,
    backgroundColor: COLORS.GRAY[100],
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.GRAY[300],
    marginLeft: 0, // ✅ Sol margin kaldırıldı
    marginRight: 12, // ✅ Sağ margin korundu
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
    paddingRight: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 4,
    marginLeft: 8,
    fontWeight: '500',
  },
});