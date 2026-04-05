import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import ListingRow from '../../components/cards/ListingRow';
import { getApprovedProperties, formatProperty } from '../../services/propertyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

const PROPERTY_TYPES = ['All', 'House', 'Apartment', 'Villa', 'Loft', 'Studio'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

// ── Property type badge colors ──
const TYPE_COLORS = {
  house:     { bg: 'rgba(16,185,129,0.12)', text: '#059669' },
  apartment: { bg: 'rgba(14,165,233,0.12)', text: '#0284c7' },
  villa:     { bg: 'rgba(139,92,246,0.12)',  text: '#7c3aed' },
  loft:      { bg: 'rgba(245,158,11,0.12)',  text: '#d97706' },
  studio:    { bg: 'rgba(236,72,153,0.12)',  text: '#be185d' },
  default:   { bg: 'rgba(100,116,139,0.12)', text: '#475569' },
};
const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.default;

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

// ── Property Card (matches app style) ──
function PropertyCard({ item, onPress }) {
  const [liked, setLiked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const typeColor = getTypeColor(item.propertyType);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={[styles.propCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flexDirection: 'row', gap: 14 }}
      >
        {/* Image */}
        <View style={styles.propImageWrapper}>
          {item.imageUri ? (
            <Animated.Image
              source={{ uri: item.imageUri }}
              style={styles.propImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.propImage, styles.propImagePlaceholder]}>
              <MaterialIcons name="home" size={32} color={Colors.outlineVariant} />
            </View>
          )}
          {/* Type Badge over image */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
              {item.propertyType || 'Property'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.propInfo}>
          <View style={styles.propTopRow}>
            <Text style={styles.propTitle} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity
              onPress={() => setLiked(!liked)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.heartBtn}
            >
              <MaterialIcons
                name={liked ? 'favorite' : 'favorite-border'}
                size={20}
                color={liked ? Colors.error : Colors.outlineVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.propLocationRow}>
            <MaterialIcons name="location-on" size={13} color={Colors.secondary} />
            <Text style={styles.propLocation} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.propStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="king-bed" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.statText}>{item.beds} Bed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="bathtub" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.statText}>{item.baths} Bath</Text>
            </View>
            {item.owner?.name && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="person" size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.statText} numberOfLines={1}>{item.owner.name}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.propPriceRow}>
            <Text style={styles.propPrice}>{item.price}</Text>
            <Text style={styles.propPriceUnit}>/mo</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Sort Modal ──
function SortModal({ visible, selectedSort, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Sort By</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[modalStyles.option, selectedSort === opt.id && modalStyles.optionActive]}
              activeOpacity={0.7}
              onPress={() => { onSelect(opt.id); onClose(); }}
            >
              <Text style={[modalStyles.optionText, selectedSort === opt.id && modalStyles.optionTextActive]}>
                {opt.label}
              </Text>
              {selectedSort === opt.id && (
                <MaterialIcons name="check-circle" size={20} color={Colors.secondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28, paddingTop: 16,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 99, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6,
    backgroundColor: Colors.surfaceContainerLow,
  },
  optionActive: { backgroundColor: 'rgba(0,101,145,0.08)', borderWidth: 1, borderColor: 'rgba(0,101,145,0.2)' },
  optionText: { fontSize: 15, fontWeight: '500', color: Colors.onSurface },
  optionTextActive: { fontWeight: '700', color: Colors.secondary },
});

// ── Main Screen ──
export default function ListingsScreen({ navigation }) {
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const fetchProperties = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const raw = await getApprovedProperties();
      setAllProperties(raw.map(formatProperty));
      setTotalCount(raw.length);
    } catch (err) {
      setError('Failed to load listings. Check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // ── Filter + Sort pipeline ──
  const filtered = allProperties
    .filter((p) => {
      const matchType = activeType === 'All' || p.propertyType?.toLowerCase() === activeType.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
      return matchType && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceRaw - b.priceRaw;
      if (sortBy === 'price_desc') return b.priceRaw - a.priceRaw;
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') navigation.navigate('Home');
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort';

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[Colors.primary, '#1e3556']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleArea}>
              <Text style={styles.headerTitle}>Explore</Text>
              <Text style={styles.headerSubtitle}>
                {loading ? 'Loading...' : `${filtered.length} properties available`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sortBtn}
              activeOpacity={0.7}
              onPress={() => setShowSort(true)}
            >
              <MaterialIcons name="sort" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or location..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={18} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── TYPE FILTER CHIPS ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, activeType === type && styles.typeChipActive]}
              onPress={() => setActiveType(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeChipText, activeType === type && styles.typeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── SORT PILL (shows when sorting is non-default) ── */}
      {sortBy !== 'newest' && (
        <View style={styles.activeSortRow}>
          <MaterialIcons name="filter-list" size={14} color={Colors.secondary} />
          <Text style={styles.activeSortText}>{currentSortLabel}</Text>
          <TouchableOpacity onPress={() => setSortBy('newest')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialIcons name="close" size={16} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── LISTINGS ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProperties(true)}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchProperties()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <View style={styles.listContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.propCard, { flexDirection: 'row', gap: 14 }]}>
                <SkeletonBox width={120} height={120} style={{ borderRadius: 16 }} />
                <View style={{ flex: 1, gap: 10, paddingTop: 4 }}>
                  <SkeletonBox width="75%" height={16} />
                  <SkeletonBox width="55%" height={12} />
                  <SkeletonBox width="40%" height={12} />
                  <SkeletonBox width="50%" height={22} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No results */}
        {!loading && !error && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="search-off" size={44} color={Colors.outlineVariant} />
            </View>
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : activeType !== 'All'
                  ? `No ${activeType} listings available yet`
                  : 'No approved properties listed yet. Check back soon!'}
            </Text>
            {(searchQuery || activeType !== 'All') && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                activeOpacity={0.7}
                onPress={() => { setSearchQuery(''); setActiveType('All'); }}
              >
                <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Property List */}
        {!loading && filtered.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.resultsCount}>{filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} found</Text>
            {filtered.map((item) => (
              <PropertyCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('PropertyDetails', { property: item })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="listings" onTabPress={handleTabPress} />
      <SortModal visible={showSort} selectedSort={sortBy} onSelect={setSortBy} onClose={() => setShowSort(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header: { overflow: 'hidden' },
  headerGradient: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sortBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  searchInput: {
    flex: 1, fontSize: 15, color: Colors.primary, fontWeight: '500', padding: 0,
  },

  // ── Filter ──
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.2)',
    paddingVertical: 12,
  },
  filterScrollContent: { paddingHorizontal: 16, gap: 8 },
  typeChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1, borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  typeChipTextActive: { color: '#fff' },

  // Active sort pill
  activeSortRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: 'rgba(0,101,145,0.06)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,101,145,0.1)',
  },
  activeSortText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.secondary },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  listContainer: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  resultsCount: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500', marginBottom: 4 },

  // ── Property Card ──
  propCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(197,198,205,0.18)',
  },
  propImageWrapper: { position: 'relative' },
  propImage: { width: 120, height: 130, borderRadius: 16, backgroundColor: Colors.surfaceContainerHigh },
  propImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  typeBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  propInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  propTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  propTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, flex: 1, marginRight: 6 },
  heartBtn: { padding: 2 },
  propLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  propLocation: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  propStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: '500' },
  statDivider: { width: 1, height: 10, backgroundColor: Colors.outlineVariant },
  propPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 8 },
  propPrice: { fontSize: 20, fontWeight: '800', color: Colors.secondary },
  propPriceUnit: { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '400' },

  // ── Empty / Error states ──
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconWrapper: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  emptySubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  clearFiltersBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: Colors.primary, borderRadius: 12,
  },
  clearFiltersBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 20, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(186,26,26,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)',
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.error, borderRadius: 8 },
  retryText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
