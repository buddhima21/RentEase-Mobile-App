import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function AmenityItem({ icon, label }) {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={22} color={Colors.onSurfaceVariant} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    flexShrink: 1,
  },
});
