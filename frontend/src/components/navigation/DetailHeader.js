import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

/**
 * DetailHeader
 * @param {Function} onBack
 * @param {Function} onShare
 * @param {boolean}  isFavorited - controlled favorite state
 * @param {Function} onFavorite  - called when heart is pressed
 */
export default function DetailHeader({ onBack, onShare, isFavorited = false, onFavorite }) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40, bounciness: 20 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();
    onFavorite && onFavorite();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
      </TouchableOpacity>
      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare} activeOpacity={0.7}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleHeartPress} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <MaterialIcons
              name={isFavorited ? 'favorite' : 'favorite-border'}
              size={22}
              color={isFavorited ? '#ef4444' : Colors.primary}
            />
          </Animated.View>
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
