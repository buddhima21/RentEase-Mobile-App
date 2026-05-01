import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { getMyProperties, deleteProperty } from '../../services/propertyService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const getFirstName = (name) => {
  if (!name) return '';
  return name.trim().split(' ')[0];
};

const AVATAR_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/** Returns status badge styles { bg, text, label } */
const getStatusStyle = (status) => {
  switch (status) {
    case 'approved':
      return { bg: '#dcfce7', text: '#166534', label: 'APPROVED' };
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e', label: 'PENDING REVIEW' };
    case 'rejected':
      return { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: status?.toUpperCase() || 'UNKNOWN' };
  }
};

/** Placeholder image when property has no image */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600';

// ─── Component ────────────────────────────────────────────────────────────────

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Data state
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // ── Load Properties (refetch every time screen is focused) ──
  const loadProperties = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getMyProperties();
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
      const message =
        error.response?.data?.message ||
        'Could not load your properties. Please check your connection.';
      setFetchError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  // ── Delete Handler ──
  const handleDelete = (property) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to permanently delete "${property.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty(property._id);
              setProperties((prev) => prev.filter((p) => p._id !== property._id));
              Alert.alert('Deleted', 'Your listing has been removed.');
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert(
                'Delete Failed',
                error.response?.data?.message || 'Could not delete the listing. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  // ── Tab Navigation ──
  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'home') navigation.navigate('Home');
    if (tabKey === 'listings') navigation.navigate('Listings');
  };

  // ── Computed Stats ──
  const totalListings  = properties.length;
  const approvedCount  = properties.filter((p) => p.status === 'approved').length;
  const pendingCount   = properties.filter((p) => p.status === 'pending').length;
  const rejectedCount  = properties.filter((p) => p.status === 'rejected').length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <MaterialIcons name="maps-home-work" size={22} color={Colors.primary} />
          <Text style={styles.brand}>RentEase</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications-none" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(user?.name) }]}>
            <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProperties(true)}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Text style={styles.heroHeading}>Owner Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Welcome back, {getFirstName(user?.name) || 'Owner'}. Here's your property portfolio.
          </Text>
        </View>

        {/* ── STATS GRID ── */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Listings"
            value={isLoading ? '–' : totalListings}
            icon="home-work"
            iconColor={Colors.secondary}
            badge={`${approvedCount} live`}
            badgeColor="rgba(0, 101, 145, 0.1)"
            badgeTextColor={Colors.secondary}
          />
          <StatCard
            label="Pending Review"
            value={isLoading ? '–' : pendingCount}
            icon="hourglass-top"
            iconColor="#f59e0b"
            badge="Awaiting admin"
            badgeColor="rgba(245, 158, 11, 0.1)"
            badgeTextColor="#92400e"
          />
          <StatCard
            label="Approved"
            value={isLoading ? '–' : approvedCount}
            icon="verified"
            iconColor="#10b981"
            badge="Live now"
            badgeColor="rgba(16, 185, 129, 0.1)"
            badgeTextColor="#065f46"
          />
          {rejectedCount > 0 && (
            <StatCard
              label="Rejected"
              value={rejectedCount}
              icon="cancel"
              iconColor={Colors.error}
              badge="Needs attention"
              badgeColor="rgba(186, 26, 26, 0.08)"
              badgeTextColor={Colors.error}
            />
          )}
        </View>

        {/* ── BOOKING MANAGEMENT ── */}
        <View style={styles.bookingMgmtSection}>
          <TouchableOpacity
            style={styles.bookingMgmtBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OwnerBookingRequests')}
          >
            <View style={[styles.bookingMgmtIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <MaterialIcons name="pending-actions" size={22} color="#f59e0b" />
            </View>
            <View style={styles.bookingMgmtInfo}>
              <Text style={styles.bookingMgmtTitle}>Booking Requests</Text>
              <Text style={styles.bookingMgmtSub}>Review and manage pending bookings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookingMgmtBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OwnerAllocationHistory')}
          >
            <View style={[styles.bookingMgmtIcon, { backgroundColor: 'rgba(0,101,145,0.1)' }]}>
              <MaterialIcons name="history" size={22} color={Colors.secondary} />
            </View>
            <View style={styles.bookingMgmtInfo}>
              <Text style={styles.bookingMgmtTitle}>Allocation History</Text>
              <Text style={styles.bookingMgmtSub}>View and manage tenant allocations</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* ── MY LISTINGS SECTION ── */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <Text style={styles.sectionSubtitle}>Manage and track your active properties</Text>
            </View>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.addBtnDesktop}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ManageProperty')}
              >
                <LinearGradient
                  colors={[Colors.secondary, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addBtnGradient}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add Property</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* ── LOADING STATE ── */}
          {isLoading && (
            <View style={styles.centeredBox}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.loadingText}>Loading your properties...</Text>
            </View>
          )}

          {/* ── ERROR STATE ── */}
          {!isLoading && fetchError && (
            <View style={styles.errorBox}>
              <MaterialIcons name="cloud-off" size={40} color={Colors.error} />
              <Text style={styles.errorBoxTitle}>Failed to Load</Text>
              <Text style={styles.errorBoxText}>{fetchError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadProperties()}
                activeOpacity={0.7}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── EMPTY STATE ── */}
          {!isLoading && !fetchError && properties.length === 0 && (
            <View style={styles.emptyBox}>
              <MaterialIcons name="home-work" size={56} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Listings Yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button below to add your first property and start renting it out.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('ManageProperty')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.secondary, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyAddBtnGradient}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyAddBtnText}>Add First Property</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PROPERTY CARDS ── */}
          {!isLoading && !fetchError && (
            <View style={styles.listContainer}>
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onEdit={() => navigation.navigate('ManageProperty', { property })}
                  onDelete={() => handleDelete(property)}
                  onPress={() => navigation.navigate('PropertyDetails', { property })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ManageProperty')}
      >
        <LinearGradient
          colors={[Colors.secondary, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconColor, badge, badgeColor, badgeTextColor }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconBox, { backgroundColor: badgeColor }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBadge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.statBadgeText, { color: badgeTextColor }]}>{badge}</Text>
      </View>
    </View>
  );
}

function PropertyCard({ property, onEdit, onDelete, onPress }) {
  const statusStyle = getStatusStyle(property.status);
  const coverImage  = property.images?.[0] || FALLBACK_IMAGE;

  return (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.9} onPress={onPress}>
      {/* Image */}
      <View style={[
        styles.listingImageWrapper,
        property.status === 'rejected' && { opacity: 0.6 },
      ]}>
        <Image source={{ uri: coverImage }} style={styles.listingImage} />
      </View>

      {/* Content */}
      <View style={styles.listingContent}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            {/* Status pill */}
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {statusStyle.label}
              </Text>
            </View>

            <Text style={styles.listingTitle} numberOfLines={1}>{property.title}</Text>

            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.iconAction} onPress={onEdit} activeOpacity={0.7}>
              <MaterialIcons name="edit" size={17} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: 'rgba(186, 26, 26, 0.08)' }]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete" size={17} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Details row */}
        <View style={styles.detailsRow}>
          {property.bedrooms != null && (
            <View style={styles.detailChip}>
              <MaterialIcons name="hotel" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View style={styles.detailChip}>
              <MaterialIcons name="bathtub" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <MaterialIcons name="attach-money" size={12} color={Colors.secondary} />
            <Text style={[styles.detailText, { color: Colors.secondary, fontWeight: '700' }]}>
              {Number(property.price).toLocaleString()}/mo
            </Text>
          </View>
          {property.propertyType && (
            <View style={styles.detailChip}>
              <MaterialIcons name="category" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{property.propertyType}</Text>
            </View>
          )}
        </View>

        {/* Rejection reason */}
        {property.status === 'rejected' && property.rejectionReason && (
          <View style={styles.rejectedNote}>
            <MaterialIcons name="error" size={13} color={Colors.error} style={{ marginRight: 4 }} />
            <Text style={styles.rejectedText} numberOfLines={2}>
              {property.rejectionReason}
            </Text>
          </View>
        )}

        {/* Pending note */}
        {property.status === 'pending' && (
          <View style={styles.pendingNote}>
            <MaterialIcons name="hourglass-top" size={13} color="#92400e" style={{ marginRight: 4 }} />
            <Text style={styles.pendingText}>Under admin review — usually 24–48 hrs.</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 14, fontWeight: '800' },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20 },

  // Hero
  hero:         { marginTop: 24, marginBottom: 24 },
  heroHeading:  { fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, marginTop: 4 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 36,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:   { fontSize: 28, fontWeight: '800', color: Colors.primary },
  statLabel:   { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, marginBottom: 10 },
  statBadge:   { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statBadgeText: { fontSize: 11, fontWeight: '700' },

  // Listings section
  listingsSection: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle:    { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  addBtnDesktop:   { borderRadius: 10, overflow: 'hidden' },
  addBtnGradient:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },

  // States
  centeredBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.onSurfaceVariant, fontWeight: '500' },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  errorBoxTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  errorBoxText:  { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, gap: 8 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  emptyAddBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden', width: '100%' },
  emptyAddBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  emptyAddBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Property cards
  listContainer: { gap: 16 },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  listingImageWrapper: {
    width: '100%',
    height: 180,
  },
  listingImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  listingContent: { padding: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusText:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  listingTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  actionBtns:   { flexDirection: 'row', gap: 8 },
  iconAction: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  detailsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },

  rejectedNote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, backgroundColor: '#fee2e2', borderRadius: 8, padding: 8 },
  rejectedText: { fontSize: 12, fontStyle: 'italic', fontWeight: '500', color: '#991b1b', flex: 1, lineHeight: 17 },
  pendingNote:  { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#fef3c7', borderRadius: 8, padding: 8 },
  pendingText:  { fontSize: 12, fontWeight: '500', color: '#92400e', flex: 1 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56, height: 56,
    borderRadius: 28,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Booking Management
  bookingMgmtSection: { marginBottom: 28, gap: 10 },
  bookingMgmtBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  bookingMgmtIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookingMgmtInfo: { flex: 1, gap: 2 },
  bookingMgmtTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  bookingMgmtSub: { fontSize: 12, color: Colors.onSurfaceVariant },
});
