import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/layout';
import { Feather } from '@expo/vector-icons';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = styles.base;
    let sizeStyle: ViewStyle = styles.md;
    if (size === 'sm') sizeStyle = styles.sm;
    if (size === 'lg') sizeStyle = styles.lg;

    let variantStyle: ViewStyle = styles.primary;
    if (variant === 'secondary') variantStyle = styles.secondary;
    if (variant === 'outline') variantStyle = styles.outline;
    if (variant === 'gold') variantStyle = styles.gold;
    if (variant === 'ghost') variantStyle = styles.ghost;

    return {
      ...base,
      ...sizeStyle,
      ...variantStyle,
      opacity: disabled || loading ? 0.6 : 1,
      ...style,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'primary') return Colors.textInverse;
    if (variant === 'secondary') return Colors.textPrimary;
    if (variant === 'outline') return Colors.textPrimary;
    if (variant === 'gold') return '#FFFFFF';
    if (variant === 'ghost') return Colors.textSecondary;
    return Colors.textInverse;
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Feather
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.text,
              styles[`text_${size}`],
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Feather
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        userSelect: 'none',
      } as any,
    }),
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.sm,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gold: {
    backgroundColor: Colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 16,
    fontWeight: '700',
  },
});
