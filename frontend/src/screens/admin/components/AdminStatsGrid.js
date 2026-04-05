import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminStatsGrid({ totalViews, pendingCount, verifiedUsers }) {
  return (
    <View style={styles.gridContainer}>
      {/* Large Stat Box */}
      <View style={[styles.statBox, styles.statBoxLarge]}>
        <View style={styles.largeBoxHeader}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="analytics" size={24} color="#006591" />
          </View>
          <Text style={styles.trendText}>+12% vs LW</Text>
        </View>
        <Text style={styles.statNumber}>{totalViews?.toLocaleString() || '0'}</Text>
        <Text style={styles.statLabel}>Total Monthly Views (Simulated)</Text>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Small Stat Box 1 */}
      <View style={styles.statBox}>
        <MaterialIcons name="pending-actions" size={24} color="#091426" style={styles.boxIcon} />
        <Text style={styles.statNumber}>{pendingCount || '0'}</Text>
        <Text style={styles.statLabel}>Pending Reviews</Text>
      </View>

      {/* Small Stat Box 2 */}
      <View style={styles.statBox}>
        <MaterialIcons name="verified-user" size={24} color="#091426" style={styles.boxIcon} />
        <Text style={styles.statNumber}>{verifiedUsers || '0'}</Text>
        <Text style={styles.statLabel}>Active Owners</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 48,
  },
  statBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.1)',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    flex: 1,
    minWidth: '45%',
  },
  statBoxLarge: {
    minWidth: '100%',
  },
  largeBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    backgroundColor: 'rgba(0, 101, 145, 0.1)',
    padding: 12,
    borderRadius: 24,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006591',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  boxIcon: {
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#091426',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#45474c',
  },
  progressBarBg: {
    marginTop: 16,
    height: 8,
    width: '100%',
    backgroundColor: '#f2f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006591',
    width: '75%',
    borderRadius: 4,
  },
});
