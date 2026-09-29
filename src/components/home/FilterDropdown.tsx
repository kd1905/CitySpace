import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: string) => void;
  style?: ViewStyle;
  showLeftBorder?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  style,
  showLeftBorder = true,
}) => {
  return (
    <View
      style={[
        styles.container,
        showLeftBorder && styles.leftBorder,
        isOpen && styles.containerOpen,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        </View>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#94A3B8"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.menu}>
          <ScrollView
            style={styles.scroll}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {options.map((item) => {
              const isSelected = value === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => onSelect(item)}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={13} color="#0F172A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 50,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 60,
  },
  containerOpen: {
    zIndex: 95,
  },
  leftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  menu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    zIndex: 100,
    maxHeight: 230,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
      } as any,
    }),
  },
  scroll: {
    maxHeight: 220,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8.5,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': {
          backgroundColor: '#F8FAFC',
        },
      } as any,
    }),
  },
  optionSelected: {
    backgroundColor: '#F1F5F9',
  },
  optionText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#334155',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#0F172A',
  },
});
