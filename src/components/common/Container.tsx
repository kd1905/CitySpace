import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { PublicContentMaxWidth } from '@/constants/layout';

export interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  maxWidth?: number;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  noPadding = false,
  maxWidth = PublicContentMaxWidth,
}) => {
  const { containerPadding } = useResponsive();

  return (
    <View
      style={[
        styles.outer,
        {
          paddingHorizontal: noPadding ? 0 : containerPadding,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          maxWidth ? { maxWidth, alignSelf: 'center' } : undefined,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  inner: {
    width: '100%',
  },
});

