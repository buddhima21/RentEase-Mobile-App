import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

export default function FeaturedCard({ price, title, location, imageUri, onPress }) {
  const [liked, setLiked] = useState(false);

  return (
    <TouchableOpacity style={styles.cardWrapper} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        {/* Heart Button */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => setLiked(!liked)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <Text style={styles.price}>
            {price}
            <Text style={styles.priceUnit}>/mo</Text>
          </Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.location}>{location}</Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: 280,
    marginRight: 20,
  },
  card: {
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    // Shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  heartBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    // glassmorphism tint
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 60,
  },
  price: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  location: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
});
