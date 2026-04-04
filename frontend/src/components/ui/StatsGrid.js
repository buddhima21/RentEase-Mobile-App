import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function StatsGrid({ beds, baths, sqft }) {
  const stats = [
    { icon: 'king-bed', label: `${beds} Beds` },
    { icon: 'bathtub', label: `${baths} Baths` },
    { icon: 'square-foot', label: `${sqft} sqft` },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <MaterialIcons name={stat.icon} size={24} color={Colors.secondary} />
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary,
  },
});
