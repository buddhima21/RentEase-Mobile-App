import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

export default function BentoListingCard({ title, location, price, images, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>

      {/* Bento Grid Images */}
      <View style={styles.gridRow}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: images[0] }} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: images[1] }} style={styles.image} resizeMode="cover" />
        </View>
      </View>

      {/* Bottom Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.location}>{location}</Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(57, 184, 253, 0.1)', // secondary-container/20 approximate
    borderWidth: 1,
    borderColor: 'rgba(57, 184, 253, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featuredBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredText: {
    color: Colors.onSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceContainer: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    color: Colors.onSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageWrapper: {
    flex: 1,
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
