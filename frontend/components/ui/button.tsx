import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            styles[`${size}Button`],
            isDisabled && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={size === 'small' ? 18 : 24}
                  color="#FFFFFF"
                  style={styles.icon}
                />
              )}
              <Text style={[styles.text, styles[`${size}Text`]]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <View
          style={[
            styles.outlineButton,
            styles[`${size}Button`],
            isDisabled && styles.disabledOutline,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={size === 'small' ? 18 : 24}
                  color={COLORS.PRIMARY}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.outlineText,
                  styles[`${size}Text`],
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.textButton, style]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.PRIMARY} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 18 : 20}
              color={COLORS.PRIMARY}
              style={styles.icon}
            />
          )}
          <Text style={[styles.textButtonText, styles[`${size}Text`]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Text styles
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outlineText: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  textButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  icon: {
    marginRight: 8,
  },
  
  disabled: {
    opacity: 0.5,
  },
  disabledOutline: {
    opacity: 0.5,
    borderColor: COLORS.GRAY[300],
  },
});