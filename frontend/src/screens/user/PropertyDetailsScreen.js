import React, { useRef, useState, useCallback } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import DetailHeader from '../../components/navigation/DetailHeader';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

const AMENITY_ICON_MAP = {
  wifi:            'wifi',
  internet:        'wifi',
  ac:              'ac-unit',
  'air condition': 'ac-unit',
  parking:         'local-parking',
  gym:             'fitness-center',
  pool:            'pool',
  security:        'security',
  garden:          'park',
  balcony:         'balcony',
  elevator:        'elevator',
  laundry:         'local-laundry-service',
  pet:             'pets',
  storage:         'storage',
  furnished:       'chair',
  cctv:            'videocam',
  generator:       'bolt',
  water:           'water-drop',
};

const getAmenityIcon = (label = '') => {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'check-circle';
};

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

const TYPE_COLORS = {
  house:     { bg: 'rgba(16,185,129,0.15)',  text: '#059669' },
  apartment: { bg: 'rgba(14,165,233,0.15)',  text: '#0284c7' },
  villa:     { bg: 'rgba(139,92,246,0.15)',   text: '#7c3aed' },
  loft:      { bg: 'rgba(245,158,11,0.15)',   text: '#d97706' },
  studio:    { bg: 'rgba(236,72,153,0.15)',   text: '#be185d' },
  default:   { bg: 'rgba(100,116,139,0.15)',  text: '#475569' },
};
const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.default;

// ── Star Rating Component ──────────────────────────────────────────────────────
function StarRating({ rating, onRate, size = 28, readonly = false }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
        >
          <MaterialIcons
            name={star <= rating ? 'star' : 'star-border'}
            size={size}
            color={star <= rating ? '#f59e0b' : '#e0e3e5'}
            style={star <= rating && !readonly ? styles.starGlow : null}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Review Card Component ──────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwner = review.user?._id === currentUserId;
  const initials = review.user?.name
    ? review.user.name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <View style={[styles.reviewCardItem, review.status === 'pending' && { opacity: 0.7 }]}>
      <View style={styles.reviewCardHeader}>
        <LinearGradient
          colors={review.status === 'pending' ? ['#f59e0b', '#d97706'] : ['#006591', '#39b8fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reviewAvatar}
        >
          <Text style={styles.reviewAvatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.reviewerName}>{review.user?.name || 'User'}</Text>
            {review.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.reviewDateText}>{date}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => onDelete(review._id)} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.starContainer}>
        <StarRating rating={review.rating} readonly size={16} />
      </View>
      <Text style={styles.commentText}>{review.comment}</Text>
      {review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesContainer}>
          {review.images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.reviewImage} />
          ))}
        </ScrollView>
      )}

      {review.ownerReply && (
        <View style={styles.ownerResponseBox}>
          <View style={styles.ownerResponseHeader}>
            <MaterialIcons name="reply" size={16} color={Colors.secondary} />
            <Text style={styles.ownerResponseTitle}>Response from Owner</Text>
          </View>
          <Text style={styles.ownerResponseText}>{review.ownerReply}</Text>
        </View>
      )}
    </View>
  );
}

export default function PropertyDetailsScreen({ navigation, route }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const { user } = useAuth();

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

  // ── Review State ──
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const res = await API.get(`/reviews/${property.id}`);
      setReviews(res.data.data);
      setAvgRating(res.data.avgRating);
    } catch (err) {
      console.log('Error loading reviews');
    } finally {
      setLoadingReviews(false);
    }
  }, [property.id]);

  useFocusEffect(useCallback(() => { fetchReviews(); }, [fetchReviews]));

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slideIndex);
  };

  const handleCallOwner = () => {
    if (property.owner?.phone) {
      Linking.openURL(`tel:${property.owner.phone}`);
    } else {
      Alert.alert('Contact Info', `Owner: ${property.owner?.name || 'Not available'}\\nEmail: ${property.owner?.email || 'Not available'}`);
    }
  };

  const handleEmailOwner = () => {
    if (property.owner?.email) {
      Linking.openURL(`mailto:${property.owner.email}?subject=Inquiry about ${property.title}`);
    }
  };

  // ── Review Logic ──
  const handleReviewSubmit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating.');
    if (!comment.trim()) return Alert.alert('Error', 'Please write a comment.');

    try {
      setSubmittingReview(true);
      const res = await API.post(`/reviews/${property.id}`, { rating, comment, images: reviewImages });
      setReviews(prev => [res.data.data, ...prev]);
      setRating(0);
      setComment('');
      setReviewImages([]);
      setShowReviewForm(false);
      Alert.alert('Success', 'Your review has been submitted and is pending owner approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r._id !== reviewId));
            fetchReviews();
          } catch {
            Alert.alert('Error', 'Could not delete review.');
          }
        },
      },
    ]);
  };

  const pickReviewImage = async () => {
    if (reviewImages.length >= 3) {
      return Alert.alert('Limit Reached', 'You can upload a maximum of 3 media files.');
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Required', 'Please allow access to your photo library.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 3 - reviewImages.length,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => 
        asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      );
      setReviewImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeReviewImage = (index) => setReviewImages(prev => prev.filter((_, i) => i !== index));

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

          {property.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <MaterialIcons name="photo-library" size={13} color="#fff" />
              <Text style={styles.imageCountText}>{activeSlide + 1}/{property.images.length}</Text>
            </View>
          )}

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

          {/* ── INLINED REVIEWS SECTION ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

            {/* Average Rating Premium Box */}
            <LinearGradient
              colors={['#091426', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avgBox}
            >
              <View style={styles.avgScoreContainer}>
                <Text style={styles.avgNumber}>{avgRating.toFixed(1)}</Text>
                <Text style={styles.avgOutOf}>/ 5</Text>
              </View>
              <View style={styles.avgDetailsContainer}>
                <StarRating rating={Math.round(avgRating)} readonly size={24} />
                <Text style={styles.totalReviews}>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
              </View>
            </LinearGradient>

            {/* Add Review Button */}
            {!showReviewForm && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setShowReviewForm(true)}>
                <LinearGradient
                  colors={['#006591', '#39b8fd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addBtn}
                >
                  <MaterialIcons name="edit-note" size={22} color="#fff" />
                  <Text style={styles.addBtnText}>Write a Review</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.form}>
                  <Text style={styles.formTitle}>Rate your experience</Text>
                  <View style={styles.starsRow}>
                    <StarRating rating={rating} onRate={setRating} size={36} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us more about your experience..."
                    placeholderTextColor="#8590a6"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                  />

                  {/* Media Upload Section */}
                  <View style={styles.mediaSection}>
                    {reviewImages.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                        {reviewImages.map((img, idx) => (
                          <View key={idx} style={styles.mediaPreviewContainer}>
                            <Image source={{ uri: img }} style={styles.mediaPreview} />
                            <TouchableOpacity style={styles.mediaRemoveBtn} onPress={() => removeReviewImage(idx)}>
                              <MaterialIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                    {reviewImages.length < 3 && (
                      <TouchableOpacity style={styles.uploadBtn} onPress={pickReviewImage}>
                        <MaterialIcons name="photo-camera" size={20} color={Colors.secondary} />
                        <Text style={styles.uploadBtnText}>Add Photo/Video</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.formBtns}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => { setShowReviewForm(false); setRating(0); setComment(''); setReviewImages([]); }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitBtnContainer} disabled={submittingReview} onPress={handleReviewSubmit}>
                      <LinearGradient
                        colors={['#006591', '#39b8fd']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitBtn}
                      >
                        {submittingReview
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.submitBtnText}>Submit Review</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />
            ) : reviews.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="chat-bubble-outline" size={48} color="#c5c6cd" />
                </View>
                <Text style={styles.emptyTextTitle}>No reviews yet</Text>
                <Text style={styles.emptyTextSub}>Be the first to share your experience!</Text>
              </View>
            ) : (
              reviews.map((rev) => (
                <ReviewCard
                  key={rev._id}
                  review={rev}
                  currentUserId={user?._id}
                  onDelete={handleDeleteReview}
                />
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* ── Floating Header ── */}
      <DetailHeader
        onBack={() => navigation.goBack()}
        onShare={() => {}}
      />

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

          <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.secondary, '#00486b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookGradient}
            >
              <MaterialIcons name="calendar-today" size={18} color="#fff" />
              <Text style={styles.bookText}>Book Tour</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

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

  detailsBlade: {
    marginTop: -28, backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 28,
  },

  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,101,145,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  verifiedText: { color: Colors.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  typePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typePillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },

  titleSection: { marginBottom: 24 },
  propertyTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5, marginBottom: 8, lineHeight: 34 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  locationText: { fontSize: 14, color: Colors.onSurfaceVariant, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 30, fontWeight: '800', color: Colors.primary },
  priceUnit: { fontSize: 15, color: Colors.onSurfaceVariant, fontWeight: '500', marginLeft: 3 },

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

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 14 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: Colors.onSurfaceVariant },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,101,145,0.07)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,101,145,0.12)',
  },
  amenityChipText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  termsBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  termsText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.onSurfaceVariant },

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

  // ── REVIEWS SECTION STYLES ──
  avgBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#091426', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  avgScoreContainer: { flexDirection: 'row', alignItems: 'baseline' },
  avgNumber: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  avgOutOf: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  avgDetailsContainer: { alignItems: 'flex-end' },
  totalReviews: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16, marginBottom: 24,
    shadowColor: '#006591', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  form: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  input: {
    backgroundColor: '#f7f9fb', borderWidth: 1, borderColor: '#eceef0',
    borderRadius: 16, padding: 16, fontSize: 15,
    color: Colors.primary, minHeight: 120,
    textAlignVertical: 'top', marginBottom: 24,
  },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f2f4f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#45474c', fontSize: 15 },
  submitBtnContainer: { flex: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 15 },

  mediaSection: { marginBottom: 24 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(0,101,145,0.06)', borderRadius: 12, alignSelf: 'flex-start' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  mediaPreviewList: { flexDirection: 'row', marginBottom: 12 },
  mediaPreviewContainer: { marginRight: 12, position: 'relative' },
  mediaPreview: { width: 80, height: 80, borderRadius: 12 },
  mediaRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  reviewCardItem: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(236,238,240,0.8)'
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  reviewerName: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  reviewDateText: { fontSize: 12, fontWeight: '500', color: '#8590a6', marginTop: 2 },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pendingBadgeText: { color: '#d97706', fontSize: 10, fontWeight: '700' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' },
  starContainer: { marginBottom: 12 },
  commentText: { fontSize: 15, color: '#45474c', lineHeight: 24 },
  reviewImagesContainer: { flexDirection: 'row', marginTop: 16 },
  reviewImage: { width: 100, height: 100, borderRadius: 12, marginRight: 12 },

  ownerResponseBox: { backgroundColor: 'rgba(0,101,145,0.06)', padding: 16, borderRadius: 12, marginTop: 16, borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  ownerResponseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ownerResponseTitle: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
  ownerResponseText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f2f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTextTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  emptyTextSub: { fontSize: 14, color: '#8590a6', fontWeight: '500' },
  
  starGlow: { textShadowColor: 'rgba(245, 158, 11, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  // ── ACTION BAR ──
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
});