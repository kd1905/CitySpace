import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { Feather } from '@expo/vector-icons';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'featured' | 'verified' | 'outline' | 'blur';
  icon?: keyof typeof Feather.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'secondary',
  icon,
  size = 'sm',
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.primary };
      case 'gold':
        return { backgroundColor: Colors.accent };
      case 'featured':
        return { backgroundColor: 'rgba(217, 119, 6, 0.92)' };
      case 'verified':
        return { backgroundColor: 'rgba(5, 150, 105, 0.92)' };
      case 'blur':
        return { backgroundColor: 'rgba(11, 15, 25, 0.72)' };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.border,
        };
      case 'secondary':
      default:
        return { backgroundColor: Colors.surfaceAlt };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'gold':
      case 'featured':
      case 'verified':
      case 'blur':
        return '#FFFFFF';
      case 'outline':
        return Colors.textSecondary;
      case 'secondary':
      default:
        return Colors.textPrimary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badge_sm : styles.badge_md,
        getContainerStyle(),
        style,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={size === 'sm' ? 11 : 13}
          color={getTextColor()}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.text_sm : styles.text_md,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
  },
  badge_sm: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badge_md: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 13,
  },
});
