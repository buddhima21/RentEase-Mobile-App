import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

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

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwner = review.user?._id === currentUserId;
  const initials = review.user?.name
    ? review.user.name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <View style={[styles.card, review.status === 'pending' && { opacity: 0.7 }]}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={review.status === 'pending' ? ['#f59e0b', '#d97706'] : ['#006591', '#39b8fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.reviewerName}>{review.user?.name || 'User'}</Text>
            {review.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Approval</Text>
              </View>
            )}
          </View>
          <Text style={styles.reviewDate}>{date}</Text>
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

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ReviewScreen({ route, navigation }) {
  const { property } = route.params;
  const { user } = useAuth();

  const [reviews, setReviews]     = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages]   = useState([]);
  const [showForm, setShowForm] = useState(false);

  // ── Fetch reviews ──
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const propId = property.id || property._id;
      const res = await API.get(`/reviews/${propId}`);
      setReviews(res.data.data);
      setAvgRating(res.data.avgRating);
    } catch (err) {
      Alert.alert('Error', 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [property.id, property._id]);

  useFocusEffect(useCallback(() => { fetchReviews(); }, [fetchReviews]));

  // ── Submit review ──
  const handleSubmit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating.');
    if (!comment.trim()) return Alert.alert('Error', 'Please write a comment.');

    try {
      setSubmitting(true);
      const propId = property.id || property._id;
      const res = await API.post(`/reviews/${propId}`, { rating, comment, images });
      
      // Add the pending review locally
      setReviews(prev => [res.data.data, ...prev]);
      setRating(0);
      setComment('');
      setImages([]);
      setShowForm(false);
      
      Alert.alert('Success', 'Your review has been submitted and is pending owner approval.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete review ──
  const handleDelete = (reviewId) => {
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

  // ── Image Picker ──
  const pickImage = async () => {
    if (images.length >= 3) {
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
      selectionLimit: 3 - images.length,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => 
        asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      );
      setImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  // ── Header ──
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Property Info */}
      <View style={styles.propertyBanner}>
        <View style={styles.propertyIconContainer}>
          <MaterialIcons name="apartment" size={24} color="#006591" />
        </View>
        <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
      </View>

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
      {!showForm && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowForm(true)}>
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
      {showForm && (
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
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.mediaPreviewContainer}>
                      <Image source={{ uri: img }} style={styles.mediaPreview} />
                      <TouchableOpacity style={styles.mediaRemoveBtn} onPress={() => removeImage(idx)}>
                        <MaterialIcons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              {images.length < 3 && (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <MaterialIcons name="photo-camera" size={20} color={Colors.secondary} />
                  <Text style={styles.uploadBtnText}>Add Photo/Video</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowForm(false); setRating(0); setComment(''); setImages([]); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtnContainer} disabled={submitting} onPress={handleSubmit}>
                <LinearGradient
                  colors={['#006591', '#39b8fd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>Submit Review</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <Text style={styles.sectionTitle}>Recent Reviews</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#006591" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              currentUserId={user?._id}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="chat-bubble-outline" size={48} color="#c5c6cd" />
              </View>
              <Text style={styles.emptyTextTitle}>No reviews yet</Text>
              <Text style={styles.emptyTextSub}>Be the first to share your experience!</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f9fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f2f4f6', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },

  headerContainer: {
    marginBottom: 8,
  },
  propertyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  propertyIconContainer: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0, 101, 145, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  propertyTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, flex: 1 },

  avgBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#091426', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  avgScoreContainer: {
    flexDirection: 'row', alignItems: 'baseline',
  },
  avgNumber: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  avgOutOf: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  avgDetailsContainer: {
    alignItems: 'flex-end',
  },
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
  cancelBtn: {
    flex: 1, backgroundColor: '#f2f4f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center'
  },
  cancelBtnText: { fontWeight: '700', color: '#45474c', fontSize: 15 },
  submitBtnContainer: { flex: 1 },
  submitBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 15 },

  mediaSection: { marginBottom: 24 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(0,101,145,0.06)', borderRadius: 12, alignSelf: 'flex-start' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  mediaPreviewList: { flexDirection: 'row', marginBottom: 12 },
  mediaPreviewContainer: { marginRight: 12, position: 'relative' },
  mediaPreview: { width: 80, height: 80, borderRadius: 12 },
  mediaRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 16, marginTop: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(236,238,240,0.8)'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  reviewerName: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  reviewDate: { fontSize: 12, fontWeight: '500', color: '#8590a6', marginTop: 2 },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pendingBadgeText: { color: '#d97706', fontSize: 10, fontWeight: '700' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff1f2',
    alignItems: 'center', justifyContent: 'center',
  },
  starContainer: { marginBottom: 12 },
  commentText: { fontSize: 15, color: '#45474c', lineHeight: 24 },
  reviewImagesContainer: { flexDirection: 'row', marginTop: 16 },
  reviewImage: { width: 100, height: 100, borderRadius: 12, marginRight: 12 },

  ownerResponseBox: { backgroundColor: 'rgba(0,101,145,0.06)', padding: 16, borderRadius: 12, marginTop: 16, borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  ownerResponseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ownerResponseTitle: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
  ownerResponseText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f2f4f6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTextTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  emptyTextSub: { fontSize: 14, color: '#8590a6', fontWeight: '500' },
  
  starGlow: {
    textShadowColor: 'rgba(245, 158, 11, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  }
});