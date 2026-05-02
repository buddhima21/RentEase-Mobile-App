import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { getFavorites } from '../../services/favoriteService';
import { formatProperty } from '../../services/propertyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

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

// ── Animated Heart Button ──
function HeartButton({ isFav, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 40, bounciness: 18 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialIcons name={isFav ? 'favorite' : 'favorite-border'} size={22} color={isFav ? '#ef4444' : Colors.outlineVariant} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Saved Property Card ──
function SavedCard({ item, onPress, onRemove }) {
  const typeColor = getTypeColor(item.propertyType);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 20 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardInner}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          <Animated.Image
            source={{ uri: item.imageUri || PLACEHOLDER_IMAGE }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageGradient}
          />
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
              {item.propertyType || 'Property'}
            </Text>
          </View>
          {/* Remove heart button */}
          <TouchableOpacity style={styles.heartOverlay} onPress={onRemove} activeOpacity={0.8}>
            <View style={styles.heartCircle}>
              <MaterialIcons name="favorite" size={18} color="#ef4444" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={13} color={Colors.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.statsRow}>
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

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{item.price}</Text>
            <Text style={styles.priceUnit}>/mo</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function SavedScreen({ navigation }) {
  const { user } = useAuth();
  const { toggleFavorite, isFavorited, reload: reloadIds } = useFavorites();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const raw = await getFavorites();
      setProperties(raw.map(formatProperty));
    } catch (err) {
      setError('Could not load your saved properties.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Re-fetch whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleRemove = async (propertyId) => {
    // Optimistically remove from UI
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    await toggleFavorite(propertyId);
    // Also refresh IDs in context
    reloadIds();
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') navigation.navigate('Home');
    else if (tabKey === 'listings') navigation.navigate('Listings');
    else if (tabKey === 'inbox') navigation.navigate('Inbox');
    else if (tabKey === 'profile') navigation.navigate('Home'); // opens profile modal via Home
  };

  // ── Not logged in state ──
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <LinearGradient colors={['#0f2744', '#1e3a5f']} style={styles.headerGradient}>
            <Text style={styles.headerTitle}>Saved</Text>
            <Text style={styles.headerSubtitle}>Your favorite properties</Text>
          </LinearGradient>
        </Animated.View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <MaterialIcons name="favorite-border" size={56} color={Colors.outlineVariant} />
          </View>
          <Text style={styles.guestTitle}>Save your favorites</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to save properties you love and access them anytime.
          </Text>
          <TouchableOpacity
            style={styles.signInCta}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text style={styles.signInCtaText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="saved" onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <LinearGradient
          colors={[Colors.primary, '#1e3556']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Saved</Text>
              <Text style={styles.headerSubtitle}>
                {loading ? 'Loading...' : `${properties.length} saved propert${properties.length === 1 ? 'y' : 'ies'}`}
              </Text>
            </View>
            <View style={styles.headerIconWrapper}>
              <MaterialIcons name="favorite" size={28} color="rgba(255,255,255,0.85)" />
              {properties.length > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{properties.length}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFavorites(true)}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
      >
        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchFavorites()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading skeletons */}
        {loading && (
          <View style={styles.listContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.card, { overflow: 'hidden' }]}>
                <SkeletonBox width="100%" height={200} style={{ borderRadius: 0 }} />
                <View style={{ padding: 14, gap: 10 }}>
                  <SkeletonBox width="70%" height={16} />
                  <SkeletonBox width="50%" height={12} />
                  <SkeletonBox width="40%" height={12} />
                  <SkeletonBox width="45%" height={22} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && properties.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(14,165,233,0.08)', 'rgba(14,165,233,0.03)']}
              style={styles.emptyIconWrapper}
            >
              <MaterialIcons name="favorite-border" size={52} color={Colors.secondary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No saved properties yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any property to save it here for later.
            </Text>
            <TouchableOpacity
              style={styles.exploreCta}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Listings')}
            >
              <MaterialIcons name="search" size={18} color="#fff" />
              <Text style={styles.exploreCtaText}>Explore Properties</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Property list */}
        {!loading && properties.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>
              ❤️  {properties.length} saved propert{properties.length === 1 ? 'y' : 'ies'}
            </Text>
            {properties.map((item) => (
              <SavedCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('PropertyDetails', { property: item })}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="saved" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { overflow: 'hidden' },
  headerGradient: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  headerIconWrapper: { position: 'relative' },
  headerBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: Colors.primary,
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  listContainer: { paddingHorizontal: 18, paddingTop: 18, gap: 16 },
  sectionLabel: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '600', marginBottom: 4 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,205,0.15)',
  },
  cardInner: {},
  imageWrapper: { position: 'relative', height: 190 },
  cardImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  typeBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heartOverlay: { position: 'absolute', top: 10, right: 12 },
  heartCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  cardInfo: { padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
  statDivider: { width: 1, height: 12, backgroundColor: Colors.outlineVariant },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
  priceText: { fontSize: 22, fontWeight: '800', color: Colors.secondary },
  priceUnit: { fontSize: 13, color: Colors.onSurfaceVariant },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 14 },
  emptyIconWrapper: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  emptySubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 21 },
  exploreCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16, marginTop: 6,
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  exploreCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Guest
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  guestIconWrapper: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  guestTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  guestSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 21 },
  signInCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 16, marginTop: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  signInCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Error
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
