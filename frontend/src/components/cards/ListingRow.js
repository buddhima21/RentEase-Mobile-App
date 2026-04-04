import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ListingRow({ title, location, price, beds, baths, imageUri, onPress }) {
  const [liked, setLiked] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />

      <View style={styles.info}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={() => setLiked(!liked)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialIcons
              name={liked ? 'favorite' : 'favorite-border'}
              size={20}
              color={liked ? Colors.error : Colors.outline}
            />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
          <Text style={styles.location}>{location}</Text>
        </View>

        {/* Price + specs */}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            {price}
            <Text style={styles.priceUnit}>/mo</Text>
          </Text>
          <View style={styles.specs}>
            <View style={styles.specItem}>
              <MaterialIcons name="king-bed" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.specText}>{beds}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialIcons name="bathtub" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.specText}>{baths}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(197,198,205,0.15)',
    gap: 12,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    flexShrink: 0,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  location: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginLeft: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  specs: {
    flexDirection: 'row',
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
});
