import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '@/constants/layout';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
  columns: number;
  containerPadding: number;
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveState {
  const { width, height } = useWindowDimensions();

  const isMobile = width < Breakpoints.tablet;
  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.laptop;
  const isLaptop = width >= Breakpoints.laptop && width < Breakpoints.desktop;
  const isDesktop = width >= Breakpoints.laptop;
  const isWide = width >= Breakpoints.desktop;

  let columns = 1;
  if (width >= Breakpoints.wide) {
    columns = 4;
  } else if (width >= Breakpoints.laptop) {
    columns = 3;
  } else if (width >= Breakpoints.tablet) {
    columns = 2;
  }

  let containerPadding = 16;
  if (width >= Breakpoints.wide) {
    containerPadding = 64;
  } else if (width >= Breakpoints.desktop) {
    containerPadding = 48;
  } else if (width >= Breakpoints.laptop) {
    containerPadding = 40;
  } else if (width >= Breakpoints.tablet) {
    containerPadding = 28;
  }

  return {
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isWide,
    width,
    height,
    columns,
    containerPadding,
    contentMaxWidth: 99999,
  };
}
