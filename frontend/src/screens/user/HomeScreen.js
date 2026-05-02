import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  
  Platform,
  Animated,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CategoryChip from '../../components/ui/CategoryChip';
import FeaturedCard from '../../components/cards/FeaturedCard';
import ListingRow from '../../components/cards/ListingRow';
import BottomNav from '../../components/navigation/BottomNav';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getApprovedProperties, formatProperty } from '../../services/propertyService';

const CATEGORIES = ['All', 'House', 'Apartment', 'Villa', 'Loft'];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

// ── Helpers ──
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

const getRoleBadge = (role) => {
  switch (role) {
    case 'owner': return { label: 'Owner', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    case 'admin': return { label: 'Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    default:      return { label: 'Tenant', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' };
  }
};

// ── Skeleton Loader ──
function SkeletonBox({ width, height, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ width, height, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 12, opacity }, style]}
    />
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [user]);

  const fetchProperties = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const raw = await getApprovedProperties();
      setAllProperties(raw.map(formatProperty));
    } catch (err) {
      setError('Could not load properties. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = activeCategory === 'All'
    ? allProperties
    : allProperties.filter(p => p.propertyType?.toLowerCase() === activeCategory.toLowerCase());

  // Recent: Latest 3 published properties
  const recent = [...filtered]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // Featured: Premium properties (sort by price highest to lowest)
  const featured = [...filtered]
    .sort((a, b) => (b.priceRaw || 0) - (a.priceRaw || 0))
    .slice(0, 5);

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'listings') navigation.navigate('Listings');
    else if (tabKey === 'saved') navigation.navigate('Saved');
    else if (tabKey === 'login') navigation.navigate('Login');
    else if (tabKey === 'profile') setShowProfileMenu(true);
    else if (tabKey === 'inbox') navigation.navigate('Inbox');
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  const roleBadge = user ? getRoleBadge(user.role) : null;
  const navigate = (prop) => navigation.navigate('PropertyDetails', { property: prop });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Animated.View style={[styles.headerLeft, { opacity: fadeAnim }]}>
          {user ? (
            <TouchableOpacity style={styles.profileArea} activeOpacity={0.7} onPress={() => setShowProfileMenu(true)}>
              <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(user.name) }]}>
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              </View>
              <View style={styles.profileTextArea}>
                <Text style={styles.greetingText}>
                  Hi, <Text style={styles.userName}>{getFirstName(user.name)}</Text>
                </Text>
                <View style={[styles.rolePill, { backgroundColor: roleBadge.bg }]}>
                  <View style={[styles.roleDot, { backgroundColor: roleBadge.color }]} />
                  <Text style={[styles.roleLabel, { color: roleBadge.color }]}>{roleBadge.label}</Text>
                </View>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signInBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
              <MaterialIcons name="person-outline" size={20} color="#fff" />
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        <View style={styles.headerRight}>
          <Text style={styles.brand}>RentEase</Text>
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Listings')}>
            <MaterialIcons name="search" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BODY ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProperties(true)} colors={[Colors.secondary]} tintColor={Colors.secondary} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroHeading}>
            Find your next{'\n'}
            <Text style={styles.heroAccent}>architectural masterpiece.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Curated living spaces designed for the modern connoisseur.
          </Text>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat} label={cat} active={activeCategory === cat} onPress={() => setActiveCategory(cat)} />
          ))}
        </ScrollView>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchProperties()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Featured Section ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Selection</Text>
            <View style={styles.sectionAccent} />
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Listings')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 16 }}>
            {[1, 2].map(i => <SkeletonBox key={i} width={280} height={380} style={{ marginRight: 4 }} />)}
          </ScrollView>
        ) : featured.length === 0 ? (
          <View style={styles.emptyListings}>
            <MaterialIcons name="home-work" size={44} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No featured properties yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeCategory !== 'All' ? `No ${activeCategory} listings available` : 'Be the first to list a property'}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featured.map((item) => (
              <FeaturedCard
                key={item.id}
                price={item.price}
                title={item.title}
                location={item.location}
                imageUri={item.imageUri || PLACEHOLDER_IMAGE}
                onPress={() => navigate(item)}
              />
            ))}
          </ScrollView>
        )}

        {/* ── Recent Section ── */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <View style={styles.sectionAccentWide} />

          {loading ? (
            [1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <SkeletonBox width={120} height={120} style={{ borderRadius: 12 }} />
                <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
                  <SkeletonBox width="80%" height={16} />
                  <SkeletonBox width="60%" height={12} />
                  <SkeletonBox width="40%" height={20} />
                </View>
              </View>
            ))
          ) : recent.length === 0 && !loading ? (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptySubtitle}>
                {activeCategory !== 'All'
                  ? `No recent ${activeCategory} listings`
                  : 'All properties shown above'}
              </Text>
            </View>
          ) : (
            recent.map((item) => (
              <ListingRow
                key={item.id}
                title={item.title}
                location={item.location}
                price={item.price}
                beds={item.beds}
                baths={item.baths}
                imageUri={item.imageUri || PLACEHOLDER_IMAGE}
                onPress={() => navigate(item)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('Listings')}>
        <MaterialIcons name="tune" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ── Profile Modal ── */}
      {user && (
        <Modal visible={showProfileMenu} transparent animationType="fade" onRequestClose={() => setShowProfileMenu(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowProfileMenu(false)}>
            <View style={styles.dropdownMenu}>
              <View style={styles.dropdownUserSection}>
                <View style={[styles.dropdownAvatar, { backgroundColor: getAvatarColor(user?.name) }]}>
                  <Text style={styles.dropdownAvatarText}>{getInitials(user?.name)}</Text>
                </View>
                <View style={styles.dropdownUserInfo}>
                  <Text style={styles.dropdownUserName}>{user?.name}</Text>
                  <Text style={styles.dropdownUserEmail}>{user?.email}</Text>
                  <View style={[styles.dropdownRoleBadge, { backgroundColor: roleBadge?.bg }]}>
                    <Text style={[styles.dropdownRoleText, { color: roleBadge?.color }]}>{roleBadge?.label}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}
                onPress={() => { setShowProfileMenu(false); user?.role === 'admin' ? navigation.navigate('AdminDashboard') : null; }}>
                <MaterialIcons name="person-outline" size={20} color={Colors.onSurfaceVariant} />
                <Text style={styles.dropdownItemText}>{user?.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}>
                <MaterialIcons name="settings" size={20} color={Colors.onSurfaceVariant} />
                <Text style={styles.dropdownItemText}>Settings</Text>
              </TouchableOpacity>
              {user?.role === 'owner' && (
                <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}
                  onPress={() => { setShowProfileMenu(false); navigation.navigate('OwnerDashboard'); }}>
                  <MaterialIcons name="business" size={20} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dropdownItemText}>My Properties</Text>
                </TouchableOpacity>
              )}
              {/* ── Tenant: Booking Dashboard ── */}
              {(user?.role === 'tenant' || user?.role === 'user') && (
                <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}
                  onPress={() => { setShowProfileMenu(false); navigation.navigate('TenantBookingDashboard'); }}>
                  <MaterialIcons name="book-online" size={20} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dropdownItemText}>My Bookings</Text>
                </TouchableOpacity>
              )}
              {/* ── Tenant: Rent Payment & Tracking ── */}
              {(user?.role === 'tenant' || user?.role === 'user') && (
                <>
                  <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}
                    onPress={() => { setShowProfileMenu(false); navigation.navigate('TenantBills'); }}>
                    <MaterialIcons name="receipt-long" size={20} color={Colors.onSurfaceVariant} />
                    <Text style={styles.dropdownItemText}>My Bills</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}
                    onPress={() => { setShowProfileMenu(false); navigation.navigate('TenantWallet'); }}>
                    <MaterialIcons name="account-balance-wallet" size={20} color={Colors.onSurfaceVariant} />
                    <Text style={styles.dropdownItemText}>My Wallet</Text>
                  </TouchableOpacity>
                </>
              )}
              {/* ── Tenant & Owner: Agreements ── */}
              {(user?.role === 'tenant' || user?.role === 'owner') && (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                  onPress={() => { setShowProfileMenu(false); navigation.navigate('Agreements'); }}
                >
                  <MaterialIcons name="description" size={20} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dropdownItemText}>My Agreements</Text>
                </TouchableOpacity>
              )}
              {/* ── Tenant: Maintenance ── */}
              {user?.role === 'tenant' && (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                  onPress={() => { setShowProfileMenu(false); navigation.navigate('MaintenanceHub'); }}
                >
                  <MaterialIcons name="build" size={20} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dropdownItemText}>Maintenance Requests</Text>
                </TouchableOpacity>
              )}
              <View style={styles.dropdownDivider} />
              <TouchableOpacity style={styles.dropdownItemLogout} activeOpacity={0.7} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color={Colors.error} />
                <Text style={styles.dropdownItemLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(247,249,251,0.95)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.15)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  signInText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  profileArea: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 4 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  avatarInitials: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  profileTextArea: { gap: 2 },
  greetingText: { fontSize: 14, color: Colors.onSurfaceVariant, fontWeight: '500' },
  userName: { fontWeight: '800', color: Colors.primary },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleDot: { width: 5, height: 5, borderRadius: 2.5 },
  roleLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Body
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  hero: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 8 },
  heroHeading: { fontSize: 30, fontWeight: '800', color: Colors.primary, lineHeight: 38, letterSpacing: -0.5 },
  heroAccent: { color: Colors.secondary },
  heroSubtitle: { marginTop: 10, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, maxWidth: 270 },
  categoriesScroll: { marginTop: 20 },
  categoriesRow: { paddingHorizontal: 22, paddingVertical: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, marginTop: 36, marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  sectionAccent: { height: 3, width: 28, backgroundColor: Colors.secondary, borderRadius: 99, marginTop: 4 },
  sectionAccentWide: { height: 3, width: 28, backgroundColor: Colors.secondary, borderRadius: 99, marginTop: 4, marginBottom: 20 },
  viewAll: { fontSize: 13, fontWeight: '700', color: Colors.secondary, letterSpacing: 0.3 },
  featuredRow: { paddingHorizontal: 22, paddingBottom: 8 },
  recentSection: { paddingHorizontal: 22, marginTop: 36 },

  // Empty / Error states
  emptyListings: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 22, gap: 8 },
  emptyRecent: { alignItems: 'center', paddingVertical: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptySubtitle: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 22, marginTop: 12, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(186,26,26,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)',
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.error, borderRadius: 8 },
  retryText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90, right: 22,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
  },

  // Profile dropdown
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 100 : 70, paddingHorizontal: 16,
  },
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  dropdownUserSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  dropdownAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  dropdownAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dropdownUserInfo: { flex: 1, gap: 2 },
  dropdownUserName: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  dropdownUserEmail: { fontSize: 12, color: Colors.onSurfaceVariant },
  dropdownRoleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  dropdownRoleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  dropdownDivider: { height: 1, backgroundColor: 'rgba(197, 198, 205, 0.2)', marginHorizontal: 16 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  dropdownItemText: { fontSize: 15, fontWeight: '500', color: Colors.onSurface },
  dropdownItemLogout: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  dropdownItemLogoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
