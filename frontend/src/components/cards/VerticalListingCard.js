import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function VerticalListingCard({ title, location, price, beds, baths, sqft, imageUri, onPress }) {
  const [liked, setLiked] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        
        {/* Top Right Heart */}
        <TouchableOpacity 
          style={styles.heartBtn} 
          onPress={() => setLiked(!liked)}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name={liked ? 'favorite' : 'favorite-border'} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>

        {/* Bottom Left Price */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>
            {price}<Text style={styles.priceUnit}>/mo</Text>
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={Colors.onSurfaceVariant} />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <MaterialIcons name="bed" size={18} color={Colors.onSurfaceVariant} />
            <Text style={styles.statText}>{beds}</Text>
          </View>
          <View style={styles.statPill}>
            <MaterialIcons name="bathtub" size={18} color={Colors.onSurfaceVariant} />
            <Text style={styles.statText}>{baths}</Text>
          </View>
          <View style={styles.statPill}>
            <MaterialIcons name="square-foot" size={18} color={Colors.onSurfaceVariant} />
            <Text style={styles.statText}>{sqft}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    // Add a slight border or shadow if desired
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  imageContainer: {
    height: 256, // roughly h-64
    width: '100%',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  heartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pricePill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: Colors.onPrimary,
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 16,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
});
