import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.GRAY[400]}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={COLORS.GRAY[400]}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={COLORS.GRAY[400]}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
    borderWidth: 1,
    borderColor: COLORS.GRAY[200],
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT,
    paddingVertical: 14,
  },
  inputWithIcon: {
    marginLeft: 8,
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginLeft: 4,
  },
});