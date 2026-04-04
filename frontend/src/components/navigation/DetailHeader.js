import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function DetailHeader({ onBack, onShare }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
      </TouchableOpacity>
      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare} activeOpacity={0.7}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setLiked(!liked)} activeOpacity={0.7}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={22}
            color={liked ? '#e53e3e' : Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rightGroup: {
    flexDirection: 'row',
    gap: 8,
  },
});
