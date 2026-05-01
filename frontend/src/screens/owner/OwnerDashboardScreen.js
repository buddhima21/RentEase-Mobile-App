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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600';

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const loadProperties = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getMyProperties();
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
      const message = error.response?.data?.message || 'Could not load your properties.';
      setFetchError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProperties(); }, [loadProperties]));

  const handleDelete = (property) => {
    Alert.alert('Delete Listing', `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteProperty(property._id);
          setProperties((prev) => prev.filter((p) => p._id !== property._id));
        } catch (error) { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  };

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'home') navigation.navigate('Home');
    if (tabKey === 'listings') navigation.navigate('Listings');
    if (tabKey === 'inbox') navigation.navigate('Inbox');
  };

  const totalListings  = properties.length;
  const approvedCount  = properties.filter((p) => p.status === 'approved').length;
  const pendingCount   = properties.filter((p) => p.status === 'pending').length;
  const rejectedCount  = properties.filter((p) => p.status === 'rejected').length;

  return (
    <SafeAreaView style={styles.safeArea}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProperties(true)} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroHeading}>Owner Dashboard</Text>
          <Text style={styles.heroSubtitle}>Welcome back, {getFirstName(user?.name) || 'Owner'}.</Text>
          
          {/* TWO SEPARATE BUTTONS - PROMINENT AT TOP */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Analytics', { view: 'stats' })} 
              style={styles.quickActionBtn}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#006591', '#00486b']} style={styles.quickActionGradient}>
                <MaterialIcons name="insights" size={18} color="#fff" />
                <Text style={styles.quickActionText}>System Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Analytics', { view: 'reviews' })} 
              style={styles.quickActionBtn}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.quickActionGradient}>
                <MaterialIcons name="rate-review" size={18} color="#fff" />
                <Text style={styles.quickActionText}>Manage Reviews</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Listings" value={isLoading ? '–' : totalListings} icon="home-work" iconColor={Colors.secondary} badge={`${approvedCount} live`} badgeColor="rgba(0,101,145,0.1)" badgeTextColor={Colors.secondary} />
          <StatCard label="Pending Review" value={isLoading ? '–' : pendingCount} icon="hourglass-top" iconColor="#f59e0b" badge="Awaiting admin" badgeColor="rgba(245,158,11,0.1)" badgeTextColor="#92400e" />
          <StatCard label="Approved" value={isLoading ? '–' : approvedCount} icon="verified" iconColor="#10b981" badge="Live now" badgeColor="rgba(16,185,129,0.1)" badgeTextColor="#065f46" />
          {rejectedCount > 0 && <StatCard label="Rejected" value={rejectedCount} icon="cancel" iconColor={Colors.error} badge="Needs attention" badgeColor="rgba(186,26,26,0.08)" badgeTextColor={Colors.error} />}
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
        {/* ── AGREEMENTS QUICK LINK ── */}
        <TouchableOpacity
          style={styles.agreementsLink}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Agreements')}
        >
          <View style={styles.agreementsLinkLeft}>
            <View style={styles.agreementsLinkIcon}>
              <MaterialIcons name="description" size={22} color={Colors.secondary} />
            </View>
            <View>
              <Text style={styles.agreementsLinkTitle}>My Agreements</Text>
              <Text style={styles.agreementsLinkSub}>View & manage rental contracts</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.secondary} />
        </TouchableOpacity>

        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <Text style={styles.sectionSubtitle}>Manage and track your active properties</Text>
            </View>
          </View>

          {isLoading && <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />}
          {!isLoading && properties.length === 0 && (
            <View style={styles.emptyBox}>
              <MaterialIcons name="home-work" size={56} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Listings Yet</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => navigation.navigate('ManageProperty')}>
                <LinearGradient colors={[Colors.secondary, Colors.primary]} style={styles.emptyAddBtnGradient}>
                  <Text style={styles.emptyAddBtnText}>Add First Property</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.listContainer}>
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} onEdit={() => navigation.navigate('ManageProperty', { property })} onDelete={() => handleDelete(property)} onPress={() => navigation.navigate('PropertyDetails', { property })} />
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('ManageProperty')}>
        <LinearGradient colors={[Colors.secondary, Colors.primary]} style={styles.fabGradient}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, iconColor, badge, badgeColor, badgeTextColor }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconBox, { backgroundColor: badgeColor }]}><MaterialIcons name={icon} size={22} color={iconColor} /></View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBadge, { backgroundColor: badgeColor }]}><Text style={[styles.statBadgeText, { color: badgeTextColor }]}>{badge}</Text></View>
    </View>
  );
}

function PropertyCard({ property, onEdit, onDelete, onPress }) {
  const statusStyle = getStatusStyle(property.status);
  const coverImage  = property.images?.[0] || FALLBACK_IMAGE;
  return (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: coverImage }} style={styles.listingImage} />
      <View style={styles.listingContent}>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
        <Text style={styles.listingTitle}>{property.title}</Text>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
          <Text style={styles.locationText}>{property.location}</Text>
        </View>
        {/* Rejection Reason — visible only to owner */}
        {property.status === 'rejected' && !!property.rejectionReason ? (
          <View style={styles.rejectionBanner}>
            <MaterialIcons name="info-outline" size={14} color="#991b1b" />
            <Text style={styles.rejectionReasonText}>{property.rejectionReason}</Text>
          </View>
        ) : null}
        <View style={styles.actionBtns}>
          <TouchableOpacity onPress={onEdit}><MaterialIcons name="edit" size={20} color={Colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={onDelete}><MaterialIcons name="delete" size={20} color={Colors.error} /></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 6, borderRadius: 20, backgroundColor: '#f0f2f5' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 14, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20 },
  hero: { marginTop: 24, marginBottom: 20 },
  heroHeading: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  heroSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 16 },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickActionBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  quickActionGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'row' },
  quickActionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flex: 1, minWidth: '45%', elevation: 2 },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, marginBottom: 8 },
  statBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statBadgeText: { fontSize: 11, fontWeight: '700' },

  // Agreements quick link
  agreementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  agreementsLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  agreementsLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 101, 145, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementsLinkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  agreementsLinkSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },

  // Listings section
  listingsSection: { marginBottom: 20 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  sectionSubtitle: { fontSize: 12, color: Colors.onSurfaceVariant },
  listContainer: { gap: 16 },
  listingCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 3 },
  listingImage: { width: '100%', height: 160 },
  listingContent: { padding: 16 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  listingTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12 },
  locationText: { fontSize: 12, color: Colors.onSurfaceVariant },
  actionBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8 },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Rejection reason banner (shown on owner's rejected properties)
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(153,27,27,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#991b1b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
    lineHeight: 17,
  },

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
