import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onSelect }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.pill,
        isSelected
          ? styles.activePill
          : [styles.inactivePill, { backgroundColor: colors.card, borderColor: colors.border }],
      ]}
      activeOpacity={0.7}
    >
      <Ionicons
        name={category.icon as any}
        size={16}
        color={isSelected ? '#FFFFFF' : colors.textSecondary}
      />
      <Text
        style={[
          styles.text,
          isSelected ? styles.activeText : [styles.inactiveText, { color: colors.textSecondary }],
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  inactivePill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  activePill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  inactiveText: {
    color: Colors.light.textSecondary,
  },
  activeText: {
    color: '#FFFFFF',
  },
});

