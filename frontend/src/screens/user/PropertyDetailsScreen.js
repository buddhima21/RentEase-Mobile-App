import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import DetailHeader from '../../components/navigation/DetailHeader';
import AmenityItem from '../../components/ui/AmenityItem';
import { useAuth } from '../../context/AuthContext';
import { createBooking, getPropertyAvailability } from '../../services/bookingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

// ── Map known amenity strings to icons ──
const AMENITY_ICON_MAP = {
  wifi:          'wifi',
  internet:      'wifi',
  ac:            'ac-unit',
  'air condition': 'ac-unit',
  parking:       'local-parking',
  gym:           'fitness-center',
  pool:          'pool',
  security:      'security',
  garden:        'park',
  balcony:       'balcony',
  elevator:      'elevator',
  laundry:       'local-laundry-service',
  pet:           'pets',
  storage:       'storage',
  furnished:     'chair',
  cctv:          'videocam',
  generator:     'bolt',
  water:         'water-drop',
};

const getAmenityIcon = (label = '') => {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'check-circle';
};

// ── Owner avatar color ──
const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

// ── Property type badge ──
const TYPE_COLORS = {
  house:     { bg: 'rgba(16,185,129,0.15)', text: '#059669' },
  apartment: { bg: 'rgba(14,165,233,0.15)', text: '#0284c7' },
  villa:     { bg: 'rgba(139,92,246,0.15)',  text: '#7c3aed' },
  loft:      { bg: 'rgba(245,158,11,0.15)',  text: '#d97706' },
  studio:    { bg: 'rgba(236,72,153,0.15)',  text: '#be185d' },
  default:   { bg: 'rgba(100,116,139,0.15)', text: '#475569' },
};
const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.default;

export default function PropertyDetailsScreen({ navigation, route }) {
  const { user } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  // ── Booking modal state ──
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [idDocumentName, setIdDocumentName] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  // ── Consume real property from route params ──
  const raw = route?.params?.property || {};

  const property = {
    id:              raw.id   || raw._id,
    title:           raw.title           || 'Property Listing',
    location:        raw.location        || 'Location not specified',
    price:           raw.price           || 'LKR —',
    priceRaw:        raw.priceRaw,
    beds:            raw.beds            ?? raw.bedrooms  ?? '—',
    baths:           raw.baths           ?? raw.bathrooms ?? '—',
    propertyType:    raw.propertyType    || null,
    description:     raw.description     || 'No description provided for this property.',
    amenities:       Array.isArray(raw.amenities) ? raw.amenities : [],
    images:          Array.isArray(raw.images) && raw.images.length > 0
                       ? raw.images
                       : [PLACEHOLDER_IMAGE],
    securityDeposit: raw.securityDeposit,
    owner:           raw.owner           || null,
    status:          raw.status,
  };

  const typeColor = getTypeColor(property.propertyType);

  // ── Fetch property availability ──
  const fetchAvailability = useCallback(async () => {
    if (!property.id) return;
    try {
      setAvailLoading(true);
      const data = await getPropertyAvailability(property.id);
      setAvailability(data);
    } catch (err) {
      console.error('Availability fetch error:', err);
    } finally {
      setAvailLoading(false);
    }
  }, [property.id]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slideIndex);
  };

  const handleCallOwner = () => {
    if (property.owner?.phone) {
      Linking.openURL(`tel:${property.owner.phone}`);
    } else {
      Alert.alert('Contact Info', `Owner: ${property.owner?.name || 'Not available'}\nEmail: ${property.owner?.email || 'Not available'}`);
    }
  };

  const handleEmailOwner = () => {
    if (property.owner?.email) {
      Linking.openURL(`mailto:${property.owner.email}?subject=Inquiry about ${property.title}`);
    }
  };

  // ── Booking handlers ──
  const handleBookTourPress = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in as a tenant to book this property.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (user.role !== 'tenant') {
      Alert.alert('Tenant Only', 'Only tenants can book properties.');
      return;
    }
    if (availability?.isFullyBooked) {
      Alert.alert('Fully Booked', 'All bedrooms in this property are currently occupied.');
      return;
    }
    setShowBookingModal(true);
  };

  const handlePickDocument = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Denied', 'We need access to your photos to upload an ID document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = uri.split('/').pop() || 'id_document';
      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      setIdDocument(base64Data);
      setIdDocumentName(fileName);
    }
  };

  const validateDate = (dateStr) => {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    return d instanceof Date && !isNaN(d) && d >= today;
  };

  const handleSubmitBooking = async () => {
    if (!preferredDate || !validateDate(preferredDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid future date in YYYY-MM-DD format.');
      return;
    }

    try {
      setBookingLoading(true);
      await createBooking({
        propertyId: property.id,
        preferredDate,
        idDocument,
        idDocumentName,
      });
      setShowBookingModal(false);
      setPreferredDate('');
      setIdDocument(null);
      setIdDocumentName('');
      fetchAvailability();
      Alert.alert('Booking Submitted! ✅', 'Your booking request has been sent to the property owner. You can track the status in your Booking Dashboard.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit booking. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Gallery ── */}
        <View style={styles.gallery}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {property.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.12)']}
            style={styles.galleryGradient}
          />

          {/* Image count badge */}
          {property.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <MaterialIcons name="photo-library" size={13} color="#fff" />
              <Text style={styles.imageCountText}>{activeSlide + 1}/{property.images.length}</Text>
            </View>
          )}

          {/* Slide Indicators */}
          {property.images.length > 1 && (
            <View style={styles.indicators}>
              {property.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    activeSlide === index ? styles.indicatorActive : styles.indicatorInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Details Blade ── */}
        <View style={styles.detailsBlade}>

          {/* ── Status & Type Row ── */}
          <View style={styles.badgesRow}>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color={Colors.secondary} />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
            {property.propertyType && (
              <View style={[styles.typePill, { backgroundColor: typeColor.bg }]}>
                <Text style={[styles.typePillText, { color: typeColor.text }]}>
                  {property.propertyType}
                </Text>
              </View>
            )}
          </View>

          {/* ── Title + Location + Price ── */}
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={Colors.secondary} />
              <Text style={styles.locationText}>{property.location}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{property.price}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
          </View>

          {/* ── Quick Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrapper}>
                <MaterialIcons name="king-bed" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.statValue}>{property.beds}</Text>
              <Text style={styles.statLabel}>Bedrooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <View style={styles.statIconWrapper}>
                <MaterialIcons name="bathtub" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.statValue}>{property.baths}</Text>
              <Text style={styles.statLabel}>Bathrooms</Text>
            </View>
            {property.securityDeposit > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <View style={styles.statIconWrapper}>
                    <MaterialIcons name="shield" size={22} color={Colors.secondary} />
                  </View>
                  <Text style={styles.statValue}>LKR {Number(property.securityDeposit).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Deposit</Text>
                </View>
              </>
            )}
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* ── Amenities ── */}
          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <MaterialIcons name={getAmenityIcon(amenity)} size={16} color={Colors.secondary} />
                    <Text style={styles.amenityChipText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Terms & Conditions ── */}
          {raw.termsAndConditions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              <View style={styles.termsBox}>
                <MaterialIcons name="gavel" size={16} color={Colors.onSurfaceVariant} style={{ marginTop: 2 }} />
                <Text style={styles.termsText}>{raw.termsAndConditions}</Text>
              </View>
            </View>
          )}

          {/* ── Owner Card ── */}
          {property.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <View style={styles.ownerCard}>
                <View style={[styles.ownerAvatar, { backgroundColor: getAvatarColor(property.owner.name) }]}>
                  <Text style={styles.ownerInitials}>{getInitials(property.owner.name)}</Text>
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{property.owner.name}</Text>
                  {property.owner.email && (
                    <Text style={styles.ownerEmail}>{property.owner.email}</Text>
                  )}
                  <View style={styles.ownerBadge}>
                    <MaterialIcons name="home-work" size={12} color="#8b5cf6" />
                    <Text style={styles.ownerBadgeText}>Property Owner</Text>
                  </View>
                </View>
                <View style={styles.ownerActions}>
                  {property.owner.email && (
                    <TouchableOpacity style={styles.ownerActionBtn} activeOpacity={0.7} onPress={handleEmailOwner}>
                      <MaterialIcons name="email" size={20} color={Colors.secondary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.ownerActionBtn, styles.ownerCallBtn]} activeOpacity={0.7} onPress={handleCallOwner}>
                    <MaterialIcons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating Header ── */}
      <DetailHeader
        onBack={() => navigation.goBack()}
        onShare={() => {}}
      />

      {/* ── Availability Badge ── */}
      {availability && (
        <View style={[styles.availBadge, availability.isFullyBooked ? styles.availBadgeFull : styles.availBadgeOpen]}>
          <MaterialIcons name={availability.isFullyBooked ? 'block' : 'check-circle'} size={16} color={availability.isFullyBooked ? '#991b1b' : '#065f46'} />
          <Text style={[styles.availBadgeText, { color: availability.isFullyBooked ? '#991b1b' : '#065f46' }]}>
            {availability.isFullyBooked ? 'Fully Booked' : `${availability.availableBedrooms} of ${availability.totalBedrooms} bedrooms available`}
          </Text>
        </View>
      )}

      {/* ── Fixed Action Bar ── */}
      <View style={styles.actionBar}>
        <View style={styles.actionPriceBlock}>
          <Text style={styles.actionLabel}>MONTHLY RENT</Text>
          <View style={styles.actionPriceRow}>
            <Text style={styles.actionPrice}>{property.price}</Text>
            <Text style={styles.actionPriceUnit}>/mo</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={handleCallOwner}
          >
            <MaterialIcons name="chat" size={18} color={Colors.secondary} />
            <Text style={styles.contactBtnText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bookBtn, availability?.isFullyBooked && { opacity: 0.5 }]}
            activeOpacity={0.85}
            onPress={handleBookTourPress}
            disabled={availability?.isFullyBooked}
          >
            <LinearGradient
              colors={availability?.isFullyBooked ? ['#9ca3af', '#6b7280'] : [Colors.secondary, '#00486b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookGradient}
            >
              <MaterialIcons name={availability?.isFullyBooked ? 'block' : 'calendar-today'} size={18} color="#fff" />
              <Text style={styles.bookText}>{availability?.isFullyBooked ? 'Fully Booked' : 'Book Tour'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Booking Modal ── */}
      <Modal visible={showBookingModal} transparent animationType="slide" onRequestClose={() => setShowBookingModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowBookingModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Book This Property</Text>
            <Text style={styles.modalSubtitle}>{property.title}</Text>

            {/* Date Input */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Preferred Date *</Text>
              <View style={styles.modalInputRow}>
                <MaterialIcons name="event" size={20} color={Colors.secondary} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={preferredDate}
                  onChangeText={setPreferredDate}
                  keyboardType="default"
                  maxLength={10}
                />
              </View>
              <Text style={styles.modalHint}>Enter date as YYYY-MM-DD (e.g. 2026-06-15)</Text>
            </View>

            {/* ID Document Upload */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>ID Document / Photo (Optional)</Text>
              <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.7} onPress={handlePickDocument}>
                <MaterialIcons name={idDocument ? 'check-circle' : 'cloud-upload'} size={24} color={idDocument ? '#059669' : Colors.secondary} />
                <Text style={[styles.uploadBtnText, idDocument && { color: '#059669' }]}>
                  {idDocument ? idDocumentName : 'Tap to upload ID document'}
                </Text>
              </TouchableOpacity>
              {idDocument && (
                <Image source={{ uri: idDocument }} style={styles.docPreview} resizeMode="cover" />
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBookingBtn, bookingLoading && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSubmitBooking}
              disabled={bookingLoading}
            >
              <LinearGradient
                colors={[Colors.secondary, '#00486b']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.submitBookingGradient}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBookingText}>Submit Booking Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowBookingModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── Gallery ──
  gallery: { width: '100%', height: 420, position: 'relative' },
  galleryImage: { width: SCREEN_WIDTH, height: 420 },
  galleryGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  imageCountBadge: {
    position: 'absolute', top: 56, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  imageCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  indicators: { position: 'absolute', bottom: 48, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  indicator: { height: 5, borderRadius: 99 },
  indicatorActive: { width: 24, backgroundColor: '#fff' },
  indicatorInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.4)' },

  // ── Details Blade ──
  detailsBlade: {
    marginTop: -28, backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 28,
  },

  // ── Badges Row ──
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,101,145,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  verifiedText: { color: Colors.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  typePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typePillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },

  // ── Title section ──
  titleSection: { marginBottom: 24 },
  propertyTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5, marginBottom: 8, lineHeight: 34 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  locationText: { fontSize: 14, color: Colors.onSurfaceVariant, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 30, fontWeight: '800', color: Colors.primary },
  priceUnit: { fontSize: 15, color: Colors.onSurfaceVariant, fontWeight: '500', marginLeft: 3 },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 20,
    paddingVertical: 16, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrapper: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,101,145,0.1)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: '500' },
  statDivider: { width: 1, height: 48, backgroundColor: Colors.outlineVariant, opacity: 0.5 },

  // ── Sections ──
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 14 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: Colors.onSurfaceVariant },

  // ── Amenities ──
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,101,145,0.07)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,101,145,0.12)',
  },
  amenityChipText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  // ── Terms ──
  termsBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  termsText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.onSurfaceVariant },

  // ── Owner Card ──
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  ownerAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  ownerInitials: { color: '#fff', fontSize: 18, fontWeight: '800' },
  ownerInfo: { flex: 1, gap: 3 },
  ownerName: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  ownerEmail: { fontSize: 12, color: Colors.onSurfaceVariant },
  ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ownerBadgeText: { fontSize: 11, color: '#8b5cf6', fontWeight: '600' },
  ownerActions: { flexDirection: 'row', gap: 8 },
  ownerActionBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,101,145,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerCallBtn: { backgroundColor: Colors.secondary },

  // ── Action Bar ──
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(230,232,234,0.5)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  actionPriceBlock: { flexShrink: 1 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 2 },
  actionPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  actionPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  actionPriceUnit: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500', marginLeft: 2 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(0,101,145,0.1)',
  },
  contactBtnText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  bookBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  bookGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 14 },
  bookText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Availability Badge ──
  availBadge: { position: 'absolute', bottom: 90, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  availBadgeOpen: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  availBadgeFull: { backgroundColor: 'rgba(186,26,26,0.08)', borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)' },
  availBadgeText: { fontSize: 13, fontWeight: '600' },

  // ── Booking Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 24 },
  modalField: { marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.outlineVariant },
  modalInput: { flex: 1, fontSize: 16, color: Colors.primary, fontWeight: '500' },
  modalHint: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 4, marginLeft: 4 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.outlineVariant, borderStyle: 'dashed' },
  uploadBtnText: { fontSize: 14, color: Colors.secondary, fontWeight: '600', flex: 1 },
  docPreview: { width: '100%', height: 120, borderRadius: 12, marginTop: 10 },
  submitBookingBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  submitBookingGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitBookingText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelModalText: { fontSize: 15, fontWeight: '600', color: Colors.onSurfaceVariant },
});
