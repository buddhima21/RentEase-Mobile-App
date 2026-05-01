import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'Draft'];

export default function AdminModerationList({ properties = [], onApprove, onReject, onPressProperty }) {
  const [activeFilter, setActiveFilter] = useState('Pending');

  // Filter properties based on selected tab
  const filteredProperties = properties.filter((property) => {
    if (activeFilter === 'Pending') return property.status === 'pending';
    if (activeFilter === 'Approved') return property.status === 'approved';
    if (activeFilter === 'Rejected') return property.status === 'rejected';
    if (activeFilter === 'Draft') {
      // Mocking Drafts: Since backend actually deletes properties, 
      // we'll show an empty list or intercept deleted items if a soft delete is implemented later.
      // Currently, it will just show nothing as no properties have 'draft' state.
      return property.status === 'draft';
    }
    return true; // Default fallback
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Approvals</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.list}>
        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color="#c5c6cd" />
            <Text style={styles.emptyStateText}>No properties found for this category.</Text>
            {activeFilter === 'Draft' ? (
              <Text style={styles.emptyStateSubtext}>Deleted properties are removed permanently by default.</Text>
            ) : null}
          </View>
        ) : (
          filteredProperties.map((property) => (
            <TouchableOpacity 
              key={property.id} 
              style={styles.card} 
              activeOpacity={0.9} 
              onPress={() => onPressProperty && onPressProperty(property)}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: property.imageUri || PLACEHOLDER_IMAGE }} style={styles.image} resizeMode="cover" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{property.propertyType || 'Property'}</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{property.title}</Text>
                  <Text style={styles.cardPrice}>{property.price}</Text>
                </View>
                
                <View style={styles.features}>
                  {!!property.beds && (
                    <View style={styles.featureItem}>
                      <MaterialIcons name="bed" size={14} color="#45474c" />
                      <Text style={styles.featureText}>{property.beds} Beds</Text>
                    </View>
                  )}
                  {!!property.baths && (
                    <View style={styles.featureItem}>
                      <MaterialIcons name="bathtub" size={14} color="#45474c" />
                      <Text style={styles.featureText}>{property.baths} Baths</Text>
                    </View>
                  )}
                  {!!property.owner?.name && (
                    <View style={styles.featureItem}>
                      <MaterialIcons name="person" size={14} color="#45474c" />
                      <Text style={styles.featureText}>By {property.owner.name}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.desc} numberOfLines={2}>{property.description}</Text>

                {/* Rejection Reason Banner */}
                {property.status === 'rejected' && !!property.rejectionReason ? (
                  <View style={styles.rejectionBanner}>
                    <MaterialIcons name="cancel" size={14} color="#ba1a1a" />
                    <Text style={styles.rejectionText} numberOfLines={2}>
                      {property.rejectionReason}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  {property.status !== 'approved' ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => onApprove(property.id)}
                    >
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                  ) : null}
                  {property.status !== 'rejected' ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => onReject(property.id)}
                    >
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    marginBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#091426',
  },
  filtersContainer: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e6e8ea',
  },
  filterBtnActive: {
    backgroundColor: '#091426',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45474c',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    gap: 24,
  },
  card: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  imageContainer: {
    width: Platform.OS === 'web' ? 288 : '100%',
    height: 192,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#091426',
  },
  cardContent: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#091426',
    flex: 1,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#091426',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#45474c',
  },
  desc: {
    fontSize: 14,
    color: '#45474c',
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#1a7a50',
  },
  rejectBtn: {
    backgroundColor: '#ba1a1a',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#45474c',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#75777d',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(186,26,26,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#ba1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: '#ba1a1a',
    fontWeight: '600',
    lineHeight: 18,
  },
});
