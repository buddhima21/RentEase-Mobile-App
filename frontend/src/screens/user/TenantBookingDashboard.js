import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet,  Platform, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, updateBookingDate } from '../../services/bookingService';

const FALLBACK = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

const STATUS_STYLES = {
  pending:  { bg: '#fef3c7', text: '#92400e', label: 'PENDING', icon: 'hourglass-top' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'ALLOCATED', icon: 'check-circle' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED', icon: 'cancel' },
  removed:  { bg: '#f3f4f6', text: '#6b7280', label: 'REMOVED', icon: 'person-remove' },
};

const getStatus = (s) => STATUS_STYLES[s] || STATUS_STYLES.pending;

export default function TenantBookingDashboard({ navigation }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit Date Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  const handleTabPress = (k) => {
    setActiveTab(k);
    if (k === 'home') navigation.navigate('Home');
    if (k === 'listings') navigation.navigate('Listings');
  };

  const validateDate = (dateStr) => {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    return d instanceof Date && !isNaN(d) && d >= today;
  };

  const handleUpdateDate = async () => {
    if (!validateDate(newDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid future date in YYYY-MM-DD format.');
      return;
    }
    try {
      setIsUpdating(true);
      await updateBookingDate(selectedBooking._id, newDate);
      Alert.alert('Success', 'Booking date updated successfully.');
      setEditModalVisible(false);
      fetchBookings(); // Refresh list
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update date');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setNewDate(booking.preferredDate ? new Date(booking.preferredDate).toISOString().split('T')[0] : '');
    setEditModalVisible(true);
  };

  const pending = bookings.filter(b => b.status === 'pending');
  const allocated = bookings.filter(b => b.status === 'approved');
  const others = bookings.filter(b => b.status === 'rejected' || b.status === 'removed');

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <MaterialIcons name="book-online" size={22} color={Colors.primary} />
        <Text style={s.brand}>My Bookings</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} colors={[Colors.secondary]} tintColor={Colors.secondary} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <StatPill label="Pending" value={pending.length} color="#f59e0b" />
          <StatPill label="Allocated" value={allocated.length} color="#10b981" />
          <StatPill label="Total" value={bookings.length} color={Colors.secondary} />
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.secondary} /><Text style={s.loadText}>Loading bookings...</Text></View>
        ) : error ? (
          <View style={s.center}>
            <MaterialIcons name="error-outline" size={44} color={Colors.error} />
            <Text style={s.errText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => fetchBookings()}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : bookings.length === 0 ? (
          <View style={s.center}>
            <MaterialIcons name="event-busy" size={56} color={Colors.outlineVariant} />
            <Text style={s.emptyTitle}>No Bookings Yet</Text>
            <Text style={s.emptySub}>Browse properties and submit a booking request to get started.</Text>
            <TouchableOpacity style={s.browseBtn} onPress={() => navigation.navigate('Listings')}>
              <LinearGradient colors={[Colors.secondary, '#00486b']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.browseBtnGrad}>
                <MaterialIcons name="search" size={18} color="#fff" />
                <Text style={s.browseBtnText}>Browse Properties</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pending.length > 0 && <SectionTitle title="Pending Requests" icon="hourglass-top" color="#f59e0b" />}
            {pending.map(b => <BookingCard key={b._id} booking={b} onEditPress={() => openEditModal(b)} />)}

            {allocated.length > 0 && <SectionTitle title="Allocated Properties" icon="check-circle" color="#10b981" />}
            {allocated.map(b => <BookingCard key={b._id} booking={b} />)}

            {others.length > 0 && <SectionTitle title="Past Bookings" icon="history" color={Colors.onSurfaceVariant} />}
            {others.map(b => <BookingCard key={b._id} booking={b} />)}
          </>
        )}
      </ScrollView>
      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Edit Date Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Change Booking Date</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={s.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              <Text style={s.modalLabel}>NEW PREFERRED DATE</Text>
              <TextInput
                style={s.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.outlineVariant}
                value={newDate}
                onChangeText={setNewDate}
                editable={!isUpdating}
              />
              <Text style={s.modalHelp}>Format: YYYY-MM-DD. Must be today or later.</Text>
            </View>
            <TouchableOpacity style={s.modalSubmitBtn} onPress={handleUpdateDate} disabled={isUpdating}>
              <LinearGradient colors={isUpdating ? ['#64748b', '#475569'] : [Colors.secondary, '#00486b']} style={s.modalSubmitGrad}>
                {isUpdating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalSubmitText}>Save Changes</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatPill({ label, value, color }) {
  return (
    <View style={[s.statPill, { borderColor: `${color}30` }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, icon, color }) {
  return (
    <View style={s.secRow}>
      <MaterialIcons name={icon} size={18} color={color} />
      <Text style={s.secTitle}>{title}</Text>
    </View>
  );
}

function BookingCard({ booking, onEditPress }) {
  const st = getStatus(booking.status);
  const prop = booking.property || {};
  const img = prop.images?.[0] || FALLBACK;

  return (
    <View style={s.card}>
      <Image source={{ uri: img }} style={s.cardImg} />
      <View style={s.cardBody}>
        <View style={[s.statusPill, { backgroundColor: st.bg }]}>
          <MaterialIcons name={st.icon} size={12} color={st.text} />
          <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={1}>{prop.title || 'Property'}</Text>
        <View style={s.locRow}>
          <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
          <Text style={s.locText} numberOfLines={1}>{prop.location || '—'}</Text>
        </View>
        <View style={s.detailRow}>
          <MaterialIcons name="event" size={13} color={Colors.secondary} />
          <Text style={s.detailText}>
            {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </Text>
        </View>
        {booking.status === 'pending' && onEditPress ? (
          <TouchableOpacity style={s.editBtn} onPress={onEditPress}>
            <MaterialIcons name="edit" size={14} color={Colors.secondary} />
            <Text style={s.editBtnText}>Edit Date</Text>
          </TouchableOpacity>
        ) : null}
        {booking.status === 'rejected' && booking.rejectionReason ? (
          <View style={s.rejectNote}>
            <MaterialIcons name="info" size={12} color="#991b1b" />
            <Text style={s.rejectText} numberOfLines={2}>{booking.rejectionReason}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.2)' },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 24 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statVal: { fontSize: 24, fontWeight: '800' },
  statLbl: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  center: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadText: { fontSize: 14, color: Colors.onSurfaceVariant, fontWeight: '500' },
  errText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10 },
  retryText: { fontWeight: '700', color: Colors.primary },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 260 },
  browseBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  browseBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 8 },
  secTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardImg: { width: 110, height: '100%', minHeight: 120 },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  detailText: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(0,101,145,0.08)', borderRadius: 6 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  rejectNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6, backgroundColor: '#fee2e2', borderRadius: 6, padding: 6 },
  rejectText: { fontSize: 11, color: '#991b1b', fontStyle: 'italic', flex: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  modalCloseBtn: { padding: 4 },
  modalBody: { marginBottom: 24 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  modalInput: { backgroundColor: Colors.surfaceContainerHighest, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.onSurface },
  modalHelp: { fontSize: 11, color: Colors.outline, marginTop: 6, fontStyle: 'italic' },
  modalSubmitBtn: { borderRadius: 12, overflow: 'hidden' },
  modalSubmitGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
