import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

const CATEGORY_ICONS = {
  House: 'home',
  Apartment: 'apartment',
  Villa: 'villa',
  Loft: 'warehouse',
};

export default function CategoryChip({ label, active = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={CATEGORY_ICONS[label] || 'home'}
        size={16}
        color={active ? Colors.onPrimary : Colors.onSurfaceVariant}
        style={styles.icon}
      />
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: Colors.onPrimary,
  },
  labelInactive: {
    color: Colors.onSurfaceVariant,
  },
});
