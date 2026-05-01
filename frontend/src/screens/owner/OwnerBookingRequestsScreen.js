import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
   Platform, ActivityIndicator, RefreshControl,
  Alert, Modal, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getOwnerBookingRequests, approveBooking, rejectBooking } from '../../services/bookingService';

const FALLBACK = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'];
const getAvatarColor = (n) => { if (!n) return AVATAR_COLORS[0]; let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };
const getInitials = (n) => { if (!n) return '?'; const p=n.trim().split(' '); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():p[0][0].toUpperCase(); };

export default function OwnerBookingRequestsScreen({ navigation }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ visible: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [docModal, setDocModal] = useState({ visible: false, uri: null, name: '' });

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await getOwnerBookingRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking requests');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const handleApprove = (booking) => {
    Alert.alert('Approve Booking', `Approve ${booking.tenant?.name}'s booking for "${booking.property?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          setActionLoading(booking._id);
          await approveBooking(booking._id);
          setRequests(prev => prev.filter(r => r._id !== booking._id));
          Alert.alert('Approved ✅', 'Tenant has been allocated to this property.');
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to approve');
        } finally { setActionLoading(null); }
      }},
    ]);
  };

  const openRejectModal = (bookingId) => {
    setRejectReason('');
    setRejectModal({ visible: true, bookingId });
  };

  const handleRejectSubmit = async () => {
    try {
      setActionLoading(rejectModal.bookingId);
      await rejectBooking(rejectModal.bookingId, rejectReason);
      setRequests(prev => prev.filter(r => r._id !== rejectModal.bookingId));
      setRejectModal({ visible: false, bookingId: null });
      Alert.alert('Rejected', 'Booking request has been rejected.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    } finally { setActionLoading(null); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <MaterialIcons name="pending-actions" size={22} color={Colors.primary} />
        <Text style={s.brand}>Booking Requests</Text>
        <View style={s.countBadge}><Text style={s.countText}>{requests.length}</Text></View>
      </View>

      <ScrollView
        style={s.scroll} contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} colors={[Colors.secondary]} tintColor={Colors.secondary} />}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.secondary} /><Text style={s.loadText}>Loading requests...</Text></View>
        ) : error ? (
          <View style={s.center}>
            <MaterialIcons name="error-outline" size={44} color={Colors.error} />
            <Text style={s.errText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => fetchRequests()}><Text style={s.retryBtnText}>Retry</Text></TouchableOpacity>
          </View>
        ) : requests.length === 0 ? (
          <View style={s.center}>
            <MaterialIcons name="inbox" size={56} color={Colors.outlineVariant} />
            <Text style={s.emptyTitle}>No Pending Requests</Text>
            <Text style={s.emptySub}>All booking requests have been handled.</Text>
          </View>
        ) : (
          requests.map(r => (
            <View key={r._id} style={s.card}>
              {/* Tenant Info */}
              <View style={s.tenantRow}>
                <View style={[s.avatar, { backgroundColor: getAvatarColor(r.tenant?.name) }]}>
                  <Text style={s.avatarText}>{getInitials(r.tenant?.name)}</Text>
                </View>
                <View style={s.tenantInfo}>
                  <Text style={s.tenantName}>{r.tenant?.name || 'Unknown'}</Text>
                  <Text style={s.tenantEmail}>{r.tenant?.email || '—'}</Text>
                  <Text style={s.tenantPhone}>{r.tenant?.phone || '—'}</Text>
                </View>
              </View>

              {/* Property Info */}
              <View style={s.propRow}>
                <Image source={{ uri: r.property?.images?.[0] || FALLBACK }} style={s.propImg} />
                <View style={s.propInfo}>
                  <Text style={s.propTitle} numberOfLines={1}>{r.property?.title || 'Property'}</Text>
                  <View style={s.locRow}><MaterialIcons name="location-on" size={12} color={Colors.onSurfaceVariant} /><Text style={s.locText} numberOfLines={1}>{r.property?.location || '—'}</Text></View>
                  <View style={s.dateRow}><MaterialIcons name="event" size={12} color={Colors.secondary} />
                    <Text style={s.dateText}>{r.preferredDate ? new Date(r.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text>
                  </View>
                </View>
              </View>

              {/* ID Document */}
              {r.idDocument && (
                <TouchableOpacity style={s.docBtn} activeOpacity={0.7} onPress={() => setDocModal({ visible: true, uri: r.idDocument, name: r.idDocumentName || 'ID Document' })}>
                  <MaterialIcons name="badge" size={18} color={Colors.secondary} />
                  <Text style={s.docBtnText}>View ID Document</Text>
                  <MaterialIcons name="open-in-new" size={14} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={s.rejectBtn}
                  activeOpacity={0.7}
                  onPress={() => openRejectModal(r._id)}
                  disabled={actionLoading === r._id}
                >
                  <MaterialIcons name="close" size={18} color={Colors.error} />
                  <Text style={s.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.approveBtn, actionLoading === r._id && { opacity: 0.6 }]}
                  activeOpacity={0.85}
                  onPress={() => handleApprove(r)}
                  disabled={actionLoading === r._id}
                >
                  <LinearGradient colors={['#10b981', '#059669']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.approveBtnGrad}>
                    {actionLoading === r._id ? <ActivityIndicator color="#fff" size="small" /> : <><MaterialIcons name="check" size={18} color="#fff" /><Text style={s.approveBtnText}>Approve</Text></>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModal.visible} transparent animationType="slide" onRequestClose={() => setRejectModal({ visible: false, bookingId: null })}>
        <Pressable style={s.modalOverlay} onPress={() => setRejectModal({ visible: false, bookingId: null })}>
          <Pressable style={s.modalContent} onPress={e => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Reject Booking</Text>
            <Text style={s.modalSub}>Provide a reason for rejection (optional)</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Property no longer available..."
              placeholderTextColor="#94a3b8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setRejectModal({ visible: false, bookingId: null })}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalRejectBtn} onPress={handleRejectSubmit}>
                <Text style={s.modalRejectBtnText}>Reject Request</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal visible={docModal.visible} transparent animationType="fade" onRequestClose={() => setDocModal({ visible: false, uri: null, name: '' })}>
        <Pressable style={s.docOverlay} onPress={() => setDocModal({ visible: false, uri: null, name: '' })}>
          <View style={s.docViewer}>
            <View style={s.docViewerHeader}>
              <Text style={s.docViewerTitle}>{docModal.name}</Text>
              <TouchableOpacity onPress={() => setDocModal({ visible: false, uri: null, name: '' })}>
                <MaterialIcons name="close" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {docModal.uri && <Image source={{ uri: docModal.uri }} style={s.docViewerImg} resizeMode="contain" />}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.2)' },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary, flex: 1 },
  countBadge: { backgroundColor: Colors.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  center: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadText: { fontSize: 14, color: Colors.onSurfaceVariant },
  errText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10 },
  retryBtnText: { fontWeight: '700', color: Colors.primary },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  tenantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tenantInfo: { flex: 1, gap: 1 },
  tenantName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  tenantEmail: { fontSize: 12, color: Colors.onSurfaceVariant },
  tenantPhone: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  propRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, padding: 10, marginBottom: 12 },
  propImg: { width: 60, height: 60, borderRadius: 10 },
  propInfo: { flex: 1, gap: 3 },
  propTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 11, color: Colors.onSurfaceVariant, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(0,101,145,0.06)', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,101,145,0.12)' },
  docBtnText: { fontSize: 13, color: Colors.secondary, fontWeight: '600', flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(186,26,26,0.08)', borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },
  approveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  approveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 16 },
  modalInput: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, padding: 14, fontSize: 14, color: Colors.primary, borderWidth: 1, borderColor: Colors.outlineVariant, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh },
  modalCancelText: { fontWeight: '700', color: Colors.onSurfaceVariant },
  modalRejectBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.error },
  modalRejectBtnText: { fontWeight: '700', color: '#fff' },
  docOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  docViewer: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  docViewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  docViewerTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  docViewerImg: { width: '100%', height: 400 },
});
