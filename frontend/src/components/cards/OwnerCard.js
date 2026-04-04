import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function OwnerCard({ name, rating, reviews, imageUri, onChat }) {
  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <Image source={{ uri: imageUri }} style={styles.avatar} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.listedBy}>Listed by</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color={Colors.secondary} />
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.reviews}>({reviews} reviews)</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.7}>
        <MaterialIcons name="chat-bubble-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  info: {
    flex: 1,
  },
  listedBy: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  reviews: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(197,198,205,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
