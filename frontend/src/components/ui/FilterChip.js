import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function FilterChip({ label, icon, active = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={18}
          color={active ? Colors.onPrimary : Colors.onSurfaceVariant}
          style={styles.icon}
        />
      )}
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
    paddingVertical: 10,
    borderRadius: 24, // fully rounded pill
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)', // outline-variant/20ish
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.onPrimary,
  },
  labelInactive: {
    color: Colors.onSurfaceVariant,
  },
});
